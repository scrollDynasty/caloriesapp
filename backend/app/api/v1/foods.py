from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, func, text
from typing import List, Optional
from pydantic import BaseModel

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.models.food import Food, FoodNutrient, BrandedFood

router = APIRouter()

NUTRIENT_MAP = {
    1008: 'calories',
    1003: 'protein',
    1004: 'fat',
    1005: 'carbs',
    1079: 'fiber',
    1087: 'calcium',
    1089: 'iron',
    1093: 'sodium',
}


class FoodItemResponse(BaseModel):
    fdc_id: int
    name: str
    calories: Optional[float] = None
    protein: Optional[float] = None
    fat: Optional[float] = None
    carbs: Optional[float] = None
    fiber: Optional[float] = None
    portion: Optional[str] = "100g"
    brand: Optional[str] = None
    source: str

    class Config:
        from_attributes = True


class FoodSearchResponse(BaseModel):
    query: Optional[str] = None
    source: str
    count: int
    total: int
    offset: int
    limit: int
    lang: str = "en"
    foods: List[FoodItemResponse]


def get_food_name(food: Food, lang: str = 'en') -> str:
    if lang == 'ru' and food.description_ru:
        return food.description_ru
    elif lang == 'uz' and food.description_uz:
        return food.description_uz
    return food.description


def build_food_response(food: Food, nutrients_dict: dict, branded_info: Optional[BrandedFood] = None, lang: str = 'en') -> FoodItemResponse:
    return FoodItemResponse(
        fdc_id=food.fdc_id,
        name=get_food_name(food, lang),
        calories=nutrients_dict.get(1008),
        protein=nutrients_dict.get(1003),
        fat=nutrients_dict.get(1004),
        carbs=nutrients_dict.get(1005),
        fiber=nutrients_dict.get(1079),
        portion=f"{branded_info.serving_size}{branded_info.serving_size_unit}" if branded_info and branded_info.serving_size else "100g",
        brand=branded_info.brand_owner if branded_info else None,
        source=food.data_type
    )


