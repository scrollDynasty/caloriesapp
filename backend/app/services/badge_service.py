from datetime import datetime, timezone
from typing import List, Dict, Tuple, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.models.user import User
from app.models.user_badge import UserBadge
from app.models.meal_photo import MealPhoto
from app.models.water_log import WaterLog
from app.models.weight_log import WeightLog
from app.models.onboarding_data import OnboardingData


ALL_BADGES = [
    {
        "id": "streak_3",
        "emoji": "🔥",
        "title": "Первые шаги",
        "description": "3 дня подряд",
        "requirement": "Отслеживай питание 3 дня подряд",
        "color": "#FF453A",
        "category": "streak",
    },
    {
        "id": "streak_7",
        "emoji": "🔥",
        "title": "Неделя силы",
        "description": "7 дней подряд",
        "requirement": "Отслеживай питание неделю подряд",
        "color": "#FF9F0A",
        "category": "streak",
    },
    {
        "id": "streak_14",
        "emoji": "⚡",
        "title": "Две недели",
        "description": "14 дней подряд",
        "requirement": "Отслеживай питание 2 недели подряд",
        "color": "#FFD60A",
        "category": "streak",
    },
    {
        "id": "streak_30",
        "emoji": "🏆",
        "title": "Месяц чемпиона",
        "description": "30 дней подряд",
        "requirement": "Отслеживай питание месяц подряд",
        "color": "#32D74B",
        "category": "streak",
    },
    {
        "id": "streak_50",
        "emoji": "💪",
        "title": "Сила воли",
        "description": "50 дней подряд",
        "requirement": "Отслеживай питание 50 дней подряд",
        "color": "#30D158",
        "category": "streak",
    },
    {
        "id": "streak_100",
        "emoji": "💎",
        "title": "Бриллиант",
        "description": "100 дней подряд",
        "requirement": "Отслеживай питание 100 дней подряд",
        "color": "#64D2FF",
        "category": "streak",
    },
    {
        "id": "streak_365",
        "emoji": "👑",
        "title": "Годовщина",
        "description": "365 дней подряд",
        "requirement": "Отслеживай питание целый год",
        "color": "#BF5AF2",
        "category": "streak",
    },
    {
        "id": "streak_1000",
        "emoji": "🌟",
        "title": "Легенда",
        "description": "1000 дней подряд",
        "requirement": "Отслеживай питание 1000 дней",
        "color": "#FF2D55",
        "category": "streak",
    },
    
    {
        "id": "first_meal",
        "emoji": "🍽️",
        "title": "Первое блюдо",
        "description": "Начало пути",
        "requirement": "Добавь своё первое блюдо",
        "color": "#D1D1D6",
        "category": "activity",
    },
    {
        "id": "meals_5",
        "emoji": "🥄",
        "title": "Ковыряюсь вилкой",
        "description": "5 приёмов пищи",
        "requirement": "Добавь 5 блюд",
        "color": "#AEAEB2",
        "category": "activity",
    },
    {
        "id": "meals_10",
        "emoji": "🥗",
        "title": "Гурман",
        "description": "10 блюд",
        "requirement": "Добавь 10 блюд",
        "color": "#8E8E93",
        "category": "activity",
    },
    {
        "id": "meals_25",
        "emoji": "🍱",
        "title": "Фуд-блогер",
        "description": "25 блюд",
        "requirement": "Добавь 25 блюд",
        "color": "#636366",
        "category": "activity",
    },
    {
        "id": "meals_50",
        "emoji": "👨‍🍳",
        "title": "Шеф-повар",
        "description": "50 блюд",
        "requirement": "Добавь 50 блюд",
        "color": "#48484A",
        "category": "activity",
    },
    {
        "id": "meals_100",
        "emoji": "🌟",
        "title": "Мастер кухни",
        "description": "100 блюд",
        "requirement": "Добавь 100 блюд",
        "color": "#3A3A3C",
        "category": "activity",
    },
    {
        "id": "meals_250",
        "emoji": "🎖️",
        "title": "Кулинарный эксперт",
        "description": "250 блюд",
        "requirement": "Добавь 250 блюд",
        "color": "#FF9500",
        "category": "activity",
    },
    {
        "id": "meals_500",
        "emoji": "🏅",
        "title": "Крёстный Лог",
        "description": "500 приёмов пищи",
        "requirement": "Добавь 500 блюд",
        "color": "#FF8500",
        "category": "activity",
    },
    {
        "id": "meals_1000",
        "emoji": "🏆",
        "title": "Бессмертный лог",
        "description": "1000 приёмов пищи",
        "requirement": "Добавь 1000 блюд",
        "color": "#FFD60A",
        "category": "activity",
    },
    {
        "id": "meals_5000",
        "emoji": "💫",
        "title": "Мастер вселенной",
        "description": "5000 приёмов пищи",
        "requirement": "Добавь 5000 блюд",
        "color": "#BF5AF2",
        "category": "activity",
    },
    
    {
        "id": "water_first",
        "emoji": "💧",
        "title": "Первая капля",
        "description": "Норма воды выполнена",
        "requirement": "Выполни норму воды за день",
        "color": "#007AFF",
        "category": "nutrition",
    },
    {
        "id": "water_3days",
        "emoji": "💦",
        "title": "Водопад",
        "description": "3 дня нормы воды",
        "requirement": "Выполни норму воды 3 дня подряд",
        "color": "#0A84FF",
        "category": "nutrition",
    },
    {
        "id": "water_week",
        "emoji": "🌊",
        "title": "Водная неделя",
        "description": "7 дней нормы воды",
        "requirement": "Выполни норму воды неделю подряд",
        "color": "#5AC8FA",
        "category": "nutrition",
    },
    {
        "id": "water_month",
        "emoji": "🏖️",
        "title": "Океан здоровья",
        "description": "30 дней нормы воды",
        "requirement": "Выполни норму воды месяц подряд",
        "color": "#32D3E6",
        "category": "nutrition",
    },
    {
        "id": "water_100days",
        "emoji": "🐋",
        "title": "Водный кит",
        "description": "100 дней нормы воды",
        "requirement": "Выполни норму воды 100 дней",
        "color": "#30B0C7",
        "category": "nutrition",
    },
    {
        "id": "water_365days",
        "emoji": "🌍",
        "title": "Водная планета",
        "description": "365 дней нормы воды",
        "requirement": "Выполни норму воды целый год",
        "color": "#00C7E6",
        "category": "nutrition",
    },
    
    {
        "id": "goal_first",
        "emoji": "✅",
        "title": "Первая цель",
        "description": "Дневная норма достигнута",
        "requirement": "Достигни дневной нормы калорий",
        "color": "#34C759",
        "category": "nutrition",
    },
    {
        "id": "goal_3days",
        "emoji": "🎯",
        "title": "Три в ряд",
        "description": "3 дня в цели",
        "requirement": "Достигни нормы калорий 3 дня подряд",
        "color": "#30D158",
        "category": "nutrition",
    },
    {
        "id": "goal_week",
        "emoji": "🏹",
        "title": "Меткий стрелок",
        "description": "7 дней в цели",
        "requirement": "Достигни нормы калорий неделю подряд",
        "color": "#32D74B",
        "category": "nutrition",
    },
    {
        "id": "goal_month",
        "emoji": "🎪",
        "title": "Точность — вежливость королей",
        "description": "30 дней в цели",
        "requirement": "Достигни нормы калорий месяц подряд",
        "color": "#30DB5B",
        "category": "nutrition",
    },
    {
        "id": "goal_100days",
        "emoji": "🎰",
        "title": "Джекпот здоровья",
        "description": "100 дней в цели",
        "requirement": "Достигни нормы калорий 100 дней",
        "color": "#00E588",
        "category": "nutrition",
    },
    {
        "id": "goal_perfect",
        "emoji": "💯",
        "title": "Перфекционист",
        "description": "Идеальная неделя",
        "requirement": "Попади в норму ±50 ккал 7 дней подряд",
        "color": "#FFD60A",
        "category": "nutrition",
    },
    
    {
        "id": "macro_first",
        "emoji": "📊",
        "title": "Мастер макросов",
        "description": "Идеальный баланс БЖУ",
        "requirement": "Достигни идеального баланса БЖУ",
        "color": "#AF52DE",
        "category": "nutrition",
    },
    {
        "id": "macro_week",
        "emoji": "⚖️",
        "title": "Сбалансированная неделя",
        "description": "7 дней баланса БЖУ",
        "requirement": "Держи баланс БЖУ неделю",
        "color": "#BF5AF2",
        "category": "nutrition",
    },
    {
        "id": "protein_week",
        "emoji": "💪",
        "title": "Сила белка",
        "description": "Норма белка 7 дней",
        "requirement": "Достигни нормы белка 7 дней подряд",
        "color": "#FF6B6B",
        "category": "nutrition",
    },
    {
        "id": "fiber_week",
        "emoji": "🌾",
        "title": "Клетчатка-мастер",
        "description": "Норма клетчатки 7 дней",
        "requirement": "Достигни нормы клетчатки 7 дней подряд",
        "color": "#A0A000",
        "category": "nutrition",
    },
    {
        "id": "lowcarb_week",
        "emoji": "🥑",
        "title": "Кето-боец",
        "description": "Неделя низких углеводов",
        "requirement": "Держи низкий уровень углеводов неделю",
        "color": "#8BC34A",
        "category": "nutrition",
    },
    
    {
        "id": "healthy_first",
        "emoji": "💚",
        "title": "Здоровый выбор",
        "description": "Блюдо с оценкой 8+",
        "requirement": "Добавь здоровое блюдо (оценка 8+)",
        "color": "#34C759",
        "category": "nutrition",
    },
    {
        "id": "healthy_week",
        "emoji": "🥬",
        "title": "Здоровая неделя",
        "description": "7 дней здоровья",
        "requirement": "Получи оценку здоровья 7+ всю неделю",
        "color": "#32D74B",
        "category": "nutrition",
    },
    {
        "id": "veggies_day",
        "emoji": "🥦",
        "title": "Овощной день",
        "description": "5 порций овощей",
        "requirement": "Съешь 5 порций овощей за день",
        "color": "#8BC34A",
        "category": "nutrition",
    },
    {
        "id": "fruits_day",
        "emoji": "🍎",
        "title": "Фруктовый сад",
        "description": "3 порции фруктов",
        "requirement": "Съешь 3 порции фруктов за день",
        "color": "#FF3B30",
        "category": "nutrition",
    },
    {
        "id": "nosugar_week",
        "emoji": "🚫",
        "title": "Без сахара",
        "description": "Неделя без добавленного сахара",
        "requirement": "Избегай добавленного сахара неделю",
        "color": "#636366",
        "category": "nutrition",
    },
    {
        "id": "wholegrains_week",
        "emoji": "🌾",
        "title": "Цельнозерновой герой",
        "description": "Неделя цельнозерновых",
        "requirement": "Выбирай цельнозерновые продукты неделю",
        "color": "#D4A574",
        "category": "nutrition",
    },
    
    {
        "id": "weight_first",
        "emoji": "⚖️",
        "title": "На весах",
        "description": "Первое взвешивание",
        "requirement": "Запиши свой вес впервые",
        "color": "#8E8E93",
        "category": "special",
    },
    {
        "id": "weight_week",
        "emoji": "📈",
        "title": "Контроль веса",
        "description": "Неделя взвешиваний",
        "requirement": "Взвешивайся 7 дней подряд",
        "color": "#636366",
        "category": "special",
    },
    {
        "id": "weight_month",
        "emoji": "📊",
        "title": "Месяц на весах",
        "description": "Месяц взвешиваний",
        "requirement": "Взвешивайся 30 дней подряд",
        "color": "#48484A",
        "category": "special",
    },
    {
        "id": "weight_loss_5kg",
        "emoji": "🎯",
        "title": "Минус 5 кг",
        "description": "Потеря 5 кг",
        "requirement": "Потеряй 5 кг веса",
        "color": "#FF9500",
        "category": "special",
    },
    {
        "id": "weight_loss_10kg",
        "emoji": "🏆",
        "title": "Минус 10 кг",
        "description": "Потеря 10 кг",
        "requirement": "Потеряй 10 кг веса",
        "color": "#FFD60A",
        "category": "special",
    },
    
    {
        "id": "early_bird",
        "emoji": "🌅",
        "title": "Ранняя пташка",
        "description": "Завтрак до 9 утра",
        "requirement": "Завтракай до 9 утра 7 дней подряд",
        "color": "#FFD60A",
        "category": "special",
    },
    {
        "id": "night_owl",
        "emoji": "🦉",
        "title": "Ночная сова",
        "description": "Поздний ужин",
        "requirement": "Добавь блюдо после 22:00",
        "color": "#5856D6",
        "category": "special",
    },
    {
        "id": "regular_meals",
        "emoji": "⏰",
        "title": "Регулярное питание",
        "description": "3 приёма в день",
        "requirement": "Ешь 3+ раза в день неделю подряд",
        "color": "#007AFF",
        "category": "special",
    },
    {
        "id": "breakfast_week",
        "emoji": "🍳",
        "title": "Завтракатель",
        "description": "Неделя завтраков",
        "requirement": "Завтракай 7 дней подряд",
        "color": "#FF9500",
        "category": "special",
    },
    
    {
        "id": "scanner_first",
        "emoji": "📸",
        "title": "Первое сканирование",
        "description": "Отсканировано 1 блюдо",
        "requirement": "Отсканируй своё первое блюдо",
        "color": "#5856D6",
        "category": "special",
    },
    {
        "id": "scanner_10",
        "emoji": "📷",
        "title": "Сканер-любитель",
        "description": "10 сканирований",
        "requirement": "Отсканируй 10 блюд",
        "color": "#5AC8FA",
        "category": "special",
    },
    {
        "id": "scanner_50",
        "emoji": "📹",
        "title": "Сканер-про",
        "description": "50 сканирований",
        "requirement": "Отсканируй 50 блюд",
        "color": "#64D2FF",
        "category": "special",
    },
    {
        "id": "scanner_100",
        "emoji": "🎥",
        "title": "Сканер-мастер",
        "description": "100 сканирований",
        "requirement": "Отсканируй 100 блюд",
        "color": "#32D3E6",
        "category": "special",
    },
    {
        "id": "scanner_500",
        "emoji": "🎬",
        "title": "Сканер-легенда",
        "description": "500 сканирований",
        "requirement": "Отсканируй 500 блюд",
        "color": "#00C7E6",
        "category": "special",
    },
    
    {
        "id": "variety_10",
        "emoji": "🗺️",
        "title": "Исследователь",
        "description": "10 разных блюд",
        "requirement": "Попробуй 10 разных блюд",
        "color": "#FF5722",
        "category": "special",
    },
    {
        "id": "variety_25",
        "emoji": "🌍",
        "title": "Путешественник",
        "description": "25 разных блюд",
        "requirement": "Попробуй 25 разных блюд",
        "color": "#FF6B3B",
        "category": "special",
    },
    {
        "id": "variety_50",
        "emoji": "🌎",
        "title": "Глобус вкусов",
        "description": "50 разных блюд",
        "requirement": "Попробуй 50 разных блюд",
        "color": "#FF7F54",
        "category": "special",
    },
    {
        "id": "cuisines_5",
        "emoji": "🌮",
        "title": "Кулинарный турист",
        "description": "5 кухонь мира",
        "requirement": "Попробуй блюда из 5 разных кухонь",
        "color": "#FF9800",
        "category": "special",
    },
    {
        "id": "cuisines_10",
        "emoji": "🍜",
        "title": "Гастрономический дипломат",
        "description": "10 кухонь мира",
        "requirement": "Попробуй блюда из 10 разных кухонь",
        "color": "#FFA726",
        "category": "special",
    },
    
    {
        "id": "recipe_first",
        "emoji": "📖",
        "title": "Рецептоман",
        "description": "Первый рецепт",
        "requirement": "Используй свой первый рецепт",
        "color": "#FF2D55",
        "category": "special",
    },
    {
        "id": "recipe_5",
        "emoji": "📚",
        "title": "Книга рецептов",
        "description": "5 рецептов",
        "requirement": "Используй 5 разных рецептов",
        "color": "#FF3A5A",
        "category": "special",
    },
    {
        "id": "recipe_10",
        "emoji": "📜",
        "title": "Рецепт-коллекционер",
        "description": "10 рецептов",
        "requirement": "Используй 10 разных рецептов",
        "color": "#FF4765",
        "category": "special",
    },
    {
        "id": "recipe_25",
        "emoji": "🎓",
        "title": "Кулинарный профессор",
        "description": "25 рецептов",
        "requirement": "Используй 25 разных рецептов",
        "color": "#FF5470",
        "category": "special",
    },
    
    {
        "id": "collector_5",
        "emoji": "🏅",
        "title": "Коллекционер",
        "description": "5 значков",
        "requirement": "Получи 5 значков",
        "color": "#FFC107",
        "category": "special",
    },
    {
        "id": "collector_10",
        "emoji": "🎖️",
        "title": "Достигатор",
        "description": "10 значков",
        "requirement": "Получи 10 значков",
        "color": "#FF9800",
        "category": "special",
    },
    {
        "id": "collector_25",
        "emoji": "🏆",
        "title": "Охотник за трофеями",
        "description": "25 значков",
        "requirement": "Получи 25 значков",
        "color": "#FF8700",
        "category": "special",
    },
    {
        "id": "collector_50",
        "emoji": "👑",
        "title": "Повелитель достижений",
        "description": "50 значков",
        "requirement": "Получи 50 значков",
        "color": "#FFD700",
        "category": "special",
    },
]


