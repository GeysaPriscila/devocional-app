#!/usr/bin/env python3
"""
Comprehensive Backend API Test for Faith Companion Devotional App
Tests all authentication, devotional generation, prayers, gratitudes, and reflections endpoints
"""

import requests
import json
import sys
import os
from datetime import datetime
import time

# Get backend URL from frontend environment
FRONTEND_ENV_PATH = "/app/frontend/.env"
backend_base_url = "https://faith-companion-109.preview.emergentagent.com"

# Try to read from frontend .env if exists
try:
    with open(FRONTEND_ENV_PATH, 'r') as f:
        for line in f:
            if line.startswith('EXPO_PUBLIC_BACKEND_URL='):
                backend_base_url = line.split('=', 1)[1].strip()
                break
except FileNotFoundError:
    print("⚠️  Frontend .env not found, using default URL")

# Set the API base URL
API_BASE_URL = f"{backend_base_url}/api"
print(f"🔗 Testing API at: {API_BASE_URL}")

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    MAGENTA = '\033[95m'
    CYAN = '\033[96m'
    WHITE = '\033[97m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'
    END = '\033[0m'

def print_test_header(test_name):
    print(f"\n{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD} {test_name} {Colors.END}")
    print(f"{Colors.CYAN}{Colors.BOLD}{'='*60}{Colors.END}")

def print_success(message):
    print(f"{Colors.GREEN}✅ {message}{Colors.END}")

def print_error(message):
    print(f"{Colors.RED}❌ {message}{Colors.END}")

def print_warning(message):
    print(f"{Colors.YELLOW}⚠️  {message}{Colors.END}")

def print_info(message):
    print(f"{Colors.BLUE}ℹ️  {message}{Colors.END}")

