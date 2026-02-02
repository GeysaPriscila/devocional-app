from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime, timedelta
from passlib.context import CryptContext
from jose import JWTError, jwt
from emergentintegrations.llm.chat import LlmChat, UserMessage
import asyncio

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.getenv('JWT_SECRET', 'your-super-secret-jwt-key')
JWT_ALGORITHM = os.getenv('JWT_ALGORITHM', 'HS256')
JWT_EXPIRATION_HOURS = int(os.getenv('JWT_EXPIRATION_HOURS', 720))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ============ MODELS ============

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: dict

class Prayer(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    content: str
    category: str  # "pendente", "respondida", "continua"
    date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class PrayerCreate(BaseModel):
    title: str
    content: str
    category: str
    date: Optional[datetime] = None

class Gratitude(BaseModel):
    id: Optional[str] = None
    user_id: str
    content: str
    date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GratitudeCreate(BaseModel):
    content: str
    date: Optional[datetime] = None

class Devotional(BaseModel):
    id: Optional[str] = None
    user_id: str
    title: str
    content: str
    verse: str
    verse_reference: str
    music_suggestions: List[dict]
    date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Reflection(BaseModel):
    id: Optional[str] = None
    user_id: str
    user_name: str
    content: str
    type: str  # "devocional", "oracao", "gratidao"
    date: datetime
    is_public: bool
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ReflectionCreate(BaseModel):
    content: str
    type: str
    is_public: bool

# ============ AUTH HELPERS ============

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        token = credentials.credentials
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials"
            )
        user = await db.users.find_one({"email": email})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        return user
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# ============ AI HELPER ============

async def generate_devotional_content(theme: str = None):
    """Generate devotional content with verse and music suggestions"""
    try:
        emergent_key = os.getenv('EMERGENT_LLM_KEY')
        
        chat = LlmChat(
            api_key=emergent_key,
            session_id="devotional_gen",
            system_message="Você é um assistente espiritual que cria devocionais cristãos inspiradores em português."
        ).with_model("openai", "gpt-5.2")
        
        prompt = f"""Crie um devocional cristão completo em português com os seguintes elementos:

1. TÍTULO: Um título inspirador e curto
2. CONTEÚDO: Um texto devocional de 200-300 palavras que seja edificante, reflexivo e prático
3. VERSÍCULO: Um versículo bíblico relevante (inclua referência completa - livro, capítulo e versículo)
4. MÚSICAS: Sugira 3 músicas gospel (2 brasileiras e 1 internacional) relacionadas ao tema

{f'Tema sugerido: {theme}' if theme else 'Escolha um tema espiritual relevante para hoje.'}

Formato da resposta:
TÍTULO: [título aqui]
CONTEÚDO: [conteúdo aqui]
VERSÍCULO: [versículo completo aqui]
REFERÊNCIA: [Livro Capítulo:Versículo]
MÚSICA_1: [Nome - Artista - País]
MÚSICA_2: [Nome - Artista - País]
MÚSICA_3: [Nome - Artista - País]"""

        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        # Parse response
        lines = response.split('\n')
        parsed = {
            'title': '',
            'content': '',
            'verse': '',
            'verse_reference': '',
            'music_suggestions': []
        }
        
        current_section = None
        content_lines = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('TÍTULO:'):
                parsed['title'] = line.replace('TÍTULO:', '').strip()
            elif line.startswith('CONTEÚDO:'):
                current_section = 'content'
                content_text = line.replace('CONTEÚDO:', '').strip()
                if content_text:
                    content_lines.append(content_text)
            elif line.startswith('VERSÍCULO:'):
                current_section = 'verse'
                parsed['verse'] = line.replace('VERSÍCULO:', '').strip()
            elif line.startswith('REFERÊNCIA:'):
                current_section = None
                parsed['verse_reference'] = line.replace('REFERÊNCIA:', '').strip()
            elif line.startswith('MÚSICA_'):
                current_section = None
                music_info = line.split(':', 1)[1].strip()
                parts = [p.strip() for p in music_info.split('-')]
                if len(parts) >= 2:
                    parsed['music_suggestions'].append({
                        'name': parts[0],
                        'artist': parts[1] if len(parts) > 1 else 'Desconhecido',
                        'country': parts[2] if len(parts) > 2 else 'Brasil'
                    })
            elif current_section == 'content' and line and not line.startswith(('VERSÍCULO:', 'REFERÊNCIA:', 'MÚSICA_')):
                content_lines.append(line)
        
        parsed['content'] = ' '.join(content_lines)
        
        return parsed
        
    except Exception as e:
        logger.error(f"Error generating devotional: {str(e)}")
        # Return a fallback devotional
        return {
            'title': 'A Paz de Deus',
            'content': 'A paz que vem de Deus é diferente de qualquer paz que o mundo pode oferecer. É uma paz que permanece mesmo em meio às tempestades da vida. Quando entregamos nossas preocupações a Deus em oração, Ele promete guardar nossos corações e mentes. Hoje, escolha confiar em Deus com cada detalhe da sua vida.',
            'verse': 'E a paz de Deus, que excede todo o entendimento, guardará o coração e a mente de vocês em Cristo Jesus.',
            'verse_reference': 'Filipenses 4:7',
            'music_suggestions': [
                {'name': 'A Paz do Céu', 'artist': 'Anderson Freire', 'country': 'Brasil'},
                {'name': 'Deus Cuida de Mim', 'artist': 'Kleber Lucas', 'country': 'Brasil'},
                {'name': 'Peace', 'artist': 'Hillsong Worship', 'country': 'Internacional'}
            ]
        }

