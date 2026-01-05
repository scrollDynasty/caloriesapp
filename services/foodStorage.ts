/**
 * Food Storage Service - загружает CSV данные с backend сервера
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import Papa from "papaparse";
import { API_BASE_URL } from "../constants/api";

const TOKEN_KEY = "@yebich:auth_token";

interface FoodItem {
  fdc_id: string;
  name: string;
  calories?: number;
  protein?: number;
  fat?: number;
  carbs?: number;
  portion?: string;
  brand?: string;
  source: string;
}

class FoodStorageService {
  private cache: Map<string, any> = new Map();
  private loading: Map<string, Promise<any>> = new Map();

  private async fetchCSV(fileName: string): Promise<Record<string, string>[]> {
    const cacheKey = `csv:${fileName}`;
    
    if (this.cache.has(cacheKey)) {
      console.log(`💾 CSV из кэша: ${fileName}`);
      return this.cache.get(cacheKey);
    }

    if (this.loading.has(cacheKey)) {
      console.log(`⏳ CSV уже загружается: ${fileName}`);
      return this.loading.get(cacheKey)!;
    }

    const promise = (async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (!token) {
          throw new Error('Токен авторизации не найден');
        }

        const url = `${API_BASE_URL}/api/v1/foods/csv/${fileName}`;
        console.log(`📥 Загружаем CSV: ${fileName}`);
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'text/csv',
            'Content-Type': 'text/csv',
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const text = await response.text();
        console.log(`📄 CSV загружен: ${fileName} (${text.length} символов)`);

        const result = Papa.parse(text, {
          header: true,
          skipEmptyLines: true,
          dynamicTyping: false,
        });

        const rows = result.data as Record<string, string>[];
        console.log(`✅ CSV парсен: ${fileName} (${rows.length} строк)`);
        
        this.cache.set(cacheKey, rows);
        return rows;
      } catch (error) {
        console.error(`❌ Ошибка загрузки ${fileName}:`, error);
        return [];
      } finally {
        this.loading.delete(cacheKey);
      }
    })();

    this.loading.set(cacheKey, promise);
    return promise;
  }

  private async loadFoodNames(): Promise<Map<string, string>> {
    console.log('📚 Загрузка названий продуктов...');
    const rows = await this.fetchCSV('food_sample.csv');
    const map = new Map<string, string>();
    
    let count = 0;
    for (const row of rows) {
      if (count > 5000) break;
      
      const fdcId = row['fdc_id'];
      const description = row['description'];
      if (fdcId && description) {
        map.set(fdcId, description);
        count++;
      }
    }

    console.log(`✅ Названия загружены: ${map.size} продуктов`);
    return map;
  }

  /**
   * Загружает нутриенты продуктов
   */
  private async loadNutrients(): Promise<Map<string, Map<string, number>>> {
    console.log('🥗 Загрузка нутриентов...');
    const rows = await this.fetchCSV('food_nutrient_sample.csv');
    const nutrientMap = new Map<string, Map<string, number>>();

    const NUTRIENT_IDS = {
      calories: '1008',
      protein: '1003',
      fat: '1004',
      carbs: '1005',
    };

    let count = 0;
    for (const row of rows) {
      if (count > 50000) break;
      
      const fdcId = row['fdc_id'];
      const nutrientId = row['nutrient_id'];
      const amount = parseFloat(row['amount'] || '0');

      if (!fdcId || !nutrientId || isNaN(amount)) continue;

      if (!nutrientMap.has(fdcId)) {
        nutrientMap.set(fdcId, new Map());
      }

      const nutrients = nutrientMap.get(fdcId)!;
      
      if (nutrientId === NUTRIENT_IDS.calories) nutrients.set('calories', Math.round(amount));
      if (nutrientId === NUTRIENT_IDS.protein) nutrients.set('protein', Math.round(amount * 10) / 10);
      if (nutrientId === NUTRIENT_IDS.fat) nutrients.set('fat', Math.round(amount * 10) / 10);
      if (nutrientId === NUTRIENT_IDS.carbs) nutrients.set('carbs', Math.round(amount * 10) / 10);
      
      count++;
    }

    console.log(`✅ Нутриенты загружены для ${nutrientMap.size} продуктов`);
    return nutrientMap;
  }

  async getFoundationFoods(limit: number = 50): Promise<FoodItem[]> {
    console.log('🌿 Загрузка Foundation Foods...');
    
    try {
      const [foodNames, nutrients] = await Promise.all([
        this.loadFoodNames(),
        this.loadNutrients(),
      ]);

      const foods: FoodItem[] = [];
      let count = 0;

      for (const [fdcId, name] of foodNames) {
        if (count >= limit) break;

        const nutrientData = nutrients.get(fdcId);
        if (!nutrientData) continue;

        foods.push({
          fdc_id: fdcId,
          name: name,
          calories: nutrientData.get('calories'),
          protein: nutrientData.get('protein'),
          fat: nutrientData.get('fat'),
          carbs: nutrientData.get('carbs'),
          portion: '100g',
          source: 'foundation',
        });

        count++;
      }

      console.log(`✅ Foundation Foods загружены: ${foods.length} продуктов`);
      return foods;
    } catch (error) {
      console.error('❌ Ошибка загрузки Foundation Foods:', error);
      return [];
    }
  }

  /**
   * Загружает branded foods
   */
  async getBrandedFoods(limit: number = 50): Promise<FoodItem[]> {
    console.log('🏪 Загрузка Branded Foods...');
    
    try {
      const [brandedRows, foodNames, nutrients] = await Promise.all([
        this.fetchCSV('branded_food.csv'),
        this.loadFoodNames(),
        this.loadNutrients(),
      ]);

      const foods: FoodItem[] = [];

      for (let i = 0; i < Math.min(limit, brandedRows.length); i++) {
        const row = brandedRows[i];
        const fdcId = row['fdc_id'];
        const brand = row['brand_owner'] || row['brand_name'];

        if (!fdcId) continue;

        const name = foodNames.get(fdcId);
        const nutrientData = nutrients.get(fdcId);

        if (name) {
          foods.push({
            fdc_id: fdcId,
            name: name,
            calories: nutrientData?.get('calories'),
            protein: nutrientData?.get('protein'),
            fat: nutrientData?.get('fat'),
            carbs: nutrientData?.get('carbs'),
            portion: '100g',
            brand: brand || undefined,
            source: 'branded',
          });
        }
      }

      console.log(`✅ Branded Foods загружены: ${foods.length} продуктов`);
      return foods;
    } catch (error) {
      console.error('❌ Ошибка загрузки Branded Foods:', error);
      return [];
    }
  }

  /**
   * Поиск продуктов по названию
   */
  async searchFoods(query: string, source: string = 'all', limit: number = 50): Promise<FoodItem[]> {
    console.log(`🔍 Поиск: "${query}" в источнике ${source}`);
    
    const lowerQuery = query.toLowerCase();
    let allFoods: FoodItem[] = [];

    try {
      if (source === 'foundation' || source === 'all') {
        const foundation = await this.getFoundationFoods(200);
        allFoods.push(...foundation);
      }

      if (source === 'branded' || source === 'all') {
        const branded = await this.getBrandedFoods(200);
        allFoods.push(...branded);
      }

      const results = allFoods
        .filter(food => food.name.toLowerCase().includes(lowerQuery))
        .slice(0, limit);

      console.log(`✅ Найдено ${results.length} продуктов`);
      return results;
    } catch (error) {
      console.error('❌ Ошибка поиска:', error);
      return [];
    }
  }

  clearCache() {
    this.cache.clear();
    this.loading.clear();
    console.log('🗑️ Кэш очищен');
  }
}

export const foodStorageService = new FoodStorageService();
