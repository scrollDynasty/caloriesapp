from fastapi import APIRouter, Depends, Query, HTTPException, status
from fastapi.responses import PlainTextResponse
from sqlalchemy.orm import Session
import os

from app.core.dependencies import get_current_user, get_db
from app.models.user import User

router = APIRouter()

# Путь к папке с CSV файлами: backend/fooddata/
# файл находится в: backend/app/api/v1/foods.py
# поднимаемся на 3 уровня: v1 -> api -> app -> backend, затем fooddata
FOODDATA_PATH = os.path.join(os.path.dirname(__file__), '../../../fooddata')


@router.get("/foods/csv/{filename}")
async def get_csv_file(
    filename: str,
    current_user: User = Depends(get_current_user),
):
    """
    Получает CSV файл из папки fooddata.
    
    Parameters:
    - filename: имя файла (food.csv, food_nutrient.csv, etc)
    """
    # Безопасность - только .csv файлы
    if not filename.endswith('.csv'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only CSV files are allowed"
        )
    
    # Предотвращаем path traversal
    if '..' in filename or '/' in filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid filename"
        )
    
    file_path = os.path.join(FOODDATA_PATH, filename)
    
    # Проверяем что файл существует и находится в правильной папке
    if not os.path.isfile(file_path) or not os.path.realpath(file_path).startswith(os.path.realpath(FOODDATA_PATH)):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"File not found: {filename}"
        )
    
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        return PlainTextResponse(content=content, media_type="text/csv")
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading file: {str(e)}"
        )


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
        # TODO: Реализовать поиск через CSV файлы
        return {
            "query": q,
            "source": source,
            "count": 0,
            "foods": [],
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error searching foods: {str(e)}"
        )


@router.get("/foods")
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
        # TODO: Реализовать через CSV файлы
        return {
            "total": 0,
            "offset": offset,
            "limit": limit,
            "source": source,
            "count": 0,
            "foods": [],
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

