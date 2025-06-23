from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT settings
JWT_SECRET = "university_management_secret_key_2025"
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="University Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Enums
class UserRole(str, Enum):
    STUDENT = "student"
    TEACHER = "teacher"
    ADMIN = "admin"

class ExamType(str, Enum):
    CONTINUOUS = "continuous"
    FINAL = "final"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: str
    password: str
    first_name: str
    last_name: str
    role: UserRole
    student_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    email: str
    password: str
    first_name: str
    last_name: str
    role: UserRole
    student_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    first_name: str
    last_name: str
    role: UserRole
    student_id: Optional[str] = None
    department: Optional[str] = None
    year: Optional[int] = None

class Course(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    code: str
    description: str
    teacher_id: str
    department: str
    credits: int
    semester: str
    year: int
    created_at: datetime = Field(default_factory=datetime.utcnow)

class CourseCreate(BaseModel):
    name: str
    code: str
    description: str
    teacher_id: str
    department: str
    credits: int
    semester: str
    year: int

class Schedule(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    course_id: str
    day_of_week: str
    start_time: str
    end_time: str
    classroom: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ScheduleCreate(BaseModel):
    course_id: str
    day_of_week: str
    start_time: str
    end_time: str
    classroom: str

class Grade(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    course_id: str
    exam_type: ExamType
    score: float
    max_score: float
    exam_date: datetime
    created_at: datetime = Field(default_factory=datetime.utcnow)

class GradeCreate(BaseModel):
    student_id: str
    course_id: str
    exam_type: ExamType
    score: float
    max_score: float
    exam_date: datetime

class ExamProposal(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    course_id: str
    exam_type: ExamType
    title: str
    description: str
    proposed_date: datetime
    duration_minutes: int
    status: str = "pending"  # pending, approved, rejected
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ExamProposalCreate(BaseModel):
    course_id: str
    exam_type: ExamType
    title: str
    description: str
    proposed_date: datetime
    duration_minutes: int

class Attendance(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    teacher_id: str
    course_id: str
    date: datetime
    status: str = "present"  # present, absent
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class AttendanceCreate(BaseModel):
    course_id: str
    date: datetime
    status: str = "present"
    notes: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
            )
        user = await db.users.find_one({"id": user_id})
        if user is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
            )
        return user
    except jwt.PyJWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
        )

def require_role(allowed_roles: List[UserRole]):
    def role_checker(current_user: Dict[str, Any] = Depends(get_current_user)):
        if current_user["role"] not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return role_checker

# Authentication Routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    
    # Hash password and create user
    hashed_password = hash_password(user_data.password)
    user_dict = user_data.dict()
    user_dict["password"] = hashed_password
    user_obj = User(**user_dict)
    
    await db.users.insert_one(user_obj.dict())
    
    # Create access token
    access_token = create_access_token({"user_id": user_obj.id, "role": user_obj.role})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user_obj.dict())
    }

@api_router.post("/auth/login")
async def login(login_data: UserLogin):
    user = await db.users.find_one({"email": login_data.email})
    if not user or not verify_password(login_data.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    access_token = create_access_token({"user_id": user["id"], "role": user["role"]})
    
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": UserResponse(**user)
    }

@api_router.get("/auth/me")
async def get_me(current_user: Dict[str, Any] = Depends(get_current_user)):
    return UserResponse(**current_user)

# Course Routes
@api_router.post("/courses")
async def create_course(course_data: CourseCreate, current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER]))):
    course_obj = Course(**course_data.dict())
    await db.courses.insert_one(course_obj.dict())
    return course_obj

@api_router.get("/courses")
async def get_courses(current_user: Dict[str, Any] = Depends(get_current_user)):
    courses = await db.courses.find().to_list(1000)
    return courses

@api_router.get("/courses/my")
async def get_my_courses(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] == UserRole.TEACHER:
        courses = await db.courses.find({"teacher_id": current_user["id"]}).to_list(1000)
    elif current_user["role"] == UserRole.STUDENT:
        # For students, we'll return all courses for now
        courses = await db.courses.find().to_list(1000)
    else:
        courses = await db.courses.find().to_list(1000)
    return courses

# Schedule Routes
@api_router.post("/schedules")
async def create_schedule(schedule_data: ScheduleCreate, current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN]))):
    schedule_obj = Schedule(**schedule_data.dict())
    await db.schedules.insert_one(schedule_obj.dict())
    return schedule_obj

@api_router.get("/schedules")
async def get_schedules(current_user: Dict[str, Any] = Depends(get_current_user)):
    schedules = await db.schedules.find().to_list(1000)
    # Enrich with course information
    for schedule in schedules:
        course = await db.courses.find_one({"id": schedule["course_id"]})
        schedule["course"] = course
    return schedules

