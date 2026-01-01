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
        "color": "#FF9500",
        "category": "streak",
    },
    {
        "id": "streak_7",
        "emoji": "🔥",
        "title": "Неделя силы",
        "description": "7 дней подряд",
        "requirement": "Отслеживай питание неделю подряд",
        "color": "#FF6B00",
        "category": "streak",
    },
    {
        "id": "streak_14",
        "emoji": "⚡",
        "title": "Две недели",
        "description": "14 дней подряд",
        "requirement": "Отслеживай питание 2 недели подряд",
        "color": "#FFD700",
        "category": "streak",
    },
    {
        "id": "streak_30",
        "emoji": "🏆",
        "title": "Месяц чемпиона",
        "description": "30 дней подряд",
        "requirement": "Отслеживай питание месяц подряд",
        "color": "#FFD700",
        "category": "streak",
    },
    {
        "id": "streak_100",
        "emoji": "💎",
        "title": "Легенда",
        "description": "100 дней подряд",
        "requirement": "Отслеживай питание 100 дней подряд",
        "color": "#00CED1",
        "category": "streak",
    },
    {
        "id": "first_meal",
        "emoji": "🍽️",
        "title": "Первое блюдо",
        "description": "Начало пути",
        "requirement": "Добавь своё первое блюдо",
        "color": "#FF6B6B",
        "category": "activity",
    },
    {
        "id": "meals_10",
        "emoji": "🥗",
        "title": "Гурман",
        "description": "10 блюд",
        "requirement": "Добавь 10 блюд",
        "color": "#4CAF50",
        "category": "activity",
    },
    {
        "id": "meals_50",
        "emoji": "👨‍🍳",
        "title": "Шеф-повар",
        "description": "50 блюд",
        "requirement": "Добавь 50 блюд",
        "color": "#FF9800",
        "category": "activity",
    },
    {
        "id": "meals_100",
        "emoji": "🌟",
        "title": "Мастер кухни",
        "description": "100 блюд",
        "requirement": "Добавь 100 блюд",
        "color": "#9C27B0",
        "category": "activity",
    },
    {
        "id": "water_champion",
        "emoji": "💧",
        "title": "Водный чемпион",
        "description": "Норма воды",
        "requirement": "Выполни норму воды за день",
        "color": "#2196F3",
        "category": "activity",
    },
    {
        "id": "water_week",
        "emoji": "🌊",
        "title": "Водная неделя",
        "description": "7 дней нормы воды",
        "requirement": "Выполняй норму воды 7 дней подряд",
        "color": "#00BCD4",
        "category": "activity",
    },
    {
        "id": "goal_reached",
        "emoji": "✅",
        "title": "Цель достигнута",
        "description": "Дневная норма",
        "requirement": "Достигни дневной нормы калорий",
        "color": "#34C759",
        "category": "nutrition",
    },
    {
        "id": "goal_week",
        "emoji": "🎯",
        "title": "Неделя в цели",
        "description": "7 дней нормы калорий",
        "requirement": "Достигай нормы калорий 7 дней подряд",
        "color": "#4CAF50",
        "category": "nutrition",
    },
    {
        "id": "macro_master",
        "emoji": "📊",
        "title": "Мастер макросов",
        "description": "Идеальный баланс",
        "requirement": "Достигни идеального баланса БЖУ",
        "color": "#AF52DE",
        "category": "nutrition",
    },
    {
        "id": "healthy_meal",
        "emoji": "💚",
        "title": "Здоровый выбор",
        "description": "Здоровое блюдо",
        "requirement": "Добавь блюдо с оценкой здоровья 8+",
        "color": "#34C759",
        "category": "nutrition",
    },
    {
        "id": "weight_logged",
        "emoji": "⚖️",
        "title": "На весах",
        "description": "Первое взвешивание",
        "requirement": "Запиши свой вес впервые",
        "color": "#607D8B",
        "category": "activity",
    },
    {
        "id": "weight_week",
        "emoji": "📈",
        "title": "Контроль веса",
        "description": "Неделя взвешиваний",
        "requirement": "Записывай вес 7 дней подряд",
        "color": "#795548",
        "category": "activity",
    },
    {
        "id": "explorer",
        "emoji": "🗺️",
        "title": "Исследователь",
        "description": "5 разных блюд",
        "requirement": "Попробуй 5 разных блюд",
        "color": "#FF5722",
        "category": "special",
    },
    {
        "id": "collector",
        "emoji": "🏅",
        "title": "Коллекционер",
        "description": "5 значков",
        "requirement": "Собери 5 значков",
        "color": "#FFC107",
        "category": "special",
    },
    {
        "id": "achiever",
        "emoji": "🎖️",
        "title": "Достигатор",
        "description": "10 значков",
        "requirement": "Собери 10 значков",
        "color": "#FF9800",
        "category": "special",
    },
]


