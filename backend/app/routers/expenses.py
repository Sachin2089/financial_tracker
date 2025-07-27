from fastapi import APIRouter, Depends, HTTPException, Query
from typing import List, Optional
from datetime import datetime, date
import pytz
from app.models.expense import ExpenseCreate, ExpenseResponse, ExpenseFilter
from app.routers.auth import get_current_active_user
from app.services.category_classifier import classifier
from app.database import expenses_collection
from bson import ObjectId


router = APIRouter(prefix="/expenses", tags=["expenses"])

# Define IST timezone
IST = pytz.timezone('Asia/Kolkata')


@router.post("/", response_model=ExpenseResponse)
async def create_expense(
    expense: ExpenseCreate,
    current_user = Depends(get_current_active_user)
):
    if not classifier.categories_cache:
        await classifier.load_categories()
    
    amount = classifier.extract_amount(expense.prompt)
    category = classifier.classify_category(expense.prompt)
    description = classifier.extract_description(expense.prompt, amount, category)
    
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Could not extract valid amount from prompt")
    
    expense_doc = {
        "user_id": str(current_user["_id"]),
        "amount": amount,
        "category": category,
        "description": description,
        "original_prompt": expense.prompt,
        "created_at": datetime.now(IST)
    }
    
    result = await expenses_collection.insert_one(expense_doc)
    expense_doc["id"] = str(result.inserted_id)
    
    return ExpenseResponse(**expense_doc)


@router.get("/", response_model=List[ExpenseResponse])
async def get_expenses(
    current_user = Depends(get_current_active_user),
    category: Optional[str] = Query(None),
    month: Optional[int] = Query(None, ge=1, le=12),
    year: Optional[int] = Query(None),
    start_date: Optional[date] = Query(None),
    end_date: Optional[date] = Query(None),
    limit: int = Query(50, le=100)
):
    query = {"user_id": str(current_user["_id"])}
    
    # Category filter
    if category:
        query["category"] = category
    
    # Monthly filter
    if month and year:
        # Create start and end dates for the specific month in IST
        start_of_month = IST.localize(datetime(year, month, 1))
        if month == 12:
            end_of_month = IST.localize(datetime(year + 1, 1, 1))
        else:
            end_of_month = IST.localize(datetime(year, month + 1, 1))
        
        query["created_at"] = {
            "$gte": start_of_month,
            "$lt": end_of_month
        }
    # Date range filter (if monthly filter not used)
    elif start_date or end_date:
        date_filter = {}
        if start_date:
            date_filter["$gte"] = IST.localize(datetime.combine(start_date, datetime.min.time()))
        if end_date:
            date_filter["$lt"] = IST.localize(datetime.combine(end_date, datetime.max.time()))
        query["created_at"] = date_filter
    
    expenses = await expenses_collection.find(query).limit(limit).sort("created_at", -1).to_list(None)
    
    for expense in expenses:
        expense["id"] = str(expense["_id"])
        del expense["_id"]
    
    return expenses


@router.get("/categories")
async def get_user_categories(current_user = Depends(get_current_active_user)):
    pipeline = [
        {"$match": {"user_id": str(current_user["_id"])}},
        {"$group": {"_id": "$category", "total": {"$sum": "$amount"}, "count": {"$sum": 1}}},
        {"$sort": {"total": -1}}
    ]
    
    categories = await expenses_collection.aggregate(pipeline).to_list(None)
    return [{"category": cat["_id"], "total": cat["total"], "count": cat["count"]} for cat in categories]


@router.delete("/{expense_id}")
async def delete_expense(
    expense_id: str,
    current_user = Depends(get_current_active_user)
):
    result = await expenses_collection.delete_one({
        "_id": ObjectId(expense_id),
        "user_id": str(current_user["_id"])
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    return {"message": "Expense deleted successfully"}


@router.get("/monthly-summary")
async def get_monthly_summary(
    current_user = Depends(get_current_active_user),
    year: Optional[int] = Query(None)
):
    # If no year specified, use current year in IST
    if not year:
        year = datetime.now(IST).year
    
    pipeline = [
        {
            "$match": {
                "user_id": str(current_user["_id"]),
                "created_at": {
                    "$gte": IST.localize(datetime(year, 1, 1)),
                    "$lt": IST.localize(datetime(year + 1, 1, 1))
                }
            }
        },
        {
            "$group": {
                "_id": {
                    "month": {"$month": "$created_at"},
                    "year": {"$year": "$created_at"}
                },
                "total_amount": {"$sum": "$amount"},
                "expense_count": {"$sum": 1},
                "categories": {"$addToSet": "$category"}
            }
        },
        {
            "$sort": {"_id.month": 1}
        }
    ]
    
    monthly_data = await expenses_collection.aggregate(pipeline).to_list(None)
    
    # Format the response
    result = []
    for item in monthly_data:
        result.append({
            "month": item["_id"]["month"],
            "year": item["_id"]["year"],
            "total_amount": item["total_amount"],
            "expense_count": item["expense_count"],
            "unique_categories": len(item["categories"])
        })
    
    return result