def get_user_stats(user: User, db: Session) -> Dict:
    meals_count = db.query(func.count(MealPhoto.id)).filter(
        MealPhoto.user_id == user.id
    ).scalar() or 0
    
    unique_meals_count = db.query(func.count(func.distinct(MealPhoto.meal_name))).filter(
        MealPhoto.user_id == user.id,
        MealPhoto.meal_name.isnot(None)
    ).scalar() or 0
    
    healthy_meals_count = db.query(func.count(MealPhoto.id)).filter(
        MealPhoto.user_id == user.id,
        MealPhoto.health_score >= 8
    ).scalar() or 0
    
    weight_logs_count = db.query(func.count(WeightLog.id)).filter(
        WeightLog.user_id == user.id
    ).scalar() or 0
    
    onboarding = db.query(OnboardingData).filter(
        OnboardingData.user_id == user.id
    ).first()
    
    target_calories = onboarding.target_calories if onboarding else 0
    
    water_days_goal_met = 0
    calorie_days_goal_met = 0
    
    earned_badges = db.query(UserBadge).filter(
        UserBadge.user_id == user.id
    ).count()
    
    return {
        "streak_count": user.streak_count or 0,
        "meals_count": meals_count,
        "unique_meals_count": unique_meals_count,
        "healthy_meals_count": healthy_meals_count,
        "weight_logs_count": weight_logs_count,
        "target_calories": target_calories,
        "water_days_goal_met": water_days_goal_met,
        "calorie_days_goal_met": calorie_days_goal_met,
        "earned_badges_count": earned_badges,
    }


