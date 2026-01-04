from sqlalchemy import Column, Integer, String, Text, Date, Numeric, BigInteger, ForeignKey, Index
from sqlalchemy.orm import relationship
from app.core.database import Base


class Food(Base):
    """Модель продукта из USDA FoodData"""
    __tablename__ = "foods"

    fdc_id = Column(Integer, primary_key=True, index=True)
    data_type = Column(String(50), nullable=False, index=True)
    description = Column(Text, nullable=False)
    food_category_id = Column(String(100))
    publication_date = Column(Date)

    # Relationships
    nutrients = relationship("FoodNutrient", back_populates="food", cascade="all, delete-orphan")
    branded_info = relationship("BrandedFood", back_populates="food", uselist=False)

    __table_args__ = (
        Index('idx_description', 'description', mysql_prefix='FULLTEXT'),
    )


class FoodNutrient(Base):
    """Модель нутриентов продукта"""
    __tablename__ = "food_nutrients"

    id = Column(BigInteger, primary_key=True, autoincrement=True)
    fdc_id = Column(Integer, ForeignKey("foods.fdc_id", ondelete="CASCADE"), nullable=False, index=True)
    nutrient_id = Column(Integer, nullable=False, index=True)
    amount = Column(Numeric(12, 4))

    # Relationships
    food = relationship("Food", back_populates="nutrients")

    __table_args__ = (
        Index('idx_fdc_nutrient', 'fdc_id', 'nutrient_id'),
    )


class BrandedFood(Base):
    """Модель брендированного продукта"""
    __tablename__ = "branded_foods"

    fdc_id = Column(Integer, ForeignKey("foods.fdc_id", ondelete="CASCADE"), primary_key=True)
    brand_owner = Column(String(255), index=True)
    brand_name = Column(String(255))
    subbrand_name = Column(String(255))
    gtin_upc = Column(String(50), index=True)
    ingredients = Column(Text)
    serving_size = Column(Numeric(10, 2))
    serving_size_unit = Column(String(50))
    household_serving_fulltext = Column(String(255))

    # Relationships
    food = relationship("Food", back_populates="branded_info")


class NutrientName(Base):
    """Справочник названий нутриентов"""
    __tablename__ = "nutrient_names"

    nutrient_id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False, unique=True)
    unit_name = Column(String(20))
