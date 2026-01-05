import csv
import io
from typing import List, Dict, Any, Optional
from collections import defaultdict

try:
    import boto3
    from botocore.exceptions import ClientError
    BOTO3_AVAILABLE = True
except ImportError:
    BOTO3_AVAILABLE = False
    ClientError = Exception

from app.core.config import settings


class FoodDatabaseService:
    def __init__(self):
        self._foods_cache = None
        self._food_names_cache = None
        self._nutrients_cache = None
        self._portions_cache = None
        self._categories_cache = None
        self._branded_foods_cache = None
        self._survey_foods_cache = None
        
        self.s3_client = None
        self._init_s3_client()
    
    def _init_s3_client(self):
        if not BOTO3_AVAILABLE:
            print("Warning: boto3 not installed. Food database will return empty results.")
            self.s3_client = None
            return
            
        try:
            if settings.yandex_storage_access_key and settings.yandex_storage_secret_key:
                self.s3_client = boto3.client(
                    's3',
                    endpoint_url=settings.yandex_storage_endpoint,
                    region_name=settings.yandex_storage_region,
                    aws_access_key_id=settings.yandex_storage_access_key,
                    aws_secret_access_key=settings.yandex_storage_secret_key
                )
            else:
                print("Warning: Yandex Storage credentials not configured.")
                self.s3_client = None
        except Exception as e:
            print(f"Error initializing S3 client: {e}")
            self.s3_client = None
    
    def _get_s3_file(self, file_path: str) -> Optional[str]:
        if not self.s3_client:
            return None
        
        try:
            response = self.s3_client.get_object(
                Bucket=settings.yandex_storage_bucket_name,
                Key=file_path
            )
            content = response['Body'].read().decode('utf-8')
            return content
        except ClientError as e:
            print(f"Error downloading {file_path}: {e}")
            return None
    
    def _load_food_names(self) -> Dict[str, str]:
        if self._food_names_cache is not None:
            return self._food_names_cache
        
        food_names = {}
        file_path = "fooddata/food.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return food_names
            
            reader = csv.DictReader(io.StringIO(content))
            count = 0
            for row in reader:
                if count > 10000:
                    break
                fdc_id = row.get('fdc_id')
                description = row.get('description', '').strip()
                if fdc_id and description:
                    food_names[fdc_id] = description
                count += 1
        except Exception as e:
            print(f"Error reading food.csv: {e}")
        
        self._food_names_cache = food_names
        return food_names
    
    def _load_nutrients(self) -> Dict[str, Dict[int, float]]:
        if self._nutrients_cache is not None:
            return self._nutrients_cache
        
        nutrient_codes = {
            1003: "protein",
            1004: "fat",
            1005: "carbs",
            1008: "calories",
        }
        
        nutrients = defaultdict(dict)
        file_path = "fooddata/food_nutrient.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return dict(nutrients)
            
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                fdc_id = row.get('fdc_id')
                nutrient_code = row.get('nutrient_id') or row.get('nutrient_code')
                value = row.get('amount') or row.get('value')
                
                if fdc_id and nutrient_code and value:
                    try:
                        nutrient_code_int = int(nutrient_code)
                        if nutrient_code_int in nutrient_codes:
                            nutrients[fdc_id][nutrient_code_int] = float(value)
                    except (ValueError, KeyError):
                        continue
        except Exception as e:
            print(f"Error reading food_nutrient.csv: {e}")
        
        self._nutrients_cache = dict(nutrients)
        return self._nutrients_cache
    
    def _load_foundation_foods(self) -> set:
        foundation_ids = set()
        file_path = "fooddata/foundation_food.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return foundation_ids
            
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                fdc_id = row.get('fdc_id')
                if fdc_id:
                    foundation_ids.add(fdc_id)
        except Exception as e:
            print(f"Error reading foundation_food.csv: {e}")
        
        return foundation_ids
    
    def _load_portions(self) -> Dict[str, str]:
        if self._portions_cache is not None:
            return self._portions_cache
        
        portions = defaultdict(lambda: "100g")
        file_path = "fooddata/food_portion.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                self._portions_cache = dict(portions)
                return dict(portions)
            
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                fdc_id = row.get('fdc_id')
                portion_size = row.get('portion_size', '')
                portion_unit = row.get('portion_unit_name', '')
                
                if fdc_id and portion_size and portion_unit:
                    if fdc_id not in portions or portions[fdc_id] == "100g":
                        portions[fdc_id] = f"{portion_size} {portion_unit}"
                    
        except Exception as e:
            print(f"Warning: Could not load portions: {e}")
        
        self._portions_cache = dict(portions)
        return dict(portions)
    
    def _load_categories(self) -> Dict[str, str]:
        if self._categories_cache is not None:
            return self._categories_cache
        
        categories = {}
        file_path = "fooddata/food_category.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return categories
            
            reader = csv.DictReader(io.StringIO(content))
            for row in reader:
                category_id = row.get('id')
                description = row.get('description', '').strip()
                if category_id and description:
                    categories[category_id] = description
                    
        except Exception as e:
            print(f"Warning: Could not load categories: {e}")
        
        self._categories_cache = categories
        return categories
    
    def _load_branded_foods(self) -> List[Dict[str, Any]]:
        if self._branded_foods_cache is not None:
            return self._branded_foods_cache
        
        branded = []
        file_path = "fooddata/branded_food.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return branded
            
            reader = csv.DictReader(io.StringIO(content))
            count = 0
            for row in reader:
                if count > 1000:
                    break
                fdc_id = row.get('fdc_id')
                description = row.get('description', '')
                brand = row.get('brand_name', '')
                if fdc_id and description:
                    branded.append({
                        "fdc_id": fdc_id,
                        "name": description,
                        "brand": brand,
                        "source": "branded"
                    })
                count += 1
                    
        except Exception as e:
            print(f"Warning: Could not load branded foods: {e}")
        
        self._branded_foods_cache = branded
        return branded
    
    def _load_survey_foods(self) -> List[Dict[str, Any]]:
        if self._survey_foods_cache is not None:
            return self._survey_foods_cache
        
        survey = []
        file_path = "fooddata/survey_fndds_food.csv"
        
        try:
            content = self._get_s3_file(file_path)
            if not content:
                return survey
            
            reader = csv.DictReader(io.StringIO(content))
            count = 0
            for row in reader:
                if count > 500:
                    break
                fdc_id = row.get('fdc_id')
                description = row.get('description', '')
                if fdc_id and description:
                    survey.append({
                        "fdc_id": fdc_id,
                        "name": description,
                        "source": "survey_fndds"
                    })
                count += 1
                    
        except Exception as e:
            print(f"Warning: Could not load survey foods: {e}")
        
        self._survey_foods_cache = survey
        return survey
    
    def get_all_foods(self) -> List[Dict[str, Any]]:
        if self._foods_cache is not None:
            return self._foods_cache
        
        foundation_ids = self._load_foundation_foods()
        food_names = self._load_food_names()
        nutrients_data = self._load_nutrients()
        portions_data = self._load_portions()
        
        foods = []
        
        for fdc_id in foundation_ids:
            if fdc_id not in food_names:
                continue
            
            name = food_names[fdc_id]
            nutrients = nutrients_data.get(fdc_id, {})
            portion = portions_data.get(fdc_id, "100g")
            
            food_item = {
                "fdc_id": fdc_id,
                "name": name,
                "calories": round(nutrients.get(1008, 0), 1),
                "protein": round(nutrients.get(1003, 0), 1),
                "fat": round(nutrients.get(1004, 0), 1),
                "carbs": round(nutrients.get(1005, 0), 1),
                "portion": portion,
                "source": "foundation"
            }
            
            if food_item["calories"] > 0:
                foods.append(food_item)
        
        foods.sort(key=lambda x: x["name"])
        self._foods_cache = foods
        
        return foods
    
    def search_foods(self, query: str, limit: int = 50, source: str = "all") -> List[Dict[str, Any]]:
        query_lower = query.lower()
        results = []
        
        if source in ["all", "foundation"]:
            all_foods = self.get_all_foods()
            results.extend([
                food for food in all_foods
                if query_lower in food["name"].lower()
            ])
        
        if source in ["all", "branded"]:
            branded = self._load_branded_foods()
            results.extend([
                food for food in branded
                if query_lower in food["name"].lower()
            ])
        
        if source in ["all", "survey"]:
            survey = self._load_survey_foods()
            results.extend([
                food for food in survey
                if query_lower in food["name"].lower()
            ])
        
        seen = set()
        unique_results = []
        for food in results:
            key = (food["fdc_id"], food.get("source", "unknown"))
            if key not in seen:
                seen.add(key)
                unique_results.append(food)
        
        return unique_results[:limit]
    
    def get_by_source(self, source: str, limit: int = 50) -> List[Dict[str, Any]]:
        if source == "foundation":
            return self.get_all_foods()[:limit]
        elif source == "branded":
            return self._load_branded_foods()[:limit]
        elif source == "survey":
            return self._load_survey_foods()[:limit]
        return []


food_db_service = FoodDatabaseService()