# Grade Routes
@api_router.post("/grades")
async def create_grade(grade_data: GradeCreate, current_user: Dict[str, Any] = Depends(require_role([UserRole.TEACHER, UserRole.ADMIN]))):
    grade_obj = Grade(**grade_data.dict())
    await db.grades.insert_one(grade_obj.dict())
    return grade_obj

@api_router.get("/grades/my")
async def get_my_grades(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] == UserRole.STUDENT:
        grades = await db.grades.find({"student_id": current_user["id"]}).to_list(1000)
    else:
        grades = await db.grades.find().to_list(1000)
    
    # Enrich with course information
    for grade in grades:
        course = await db.courses.find_one({"id": grade["course_id"]})
        grade["course"] = course
    return grades

# Exam Proposal Routes
@api_router.post("/exam-proposals")
async def create_exam_proposal(proposal_data: ExamProposalCreate, current_user: Dict[str, Any] = Depends(require_role([UserRole.TEACHER]))):
    proposal_dict = proposal_data.dict()
    proposal_dict["teacher_id"] = current_user["id"]
    proposal_obj = ExamProposal(**proposal_dict)
    await db.exam_proposals.insert_one(proposal_obj.dict())
    return proposal_obj

@api_router.get("/exam-proposals")
async def get_exam_proposals(current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER]))):
    if current_user["role"] == UserRole.TEACHER:
        proposals = await db.exam_proposals.find({"teacher_id": current_user["id"]}).to_list(1000)
    else:
        proposals = await db.exam_proposals.find().to_list(1000)
    
    # Enrich with course and teacher information
    for proposal in proposals:
        course = await db.courses.find_one({"id": proposal["course_id"]})
        teacher = await db.users.find_one({"id": proposal["teacher_id"]})
        proposal["course"] = course
        proposal["teacher"] = teacher
    return proposals

@api_router.put("/exam-proposals/{proposal_id}/status")
async def update_exam_proposal_status(proposal_id: str, status: str, current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN]))):
    await db.exam_proposals.update_one(
        {"id": proposal_id},
        {"$set": {"status": status}}
    )
    return {"message": "Status updated successfully"}

# Attendance Routes
@api_router.post("/attendance")
async def mark_attendance(attendance_data: AttendanceCreate, current_user: Dict[str, Any] = Depends(require_role([UserRole.TEACHER]))):
    attendance_dict = attendance_data.dict()
    attendance_dict["teacher_id"] = current_user["id"]
    attendance_obj = Attendance(**attendance_dict)
    await db.attendance.insert_one(attendance_obj.dict())
    return attendance_obj

@api_router.get("/attendance")
async def get_attendance(current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN, UserRole.TEACHER]))):
    if current_user["role"] == UserRole.TEACHER:
        attendance = await db.attendance.find({"teacher_id": current_user["id"]}).to_list(1000)
    else:
        attendance = await db.attendance.find().to_list(1000)
    
    # Enrich with course and teacher information
    for record in attendance:
        course = await db.courses.find_one({"id": record["course_id"]})
        teacher = await db.users.find_one({"id": record["teacher_id"]})
        record["course"] = course
        record["teacher"] = teacher
    return attendance

# Admin Routes
@api_router.get("/admin/users")
async def get_all_users(current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN]))):
    users = await db.users.find().to_list(1000)
    return [UserResponse(**user) for user in users]

@api_router.delete("/admin/users/{user_id}")
async def delete_user(user_id: str, current_user: Dict[str, Any] = Depends(require_role([UserRole.ADMIN]))):
    await db.users.delete_one({"id": user_id})
    return {"message": "User deleted successfully"}

# Dashboard stats
@api_router.get("/stats")
async def get_stats(current_user: Dict[str, Any] = Depends(get_current_user)):
    if current_user["role"] == UserRole.ADMIN:
        total_students = await db.users.count_documents({"role": "student"})
        total_teachers = await db.users.count_documents({"role": "teacher"})
        total_courses = await db.courses.count_documents({})
        pending_proposals = await db.exam_proposals.count_documents({"status": "pending"})
        
        return {
            "total_students": total_students,
            "total_teachers": total_teachers,
            "total_courses": total_courses,
            "pending_proposals": pending_proposals
        }
    elif current_user["role"] == UserRole.TEACHER:
        my_courses = await db.courses.count_documents({"teacher_id": current_user["id"]})
        my_proposals = await db.exam_proposals.count_documents({"teacher_id": current_user["id"]})
        
        return {
            "my_courses": my_courses,
            "my_proposals": my_proposals
        }
    else:  # Student
        my_grades = await db.grades.count_documents({"student_id": current_user["id"]})
        total_courses = await db.courses.count_documents({})
        
        return {
            "my_grades": my_grades,
            "available_courses": total_courses
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()