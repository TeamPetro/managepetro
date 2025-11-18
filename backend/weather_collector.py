import requests
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from models.data_models import WeatherData
from models.database_models import WeatherData as WeatherRecord
from config import config
import os


async def fetch_weather() -> WeatherData:
    """Fetch weather data using standardized model.

    Runs the blocking requests.get call in a thread so the async event loop
    is not blocked.
    """
    url = f"https://api.weatherapi.com/v1/current.json?key={config.WEATHER_API_KEY}&q={config.WEATHER_CITY}"

    def _sync_get():
        r = requests.get(url, timeout=30)
        r.raise_for_status()
        return r.json()

    try:
        data = await asyncio.to_thread(_sync_get)
        return WeatherData.from_api_response(data)
    except requests.exceptions.RequestException as e:
        raise Exception(f"Weather API request failed: {str(e)}")
    except ValueError as e:
        raise Exception(f"Weather API response parsing failed: {str(e)}")


async def save_to_db(weather: WeatherData, session: AsyncSession):
    """Save weather data to database using SQLAlchemy 2.0"""
    try:
        db_data = weather.to_db_dict()
        weather_record = WeatherRecord(
            city=db_data["city"],
            temperature=db_data["temperature"],
            condition=db_data["condition"],
            wind=db_data["wind"],
            humidity=db_data["humidity"],
            collected_at=db_data["collected_at"],
        )

        session.add(weather_record)
        await session.commit()
        print(f"Weather data saved: {weather.to_dict()}")

    except Exception as e:
        print(f"Failed to save weather data: {e}")
        await session.rollback()
        raise


def create_async_db_session():
    """Create async session factory for weather collector.

    Returns an async_sessionmaker bound to an async engine. This function is
    synchronous (it does not perform IO).
    """

    database_url = os.getenv("DATABASE_URL")

    if not database_url:
        raise ValueError(
            "DATABASE_URL environment variable is required. "
            "Set it to your PostgreSQL connection string."
        )

    # Convert Render's postgres:// to postgresql+asyncpg://
    if database_url.startswith("postgres://"):
        database_url = database_url.replace("postgres://", "postgresql+asyncpg://", 1)

    engine = create_async_engine(
        database_url,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,
    )

    async_session = async_sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    return async_session


async def main():
    """Main weather collection loop using async SQLAlchemy"""
    async_session = create_async_db_session()

    while True:
        try:
            async with async_session() as session:
                weather = await fetch_weather()
                await save_to_db(weather, session)
                print("Weather data inserted:", weather.to_dict())

            await asyncio.sleep(3600)  # Wait 1 hour

        except Exception as e:
            print(f"Weather collection error: {e}")
            await asyncio.sleep(300)  # Wait 5 minutes on error


if __name__ == "__main__":
    asyncio.run(main())