def get_badge_config(badge_id: str) -> Optional[Dict]:
    for badge in ALL_BADGES:
        if badge["id"] == badge_id:
            return badge
    return None


def get_user_stats(user: User, db: Session) -> Dict:
    meals_count = db.query(func.count(MealPhoto.id)).filter(
        MealPhoto.user_id == user.id,
        MealPhoto.meal_name.isnot(None)
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
    elif badge_id == "streak_100":
        return stats["streak_count"] >= 100
    elif badge_id == "first_meal":
        return stats["meals_count"] >= 1
    elif badge_id == "meals_10":
        return stats["meals_count"] >= 10
    elif badge_id == "meals_50":
        return stats["meals_count"] >= 50
    elif badge_id == "meals_100":
        return stats["meals_count"] >= 100
    elif badge_id == "water_champion":
        return stats["water_days_goal_met"] >= 1
    elif badge_id == "water_week":
        return stats["water_days_goal_met"] >= 7
    elif badge_id == "goal_reached":
        return stats["calorie_days_goal_met"] >= 1
    elif badge_id == "goal_week":
        return stats["calorie_days_goal_met"] >= 7
    elif badge_id == "macro_master":
        return False
    elif badge_id == "healthy_meal":
        return stats["healthy_meals_count"] >= 1
    elif badge_id == "weight_logged":
        return stats["weight_logs_count"] >= 1
    elif badge_id == "weight_week":
        return stats["weight_logs_count"] >= 7
    elif badge_id == "explorer":
        return stats["unique_meals_count"] >= 5
    elif badge_id == "collector":
        return stats["earned_badges_count"] >= 5
    elif badge_id == "achiever":
        return stats["earned_badges_count"] >= 10
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
        earned_at=datetime.now(timezone.utc),
        seen=False,
        notified=False
    )
    db.add(badge)
    db.commit()
    db.refresh(badge)
    return badge


def check_and_award_badges(user: User, db: Session) -> List[UserBadge]:
    stats = get_user_stats(user, db)
    
    existing_badges = db.query(UserBadge.badge_id).filter(
        UserBadge.user_id == user.id
    ).all()
    existing_badge_ids = {b.badge_id for b in existing_badges}
    
    new_badges = []
    
    for badge_config in ALL_BADGES:
        badge_id = badge_config["id"]
        
        if badge_id in existing_badge_ids:
            continue
        
        if check_badge_eligibility(badge_id, stats):
            new_badge = award_badge(
                user_id=user.id,
                badge_id=badge_id,
                category=badge_config["category"],
                db=db
            )
            if new_badge:
                new_badges.append(new_badge)
                stats["earned_badges_count"] += 1
    
    return new_badges


def get_all_badges_with_status(user: User, db: Session) -> Tuple[List[Dict], int, List[str]]:
    earned_badges = db.query(UserBadge).filter(
        UserBadge.user_id == user.id
    ).all()
    
    earned_map = {b.badge_id: b for b in earned_badges}
    
    result = []
    new_badge_ids = []
    
    for badge_config in ALL_BADGES:
        badge_id = badge_config["id"]
        earned = earned_map.get(badge_id)
        
        badge_status = {
            "badge_id": badge_id,
            "emoji": badge_config["emoji"],
            "title": badge_config["title"],
            "description": badge_config["description"],
            "requirement": badge_config["requirement"],
            "color": badge_config["color"],
            "category": badge_config["category"],
            "is_earned": earned is not None,
            "earned_at": earned.earned_at if earned else None,
            "seen": earned.seen if earned else False,
        }
        result.append(badge_status)
        
        if earned and not earned.seen:
            new_badge_ids.append(badge_id)
    
    return result, len(earned_badges), new_badge_ids


def mark_badges_seen(user_id: int, badge_ids: List[str], db: Session) -> int:
    result = db.query(UserBadge).filter(
        UserBadge.user_id == user_id,
        UserBadge.badge_id.in_(badge_ids),
        UserBadge.seen == False
    ).update({"seen": True}, synchronize_session=False)
    db.commit()
    return result