@router.get("/foods/search", response_model=FoodSearchResponse)
async def search_foods(
    q: str = Query(..., min_length=1, max_length=100, description="Поисковый запрос"),
    limit: int = Query(50, ge=1, le=100, description="Количество результатов"),
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    source: str = Query("all", regex="^(all|foundation|branded|survey)$", description="Источник данных"),
    lang: str = Query("en", regex="^(en|ru|uz)$", description="Язык результатов"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Food)
        if source != "all":
            if source == "foundation":
                query = query.filter(Food.data_type == "foundation_food")
            elif source == "branded":
                query = query.filter(Food.data_type == "branded_food")
            elif source == "survey":
                query = query.filter(Food.data_type.in_(["survey_fndds_food", "sample_food"]))
        
        search_term = q.strip().lower()
        if lang == 'ru':
            query = query.filter(
                or_(
                    Food.description_ru.ilike(f"%{search_term}%"),
                    Food.description.ilike(f"%{search_term}%")
                )
            )
        elif lang == 'uz':
            query = query.filter(
                or_(
                    Food.description_uz.ilike(f"%{search_term}%"),
                    Food.description.ilike(f"%{search_term}%")
                )
            )
        else:
            query = query.filter(
                or_(
                    Food.description.ilike(f"%{search_term}%"),
                    text(f"MATCH(description) AGAINST('{search_term}' IN BOOLEAN MODE)")
                )
            )
        
        total = query.count()
        
        foods = query.order_by(Food.description).offset(offset).limit(limit).all()
        fdc_ids = [f.fdc_id for f in foods]
        nutrients = db.query(FoodNutrient).filter(
            FoodNutrient.fdc_id.in_(fdc_ids),
            FoodNutrient.nutrient_id.in_(NUTRIENT_MAP.keys())
        ).all()
        
        nutrients_by_food = {}
        for nutrient in nutrients:
            if nutrient.fdc_id not in nutrients_by_food:
                nutrients_by_food[nutrient.fdc_id] = {}
            nutrients_by_food[nutrient.fdc_id][nutrient.nutrient_id] = float(nutrient.amount) if nutrient.amount else None
        
        branded_info = {}
        if source in ("all", "branded"):
            branded = db.query(BrandedFood).filter(BrandedFood.fdc_id.in_(fdc_ids)).all()
            branded_info = {b.fdc_id: b for b in branded}
        
        result_foods = [
            build_food_response(
                food,
                nutrients_by_food.get(food.fdc_id, {}),
                branded_info.get(food.fdc_id),
                lang
            )
            for food in foods
        ]
        
        return FoodSearchResponse(
            query=q,
            source=source,
            count=len(result_foods),
            total=total,
            offset=offset,
            limit=limit,
            lang=lang,
            foods=result_foods
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching foods: {str(e)}"
        )


@router.get("/foods", response_model=FoodSearchResponse)
async def get_foods(
    offset: int = Query(0, ge=0, description="Смещение для пагинации"),
    limit: int = Query(50, ge=1, le=100, description="Количество результатов"),
    source: str = Query("foundation", regex="^(all|foundation|branded|survey)$", description="Источник данных"),
    lang: str = Query("en", regex="^(en|ru|uz)$", description="Язык результатов"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        query = db.query(Food)
        if source == "foundation":
            query = query.filter(Food.data_type == "foundation_food")
        elif source == "branded":
            query = query.filter(Food.data_type == "branded_food")
        elif source == "survey":
            query = query.filter(Food.data_type.in_(["survey_fndds_food", "sample_food"]))
        
        total = query.count()
        
        foods = query.order_by(Food.fdc_id).offset(offset).limit(limit).all()
        fdc_ids = [f.fdc_id for f in foods]
        nutrients = db.query(FoodNutrient).filter(
            FoodNutrient.fdc_id.in_(fdc_ids),
            FoodNutrient.nutrient_id.in_(NUTRIENT_MAP.keys())
        ).all()
        
        nutrients_by_food = {}
        for nutrient in nutrients:
            if nutrient.fdc_id not in nutrients_by_food:
                nutrients_by_food[nutrient.fdc_id] = {}
            nutrients_by_food[nutrient.fdc_id][nutrient.nutrient_id] = float(nutrient.amount) if nutrient.amount else None
        
        branded_info = {}
        if source in ("all", "branded"):
            branded = db.query(BrandedFood).filter(BrandedFood.fdc_id.in_(fdc_ids)).all()
            branded_info = {b.fdc_id: b for b in branded}
        
        result_foods = [
            build_food_response(
                food,
                nutrients_by_food.get(food.fdc_id, {}),
                branded_info.get(food.fdc_id),
                lang
            )
            for food in foods
        ]
        
        return FoodSearchResponse(
            query=None,
            source=source,
            count=len(result_foods),
            total=total,
            offset=offset,
            limit=limit,
            lang=lang,
            foods=result_foods
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting foods: {str(e)}"
        )


@router.get("/foods/{fdc_id}", response_model=FoodItemResponse)
async def get_food_by_id(
    fdc_id: int,
    lang: str = Query("en", regex="^(en|ru|uz)$", description="Язык результатов"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    food = db.query(Food).filter(Food.fdc_id == fdc_id).first()
    
    if not food:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Food with fdc_id {fdc_id} not found"
        )
    
    nutrients = db.query(FoodNutrient).filter(
        FoodNutrient.fdc_id == fdc_id,
        FoodNutrient.nutrient_id.in_(NUTRIENT_MAP.keys())
    ).all()
    
    nutrients_dict = {n.nutrient_id: float(n.amount) if n.amount else None for n in nutrients}
    
    branded = db.query(BrandedFood).filter(BrandedFood.fdc_id == fdc_id).first()
    
    return build_food_response(food, nutrients_dict, branded, lang)


@router.get("/foods/sources")
async def get_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    try:
        foundation_count = db.query(func.count(Food.fdc_id)).filter(Food.data_type == "foundation_food").scalar()
        branded_count = db.query(func.count(Food.fdc_id)).filter(Food.data_type == "branded_food").scalar()
        survey_count = db.query(func.count(Food.fdc_id)).filter(
            Food.data_type.in_(["survey_fndds_food", "sample_food"])
        ).scalar()
        
        return {
            "sources": [
                {
                    "id": "foundation",
                    "name": "Foundation Foods",
                    "description": "Основные продукты USDA с полной питательной информацией",
                    "count": foundation_count or 0
                },
                {
                    "id": "branded",
                    "name": "Брендированные продукты",
                    "description": "Продукты известных брендов с указанием производителя",
                    "count": branded_count or 0
                },
                {
                    "id": "survey",
                    "name": "FNDDS/Survey",
                    "description": "Продукты из национального обследования диеты",
                    "count": survey_count or 0
                }
            ],
            "total": (foundation_count or 0) + (branded_count or 0) + (survey_count or 0)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting sources: {str(e)}"
        )