def check_badge_eligibility(badge_id: str, stats: Dict) -> bool:
    if badge_id == "streak_3":
        return stats["streak_count"] >= 3
    elif badge_id == "streak_7":
        return stats["streak_count"] >= 7
    elif badge_id == "streak_14":
        return stats["streak_count"] >= 14
    elif badge_id == "streak_30":
        return stats["streak_count"] >= 30
    elif badge_id == "streak_50":
        return stats["streak_count"] >= 50
    elif badge_id == "streak_100":
        return stats["streak_count"] >= 100
    elif badge_id == "streak_365":
        return stats["streak_count"] >= 365
    elif badge_id == "streak_1000":
        return stats["streak_count"] >= 1000
    
    elif badge_id == "first_meal":
        return stats["meals_count"] >= 1
    elif badge_id == "meals_5":
        return stats["meals_count"] >= 5
    elif badge_id == "meals_10":
        return stats["meals_count"] >= 10
    elif badge_id == "meals_25":
        return stats["meals_count"] >= 25
    elif badge_id == "meals_50":
        return stats["meals_count"] >= 50
    elif badge_id == "meals_100":
        return stats["meals_count"] >= 100
    elif badge_id == "meals_250":
        return stats["meals_count"] >= 250
    elif badge_id == "meals_500":
        return stats["meals_count"] >= 500
    elif badge_id == "meals_1000":
        return stats["meals_count"] >= 1000
    elif badge_id == "meals_5000":
        return stats["meals_count"] >= 5000
    
    elif badge_id.startswith("water_"):
        return stats["water_days_goal_met"] >= 1
    
    elif badge_id.startswith("goal_"):
        return stats["calorie_days_goal_met"] >= 1
    
    elif badge_id.startswith("macro_") or badge_id.startswith("protein_") or badge_id.startswith("fiber_") or badge_id.startswith("lowcarb_"):
        return False
    
    elif badge_id == "healthy_first":
        return stats["healthy_meals_count"] >= 1
    elif badge_id.startswith("healthy_") or badge_id.startswith("veggies_") or badge_id.startswith("fruits_"):
        return False
    
    elif badge_id == "weight_first":
        return stats["weight_logs_count"] >= 1
    elif badge_id == "weight_week":
        return stats["weight_logs_count"] >= 7
    elif badge_id == "weight_month":
        return stats["weight_logs_count"] >= 30
    elif badge_id.startswith("weight_loss_"):
        return False
    
    elif badge_id.startswith("early_") or badge_id.startswith("night_") or badge_id.startswith("regular_") or badge_id.startswith("breakfast_"):
        return False
    
    elif badge_id.startswith("scanner_"):
        return False
    
    elif badge_id.startswith("variety_"):
        if "10" in badge_id:
            return stats["unique_meals_count"] >= 10
        elif "25" in badge_id:
            return stats["unique_meals_count"] >= 25
        elif "50" in badge_id:
            return stats["unique_meals_count"] >= 50
        return False
    elif badge_id.startswith("cuisines_"):
        return False
    
    elif badge_id.startswith("recipe_"):
        return False
    
    elif badge_id == "collector_5":
        return stats["earned_badges_count"] >= 5
    elif badge_id == "collector_10":
        return stats["earned_badges_count"] >= 10
    elif badge_id == "collector_25":
        return stats["earned_badges_count"] >= 25
    elif badge_id == "collector_50":
        return stats["earned_badges_count"] >= 50
    
    return False


