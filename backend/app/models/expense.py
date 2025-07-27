from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
import pytz

# Define IST timezone
IST = pytz.timezone('Asia/Kolkata')

def get_ist_now():
    return datetime.now(IST)

class ExpenseCreate(BaseModel):
    prompt: str  

class ExpenseResponse(BaseModel):
    id: Optional[str] = None
    user_id: str
    amount: float
    category: str
    description: str
    original_prompt: str
    created_at: datetime = Field(default_factory=get_ist_now)

class ExpenseFilter(BaseModel):
    category: Optional[str] = None
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
