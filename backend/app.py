from flask import Flask, request, jsonify
from flask_cors import CORS
from functools import wraps
import json
import datetime
import os
import requests 
from werkzeug.utils import secure_filename
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import psycopg2 
from psycopg2 import pool, extras 

import bcrypt      # For password hashing
import jwt         # For creating secure session tokens (JWTs)
from datetime import timedelta
import random      # ADDED: Needed for forgot password
import string      # ADDED: Needed for forgot password

# --- ENVIRONMENT VARIABLES & SECURITY SETUP ---
DATABASE_URL = os.environ.get("DATABASE_URL")
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "SUPER_SECRET_FALLBACK_KEY_NEEDS_TO_BE_REPLACED") 
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")

if not DATABASE_URL:
    print("FATAL: DATABASE_URL environment variable not set.")

# --- POSTGRESQL CONNECTION POOL SETUP ---
db_pool = None
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    print("PostgreSQL connection pool initialized.")
except Exception as e:
    print(f"Error initializing PostgreSQL connection pool: {e}")

# Database Helper Functions
def get_db_connection():
    if db_pool:
        return db_pool.getconn()
    raise Exception("Database connection pool is not initialized.")

def release_db_connection(conn):
    if db_pool and conn:
        db_pool.putconn(conn)
        
def execute_sql(sql_query, params=None, fetch_one=False, fetch_all=False, commit=False):
    conn = None
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=extras.RealDictCursor) 
        cur.execute(sql_query, params)
        
        if commit:
            conn.commit()
            # If we need the ID from an INSERT
            if "RETURNING" in sql_query.upper():
                 return cur.fetchone()
            return {"success": True}
        
        if fetch_one:
            return cur.fetchone()
        
        if fetch_all:
            return cur.fetchall()
            
        return {"success": True}

    except Exception as e:
        if conn and commit:
            conn.rollback()
        raise ValueError(f"PostgreSQL Error: {e}")
    finally:
        if conn:
            release_db_connection(conn)


app = Flask(__name__)

CORS(app, resources={r"/*": {
    "origins": [
        "https://plink-rmjy.onrender.com",  # Your Live Frontend
        "http://localhost:3000",            # Your Localhost (for testing)
        "https://plink-backend-api.onrender.com" # Self (sometimes needed)
    ],
    "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "allow_headers": ["Content-Type", "Authorization"],
    "supports_credentials": True
}})

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# =======================================================
# === AUTHENTICATION DECORATOR ===
# =======================================================

def jwt_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        # Allow OPTIONS requests to pass through without checking token
        # (This is crucial for the browser "Preflight" check)
        if request.method == 'OPTIONS':
            return jsonify({'status': 'ok'}), 200

        auth_header = request.headers.get('Authorization')
        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({"error": "Authorization token missing or invalid"}), 401
        
        token = auth_header.split("Bearer ")[1]
        
        try:
            # Decode the JWT token
            payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=["HS256"])
            request.user_id = payload['user_id']
            request.user_email = payload['email']
            request.user_role = payload['role']
            
            # Check for admin role if accessing an admin route
            if request.path.startswith('/admin') and request.user_role != 'admin':
                return jsonify({"error": "Admin access required"}), 403
                
            return f(*args, **kwargs)
        except jwt.ExpiredSignatureError:
            return jsonify({"error": "Token has expired"}), 401
        except jwt.InvalidTokenError:
            return jsonify({"error": "Invalid token"}), 401
        except Exception as e:
            return jsonify({"error": f"Authentication failed: {e}"}), 500
    return decorated

# Function to send the email (uses PostgreSQL for analytics)
def send_scheduled_email(recipients_type, subject, body, file_paths):
    print(f"Sending email at {datetime.datetime.now()}...")
    
    metrics = {
        "sent": 150, "opens_rate": 35.5, "clicks_rate": 12.1, 
        "bounces": 2, "unsubscribes": 1 
    }

    try:
        sql = """
        INSERT INTO email_analytics (subject, recipients_type, sent_date, metrics)
        VALUES (%s, %s, NOW(), %s)
        """
        execute_sql(sql, (subject, recipients_type, json.dumps(metrics)), commit=True)
    except Exception as e:
        print(f"Error saving email analytics to PostgreSQL: {e}")

    for path in file_paths:
        try:
            os.remove(path)
        except OSError as e:
            print(f"Error deleting file {path}: {e}")


