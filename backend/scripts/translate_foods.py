#!/usr/bin/env python3
"""
Скрипт перевода продуктов на русский и узбекский языки.
Использует Google Translate через deep-translator (бесплатно).

Для 2M+ записей займёт много времени (~7-10 дней при 1000 записей/час).
Рекомендуется запускать в background: nohup python3 translate_foods.py &

Оптимизации:
- Batch перевод (несколько текстов за раз)
- Кэширование частых слов
- Пропуск уже переведённых
- Checkpoint каждые 1000 записей
"""

import sys
import time
import json
import os
from datetime import datetime
from typing import List, Dict, Optional
import pymysql
from pymysql import cursors

# Попробуем импортировать переводчик
try:
    from deep_translator import GoogleTranslator
    TRANSLATOR_AVAILABLE = True
except ImportError:
    print("⚠️  Установите: pip install deep-translator")
    TRANSLATOR_AVAILABLE = False

# Конфигурация
DB_CONFIG = {
    'host': 'localhost',
    'user': 'root',
    'password': '1435511926Ss..',
    'database': 'caloriesapp',
    'charset': 'utf8mb4',
    'cursorclass': cursors.DictCursor
}

BATCH_SIZE = 50  # Сколько переводить за раз
CHECKPOINT_SIZE = 500  # Сохранять прогресс каждые N записей
SLEEP_BETWEEN_BATCHES = 2  # Секунд между батчами (чтобы не забанили)
MAX_TEXT_LENGTH = 500  # Максимальная длина для перевода

# Кэш частых слов (ускоряет перевод)
COMMON_WORDS_CACHE = {
    'en_ru': {
        'chicken': 'курица',
        'beef': 'говядина',
        'pork': 'свинина',
        'fish': 'рыба',
        'salmon': 'лосось',
        'tuna': 'тунец',
        'egg': 'яйцо',
        'eggs': 'яйца',
        'milk': 'молоко',
        'cheese': 'сыр',
        'butter': 'масло',
        'bread': 'хлеб',
        'rice': 'рис',
        'pasta': 'паста',
        'potato': 'картофель',
        'potatoes': 'картофель',
        'tomato': 'помидор',
        'apple': 'яблоко',
        'banana': 'банан',
        'orange': 'апельсин',
        'grape': 'виноград',
        'water': 'вода',
        'juice': 'сок',
        'coffee': 'кофе',
        'tea': 'чай',
        'sugar': 'сахар',
        'salt': 'соль',
        'oil': 'масло',
        'olive': 'оливковое',
        'vegetable': 'овощ',
        'fruit': 'фрукт',
        'meat': 'мясо',
        'raw': 'сырой',
        'cooked': 'приготовленный',
        'fried': 'жареный',
        'baked': 'запечённый',
        'boiled': 'варёный',
        'grilled': 'на гриле',
        'fresh': 'свежий',
        'frozen': 'замороженный',
        'canned': 'консервированный',
        'dried': 'сушёный',
        'whole': 'цельный',
        'sliced': 'нарезанный',
        'ground': 'молотый',
        'boneless': 'без костей',
        'skinless': 'без кожи',
        'lean': 'постный',
        'fat': 'жир',
        'protein': 'белок',
        'carbohydrate': 'углевод',
        'fiber': 'клетчатка',
        'sodium': 'натрий',
        'calcium': 'кальций',
        'iron': 'железо',
        'vitamin': 'витамин',
    },
    'en_uz': {
        'chicken': 'tovuq',
        'beef': 'mol go\'shti',
        'pork': 'cho\'chqa go\'shti',
        'fish': 'baliq',
        'egg': 'tuxum',
        'eggs': 'tuxumlar',
        'milk': 'sut',
        'cheese': 'pishloq',
        'butter': 'sariyog\'',
        'bread': 'non',
        'rice': 'guruch',
        'potato': 'kartoshka',
        'tomato': 'pomidor',
        'apple': 'olma',
        'banana': 'banan',
        'orange': 'apelsin',
        'water': 'suv',
        'juice': 'sharbat',
        'coffee': 'qahva',
        'tea': 'choy',
        'sugar': 'shakar',
        'salt': 'tuz',
        'oil': 'yog\'',
        'vegetable': 'sabzavot',
        'fruit': 'meva',
        'meat': 'go\'sht',
        'raw': 'xom',
        'cooked': 'pishirilgan',
        'fried': 'qovurilgan',
        'fresh': 'yangi',
        'frozen': 'muzlatilgan',
    }
}


