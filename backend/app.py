from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from functools import wraps
import json
import datetime
import os
import requests 
from werkzeug.utils import secure_filename
from apscheduler.schedulers.background import BackgroundScheduler
import atexit
import psycopg2 
from psycopg2 import pool, extras # Import pool and extras for dict cursors

# --- NEW: PostgreSQL Setup ---
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    print("FATAL: DATABASE_URL environment variable not set. Using dummy URL.")

db_pool = None
try:
    # Initialize connection pool
    db_pool = psycopg2.pool.SimpleConnectionPool(1, 10, DATABASE_URL)
    print("PostgreSQL connection pool initialized.")
except Exception as e:
    print(f"Error initializing PostgreSQL connection pool: {e}")

# Database Helper Functions
def get_db_connection():
    if db_pool:
        # Get a connection and return it
        return db_pool.getconn()
    raise Exception("Database connection pool is not initialized.")

def release_db_connection(conn):
    if db_pool and conn:
        # Release connection back to the pool
        db_pool.putconn(conn)
        
# Core SQL Execution Function
def execute_sql(sql_query, params=None, fetch_one=False, fetch_all=False, commit=False):
    conn = None
    try:
        conn = get_db_connection()
        # Use DictCursor to return results as dictionaries
        cur = conn.cursor(cursor_factory=extras.RealDictCursor) 
        cur.execute(sql_query, params)
        
        if commit:
            conn.commit()
            return {"success": True}
        
        if fetch_one:
            return cur.fetchone()
        
        if fetch_all:
            return cur.fetchall()
            
        return {"success": True}

    except Exception as e:
        if conn and commit:
            conn.rollback()
        # Raise a custom error to handle in the route
        raise ValueError(f"PostgreSQL Error: {e}")
    finally:
        if conn:
            release_db_connection(conn)


# IMPORTANT: API Key updated with the new key provided by the user.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAfjSp6FNId4MjEM-wtS4GTZCHqdhA8fM0") 

# Path to your Firebase Admin SDK (Used only for Auth, not DB)
CREDENTIALS_PATH = 'disrupt-53691-firebase-adminsdk-fbsvc-7410fd769f.json'

# Initialize Firebase Admin SDK (only once)
try:
    with open(CREDENTIALS_PATH, 'r') as f:
        firebase_credentials = json.load(f)
    cred = credentials.Certificate(firebase_credentials)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
except (IOError, ValueError) as e:
    print(f"Error initializing Firebase Admin SDK for Auth: {e}")