# =======================================================
# === USER AUTHENTICATION ENDPOINTS ===
# =======================================================

@app.route("/auth/register", methods=["POST"])
def register():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    if not email or not password:
        return jsonify({"error": "Email and password required"}), 400
        
    # Hash password securely
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
    
    try:
        # Default role is 'user'
        sql = "INSERT INTO auth_users (email, password_hash, user_role) VALUES (%s, %s, %s)"
        execute_sql(sql, (email, hashed_password, 'user'), commit=True)
        return jsonify({"message": "Registration successful"}), 201
    except Exception as e:
        # Check for PostgreSQL unique constraint error (user already exists)
        if "duplicate key value violates unique constraint" in str(e):
            return jsonify({"error": "User already exists"}), 409
        return jsonify({"error": f"Registration failed: {e}"}), 500

@app.route("/auth/login", methods=["POST"])
def login():
    data = request.json
    email = data.get("email")
    password = data.get("password")
    
    sql = "SELECT id, password_hash, user_role FROM auth_users WHERE email = %s"
    user = execute_sql(sql, (email,), fetch_one=True)
    
    # Check if user exists and password is correct
    if user and bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
        # Create JWT payload
        payload = {
            'user_id': str(user['id']), # Ensure ID is string for JWT
            'email': email,
            'role': user['user_role'],
            'exp': datetime.datetime.utcnow() + timedelta(hours=24) # Token expires in 24 hours
        }
        token = jwt.encode(payload, JWT_SECRET_KEY, algorithm='HS256')
        
        return jsonify({
            "message": "Login successful", 
            "token": token,
            "role": user['user_role']
        }), 200
    else:
        return jsonify({"error": "Invalid credentials"}), 401
    