def award_badge(user_id: int, badge_id: str, category: str, db: Session) -> Optional[UserBadge]:
    existing = db.query(UserBadge).filter(
        UserBadge.user_id == user_id,
        UserBadge.badge_id == badge_id
    ).first()
    
    if existing:
        return None
    
    badge = UserBadge(
        user_id=user_id,
        badge_id=badge_id,
        category=category,
    )
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return badge


def check_and_award_new_badges(user_id: int, db: Session) -> List[UserBadge]:
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        return []
    
    stats = get_user_stats(user, db)
    earned_badge_ids = {b.badge_id for b in db.query(UserBadge).filter(UserBadge.user_id == user_id).all()}
    
    new_badges = []
    for badge_config in ALL_BADGES:
        badge_id = badge_config["id"]
        if badge_id in earned_badge_ids:
            continue
        
        if check_badge_eligibility(badge_id, stats):
            new_badge = award_badge(user_id, badge_id, badge_config["category"], db)
            if new_badge:
                new_badges.append(new_badge)
    
    return new_badges


def get_all_badges_with_status(user: User, db: Session) -> Tuple[List[Dict], int, List[str]]:
    earned_badges = {b.badge_id: b for b in db.query(UserBadge).filter(UserBadge.user_id == user.id).all()}
    
    result = []
    total_earned = 0
    new_badge_ids = []
    
    for badge_config in ALL_BADGES:
        badge_data = badge_config.copy()
        badge_data["badge_id"] = badge_config["id"]
        earned_badge = earned_badges.get(badge_config["id"])
        badge_data["is_earned"] = earned_badge is not None
        badge_data["earned_at"] = earned_badge.earned_at if earned_badge else None
        badge_data["seen"] = earned_badge.seen if earned_badge else False
        
        if earned_badge:
            total_earned += 1
            if not earned_badge.seen:
                new_badge_ids.append(earned_badge.badge_id)
        
        result.append(badge_data)
    
    return result, total_earned, new_badge_ids


def check_and_award_badges(user: User, db: Session) -> List[UserBadge]:
    return check_and_award_new_badges(user.id, db)


def mark_badges_seen(user_id: int, badge_ids: List[str], db: Session) -> int:
    updated = db.query(UserBadge).filter(
        UserBadge.user_id == user_id,
        UserBadge.badge_id.in_(badge_ids)
    ).update({"seen": True}, synchronize_session=False)
    db.commit()
    return updated


def get_badge_config(badge_id: str) -> Optional[Dict]:
    for badge in ALL_BADGES:
        if badge["id"] == badge_id:
            return badge
    return None