class FoodTranslator:
    def __init__(self):
        self.connection = None
        self.translator_ru = None
        self.translator_uz = None
        self.stats = {
            'translated_ru': 0,
            'translated_uz': 0,
            'skipped': 0,
            'errors': 0,
            'start_time': None
        }
        
    def connect_db(self):
        """Подключение к БД"""
        self.connection = pymysql.connect(**DB_CONFIG)
        print("✅ Подключено к MariaDB")
        
    def init_translators(self):
        """Инициализация переводчиков"""
        if not TRANSLATOR_AVAILABLE:
            raise RuntimeError("deep-translator не установлен")
        
        self.translator_ru = GoogleTranslator(source='en', target='ru')
        self.translator_uz = GoogleTranslator(source='en', target='uz')
        print("✅ Переводчики инициализированы")
        
    def get_untranslated(self, lang: str, limit: int = BATCH_SIZE) -> List[Dict]:
        """Получает продукты без перевода"""
        with self.connection.cursor() as cursor:
            column = f"description_{lang}"
            cursor.execute(f"""
                SELECT fdc_id, description 
                FROM foods 
                WHERE {column} IS NULL 
                ORDER BY fdc_id 
                LIMIT %s
            """, (limit,))
            return cursor.fetchall()
    
    def translate_text(self, text: str, lang: str) -> Optional[str]:
        """Переводит текст на указанный язык"""
        if not text or len(text) > MAX_TEXT_LENGTH:
            return text[:MAX_TEXT_LENGTH] if text else None
            
        # Проверяем кэш
        text_lower = text.lower()
        cache_key = f"en_{lang}"
        if cache_key in COMMON_WORDS_CACHE:
            for en_word, translated in COMMON_WORDS_CACHE[cache_key].items():
                if text_lower == en_word:
                    return translated
        
        try:
            if lang == 'ru':
                return self.translator_ru.translate(text)
            elif lang == 'uz':
                return self.translator_uz.translate(text)
        except Exception as e:
            print(f"⚠️  Ошибка перевода '{text[:50]}...': {e}")
            return None
            
    def translate_batch(self, foods: List[Dict], lang: str) -> Dict[int, str]:
        """Переводит батч продуктов"""
        results = {}
        
        for food in foods:
            fdc_id = food['fdc_id']
            description = food['description']
            
            translated = self.translate_text(description, lang)
            if translated:
                results[fdc_id] = translated
                
        return results
    
    def save_translations(self, translations: Dict[int, str], lang: str):
        """Сохраняет переводы в БД"""
        if not translations:
            return
            
        column = f"description_{lang}"
        
        with self.connection.cursor() as cursor:
            for fdc_id, text in translations.items():
                cursor.execute(f"""
                    UPDATE foods 
                    SET {column} = %s 
                    WHERE fdc_id = %s
                """, (text, fdc_id))
        
        self.connection.commit()
        
    def get_progress(self) -> Dict:
        """Получает статистику прогресса"""
        with self.connection.cursor() as cursor:
            cursor.execute("SELECT COUNT(*) as total FROM foods")
            total = cursor.fetchone()['total']
            
            cursor.execute("SELECT COUNT(*) as count FROM foods WHERE description_ru IS NOT NULL")
            ru_count = cursor.fetchone()['count']
            
            cursor.execute("SELECT COUNT(*) as count FROM foods WHERE description_uz IS NOT NULL")
            uz_count = cursor.fetchone()['count']
            
        return {
            'total': total,
            'ru_translated': ru_count,
            'uz_translated': uz_count,
            'ru_percent': round(ru_count / total * 100, 2) if total > 0 else 0,
            'uz_percent': round(uz_count / total * 100, 2) if total > 0 else 0
        }
        
    def run(self, lang: str = 'ru', max_items: int = None):
        """Основной цикл перевода"""
        print(f"\n{'='*60}")
        print(f"🌍 Начало перевода на: {lang}")
        print(f"{'='*60}")
        
        self.stats['start_time'] = datetime.now()
        processed = 0
        
        while True:
            foods = self.get_untranslated(lang, BATCH_SIZE)
            
            if not foods:
                print(f"\n✅ Все продукты переведены на {lang}!")
                break
                
            if max_items and processed >= max_items:
                print(f"\n⏹️  Достигнут лимит: {max_items} записей")
                break
            
            # Переводим батч
            translations = self.translate_batch(foods, lang)
            
            # Сохраняем
            self.save_translations(translations, lang)
            
            processed += len(translations)
            self.stats[f'translated_{lang}'] = processed
            
            # Прогресс
            if processed % CHECKPOINT_SIZE == 0:
                progress = self.get_progress()
                elapsed = datetime.now() - self.stats['start_time']
                rate = processed / elapsed.total_seconds() * 3600 if elapsed.total_seconds() > 0 else 0
                
                print(f"\n📊 Прогресс {lang}: {progress[f'{lang}_translated']:,} / {progress['total']:,} ({progress[f'{lang}_percent']}%)")
                print(f"   Скорость: {rate:.0f} записей/час")
                print(f"   Время работы: {elapsed}")
            else:
                print(f"  ✓ Переведено: {processed:,}", end='\r')
            
            # Пауза чтобы не забанили
            time.sleep(SLEEP_BETWEEN_BATCHES)
        
        # Финальная статистика
        elapsed = datetime.now() - self.stats['start_time']
        print(f"\n{'='*60}")
        print(f"📊 Завершено!")
        print(f"   Переведено: {processed:,} записей")
        print(f"   Время: {elapsed}")
        print(f"{'='*60}")


def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Перевод продуктов USDA')
    parser.add_argument('--lang', choices=['ru', 'uz', 'both'], default='both',
                        help='Язык перевода (ru, uz, both)')
    parser.add_argument('--limit', type=int, default=None,
                        help='Максимум записей для перевода')
    parser.add_argument('--status', action='store_true',
                        help='Показать только статус')
    
    args = parser.parse_args()
    
    translator = FoodTranslator()
    translator.connect_db()
    
    if args.status:
        progress = translator.get_progress()
        print(f"\n📊 Статус переводов:")
        print(f"   Всего продуктов: {progress['total']:,}")
        print(f"   Русский: {progress['ru_translated']:,} ({progress['ru_percent']}%)")
        print(f"   Узбекский: {progress['uz_translated']:,} ({progress['uz_percent']}%)")
        return
    
    translator.init_translators()
    
    if args.lang in ('ru', 'both'):
        translator.run('ru', args.limit)
        
    if args.lang in ('uz', 'both'):
        translator.run('uz', args.limit)


if __name__ == '__main__':
    main()