class FaithCompanionAPITest:
    def __init__(self):
        self.session = requests.Session()
        self.access_token = None
        self.user_email = f"testuser_{int(datetime.now().timestamp())}@example.com"
        self.user_password = "SecurePassword123!"
        self.user_name = "Test User"
        
        # Test data storage
        self.prayer_id = None
        self.gratitude_id = None
        self.devotional_id = None
        self.reflection_id = None
        
        # Test results
        self.test_results = {
            'total_tests': 0,
            'passed_tests': 0,
            'failed_tests': 0,
            'critical_failures': []
        }

    def make_request(self, method, endpoint, data=None, headers=None, timeout=30):
        """Make HTTP request with proper error handling"""
        url = f"{API_BASE_URL}{endpoint}"
        
        default_headers = {'Content-Type': 'application/json'}
        if self.access_token:
            default_headers['Authorization'] = f'Bearer {self.access_token}'
        
        if headers:
            default_headers.update(headers)
        
        try:
            if method.upper() == 'GET':
                response = self.session.get(url, headers=default_headers, timeout=timeout)
            elif method.upper() == 'POST':
                response = self.session.post(url, json=data, headers=default_headers, timeout=timeout)
            elif method.upper() == 'PUT':
                response = self.session.put(url, json=data, headers=default_headers, timeout=timeout)
            elif method.upper() == 'DELETE':
                response = self.session.delete(url, headers=default_headers, timeout=timeout)
            else:
                raise ValueError(f"Unsupported HTTP method: {method}")
            
            return response
        
        except requests.exceptions.ConnectionError:
            print_error(f"Connection failed to {url}")
            return None
        except requests.exceptions.Timeout:
            print_error(f"Request timeout to {url}")
            return None
        except Exception as e:
            print_error(f"Request failed: {str(e)}")
            return None

    def assert_test(self, condition, test_name, error_message="", is_critical=False):
        """Assert test condition and track results"""
        self.test_results['total_tests'] += 1
        
        if condition:
            self.test_results['passed_tests'] += 1
            print_success(f"{test_name}")
            return True
        else:
            self.test_results['failed_tests'] += 1
            full_error = f"{test_name}: {error_message}" if error_message else test_name
            print_error(full_error)
            
            if is_critical:
                self.test_results['critical_failures'].append(full_error)
            
            return False

    def test_health_check(self):
        """Test if API is responsive"""
        print_test_header("API HEALTH CHECK")
        
        # Test root endpoint
        response = self.make_request('GET', '/')
        if response is None:
            self.assert_test(False, "API Health Check", "Failed to connect to API", is_critical=True)
            return False
        
        self.assert_test(
            response.status_code in [200, 404], 
            "API Connection", 
            f"Got status {response.status_code}"
        )
        
        print_info(f"API URL: {API_BASE_URL}")
        print_info(f"Response Status: {response.status_code}")
        
        return True

    def test_user_registration(self):
        """Test user registration endpoint"""
        print_test_header("USER REGISTRATION")
        
        user_data = {
            "email": self.user_email,
            "password": self.user_password,
            "name": self.user_name
        }
        
        response = self.make_request('POST', '/auth/register', user_data)
        
        if response is None:
            self.assert_test(False, "User Registration", "No response received", is_critical=True)
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "User Registration Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                self.assert_test(
                    'access_token' in data,
                    "Access Token Present",
                    "No access_token in response"
                )
                
                self.assert_test(
                    'user' in data,
                    "User Data Present",
                    "No user data in response"
                )
                
                if 'access_token' in data:
                    self.access_token = data['access_token']
                    print_info(f"Access token received: {self.access_token[:20]}...")
                
                print_success(f"User registered: {self.user_email}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Registration Response Format", "Invalid JSON response")
        else:
            print_error(f"Registration failed with status {response.status_code}")
            if response.text:
                print_error(f"Error: {response.text}")
        
        return success

    def test_user_login(self):
        """Test user login endpoint"""
        print_test_header("USER LOGIN")
        
        # Test with correct credentials
        login_data = {
            "email": self.user_email,
            "password": self.user_password
        }
        
        response = self.make_request('POST', '/auth/login', login_data)
        
        if response is None:
            self.assert_test(False, "User Login", "No response received", is_critical=True)
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "User Login Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                self.assert_test(
                    'access_token' in data,
                    "Login Token Present",
                    "No access_token in login response"
                )
                
                if 'access_token' in data:
                    self.access_token = data['access_token']
                    print_success("Login successful")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Login Response Format", "Invalid JSON response")
        
        # Test invalid credentials
        invalid_login = {
            "email": self.user_email,
            "password": "wrongpassword"
        }
        
        response = self.make_request('POST', '/auth/login', invalid_login)
        if response:
            self.assert_test(
                response.status_code == 401,
                "Invalid Login Rejection",
                f"Expected 401, got {response.status_code}"
            )
        
        return success

    def test_protected_route_me(self):
        """Test /auth/me protected endpoint"""
        print_test_header("PROTECTED ROUTE - /auth/me")
        
        if not self.access_token:
            self.assert_test(False, "Protected Route Test", "No access token available", is_critical=True)
            return False
        
        response = self.make_request('GET', '/auth/me')
        
        if response is None:
            self.assert_test(False, "Auth Me Endpoint", "No response received", is_critical=True)
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "Auth Me Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                self.assert_test(
                    data.get('email') == self.user_email,
                    "User Email Match",
                    f"Expected {self.user_email}, got {data.get('email')}"
                )
                
                self.assert_test(
                    'name' in data,
                    "User Name Present",
                    "No name field in user data"
                )
                
                print_info(f"User data: {data}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Me Response Format", "Invalid JSON response")
        
        return success

    def test_theme_update(self):
        """Test theme update endpoint"""
        print_test_header("THEME UPDATE")
        
        if not self.access_token:
            self.assert_test(False, "Theme Update Test", "No access token available")
            return False
        
        theme_data = {"theme": "dark"}
        response = self.make_request('PUT', '/auth/theme', theme_data)
        
        if response is None:
            self.assert_test(False, "Theme Update", "No response received")
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "Theme Update Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                self.assert_test(
                    data.get('success') == True,
                    "Theme Update Success",
                    "Success field not True"
                )
            except json.JSONDecodeError:
                self.assert_test(False, "Theme Response Format", "Invalid JSON response")
        
        return success

    def test_devotional_generation(self):
        """Test AI devotional generation endpoint"""
        print_test_header("DEVOTIONAL GENERATION (AI)")
        
        if not self.access_token:
            self.assert_test(False, "Devotional Generation Test", "No access token available", is_critical=True)
            return False
        
        print_info("Generating devotional (this may take 5-10 seconds)...")
        
        response = self.make_request('POST', '/devotionals/generate', timeout=60)
        
        if response is None:
            self.assert_test(False, "Devotional Generation", "No response received", is_critical=True)
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "Devotional Generation Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                
                # Check required fields
                required_fields = ['title', 'content', 'verse', 'verse_reference', 'music_suggestions']
                for field in required_fields:
                    self.assert_test(
                        field in data and data[field],
                        f"Devotional {field.title()} Present",
                        f"Missing or empty {field}"
                    )
                
                if 'id' in data:
                    self.devotional_id = data['id']
                    print_info(f"Generated devotional ID: {self.devotional_id}")
                
                # Check music suggestions format
                if 'music_suggestions' in data and isinstance(data['music_suggestions'], list):
                    self.assert_test(
                        len(data['music_suggestions']) > 0,
                        "Music Suggestions Count",
                        "No music suggestions provided"
                    )
                    
                    if data['music_suggestions']:
                        first_song = data['music_suggestions'][0]
                        if isinstance(first_song, dict):
                            self.assert_test(
                                'name' in first_song and 'artist' in first_song,
                                "Music Suggestions Format",
                                "Music suggestions missing name or artist"
                            )
                
                print_info(f"Devotional title: {data.get('title', 'N/A')}")
                print_info(f"Verse reference: {data.get('verse_reference', 'N/A')}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Devotional Response Format", "Invalid JSON response")
        else:
            print_error(f"Devotional generation failed: {response.text}")
        
        return success

    def test_devotionals_list(self):
        """Test getting devotionals list"""
        print_test_header("DEVOTIONALS LIST")
        
        if not self.access_token:
            self.assert_test(False, "Devotionals List Test", "No access token available")
            return False
        
        response = self.make_request('GET', '/devotionals')
        
        if response is None:
            self.assert_test(False, "Devotionals List", "No response received")
            return False
        
        success = self.assert_test(
            response.status_code == 200,
            "Devotionals List Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if success:
            try:
                data = response.json()
                self.assert_test(
                    isinstance(data, list),
                    "Devotionals List Format",
                    "Response is not a list"
                )
                
                if self.devotional_id:
                    devotional_found = any(d.get('id') == self.devotional_id for d in data)
                    self.assert_test(
                        devotional_found,
                        "Generated Devotional in List",
                        "Previously generated devotional not found in list"
                    )
                
                print_info(f"Found {len(data)} devotionals")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Devotionals List Response Format", "Invalid JSON response")
        
        return success

    def test_prayer_crud(self):
        """Test Prayer CRUD operations"""
        print_test_header("PRAYERS CRUD")
        
        if not self.access_token:
            self.assert_test(False, "Prayer CRUD Test", "No access token available", is_critical=True)
            return False
        
        # CREATE Prayer
        prayer_data = {
            "title": "Oração pela Família",
            "content": "Senhor, protege minha família e nos dá sabedoria para tomar boas decisões.",
            "category": "pendente"
        }
        
        response = self.make_request('POST', '/prayers', prayer_data)
        
        if response is None:
            self.assert_test(False, "Prayer Creation", "No response received", is_critical=True)
            return False
        
        create_success = self.assert_test(
            response.status_code == 200,
            "Prayer Creation Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if create_success:
            try:
                data = response.json()
                self.assert_test(
                    'id' in data,
                    "Prayer ID Present",
                    "No ID returned for created prayer"
                )
                
                if 'id' in data:
                    self.prayer_id = data['id']
                    print_info(f"Prayer created with ID: {self.prayer_id}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Prayer Creation Response Format", "Invalid JSON response")
        
        # READ Prayers
        response = self.make_request('GET', '/prayers')
        
        if response is not None:
            read_success = self.assert_test(
                response.status_code == 200,
                "Prayer List Status",
                f"Expected 200, got {response.status_code}"
            )
            
            if read_success:
                try:
                    data = response.json()
                    self.assert_test(
                        isinstance(data, list),
                        "Prayer List Format",
                        "Response is not a list"
                    )
                    
                    if self.prayer_id:
                        prayer_found = any(p.get('id') == self.prayer_id for p in data)
                        self.assert_test(
                            prayer_found,
                            "Created Prayer in List",
                            "Created prayer not found in list"
                        )
                    
                    print_info(f"Found {len(data)} prayers")
                    
                except json.JSONDecodeError:
                    self.assert_test(False, "Prayer List Response Format", "Invalid JSON response")
        
        # UPDATE Prayer (if we have an ID)
        if self.prayer_id:
            update_data = {
                "title": "Oração pela Família (Respondida)",
                "content": "Senhor, obrigado por proteger minha família.",
                "category": "respondida"
            }
            
            response = self.make_request('PUT', f'/prayers/{self.prayer_id}', update_data)
            
            if response is not None:
                update_success = self.assert_test(
                    response.status_code == 200,
                    "Prayer Update Status",
                    f"Expected 200, got {response.status_code}"
                )
                
                if update_success:
                    try:
                        data = response.json()
                        self.assert_test(
                            data.get('success') == True,
                            "Prayer Update Success",
                            "Success field not True"
                        )
                    except json.JSONDecodeError:
                        self.assert_test(False, "Prayer Update Response Format", "Invalid JSON response")
        
        # Test category filtering
        response = self.make_request('GET', '/prayers?category=respondida')
        
        if response is not None:
            filter_success = self.assert_test(
                response.status_code == 200,
                "Prayer Category Filter",
                f"Expected 200, got {response.status_code}"
            )
            
            if filter_success:
                try:
                    data = response.json()
                    if data:  # If we have prayers
                        all_respondida = all(p.get('category') == 'respondida' for p in data)
                        self.assert_test(
                            all_respondida,
                            "Prayer Category Filtering",
                            "Some prayers in filtered list don't match category"
                        )
                except json.JSONDecodeError:
                    self.assert_test(False, "Prayer Filter Response Format", "Invalid JSON response")
        
        return create_success

    def test_gratitude_crud(self):
        """Test Gratitude CRUD operations"""
        print_test_header("GRATITUDES CRUD")
        
        if not self.access_token:
            self.assert_test(False, "Gratitude CRUD Test", "No access token available", is_critical=True)
            return False
        
        # CREATE Gratitude
        gratitude_data = {
            "content": "Sou grato pela saúde da minha família e pelas oportunidades de crescimento."
        }
        
        response = self.make_request('POST', '/gratitudes', gratitude_data)
        
        if response is None:
            self.assert_test(False, "Gratitude Creation", "No response received", is_critical=True)
            return False
        
        create_success = self.assert_test(
            response.status_code == 200,
            "Gratitude Creation Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if create_success:
            try:
                data = response.json()
                self.assert_test(
                    'id' in data,
                    "Gratitude ID Present",
                    "No ID returned for created gratitude"
                )
                
                if 'id' in data:
                    self.gratitude_id = data['id']
                    print_info(f"Gratitude created with ID: {self.gratitude_id}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Gratitude Creation Response Format", "Invalid JSON response")
        
        # READ Gratitudes
        response = self.make_request('GET', '/gratitudes')
        
        if response is not None:
            read_success = self.assert_test(
                response.status_code == 200,
                "Gratitude List Status",
                f"Expected 200, got {response.status_code}"
            )
            
            if read_success:
                try:
                    data = response.json()
                    self.assert_test(
                        isinstance(data, list),
                        "Gratitude List Format",
                        "Response is not a list"
                    )
                    
                    if self.gratitude_id:
                        gratitude_found = any(g.get('id') == self.gratitude_id for g in data)
                        self.assert_test(
                            gratitude_found,
                            "Created Gratitude in List",
                            "Created gratitude not found in list"
                        )
                    
                    print_info(f"Found {len(data)} gratitudes")
                    
                except json.JSONDecodeError:
                    self.assert_test(False, "Gratitude List Response Format", "Invalid JSON response")
        
        return create_success

    def test_reflections(self):
        """Test Community Reflections"""
        print_test_header("COMMUNITY REFLECTIONS")
        
        if not self.access_token:
            self.assert_test(False, "Reflections Test", "No access token available", is_critical=True)
            return False
        
        # CREATE Reflection
        reflection_data = {
            "content": "Hoje aprendi que a paciência é uma virtude que se desenvolve com a prática diária.",
            "type": "devocional",
            "is_public": True
        }
        
        response = self.make_request('POST', '/reflections', reflection_data)
        
        if response is None:
            self.assert_test(False, "Reflection Creation", "No response received", is_critical=True)
            return False
        
        create_success = self.assert_test(
            response.status_code == 200,
            "Reflection Creation Status",
            f"Expected 200, got {response.status_code}"
        )
        
        if create_success:
            try:
                data = response.json()
                self.assert_test(
                    'id' in data,
                    "Reflection ID Present",
                    "No ID returned for created reflection"
                )
                
                if 'id' in data:
                    self.reflection_id = data['id']
                    print_info(f"Reflection created with ID: {self.reflection_id}")
                
            except json.JSONDecodeError:
                self.assert_test(False, "Reflection Creation Response Format", "Invalid JSON response")
        
        # READ Public Reflections
        response = self.make_request('GET', '/reflections/public')
        
        if response is not None:
            read_success = self.assert_test(
                response.status_code == 200,
                "Public Reflections Status",
                f"Expected 200, got {response.status_code}"
            )
            
            if read_success:
                try:
                    data = response.json()
                    self.assert_test(
                        isinstance(data, list),
                        "Public Reflections Format",
                        "Response is not a list"
                    )
                    
                    if self.reflection_id:
                        reflection_found = any(r.get('id') == self.reflection_id for r in data)
                        self.assert_test(
                            reflection_found,
                            "Created Reflection in Public List",
                            "Created reflection not found in public list"
                        )
                    
                    print_info(f"Found {len(data)} public reflections")
                    
                except json.JSONDecodeError:
                    self.assert_test(False, "Public Reflections Response Format", "Invalid JSON response")
        
        return create_success

    def test_delete_operations(self):
        """Test DELETE operations"""
        print_test_header("DELETE OPERATIONS")
        
        if not self.access_token:
            self.assert_test(False, "Delete Operations Test", "No access token available")
            return False
        
        success_count = 0
        
        # Delete Prayer
        if self.prayer_id:
            response = self.make_request('DELETE', f'/prayers/{self.prayer_id}')
            if response is not None:
                delete_success = self.assert_test(
                    response.status_code == 200,
                    "Prayer Deletion",
                    f"Expected 200, got {response.status_code}"
                )
                if delete_success:
                    success_count += 1
        
        # Delete Gratitude
        if self.gratitude_id:
            response = self.make_request('DELETE', f'/gratitudes/{self.gratitude_id}')
            if response is not None:
                delete_success = self.assert_test(
                    response.status_code == 200,
                    "Gratitude Deletion",
                    f"Expected 200, got {response.status_code}"
                )
                if delete_success:
                    success_count += 1
        
        return success_count > 0

    def test_authentication_failures(self):
        """Test authentication failure scenarios"""
        print_test_header("AUTHENTICATION FAILURES")
        
        # Test accessing protected route without token
        old_token = self.access_token
        self.access_token = None
        
        response = self.make_request('GET', '/auth/me')
        
        if response is not None:
            self.assert_test(
                response.status_code == 401,
                "Unauthorized Access Rejection",
                f"Expected 401, got {response.status_code}"
            )
        
        # Test with invalid token
        self.access_token = "invalid_token_12345"
        
        response = self.make_request('GET', '/auth/me')
        
        if response is not None:
            self.assert_test(
                response.status_code == 401,
                "Invalid Token Rejection",
                f"Expected 401, got {response.status_code}"
            )
        
        # Restore valid token
        self.access_token = old_token
        
        return True

    def run_all_tests(self):
        """Run the complete test suite"""
        print(f"\n{Colors.MAGENTA}{Colors.BOLD}🧪 FAITH COMPANION API TEST SUITE{Colors.END}")
        print(f"{Colors.MAGENTA}{Colors.BOLD}{'='*80}{Colors.END}")
        
        start_time = time.time()
        
        # Core connectivity test
        if not self.test_health_check():
            print_error("❌ API is not accessible. Stopping tests.")
            return False
        
        # Authentication flow
        self.test_user_registration()
        self.test_user_login()
        self.test_protected_route_me()
        self.test_theme_update()
        
        # Core functionality
        self.test_devotional_generation()
        self.test_devotionals_list()
        self.test_prayer_crud()
        self.test_gratitude_crud()
        self.test_reflections()
        
        # Cleanup and edge cases
        self.test_delete_operations()
        self.test_authentication_failures()
        
        # Print final results
        end_time = time.time()
        duration = end_time - start_time
        
        print(f"\n{Colors.MAGENTA}{Colors.BOLD}📊 TEST RESULTS SUMMARY{Colors.END}")
        print(f"{Colors.MAGENTA}{Colors.BOLD}{'='*80}{Colors.END}")
        
        print(f"{Colors.WHITE}Total Tests: {self.test_results['total_tests']}{Colors.END}")
        print(f"{Colors.GREEN}✅ Passed: {self.test_results['passed_tests']}{Colors.END}")
        print(f"{Colors.RED}❌ Failed: {self.test_results['failed_tests']}{Colors.END}")
        
        if self.test_results['critical_failures']:
            print(f"\n{Colors.RED}{Colors.BOLD}🚨 CRITICAL FAILURES:{Colors.END}")
            for failure in self.test_results['critical_failures']:
                print(f"{Colors.RED}  • {failure}{Colors.END}")
        
        success_rate = (self.test_results['passed_tests'] / self.test_results['total_tests']) * 100 if self.test_results['total_tests'] > 0 else 0
        
        print(f"\n{Colors.CYAN}Success Rate: {success_rate:.1f}%{Colors.END}")
        print(f"{Colors.CYAN}Duration: {duration:.2f} seconds{Colors.END}")
        
        if success_rate >= 90:
            print(f"\n{Colors.GREEN}{Colors.BOLD}🎉 EXCELLENT! API is working great!{Colors.END}")
        elif success_rate >= 75:
            print(f"\n{Colors.YELLOW}{Colors.BOLD}⚠️  GOOD! Minor issues to address{Colors.END}")
        else:
            print(f"\n{Colors.RED}{Colors.BOLD}🚨 NEEDS ATTENTION! Multiple issues found{Colors.END}")
        
        return len(self.test_results['critical_failures']) == 0

if __name__ == "__main__":
    tester = FaithCompanionAPITest()
    success = tester.run_all_tests()
    
    if not success:
        sys.exit(1)