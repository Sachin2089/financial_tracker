import re
from typing import Dict, List
from app.database import categories_collection

class CategoryClassifier:
    def __init__(self):
        self.categories_cache = {}
    
    async def load_categories(self):
        """Load categories and keywords from database"""
        categories = await categories_collection.find().to_list(None)
        self.categories_cache = {
            cat["name"]: cat["keywords"] for cat in categories
        }
    
    def extract_amount(self, text: str) -> float:
        """Extract amount from text like '200 rupees' or '₹500'"""
        # Pattern to match numbers followed by currency indicators
        patterns = [
            r'(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹)',
            r'₹\s*(\d+(?:\.\d+)?)',
            r'(\d+(?:\.\d+)?)\s*(?:dollars?|\$)',
            r'\$\s*(\d+(?:\.\d+)?)'
        ]
        
        for pattern in patterns:
            match = re.search(pattern, text.lower())
            if match:
                return float(match.group(1))
        
        # Fallback: extract any number
        numbers = re.findall(r'\d+(?:\.\d+)?', text)
        return float(numbers[0]) if numbers else 0.0
    
    def classify_category(self, text: str) -> str:
        """Classify expense category based on text"""
        text_lower = text.lower()
        
        # Score each category based on keyword matches
        category_scores = {}
        
        for category, keywords in self.categories_cache.items():
            score = 0
            for keyword in keywords:
                if keyword.lower() in text_lower:
                    score += 1
            category_scores[category] = score
        
        if category_scores and max(category_scores.values()) > 0:
            return max(category_scores, key=category_scores.get)
        
        return "miscellaneous"
    
    def extract_description(self, text: str, amount: float, category: str) -> str:
        """Generate a clean description from the prompt"""
        # Remove amount and currency from text
        clean_text = re.sub(r'(\d+(?:\.\d+)?)\s*(?:rupees?|rs\.?|₹|\$|dollars?)', '', text, flags=re.IGNORECASE)
        clean_text = re.sub(r'[₹$]', '', clean_text)
        clean_text = clean_text.strip()
        
    
        if len(clean_text) < 3:
            return f"{category.replace('_', ' ').title()} expense"
        
        return clean_text.capitalize()


classifier = CategoryClassifier()