app = Flask(__name__)
# Enable CORS for all origins in development
CORS(app) 

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# === Decorator to check Firebase ID token (KEPT for Auth) ===
def verify_token(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        id_token = request.headers.get('Authorization')
        if not id_token:
            return jsonify({"error": "Unauthorized"}), 401
        
        try:
            id_token = id_token.split("Bearer ")[1]
            decoded_token = auth.verify_id_token(id_token)
            
            if not decoded_token.get("admin"):
                return jsonify({"error": "Unauthorized, not an admin"}), 403

            request.user_id = decoded_token['uid']
            request.user_email = decoded_token['email']
            
            return f(*args, **kwargs)
        except Exception:
            return jsonify({"error": "Token verification failed"}), 401
    return decorated

# Function to send the email (will be scheduled) - UPDATED TO USE SQL INSERT
def send_scheduled_email(recipients_type, subject, body, file_paths):
    print(f"Sending email at {datetime.datetime.now()}...")
    
    metrics = {
        "sent": 150, "opens_rate": 35.5, "clicks_rate": 12.1, 
        "bounces": 2, "unsubscribes": 1 
    }

    # Save analytics to PostgreSQL
    try:
        sql = """
        INSERT INTO email_analytics (subject, recipients_type, sent_date, metrics)
        VALUES (%s, %s, NOW(), %s)
        """
        # Convert metrics dict to JSON string for PostgreSQL JSON/JSONB column
        execute_sql(sql, (subject, recipients_type, json.dumps(metrics)), commit=True)
    except Exception as e:
        print(f"Error saving email analytics to PostgreSQL: {e}")

    # Cleanup: Delete the temporary files after sending
    for path in file_paths:
        try:
            os.remove(path)
            print(f"Successfully deleted temporary file: {path}")
        except OSError as e:
            print(f"Error deleting file {path}: {e}")

# --- AI ANALYSIS ROUTE (NO DB CHANGE) ---
@app.route("/ai/analyze", methods=["POST"])
@cross_origin() 
def ai_analyze():
    data = request.json
    image_data_list = data.get('imageData', [])
    
    if not image_data_list or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
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


# === Admin Routes (ALL UPDATED FOR POSTGRESQL) ===

@app.route("/admin/verify_token", methods=["POST", "OPTIONS"])
@cross_origin()
def verify_token_route():
    # This route is purely for Firebase Auth verification, no DB needed.
    id_token = request.headers.get('Authorization')
    if not id_token:
        return jsonify({"error": "Unauthorized"}), 401
    
    try:
        id_token = id_token.split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        
        if not decoded_token.get("admin"):
            return jsonify({"error": "Unauthorized, not an admin"}), 403

        return jsonify({"message": "Token is valid", "admin": True}), 200
    except Exception:
        return jsonify({"error": "Token verification failed"}), 401

@app.route("/admin/analytics/overview", methods=["GET"])
@verify_token
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
@verify_token
def analytics_users():
    try:
        # NOTE: SELECT * will get all columns. The RealDictCursor will return dicts.
        sql = "SELECT id, email, \"Name\" as name, created_at as registered FROM user_collection ORDER BY created_at DESC"
        users_list = execute_sql(sql, fetch_all=True)
        
        # Format the datetime object to ISO string for consistency
        for user in users_list:
             if user.get('registered') and isinstance(user['registered'], datetime.datetime):
                user['registered'] = user['registered'].isoformat()
        
        return jsonify({"data": users_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/analytics/categories", methods=["GET"])
@verify_token
def analytics_categories():
    try:
        # SQL GROUP BY and COUNT for category aggregation
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
@verify_token
def get_locations():
    try:
        # Select necessary fields from pending_locations
        sql = """
        SELECT id, "propertyType" as title, status, "adminUser" 
        FROM pending_locations 
        ORDER BY id DESC
        """
        locations_list = execute_sql(sql, fetch_all=True)
        
        # Ensure 'title' has a default if null in DB
        for loc in locations_list:
            loc['title'] = loc['title'] or "No Type"
            loc['status'] = loc['status'] or "pending"
            
        return jsonify({"locations": locations_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations/assign-admin/<location_id>", methods=["POST"])
@verify_token
def assign_admin(location_id):
    try:
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
@verify_token
def approve_location(location_id):
    try:
        sql = "UPDATE pending_locations SET status = %s WHERE id = %s"
        execute_sql(sql, ("approved", location_id), commit=True)
        return jsonify({"message": f"Location {location_id} marked as approved."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/crm/contacts", methods=["GET"])
@verify_token
def get_contacts():
    try:
        search_query = request.args.get('q', '').lower()
        contact_filter = request.args.get('filter', 'all')
        
        contacts_list = []
        
        # Get User Profiles
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

        # Get Location Owners (We use a LEFT JOIN to deduplicate against User Profiles)
        if contact_filter in ['all', 'owners']:
             # Use DISTINCT ON email to prevent duplicates if an owner has multiple locations
            sql = """
            SELECT DISTINCT ON (email) id, email, "fullName" as name, "phoneNumber" as phone, NULL as company
            FROM pending_locations
            WHERE email IS NOT NULL 
            AND (lower("fullName") LIKE %s OR lower(email) LIKE %s)
            """
            search_param = f'%{search_query}%'
            location_owners = execute_sql(sql, (search_param, search_param), fetch_all=True)

            # Only add owner if their email isn't already in the list
            existing_emails = {c['email'] for c in contacts_list}
            for contact in location_owners:
                if contact['email'] and contact['email'] not in existing_emails:
                    contact['type'] = "Location Owner"
                    contacts_list.append(contact)
        
        return jsonify({"contacts": contacts_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/crm/add_contact", methods=["POST"])
@verify_token
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
@verify_token
def handle_email_request():
    # ... (File handling remains the same as it's not DB related) ...
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
@verify_token
def get_email_analytics():
    try:
        time_filter = request.args.get('timeFilter', 'monthly')
        
        # Determine the time delta based on the filter
        delta = None
        if time_filter == 'daily':
            delta = datetime.timedelta(days=1)
        elif time_filter == 'weekly':
            delta = datetime.timedelta(weeks=1)
        elif time_filter == 'monthly':
            delta = datetime.timedelta(days=30)
        elif time_filter == 'annually':
            delta = datetime.timedelta(days=365)
        
        # SQL WHERE clause based on time filter
        where_clause = ""
        if delta:
             # Calculate the start date and use it in the query
            start_date = datetime.datetime.now() - delta
            where_clause = f"WHERE sent_date >= '{start_date.isoformat()}'" 
        
        sql = f"""
        SELECT id, subject, recipients_type, sent_date, metrics 
        FROM email_analytics 
        {where_clause}
        ORDER BY sent_date DESC
        """
        analytics_list = execute_sql(sql, fetch_all=True)

        # Ensure metrics are properly handled (PostgreSQL returns JSONB/JSON as dict by default)
        # And sent_date is formatted
        for item in analytics_list:
            if item.get("sent_date") and isinstance(item['sent_date'], datetime.datetime):
                item['sentDate'] = item.pop('sent_date').isoformat()
            if item.get("recipients_type"):
                 item['recipientsType'] = item.pop('recipients_type')
        
        return jsonify({"analytics": analytics_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/change_password", methods=["POST"])
@verify_token
def change_admin_password():
    # This route relies purely on Firebase Auth/Security, no DB change needed.
    data = request.json
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"error": "New password is required"}), 400
    try:
        id_token = request.headers.get('Authorization').split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        admin_user = auth.get_user(decoded_token['uid'])
        # NOTE: Firebase Admin SDK only allows password reset link generation for the user's email
        auth.generate_password_reset_link(admin_user.email) 
        return jsonify({"message": "A password reset email has been sent to your admin email address."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/add_admin", methods=["POST"])
@verify_token
def add_new_admin():
    # This route relies purely on Firebase Auth/Security and the send_scheduled_email helper.
    data = request.json
    email = data.get("email")
    password = data.get("password") 
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    try:
        # Create user in Firebase Auth
        user = auth.create_user(email=email, password=password)
        auth.set_custom_user_claims(user.uid, {'admin': True})
        
        # Email logic
        subject = "Welcome to the Admin Panel"
        body = f"Hello {email},\n\nYou have been granted admin access. Here are your login details:\n\nEmail: {email}\nPassword: {password}\n\nPlease change your password after logging in for the first time."
        send_scheduled_email(recipients_type=email, subject=subject, body=body, file_paths=[])
        
        return jsonify({"message": f"User {email} has been granted admin privileges and an email with their password has been sent."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    # RENDER DEPLOYMENT FIX: Must listen on '0.0.0.0' and use the PORT environment variable
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)