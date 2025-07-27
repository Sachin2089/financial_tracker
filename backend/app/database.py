from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = os.getenv("DATABASE_NAME")

client = AsyncIOMotorClient(MONGODB_URL)
database = client[DATABASE_NAME]


users_collection = database.users
expenses_collection = database.expenses
categories_collection = database.categories

async def init_categories():
    """Initialize default categories if not exists"""
    default_categories = [
        {"name": "food", "keywords": ["lunch", "dinner", "breakfast", "restaurant", "cafe", "food", "meal"]},
        {"name": "travel", "keywords": ["uber", "taxi", "bus", "train", "flight", "petrol", "fuel", "travel"]},
        {"name": "fun", "keywords": ["movie", "game", "entertainment", "party", "fun", "leisure"]},
        {"name": "room_expense", "keywords": ["rent", "electricity", "water", "gas", "maintenance", "utility"]},
        {"name": "groceries", "keywords": ["grocery", "supermarket", "vegetables", "fruits", "shopping"]},
        {"name": "gym", "keywords": ["protein", "gym"]}
    ]
    
    for category in default_categories:
        await categories_collection.update_one(
            {"name": category["name"]},
            {"$set": category},
            upsert=True
        )
