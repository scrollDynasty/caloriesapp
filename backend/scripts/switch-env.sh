set -e

ENV_TYPE="${1:-dev}"

if [ "$ENV_TYPE" != "dev" ] && [ "$ENV_TYPE" != "prod" ]; then
    echo "❌ Ошибка: Неверное окружение. Используйте 'dev' или 'prod'"
    echo "Использование: $0 [dev|prod]"
    exit 1
fi

cd "$(dirname "$0")/.."

ENV_FILE=".env"
ENV_REAL=".env.$ENV_TYPE"
ENV_SAMPLE="env.$ENV_TYPE.sample"

if [ -f "$ENV_REAL" ]; then
    SOURCE_FILE="$ENV_REAL"
    echo "📋 Using real environment file: $ENV_REAL"
elif [ -f "$ENV_SAMPLE" ]; then
    SOURCE_FILE="$ENV_SAMPLE"
    echo "📋 Using sample file: $ENV_SAMPLE"
    echo "⚠️  Note: Consider creating $ENV_REAL with your actual values"
else
    echo "❌ Error: Neither $ENV_REAL nor $ENV_SAMPLE found!"
    exit 1
fi

echo "📝 Switching to $ENV_TYPE environment..."
cp "$SOURCE_FILE" "$ENV_FILE"

echo "✅ Switched to $ENV_TYPE environment"
echo "⚠️  Please update .env with your actual values if needed!"

