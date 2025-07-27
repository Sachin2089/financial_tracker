from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
import pytz

# Define IST timezone
IST = pytz.timezone('Asia/Kolkata')

def get_ist_now():
    return datetime.now(IST)

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class User(BaseModel):
    id: Optional[str] =  None
    username: str
    email: EmailStr
    created_at: datetime = Field(default_factory=get_ist_now)
    updated_at: Optional[datetime] = None
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    token_type: str