import requests
import unittest
import json
from datetime import datetime, timedelta

class UniversityAPITester(unittest.TestCase):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.base_url = "https://03ba142c-35be-4b8d-9e20-38397736e6b6.preview.emergentagent.com/api"
        self.admin_token = None
        self.teacher_token = None
        self.student_token = None
        self.admin_user = None
        self.teacher_user = None
        self.student_user = None

    def setUp(self):
        # Test the API root endpoint
        response = requests.get(f"{self.base_url}/")
        self.assertEqual(response.status_code, 200)
        self.assertIn("University Management System API", response.json()["message"])
        
        # Login with test users
        self.login_users()

    def login_users(self):
        # Admin login
        admin_login = {"email": "admin@university.com", "password": "admin123"}
        response = requests.post(f"{self.base_url}/auth/login", json=admin_login)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.admin_token = data["access_token"]
        self.admin_user = data["user"]
        
        # Teacher login
        teacher_login = {"email": "prof@university.com", "password": "prof123"}
        response = requests.post(f"{self.base_url}/auth/login", json=teacher_login)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.teacher_token = data["access_token"]
        self.teacher_user = data["user"]
        
        # Student login
        student_login = {"email": "student@university.com", "password": "student123"}
        response = requests.post(f"{self.base_url}/auth/login", json=student_login)
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.student_token = data["access_token"]
        self.student_user = data["user"]

    def test_01_authentication(self):
        """Test authentication endpoints"""
        print("\n--- Testing Authentication ---")
        
        # Test /auth/me endpoint with admin token
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.admin_user["id"])
        self.assertEqual(response.json()["role"], "admin")
        print("✅ Admin authentication successful")
        
        # Test /auth/me endpoint with teacher token
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.teacher_user["id"])
        self.assertEqual(response.json()["role"], "teacher")
        print("✅ Teacher authentication successful")
        
        # Test /auth/me endpoint with student token
        headers = {"Authorization": f"Bearer {self.student_token}"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["id"], self.student_user["id"])
        self.assertEqual(response.json()["role"], "student")
        print("✅ Student authentication successful")
        
        # Test invalid token
        headers = {"Authorization": "Bearer invalid_token"}
        response = requests.get(f"{self.base_url}/auth/me", headers=headers)
        self.assertEqual(response.status_code, 401)
        print("✅ Invalid token rejected")

    def test_02_stats_endpoint(self):
        """Test stats endpoint for different roles"""
        print("\n--- Testing Stats Endpoint ---")
        
        # Admin stats
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.base_url}/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        admin_stats = response.json()
        self.assertIn("total_students", admin_stats)
        self.assertIn("total_teachers", admin_stats)
        self.assertIn("total_courses", admin_stats)
        self.assertIn("pending_proposals", admin_stats)
        print("✅ Admin stats retrieved successfully")
        
        # Teacher stats
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        teacher_stats = response.json()
        self.assertIn("my_courses", teacher_stats)
        self.assertIn("my_proposals", teacher_stats)
        print("✅ Teacher stats retrieved successfully")
        
        # Student stats
        headers = {"Authorization": f"Bearer {self.student_token}"}
        response = requests.get(f"{self.base_url}/stats", headers=headers)
        self.assertEqual(response.status_code, 200)
        student_stats = response.json()
        self.assertIn("my_grades", student_stats)
        self.assertIn("available_courses", student_stats)
        print("✅ Student stats retrieved successfully")

    def test_03_courses_endpoint(self):
        """Test courses endpoints"""
        print("\n--- Testing Courses Endpoints ---")
        
        # Get all courses as admin
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.base_url}/courses", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Admin can retrieve all courses")
        
        # Get my courses as teacher
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/courses/my", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Teacher can retrieve their courses")
        
        # Get my courses as student
        headers = {"Authorization": f"Bearer {self.student_token}"}
        response = requests.get(f"{self.base_url}/courses/my", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Student can retrieve available courses")
        
        # Create a course as admin
        course_data = {
            "name": "Test Course",
            "code": "TEST101",
            "description": "A test course",
            "teacher_id": self.teacher_user["id"],
            "department": "Computer Science",
            "credits": 3,
            "semester": "Spring",
            "year": 2025
        }
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.post(f"{self.base_url}/courses", json=course_data, headers=headers)
        self.assertEqual(response.status_code, 200)
        self.created_course_id = response.json()["id"]
        print("✅ Admin can create a course")

    def test_04_schedules_endpoint(self):
        """Test schedules endpoints"""
        print("\n--- Testing Schedules Endpoints ---")
        
        # Get all schedules
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.base_url}/schedules", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Can retrieve schedules")
        
        # Get courses to find a valid course_id
        response = requests.get(f"{self.base_url}/courses", headers=headers)
        courses = response.json()
        
        if courses:
            # Create a schedule as admin
            schedule_data = {
                "course_id": courses[0]["id"],
                "day_of_week": "Monday",
                "start_time": "09:00",
                "end_time": "11:00",
                "classroom": "Room 101"
            }
            response = requests.post(f"{self.base_url}/schedules", json=schedule_data, headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Admin can create a schedule")
        else:
            print("⚠️ No courses available to create a schedule")

    def test_05_exam_proposals(self):
        """Test exam proposal endpoints"""
        print("\n--- Testing Exam Proposal Endpoints ---")
        
        # Get courses for teacher
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/courses/my", headers=headers)
        teacher_courses = response.json()
        
        if teacher_courses:
            # Create an exam proposal as teacher
            proposal_data = {
                "course_id": teacher_courses[0]["id"],
                "exam_type": "final",
                "title": "Final Exam",
                "description": "Comprehensive final exam",
                "proposed_date": (datetime.now() + timedelta(days=30)).isoformat(),
                "duration_minutes": 120
            }
            response = requests.post(f"{self.base_url}/exam-proposals", json=proposal_data, headers=headers)
            self.assertEqual(response.status_code, 200)
            proposal_id = response.json()["id"]
            print("✅ Teacher can create an exam proposal")
            
            # Get exam proposals as teacher
            response = requests.get(f"{self.base_url}/exam-proposals", headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Teacher can retrieve their exam proposals")
            
            # Update proposal status as admin
            headers = {"Authorization": f"Bearer {self.admin_token}"}
            response = requests.put(f"{self.base_url}/exam-proposals/{proposal_id}/status?status=approved", headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Admin can approve an exam proposal")
        else:
            print("⚠️ No courses available for teacher to create an exam proposal")

    def test_06_grades(self):
        """Test grades endpoints"""
        print("\n--- Testing Grades Endpoints ---")
        
        # Get courses
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/courses/my", headers=headers)
        courses = response.json()
        
        if courses and self.student_user:
            # Create a grade as teacher
            grade_data = {
                "student_id": self.student_user["id"],
                "course_id": courses[0]["id"],
                "exam_type": "continuous",
                "score": 85,
                "max_score": 100,
                "exam_date": datetime.now().isoformat()
            }
            response = requests.post(f"{self.base_url}/grades", json=grade_data, headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Teacher can create a grade")
            
            # Get grades as student
            headers = {"Authorization": f"Bearer {self.student_token}"}
            response = requests.get(f"{self.base_url}/grades/my", headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Student can retrieve their grades")
        else:
            print("⚠️ No courses or student available to test grades")

    def test_07_attendance(self):
        """Test attendance endpoints"""
        print("\n--- Testing Attendance Endpoints ---")
        
        # Get courses for teacher
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/courses/my", headers=headers)
        teacher_courses = response.json()
        
        if teacher_courses:
            # Mark attendance as teacher
            attendance_data = {
                "course_id": teacher_courses[0]["id"],
                "date": datetime.now().isoformat(),
                "status": "present",
                "notes": "Test attendance"
            }
            response = requests.post(f"{self.base_url}/attendance", json=attendance_data, headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Teacher can mark attendance")
            
            # Get attendance as teacher
            response = requests.get(f"{self.base_url}/attendance", headers=headers)
            self.assertEqual(response.status_code, 200)
            print("✅ Teacher can retrieve attendance records")
        else:
            print("⚠️ No courses available for teacher to mark attendance")

    def test_08_admin_endpoints(self):
        """Test admin-specific endpoints"""
        print("\n--- Testing Admin Endpoints ---")
        
        # Get all users as admin
        headers = {"Authorization": f"Bearer {self.admin_token}"}
        response = requests.get(f"{self.base_url}/admin/users", headers=headers)
        self.assertEqual(response.status_code, 200)
        print("✅ Admin can retrieve all users")
        
        # Test permission restrictions
        # Teacher trying to access admin endpoint
        headers = {"Authorization": f"Bearer {self.teacher_token}"}
        response = requests.get(f"{self.base_url}/admin/users", headers=headers)
        self.assertEqual(response.status_code, 403)
        print("✅ Teacher cannot access admin endpoints")
        
        # Student trying to access admin endpoint
        headers = {"Authorization": f"Bearer {self.student_token}"}
        response = requests.get(f"{self.base_url}/admin/users", headers=headers)
        self.assertEqual(response.status_code, 403)
        print("✅ Student cannot access admin endpoints")

if __name__ == "__main__":
    tester = UniversityAPITester()
    tester.setUp()
    
    # Run all tests
    tester.test_01_authentication()
    tester.test_02_stats_endpoint()
    tester.test_03_courses_endpoint()
    tester.test_04_schedules_endpoint()
    tester.test_05_exam_proposals()
    tester.test_06_grades()
    tester.test_07_attendance()
    tester.test_08_admin_endpoints()
    
    print("\n✅ All API tests completed")