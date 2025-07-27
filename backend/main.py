from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware  # 🪄 Add this

from app.routers import auth, expenses
from app.database import init_categories
from app.services.category_classifier import classifier

app = FastAPI(title="Finance Tracker API", version="1.0.0")

# 🎩 CORS settings - tweak origins as needed
origins =["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins, 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_event():
    await init_categories()
    await classifier.load_categories()

app.include_router(auth.router)
app.include_router(expenses.router)

@app.get("/")
async def root():
    return {"message": "Finance Tracker API is running!"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
