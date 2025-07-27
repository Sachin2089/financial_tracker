from datetime import datetime, timedelta
import pytz
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext
from app.database import users_collection
from app.models.user import User
import os


SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))

# Define IST timezone
IST = pytz.timezone('Asia/Kolkata')
UTC = pytz.timezone('UTC')

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password):
    return pwd_context.hash(password)


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    # Get current time in IST
    now_ist = datetime.now(IST)
    
    if expires_delta:
        expire = now_ist + expires_delta
    else:
        expire = now_ist + timedelta(minutes=15)
    
    # Convert to UTC timestamp for JWT (standard practice)
    expire_utc = expire.astimezone(UTC).replace(tzinfo=None)
    to_encode.update({"exp": expire_utc})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def authenticate_user(username: str, password: str):
    user = await users_collection.find_one({"username": username})
    if not user:
        return False
    if not verify_password(password, user["hashed_password"]):
        return False
    return user


async def get_current_user(token: str):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    
    user = await users_collection.find_one({"username": username})
    return user
