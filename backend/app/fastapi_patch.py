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
    if type_ is not None and isinstance(type_, type) and issubclass(type_, BaseModel):
        return type_
    
    if default is ...:
        return Field(**kwargs)
    else:
        return Field(default=default, **kwargs)


if not hasattr(fastapi_utils, 'create_response_field'):
    fastapi_utils.create_response_field = create_response_field


try:
    import sqlmodel._compat as sqlmodel_compat
    
    if not hasattr(sqlmodel_compat, 'post_init_field_info'):
        def post_init_field_info(field_info: Any) -> Any:
            return field_info
        
        sqlmodel_compat.post_init_field_info = post_init_field_info
except ImportError:
    pass
