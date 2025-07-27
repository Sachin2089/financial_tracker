from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from datetime import datetime, timedelta
import pytz
from app.models.user import UserCreate, UserLogin, Token, User
from app.services.auth_service import (
    get_password_hash, authenticate_user, create_access_token,
    ACCESS_TOKEN_EXPIRE_MINUTES, get_current_user
)
from app.database import users_collection


router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Define IST timezone
IST = pytz.timezone('Asia/Kolkata')


@router.post("/signup", response_model=dict)
async def signup(user: UserCreate):
    existing_user = await users_collection.find_one({"username": user.username})
    if existing_user:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    existing_email = await users_collection.find_one({"email": user.email})
    if existing_email:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Create new user
    hashed_password = get_password_hash(user.password)
    user_doc = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password,
        "created_at": datetime.now(IST),
        "is_active": True
    }
    
    result = await users_collection.insert_one(user_doc)
    return {"message": "User created successfully", "user_id": str(result.inserted_id)}


@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    authenticated_user = await authenticate_user(user.username, user.password)
    if not authenticated_user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password"
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": authenticated_user["username"]}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


async def get_current_active_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    user = await get_current_user(credentials.credentials)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid authentication credentials")
    return user
