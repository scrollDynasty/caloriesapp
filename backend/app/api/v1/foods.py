from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session

from app.core.dependencies import get_current_user, get_db
from app.models.user import User
from app.services.food_database import food_db_service

router = APIRouter()


@router.get("/foods/search")
async def search_foods(
    q: str = Query(..., min_length=1, max_length=100),
    limit: int = Query(50, ge=1, le=100),
    source: str = Query("all", regex="^(all|foundation|branded|survey)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Ищет продукты в базе.
    
    Parameters:
    - q: поисковый запрос (название продукта)
    - limit: максимальное количество результатов (1-100)
    - source: источник данных (all, foundation, branded, survey)
    """
    try:
        results = food_db_service.search_foods(q, limit=limit, source=source)
        return {
            "query": q,
            "source": source,
            "count": len(results),
            "foods": results,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching foods: {str(e)}"
        )


@router.get("/foods")
async def get_foods(
    offset: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=100),
    source: str = Query("foundation", regex="^(all|foundation|branded|survey)$"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получает список продуктов с пагинацией.
    
    Parameters:
    - offset: количество пропускаемых продуктов
    - limit: количество продуктов для возврата (1-100)
    - source: источник данных (foundation, branded, survey)
    """
    try:
        foods = food_db_service.get_by_source(source, limit=limit + offset)
        total = len(foods)
        paginated_foods = foods[offset:offset + limit]
        
        return {
            "total": total,
            "offset": offset,
            "limit": limit,
            "source": source,
            "count": len(paginated_foods),
            "foods": paginated_foods,
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error getting foods: {str(e)}"
        )


@router.get("/foods/sources")
async def get_sources(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Получает доступные источники данных о продуктах.
    """
    return {
        "sources": [
            {
                "id": "foundation",
                "name": "Foundation Foods",
                "description": "Основные продукты USDA с полной питательной информацией"
            },
            {
                "id": "branded",
                "name": "Брендированные продукты",
                "description": "Продукты известных брендов с указанием производителя"
            },
            {
                "id": "survey",
                "name": "FNDDS/Survey",
                "description": "Продукты из национального обследования диеты"
            }
        ]
    }

