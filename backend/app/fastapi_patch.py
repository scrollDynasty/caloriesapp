"""
Патч для совместимости fastapi-amis-admin с новыми версиями FastAPI и SQLModel
Добавляет недостающие функции, которые были удалены в новых версиях
"""
import fastapi.utils as fastapi_utils
from typing import Any, Type, Optional
from pydantic import BaseModel, Field


def create_response_field(
    name: Optional[str] = None,
    type_: Optional[Type[Any]] = None,
    class_validators: Optional[dict] = None,
    model_config: Optional[type] = None,
    default: Any = ...,
    **kwargs: Any,
) -> Any:
    """
    Создает поле ответа для FastAPI.
    Эта функция была удалена из fastapi.utils в новых версиях FastAPI.
    """
    if type_ is not None and isinstance(type_, type) and issubclass(type_, BaseModel):
        return type_
    
    if default is ...:
        return Field(**kwargs)
    else:
        return Field(default=default, **kwargs)


# Добавляем функцию в модуль fastapi.utils, если её там нет
if not hasattr(fastapi_utils, 'create_response_field'):
    fastapi_utils.create_response_field = create_response_field


# Патч для sqlmodel._compat - добавляем post_init_field_info
try:
    import sqlmodel._compat as sqlmodel_compat
    
    if not hasattr(sqlmodel_compat, 'post_init_field_info'):
        def post_init_field_info(field_info: Any) -> Any:
            """
            Функция post_init_field_info была удалена из sqlmodel._compat в новых версиях.
            Эта функция использовалась для обработки полей после инициализации.
            """
            return field_info
        
        sqlmodel_compat.post_init_field_info = post_init_field_info
except ImportError:
    # Если sqlmodel не установлен, пропускаем
    pass

