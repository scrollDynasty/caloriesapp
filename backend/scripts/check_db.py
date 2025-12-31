import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from app.core.config import settings
    from app.core.database import engine

    print("Checking database connection...")
    print(f"Host: {settings.db_host}")
    print(f"Port: {settings.db_port}")
    print(f"Database: {settings.db_name}")
    print(f"User: {settings.db_user}")

    from sqlalchemy import text
    with engine.connect() as conn:
        result = conn.execute(text("SELECT 1"))
        print("Database connection successful!")

        result = conn.execute(text("SELECT DATABASE()"))
        db_name = result.scalar()
        if db_name:
            print(f"Using database: {db_name}")
        else:
            print("No database selected")

        result = conn.execute(text("SHOW TABLES"))
        tables = [row[0] for row in result]
        if tables:
            print(f"Found tables: {len(tables)}")
            for table in tables:
                print(f"  - {table}")
        else:
            print("No tables found. Run the application to create them.")

except Exception as e:
    print(f"Connection error: {e}")
    print("\nMake sure:")
    print("1. MariaDB/MySQL is running")
    print("2. Database is created")
    print("3. .env file parameters are correct")
    sys.exit(1)