# ============ ROUTES ============

@api_router.post("/auth/register", response_model=Token)
async def register(user_data: UserRegister):
    # Check if user exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Create user
    hashed_password = get_password_hash(user_data.password)
    user_dict = {
        "email": user_data.email,
        "name": user_data.name,
        "password": hashed_password,
        "theme": "light",
        "created_at": datetime.utcnow()
    }
    
    await db.users.insert_one(user_dict)
    
    # Create token
    access_token = create_access_token(data={"sub": user_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user_dict["email"],
            "name": user_dict["name"],
            "theme": user_dict["theme"]
        }
    }

@api_router.post("/auth/login", response_model=Token)
async def login(user_data: UserLogin):
    user = await db.users.find_one({"email": user_data.email})
    if not user or not verify_password(user_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token(data={"sub": user_data.email})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "email": user["email"],
            "name": user["name"],
            "theme": user.get("theme", "light")
        }
    }

@api_router.get("/auth/me")
async def get_me(current_user = Depends(get_current_user)):
    return {
        "email": current_user["email"],
        "name": current_user["name"],
        "theme": current_user.get("theme", "light")
    }

@api_router.put("/auth/theme")
async def update_theme(theme: dict, current_user = Depends(get_current_user)):
    await db.users.update_one(
        {"email": current_user["email"]},
        {"$set": {"theme": theme.get("theme", "light")}}
    )
    return {"success": True}

# ============ DEVOTIONALS ============

@api_router.post("/devotionals/generate")
async def generate_devotional(current_user = Depends(get_current_user)):
    """Generate a new daily devotional"""
    try:
        # Check if user already has a devotional for today
        today = datetime.utcnow().replace(hour=0, minute=0, second=0, microsecond=0)
        existing = await db.devotionals.find_one({
            "user_id": current_user["email"],
            "date": {"$gte": today}
        })
        
        if existing:
            return {
                "id": str(existing["_id"]),
                "title": existing["title"],
                "content": existing["content"],
                "verse": existing["verse"],
                "verse_reference": existing["verse_reference"],
                "music_suggestions": existing["music_suggestions"],
                "date": existing["date"].isoformat()
            }
        
        # Generate new devotional
        devotional_data = await generate_devotional_content()
        
        devotional = {
            "user_id": current_user["email"],
            "title": devotional_data["title"],
            "content": devotional_data["content"],
            "verse": devotional_data["verse"],
            "verse_reference": devotional_data["verse_reference"],
            "music_suggestions": devotional_data["music_suggestions"],
            "date": datetime.utcnow(),
            "created_at": datetime.utcnow()
        }
        
        result = await db.devotionals.insert_one(devotional)
        devotional["id"] = str(result.inserted_id)
        
        return {
            "id": devotional["id"],
            "title": devotional["title"],
            "content": devotional["content"],
            "verse": devotional["verse"],
            "verse_reference": devotional["verse_reference"],
            "music_suggestions": devotional["music_suggestions"],
            "date": devotional["date"].isoformat()
        }
        
    except Exception as e:
        logger.error(f"Error in generate_devotional: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error generating devotional: {str(e)}"
        )

@api_router.get("/devotionals")
async def get_devotionals(current_user = Depends(get_current_user)):
    """Get user's devotionals"""
    devotionals = await db.devotionals.find(
        {"user_id": current_user["email"]}
    ).sort("date", -1).limit(30).to_list(30)
    
    return [
        {
            "id": str(d["_id"]),
            "title": d["title"],
            "content": d["content"],
            "verse": d["verse"],
            "verse_reference": d["verse_reference"],
            "music_suggestions": d["music_suggestions"],
            "date": d["date"].isoformat()
        }
        for d in devotionals
    ]

