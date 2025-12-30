from datetime import datetime, timedelta, timezone as dt_timezone
from typing import Tuple


def get_day_range_utc(
    date_str: str, 
    tz_offset_minutes: int
) -> Tuple[datetime, datetime, dt_timezone]:
    target_date = datetime.strptime(date_str, "%Y-%m-%d").date()
    
    offset = timedelta(minutes=tz_offset_minutes)
    tz = dt_timezone(offset)
    
    start_local = datetime.combine(target_date, datetime.min.time())
    end_local = start_local + timedelta(days=1)
    
    start_utc = (start_local - offset).replace(tzinfo=dt_timezone.utc)
    end_utc = (end_local - offset).replace(tzinfo=dt_timezone.utc)
    
    return start_utc, end_utc, tz