@app.route("/auth/me", methods=["GET", "OPTIONS"])
@jwt_required
def get_current_user():
    try:
        # request.user_id comes from the @jwt_required decorator
        sql = "SELECT id, email, user_role FROM auth_users WHERE id = %s"
        user = execute_sql(sql, (request.user_id,), fetch_one=True)
        
        if user:
            return jsonify({
                "user": {
                    "id": str(user['id']),
                    "email": user['email'],
                    "role": user['user_role']
                    # Add other profile fields here if needed (e.g. bio, phone)
                }
            }), 200
        else:
            return jsonify({"error": "User not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# --- AI ANALYSIS ROUTE ---
@app.route("/ai/analyze", methods=["POST"])
def ai_analyze():
    data = request.json
    image_data_list = data.get('imageData', [])
    
    if not image_data_list or not GEMINI_API_KEY:
        return jsonify({"error": "AI service failed: Gemini API Key is not configured."}), 400

    user_prompt = """
    Analyze the provided image(s) of a property. Focus on the visual details. Return ONLY a single JSON object. 
    Keys MUST include: propertyType, locationType, ageOfProperty, interiorDescription, exteriorDescription, and locationDescription.
    Combine analysis from all images if multiple are provided.
    """
    
    parts = [{"text": user_prompt}]
    for item in image_data_list:
        parts.append({
            "inlineData": {
                "mimeType": item['mimeType'],
                "data": item['data']
            }
        })
    
    gemini_payload = {
        "contents": [{"role": "user", "parts": parts}],
        "generationConfig": { 
            "responseMimeType": "application/json",
        }
    }

    gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }

    try:
        response = requests.post(gemini_api_url, headers=headers, json=gemini_payload)
        
        if response.status_code not in [200, 201]:
             error_details = response.json().get("error", {}).get("message", "API key or billing issue.")
             return jsonify({"error": f"AI analysis failed (Status {response.status_code}): {error_details}"}), 503
        
        response.raise_for_status() 
        
        gemini_result = response.json()
        
        generated_json_text = gemini_result.get("candidates", [{}])[0].get("content", {}).get("parts", [{}])[0].get("text", "")
        
        ai_data = json.loads(generated_json_text)
        
        return jsonify({"message": "AI analysis successful", "aiData": ai_data}), 200

    except requests.exceptions.RequestException as e:
        print(f"Gemini API Request Error: {e}")
        return jsonify({"error": "AI service failed: Check network or API service status."}), 503
    except json.JSONDecodeError:
        print(f"AI response was not valid JSON: {generated_json_text}")
        return jsonify({"error": "AI returned data in an invalid format. Please try again."}), 500
    except Exception as e:
        return jsonify({"error": f"An internal error occurred: {str(e)}"}), 500


# =======================================================
# === ADMIN ROUTES ===
# =======================================================

@app.route("/admin/verify_token", methods=["POST", "OPTIONS"])
@jwt_required
def verify_token_route():
    # This route verifies the JWT role and expiration
    return jsonify({"message": "Token is valid", "admin": request.user_role == 'admin'}), 200

@app.route("/admin/analytics/overview", methods=["GET"])
@jwt_required
def analytics_overview():
    try:
        user_count_result = execute_sql("SELECT COUNT(*) FROM user_collection", fetch_one=True)
        total_users = user_count_result['count'] if user_count_result else 0
        
        location_count_result = execute_sql("SELECT COUNT(*) FROM locations", fetch_one=True)
        total_locations = location_count_result['count'] if location_count_result else 0
        
        return jsonify({
            "total_users": total_users,
            "total_locations": total_locations
        }), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/analytics/users", methods=["GET"])
@jwt_required
def analytics_users():
    try:
        # Note: 'auth_users' is for login, 'user_collection' is for general profile data.
        # We need a join here for full user analytics, but for now, we use the original table.
        sql = "SELECT id, email, \"Name\" as name, created_at as registered FROM user_collection ORDER BY created_at DESC"
        users_list = execute_sql(sql, fetch_all=True)
        
        for user in users_list:
             if user.get('registered') and isinstance(user['registered'], datetime.datetime):
                user['registered'] = user['registered'].isoformat()
        
        return jsonify({"data": users_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/analytics/categories", methods=["GET"])
@jwt_required
def analytics_categories():
    try:
        sql = """
        SELECT "propertyType" as category, COUNT(*) as count 
        FROM locations 
        GROUP BY "propertyType"
        """
        chart_data = execute_sql(sql, fetch_all=True)
        
        return jsonify({"data": chart_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations", methods=["GET"])
@jwt_required
def get_locations():
    try:
        sql = """
        SELECT id, "propertyType" as title, status, "adminUser" 
        FROM pending_locations 
        ORDER BY id DESC
        """
        locations_list = execute_sql(sql, fetch_all=True)
        
        for loc in locations_list:
            loc['title'] = loc['title'] or "No Type"
            loc['status'] = loc['status'] or "pending"
            
        return jsonify({"locations": locations_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations/assign-admin/<location_id>", methods=["POST"])
@jwt_required
def assign_admin(location_id):
    try:
        # Use user_email from the JWT payload
        sql = """
        UPDATE pending_locations 
        SET status = %s, "adminUser" = %s 
        WHERE id = %s
        """
        execute_sql(sql, ("in-progress", request.user_email, location_id), commit=True)
        return jsonify({"message": "Location assigned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations/approve/<location_id>", methods=["POST"])
@jwt_required
def approve_location(location_id):
    try:
        sql = "UPDATE pending_locations SET status = %s WHERE id = %s"
        execute_sql(sql, ("approved", location_id), commit=True)
        return jsonify({"message": f"Location {location_id} marked as approved."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/crm/contacts", methods=["GET"])
@jwt_required
def get_contacts():
    try:
        search_query = request.args.get('q', '').lower()
        contact_filter = request.args.get('filter', 'all')
        
        contacts_list = []
        
        # Get User Profiles (using original table)
        if contact_filter in ['all', 'profiles']:
            sql = """
            SELECT id, email, "Name" as name, "Phone" as phone, "Company" as company 
            FROM user_collection
            WHERE lower("Name") LIKE %s OR lower(email) LIKE %s
            """
            search_param = f'%{search_query}%'
            user_profiles = execute_sql(sql, (search_param, search_param), fetch_all=True)
            for contact in user_profiles:
                contact['type'] = "User Profile"
                contacts_list.append(contact)

        # Get Location Owners
        if contact_filter in ['all', 'owners']:
            sql = """
            SELECT DISTINCT ON (email) id, email, "fullName" as name, "phoneNumber" as phone, NULL as company
            FROM pending_locations
            WHERE email IS NOT NULL 
            AND (lower("fullName") LIKE %s OR lower(email) LIKE %s)
            """
            search_param = f'%{search_query}%'
            location_owners = execute_sql(sql, (search_param, search_param), fetch_all=True)

            existing_emails = {c['email'] for c in contacts_list}
            for contact in location_owners:
                if contact['email'] and contact['email'] not in existing_emails:
                    contact['type'] = "Location Owner"
                    contacts_list.append(contact)
        
        return jsonify({"contacts": contacts_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/crm/add_contact", methods=["POST"])
@jwt_required
def add_contact():
    data = request.json
    email = data.get("email")
    name = data.get("name")
    phone = data.get("phone")
    company = data.get("company")
    if not email:
        return jsonify({"error": "Email is required"}), 400
    try:
        sql = """
        INSERT INTO crm_contacts (email, name, phone, company, created_at)
        VALUES (%s, %s, %s, %s, NOW()) RETURNING id
        """
        result = execute_sql(sql, (email, name, phone, company), fetch_one=True, commit=True)
        contact_id = result.get('id') if result else None
        
        return jsonify({"message": "Contact added successfully", "contact_id": contact_id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/email/send", methods=["POST"])
@jwt_required
def handle_email_request():
    # ... (Scheduling logic remains the same) ...
    recipients_type = request.form.get("recipients")
    subject = request.form.get("subject")
    body = request.form.get("body")
    scheduled_date_str = request.form.get("scheduled_date")
    scheduled_time_str = request.form.get("scheduled_time")
    
    uploaded_files = request.files.getlist('files')
    temp_file_paths = []
    UPLOAD_FOLDER = 'temp_uploads'
    if not os.path.exists(UPLOAD_FOLDER):
        os.makedirs(UPLOAD_FOLDER)
    
    for file in uploaded_files:
        if file and file.filename:
            filename = secure_filename(file.filename)
            file_path = os.path.join(UPLOAD_FOLDER, filename)
            file.save(file_path)
            temp_file_paths.append(file_path)

    if scheduled_date_str and scheduled_time_str:
        scheduled_datetime_str = f"{scheduled_date_str} {scheduled_time_str}"
        try:
            scheduled_datetime = datetime.datetime.strptime(scheduled_datetime_str, '%Y-%m-%d %H:%M')
            if scheduled_datetime < datetime.datetime.now():
                return jsonify({"error": "Cannot schedule email in the past."}), 400
        except ValueError:
            return jsonify({"error": "Invalid date or time format."}), 400

        scheduler.add_job(
            func=send_scheduled_email,
            trigger='date',
            run_date=scheduled_datetime,
            args=[recipients_type, subject, body, temp_file_paths]
        )
        message = "Email scheduled successfully."
    else:
        send_scheduled_email(recipients_type, subject, body, temp_file_paths)
        message = "Email sent successfully."

    return jsonify({"message": message}), 200

@app.route("/admin/email/analytics", methods=["GET"])
@jwt_required
def get_email_analytics():
    try:
        time_filter = request.args.get('timeFilter', 'monthly')
        
        delta = None
        if time_filter == 'daily':
            delta = datetime.timedelta(days=1)
        elif time_filter == 'weekly':
            delta = datetime.timedelta(weeks=1)
        elif time_filter == 'monthly':
            delta = datetime.timedelta(days=30)
        elif time_filter == 'annually':
            delta = datetime.timedelta(days=365)
        
        where_clause = ""
        if delta:
            start_date = datetime.datetime.now() - delta
            where_clause = f"WHERE sent_date >= '{start_date.isoformat()}'" 
        
        sql = f"""
        SELECT id, subject, recipients_type, sent_date, metrics 
        FROM email_analytics 
        {where_clause}
        ORDER BY sent_date DESC
        """
        analytics_list = execute_sql(sql, fetch_all=True)

        for item in analytics_list:
            if item.get("sent_date") and isinstance(item['sent_date'], datetime.datetime):
                item['sentDate'] = item.pop('sent_date').isoformat()
            if item.get("recipients_type"):
                 item['recipientsType'] = item.pop('recipients_type')
        
        return jsonify({"analytics": analytics_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/change_password", methods=["POST"])
@jwt_required
def change_admin_password():
    data = request.json
    old_password = data.get("old_password")
    new_password = data.get("new_password")

    if not new_password or not old_password:
        return jsonify({"error": "Old and new passwords are required"}), 400

    try:
        # 1. Fetch current hashed password from DB
        sql_fetch = "SELECT password_hash FROM auth_users WHERE id = %s"
        user = execute_sql(sql_fetch, (request.user_id,), fetch_one=True)
        
        if not user or not bcrypt.checkpw(old_password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({"error": "Incorrect old password."}), 403

        # 2. Hash and update new password
        new_hashed_password = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        sql_update = "UPDATE auth_users SET password_hash = %s WHERE id = %s"
        execute_sql(sql_update, (new_hashed_password, request.user_id), commit=True)
        
        return jsonify({"message": "Password changed successfully."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/add_admin", methods=["POST"])
@jwt_required
def add_new_admin():
    data = request.json
    email = data.get("email")
    password = data.get("password") 
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    
    try:
        # Create user with 'admin' role in auth_users table
        hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        sql = "INSERT INTO auth_users (email, password_hash, user_role) VALUES (%s, %s, %s)"
        execute_sql(sql, (email, hashed_password, 'admin'), commit=True)

        # Email notification logic
        subject = "Welcome to the Admin Panel"
        body = f"Hello {email},\n\nYou have been granted admin access. Your login details:\n\nEmail: {email}\nPassword: {password}\n\n"
        send_scheduled_email(recipients_type=email, subject=subject, body=body, file_paths=[])
        
        return jsonify({"message": f"User {email} created with admin privileges and login email sent."}), 200
    except Exception as e:
        if "duplicate key value violates unique constraint" in str(e):
            return jsonify({"error": "User already exists"}), 409
        return jsonify({"error": str(e)}), 500
    
@app.route('/auth/forgot-password', methods=['POST'])
def forgot_password():
    data = request.get_json()
    email = data.get('email')

    if not email:
        return jsonify({"message": "Email is required"}), 400

    try:
        conn = get_db_connection()
        cur = conn.cursor()
        
        # 1. Check if user exists
        cur.execute("SELECT id FROM auth_users WHERE email = %s", (email,))
        user = cur.fetchone()
        
        if not user:
            # SECURITY: We return 200 OK even if user is not found 
            cur.close()
            conn.close()
            return jsonify({"message": "If that email exists, a reset link has been sent."}), 200

        # 2. Generate a temporary reset token (In production, save this to DB)
        reset_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))
        
        # TODO: Save reset_token to database with an expiration time
        # cur.execute("UPDATE users SET reset_token = %s WHERE email = %s", (reset_token, email))
        # conn.commit()

        # 3. Send Email (Stub)
        print(f"============================================")
        print(f" [MOCK EMAIL] To: {email}")
        print(f" [MOCK EMAIL] Link: https://plink-rmjy.onrender.com/reset-password?token={reset_token}")
        print(f"============================================")

        cur.close()
        conn.close()
        
        return jsonify({"message": "Reset link sent"}), 200

    except Exception as e:
        print(f"Error in forgot_password: {e}")
        return jsonify({"message": "Internal server error"}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)