"""
Test per registrazione aziende e consulenti
"""
from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from users.models import User, Company, ConsultantCompanyLink


class CompanyRegistrationTest(TestCase):
    """Test registrazione azienda"""
    
    def setUp(self):
        self.client = APIClient()
        self.registration_url = "/api/public/company-registration/"
        self.valid_data = {
            "email": "owner@company.com",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
            "first_name": "Mario",
            "last_name": "Rossi",
            "company_name": "Test Company SRL",
            "vat_number": "IT12345678901",
            "country_code": "IT",
            "city": "Milano",
        }
    
    def test_company_registration_success(self):
        """Test registrazione azienda funziona correttamente"""
        response = self.client.post(self.registration_url, self.valid_data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica utente creato
        user = User.objects.filter(email=self.valid_data["email"]).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, self.valid_data["first_name"])
        self.assertEqual(user.last_name, self.valid_data["last_name"])
        self.assertEqual(user.role, User.RoleChoices.COMPANY_OWNER)
        
        # Verifica company creata
        company = Company.objects.filter(name=self.valid_data["company_name"]).first()
        self.assertIsNotNone(company)
        self.assertEqual(company.vat_number, self.valid_data["vat_number"])
        self.assertEqual(company.city, self.valid_data["city"])
        self.assertEqual(company.status, Company.StatusChoices.TRIAL)
        
        # Verifica user associato a company
        self.assertEqual(user.company, company)
    
    def test_company_registration_password_mismatch(self):
        """Test password non coincidono"""
        data = self.valid_data.copy()
        data["password_confirm"] = "DifferentPassword123!"
        
        response = self.client.post(self.registration_url, data, format="json")
        
        # Verifica errore 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifica messaggio errore
        self.assertIn("password", str(response.data).lower())
        
        # Verifica utente non creato
        user = User.objects.filter(email=data["email"]).first()
        self.assertIsNone(user)
    
    def test_company_registration_duplicate_email(self):
        """Test email duplicata"""
        # Crea prima registrazione
        self.client.post(self.registration_url, self.valid_data, format="json")
        
        # Tenta seconda registrazione con stessa email
        data = self.valid_data.copy()
        data["company_name"] = "Another Company"
        response = self.client.post(self.registration_url, data, format="json")
        
        # Verifica errore 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verifica solo una company creata
        companies = Company.objects.all()
        self.assertEqual(companies.count(), 1)
    
    def test_company_registration_missing_required_fields(self):
        """Test campi obbligatori mancanti"""
        # Test senza email
        data = self.valid_data.copy()
        del data["email"]
        response = self.client.post(self.registration_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test senza company_name
        data = self.valid_data.copy()
        del data["company_name"]
        response = self.client.post(self.registration_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_company_registration_weak_password(self):
        """Test password troppo debole"""
        data = self.valid_data.copy()
        data["password"] = "123"
        data["password_confirm"] = "123"
        
        response = self.client.post(self.registration_url, data, format="json")
        
        # Verifica errore (potrebbe essere 400)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_422_UNPROCESSABLE_ENTITY])


class ConsultantRegistrationTest(TestCase):
    """Test registrazione consulente"""
    
    def setUp(self):
        self.client = APIClient()
        self.registration_url = "/api/public/consultant-registration/"
        self.valid_data = {
            "email": "consultant@example.com",
            "password": "SecurePass123!",
            "password_confirm": "SecurePass123!",
            "first_name": "Laura",
            "last_name": "Bianchi",
            "role": "labor_consultant",
        }
    
    def test_consultant_registration_success(self):
        """Test registrazione consulente funziona"""
        response = self.client.post(self.registration_url, self.valid_data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        # Verifica utente creato
        user = User.objects.filter(email=self.valid_data["email"]).first()
        self.assertIsNotNone(user)
        self.assertEqual(user.first_name, self.valid_data["first_name"])
        self.assertEqual(user.role, User.RoleChoices.LABOR_CONSULTANT)
        
        # Verifica company è None per consulenti
        self.assertIsNone(user.company)
    
    def test_consultant_registration_invalid_role(self):
        """Test ruolo non valido per consulente"""
        data = self.valid_data.copy()
        data["role"] = "company_owner"  # Ruolo non valido per consulenti
        
        response = self.client.post(self.registration_url, data, format="json")
        
        # Verifica errore o che il ruolo sia stato ignorato
        # (dipende dall'implementazione della view)
        if response.status_code == status.HTTP_400_BAD_REQUEST:
            self.assertIn("role", str(response.data).lower())
        else:
            # Se accetta, verifica che il ruolo non sia company_owner
            user = User.objects.filter(email=data["email"]).first()
            if user:
                self.assertNotEqual(user.role, User.RoleChoices.COMPANY_OWNER)
    
    def test_consultant_registration_password_mismatch(self):
        """Test password non coincidono"""
        data = self.valid_data.copy()
        data["password_confirm"] = "DifferentPassword123!"
        
        response = self.client.post(self.registration_url, data, format="json")
        
        # Verifica errore 400
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTest(TestCase):
    """Test login utenti"""
    
    def setUp(self):
        self.client = APIClient()
        self.login_url = "/api/auth/login/"
        
        # Crea utente di test
        self.user = User.objects.create_user(
            email="test@example.com",
            password="TestPassword123!",
            first_name="Test",
            last_name="User",
            role=User.RoleChoices.EMPLOYEE,
            is_active=True,
        )
    
    def test_login_success(self):
        """Test login funziona con credenziali valide"""
        data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
        }
        
        response = self.client.post(self.login_url, data, format="json")
        
        # Verifica status code
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verifica presenza token nella risposta
        # (dipende dall'implementazione: potrebbe essere 'token', 'access', 'key', etc.)
        response_keys = [key.lower() for key in response.data.keys()]
        has_token = any(
            keyword in " ".join(response_keys) 
            for keyword in ["token", "access", "key", "jwt"]
        )
        self.assertTrue(has_token, f"Token non trovato in risposta: {response.data}")
    
    def test_login_wrong_password(self):
        """Test password errata"""
        data = {
            "email": "test@example.com",
            "password": "WrongPassword123!",
        }
        
        response = self.client.post(self.login_url, data, format="json")
        
        # Verifica errore (400 o 401)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_login_nonexistent_user(self):
        """Test utente non esiste"""
        data = {
            "email": "nonexistent@example.com",
            "password": "SomePassword123!",
        }
        
        response = self.client.post(self.login_url, data, format="json")
        
        # Verifica errore (400 o 401)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_login_inactive_user(self):
        """Test utente disattivato"""
        # Disattiva utente
        self.user.is_active = False
        self.user.save()
        
        data = {
            "email": "test@example.com",
            "password": "TestPassword123!",
        }
        
        response = self.client.post(self.login_url, data, format="json")
        
        # Verifica errore (400 o 401)
        self.assertIn(response.status_code, [status.HTTP_400_BAD_REQUEST, status.HTTP_401_UNAUTHORIZED])
    
    def test_login_missing_credentials(self):
        """Test credenziali mancanti"""
        # Senza password
        data = {"email": "test@example.com"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Senza email
        data = {"password": "TestPassword123!"}
        response = self.client.post(self.login_url, data, format="json")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