# ============ PRAYERS ============

@api_router.post("/prayers")
async def create_prayer(prayer_data: PrayerCreate, current_user = Depends(get_current_user)):
    prayer = {
        "user_id": current_user["email"],
        "title": prayer_data.title,
        "content": prayer_data.content,
        "category": prayer_data.category,
        "date": prayer_data.date or datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.prayers.insert_one(prayer)
    prayer["id"] = str(result.inserted_id)
    
    return {
        "id": prayer["id"],
        "title": prayer["title"],
        "content": prayer["content"],
        "category": prayer["category"],
        "date": prayer["date"].isoformat()
    }

@api_router.get("/prayers")
async def get_prayers(category: Optional[str] = None, current_user = Depends(get_current_user)):
    query = {"user_id": current_user["email"]}
    if category:
        query["category"] = category
    
    prayers = await db.prayers.find(query).sort("date", -1).to_list(100)
    
    return [
        {
            "id": str(p["_id"]),
            "title": p["title"],
            "content": p["content"],
            "category": p["category"],
            "date": p["date"].isoformat()
        }
        for p in prayers
    ]

@api_router.put("/prayers/{prayer_id}")
async def update_prayer(prayer_id: str, prayer_data: PrayerCreate, current_user = Depends(get_current_user)):
    from bson import ObjectId
    
    result = await db.prayers.update_one(
        {"_id": ObjectId(prayer_id), "user_id": current_user["email"]},
        {"$set": {
            "title": prayer_data.title,
            "content": prayer_data.content,
            "category": prayer_data.category,
            "date": prayer_data.date or datetime.utcnow()
        }}
    )
    
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Prayer not found")
    
    return {"success": True}

@api_router.delete("/prayers/{prayer_id}")
async def delete_prayer(prayer_id: str, current_user = Depends(get_current_user)):
    from bson import ObjectId
    
    result = await db.prayers.delete_one(
        {"_id": ObjectId(prayer_id), "user_id": current_user["email"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Prayer not found")
    
    return {"success": True}

# ============ GRATITUDES ============

@api_router.post("/gratitudes")
async def create_gratitude(gratitude_data: GratitudeCreate, current_user = Depends(get_current_user)):
    gratitude = {
        "user_id": current_user["email"],
        "content": gratitude_data.content,
        "date": gratitude_data.date or datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.gratitudes.insert_one(gratitude)
    gratitude["id"] = str(result.inserted_id)
    
    return {
        "id": gratitude["id"],
        "content": gratitude["content"],
        "date": gratitude["date"].isoformat()
    }

@api_router.get("/gratitudes")
async def get_gratitudes(current_user = Depends(get_current_user)):
    gratitudes = await db.gratitudes.find(
        {"user_id": current_user["email"]}
    ).sort("date", -1).to_list(100)
    
    return [
        {
            "id": str(g["_id"]),
            "content": g["content"],
            "date": g["date"].isoformat()
        }
        for g in gratitudes
    ]

@api_router.delete("/gratitudes/{gratitude_id}")
async def delete_gratitude(gratitude_id: str, current_user = Depends(get_current_user)):
    from bson import ObjectId
    
    result = await db.gratitudes.delete_one(
        {"_id": ObjectId(gratitude_id), "user_id": current_user["email"]}
    )
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Gratitude not found")
    
    return {"success": True}

# ============ REFLECTIONS (Community) ============

@api_router.post("/reflections")
async def create_reflection(reflection_data: ReflectionCreate, current_user = Depends(get_current_user)):
    reflection = {
        "user_id": current_user["email"],
        "user_name": current_user["name"],
        "content": reflection_data.content,
        "type": reflection_data.type,
        "is_public": reflection_data.is_public,
        "date": datetime.utcnow(),
        "created_at": datetime.utcnow()
    }
    
    result = await db.reflections.insert_one(reflection)
    reflection["id"] = str(result.inserted_id)
    
    return {
        "id": reflection["id"],
        "user_name": reflection["user_name"],
        "content": reflection["content"],
        "type": reflection["type"],
        "date": reflection["date"].isoformat()
    }

@api_router.get("/reflections/public")
async def get_public_reflections(current_user = Depends(get_current_user)):
    reflections = await db.reflections.find(
        {"is_public": True}
    ).sort("date", -1).limit(50).to_list(50)
    
    return [
        {
            "id": str(r["_id"]),
            "user_name": r["user_name"],
            "content": r["content"],
            "type": r["type"],
            "date": r["date"].isoformat()
        }
        for r in reflections
    ]

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
