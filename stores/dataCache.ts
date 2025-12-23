/**
 * Централизованный кэш данных в памяти
 * Реализует паттерн stale-while-revalidate
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  isStale: boolean;
}

interface DailyMealsData {
  date: string;
  total_calories: number;
  total_protein: number;
  total_fat: number;
  total_carbs: number;
  total_fiber: number;
  total_sugar: number;
  total_sodium: number;
  health_score: number | null;
  streak_count?: number;
  meals: Array<{
    id: number;
    name: string;
    time: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
    fiber?: number;
    sugar?: number;
    sodium?: number;
    health_score?: number;
  }>;
}

interface WaterData {
  date: string;
  total_ml: number;
  goal_ml: number | null;
  entries: Array<{
    id: number;
    amount_ml: number;
    goal_ml?: number | null;
    created_at: string;
  }>;
}

interface WeekData {
  weekKey: string;
  achievements: Record<string, boolean>;
  progress: Record<string, number>;
}

interface OnboardingData {
  target_calories?: number;
  protein_grams?: number;
  carbs_grams?: number;
  fats_grams?: number;
  [key: string]: any;
}

interface UserData {
  id: number;
  email?: string;
  name?: string;
  [key: string]: any;
}

class DataCache {
  private static readonly DAILY_TTL = 24 * 60 * 60 * 1000;
  private static readonly WATER_TTL = 24 * 60 * 60 * 1000; 
  private static readonly WEEK_TTL = 24 * 60 * 60 * 1000;
  private static readonly USER_TTL = 7 * 24 * 60 * 60 * 1000;
  private static readonly ONBOARDING_TTL = 7 * 24 * 60 * 60 * 1000;

  // Лимиты размера кэшей для предотвращения утечек памяти
  private static readonly MAX_DAILY_ENTRIES = 60; // ~2 месяца
  private static readonly MAX_WATER_ENTRIES = 60;
  private static readonly MAX_WEEK_ENTRIES = 12; // ~3 месяца

  // Кэши
  private dailyMealsCache: Map<string, CacheEntry<DailyMealsData>> = new Map();
  private waterCache: Map<string, CacheEntry<WaterData>> = new Map();
  private weekCache: Map<string, CacheEntry<WeekData>> = new Map();
  private userCache: CacheEntry<UserData> | null = null;
  private onboardingCache: CacheEntry<OnboardingData> | null = null;

  // Флаги для отслеживания фоновых обновлений
  private pendingUpdates: Set<string> = new Set();

  /**
   * Удаляет старые записи из Map, если превышен лимит (LRU-подобное поведение)
   */
  private evictOldEntries<T>(cache: Map<string, CacheEntry<T>>, maxSize: number): void {
    if (cache.size <= maxSize) return;
    
    // Сортируем по timestamp и удаляем самые старые
    const entries = Array.from(cache.entries())
      .sort((a, b) => a[1].timestamp - b[1].timestamp);
    
    const toRemove = entries.slice(0, cache.size - maxSize);
    for (const [key] of toRemove) {
      cache.delete(key);
    }
  }

  // ===== Daily Meals =====

  getDailyMeals(dateKey: string): DailyMealsData | null {
    const entry = this.dailyMealsCache.get(dateKey);
    if (!entry) return null;
    return entry.data;
  }

  isDailyMealsStale(dateKey: string): boolean {
    const entry = this.dailyMealsCache.get(dateKey);
    if (!entry) return true;
    return Date.now() - entry.timestamp > DataCache.DAILY_TTL;
  }

  hasDailyMeals(dateKey: string): boolean {
    return this.dailyMealsCache.has(dateKey);
  }

  setDailyMeals(dateKey: string, data: DailyMealsData): void {
    this.dailyMealsCache.set(dateKey, {
      data,
      timestamp: Date.now(),
      isStale: false,
    });
    // Очищаем старые записи при превышении лимита
    this.evictOldEntries(this.dailyMealsCache, DataCache.MAX_DAILY_ENTRIES);
  }

  invalidateDailyMeals(dateKey?: string): void {
    if (dateKey) {
      this.dailyMealsCache.delete(dateKey);
    } else {
      this.dailyMealsCache.clear();
    }
  }

  // ===== Water =====

  getWater(dateKey: string): WaterData | null {
    const entry = this.waterCache.get(dateKey);
    if (!entry) return null;
    return entry.data;
  }

  isWaterStale(dateKey: string): boolean {
    const entry = this.waterCache.get(dateKey);
    if (!entry) return true;
    return Date.now() - entry.timestamp > DataCache.WATER_TTL;
  }

  hasWater(dateKey: string): boolean {
    return this.waterCache.has(dateKey);
  }

  setWater(dateKey: string, data: WaterData): void {
    this.waterCache.set(dateKey, {
      data,
      timestamp: Date.now(),
      isStale: false,
    });
    this.evictOldEntries(this.waterCache, DataCache.MAX_WATER_ENTRIES);
  }

  invalidateWater(dateKey?: string): void {
    if (dateKey) {
      this.waterCache.delete(dateKey);
    } else {
      this.waterCache.clear();
    }
  }

  // ===== Week Data =====

  getWeekData(weekKey: string): WeekData | null {
    const entry = this.weekCache.get(weekKey);
    if (!entry) return null;
    return entry.data;
  }

  isWeekStale(weekKey: string): boolean {
    const entry = this.weekCache.get(weekKey);
    if (!entry) return true;
    return Date.now() - entry.timestamp > DataCache.WEEK_TTL;
  }

  hasWeekData(weekKey: string): boolean {
    return this.weekCache.has(weekKey);
  }

  setWeekData(weekKey: string, data: WeekData): void {
    this.weekCache.set(weekKey, {
      data,
      timestamp: Date.now(),
      isStale: false,
    });
    this.evictOldEntries(this.weekCache, DataCache.MAX_WEEK_ENTRIES);
  }

  updateWeekProgress(weekKey: string, dateKey: string, progress: number, achieved: boolean): void {
    const entry = this.weekCache.get(weekKey);
    if (entry) {
      entry.data.progress[dateKey] = progress;
      entry.data.achievements[dateKey] = achieved;
    }
  }

  // ===== User Data =====

  getUser(): UserData | null {
    if (!this.userCache) return null;
    return this.userCache.data;
  }

  isUserStale(): boolean {
    if (!this.userCache) return true;
    return Date.now() - this.userCache.timestamp > DataCache.USER_TTL;
  }

  hasUser(): boolean {
    return this.userCache !== null;
  }

  setUser(data: UserData): void {
    this.userCache = {
      data,
      timestamp: Date.now(),
      isStale: false,
    };
  }

  // ===== Onboarding Data =====

  getOnboarding(): OnboardingData | null {
    if (!this.onboardingCache) return null;
    return this.onboardingCache.data;
  }

  isOnboardingStale(): boolean {
    if (!this.onboardingCache) return true;
    return Date.now() - this.onboardingCache.timestamp > DataCache.ONBOARDING_TTL;
  }

  hasOnboarding(): boolean {
    return this.onboardingCache !== null;
  }

  setOnboarding(data: OnboardingData): void {
    this.onboardingCache = {
      data,
      timestamp: Date.now(),
      isStale: false,
    };
  }

  // ===== Pending Updates Tracking =====

  isPendingUpdate(key: string): boolean {
    return this.pendingUpdates.has(key);
  }

  setPendingUpdate(key: string): void {
    this.pendingUpdates.add(key);
  }

  clearPendingUpdate(key: string): void {
    this.pendingUpdates.delete(key);
  }


  invalidateOnboarding(): void {
    this.onboardingCache = null;
  }

  invalidateUser(): void {
    this.userCache = null;
  }


  invalidateAll(): void {
    this.dailyMealsCache.clear();
    this.waterCache.clear();
    this.weekCache.clear();
    this.userCache = null;
    this.onboardingCache = null;
    this.pendingUpdates.clear();
  }

  // Инвалидация данных за сегодня (после добавления еды/воды)
  invalidateToday(dateKey: string): void {
    this.invalidateDailyMeals(dateKey);
    this.invalidateWater(dateKey);
  }
}

export const dataCache = new DataCache();
export type { DailyMealsData, OnboardingData, UserData, WaterData, WeekData };

