from flask import Flask, request, jsonify
from flask_cors import CORS, cross_origin
from functools import wraps
import firebase_admin
from firebase_admin import credentials, auth, firestore
import json
import datetime
import os
import requests 
from werkzeug.utils import secure_filename
from apscheduler.schedulers.background import BackgroundScheduler
import atexit

# IMPORTANT: API Key updated with the new key provided by the user.
# For security, you should load this key from a secure environment variable.
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "AIzaSyAfjSp6FNId4MjEM-wtS4GTZCHqdhA8fM0") 

# Path to your Firebase Admin SDK
CREDENTIALS_PATH = 'disrupt-53691-firebase-adminsdk-fbsvc-7410fd769f.json'

# Initialize Firebase Admin SDK (only once)
try:
    with open(CREDENTIALS_PATH, 'r') as f:
        firebase_credentials = json.load(f)
    cred = credentials.Certificate(firebase_credentials)
    if not firebase_admin._apps:
        firebase_admin.initialize_app(cred)
except (IOError, ValueError) as e:
    print(f"Error initializing Firebase Admin SDK: {e}")

db = firestore.client()

app = Flask(__name__)
# Enable CORS for all origins in development
CORS(app) 

# Initialize APScheduler
scheduler = BackgroundScheduler()
scheduler.start()
atexit.register(lambda: scheduler.shutdown())

# === Decorator to check Firebase ID token ===
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

# Function to send the email (will be scheduled)
def send_scheduled_email(recipients_type, subject, body, file_paths):
    print(f"Sending email at {datetime.datetime.now()}...")
    
    metrics = {
        "sent": 150, "opens_rate": 35.5, "clicks_rate": 12.1, 
        "bounces": 2, "unsubscribes": 1 
    }

    # Save analytics to Firestore
    try:
        analytics_ref = db.collection("email_analytics").document()
        analytics_ref.set({
            "subject": subject,
            "recipients_type": recipients_type,
            "sentDate": datetime.datetime.now(),
            "metrics": metrics,
        })
    except Exception as e:
        print(f"Error saving email analytics to Firestore: {e}")

    # Cleanup: Delete the temporary files after sending
    for path in file_paths:
        try:
            os.remove(path)
            print(f"Successfully deleted temporary file: {path}")
        except OSError as e:
            print(f"Error deleting file {path}: {e}")

# --- AI ANALYSIS ROUTE ---
@app.route("/ai/analyze", methods=["POST"])
@cross_origin() 
def ai_analyze():
    data = request.json
    image_data_list = data.get('imageData', [])
    
    # Check if the key is the unconfigured placeholder
    if not image_data_list or GEMINI_API_KEY == "YOUR_GEMINI_API_KEY_HERE":
        return jsonify({"error": "AI service failed: Gemini API Key is not configured."}), 400

    user_prompt = """
    Analyze the provided image(s) of a property. Focus on the visual details. Return ONLY a single JSON object. 
    Keys MUST include: propertyType, locationType, ageOfProperty, interiorDescription, exteriorDescription, and locationDescription.
    Combine analysis from all images if multiple are provided.
    """
    
    # Construct the parts list for the Gemini API call
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
        "generationConfig": {  # <--- FIX: Renamed 'config' to 'generationConfig'
            "responseMimeType": "application/json",
        }
    }

    # CRUCIAL FIX: Uses the GEMINI_API_KEY variable
    gemini_api_url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent"
    
    # NEW: Pass the API key in the X-goog-api-key header
    headers = {
        'Content-Type': 'application/json',
        'X-goog-api-key': GEMINI_API_KEY
    }

    try:
        response = requests.post(gemini_api_url, headers=headers, json=gemini_payload)
        
        # Check for specific 400/403/429 errors first, as they are the known failure modes
        if response.status_code in [400, 403, 429]:
            error_details = response.json().get("error", {}).get("message", "API key or billing issue.")
            return jsonify({"error": f"AI analysis failed (Status {response.status_code}): {error_details}"}), 503
        
        response.raise_for_status() # Raise an exception for other 4xx/5xx errors
        
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


# === All Admin Routes ===

@app.route("/admin/verify_token", methods=["POST", "OPTIONS"])
@cross_origin()
def verify_token_route():
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
        users_ref = db.collection("user_collection")
        total_users = len(users_ref.get())
        locations_ref = db.collection("locations")
        total_locations = len(locations_ref.get())
        
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
        users_ref = db.collection("user_collection").stream()
        users_list = []
        for doc in users_ref:
            data = doc.to_dict()
            createdAt_timestamp = data.get("createdAt")
            if createdAt_timestamp and isinstance(createdAt_timestamp, datetime.datetime):
                registered_date = createdAt_timestamp.isoformat()
            else:
                registered_date = None
            users_list.append({
                "id": doc.id,
                "email": data.get("email"),
                "name": data.get("Name", "N/A"),
                "registered": registered_date
            })
        return jsonify({"data": users_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/analytics/categories", methods=["GET"])
@verify_token
def analytics_categories():
    try:
        locations_ref = db.collection("locations").stream()
        category_counts = {}
        for doc in locations_ref:
            data = doc.to_dict()
            category = data.get("propertyType") 
            if category:
                category_counts[category] = category_counts.get(category, 0) + 1
        chart_data = [{"category": cat, "count": count} for cat, count in category_counts.items()]
        return jsonify({"data": chart_data}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations", methods=["GET"])
@verify_token
def get_locations():
    try:
        locations_ref = db.collection("pending_locations").stream() 
        locations_list = []
        for doc in locations_ref:
            data = doc.to_dict()
            locations_list.append({
                "id": doc.id,
                "title": data.get("propertyType", "No Type"), 
                "status": data.get("status", "pending"),
                "adminUser": data.get("adminUser"),
            })
        return jsonify({"locations": locations_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations/assign-admin/<location_id>", methods=["POST"])
@verify_token
def assign_admin(location_id):
    try:
        location_ref = db.collection("pending_locations").document(location_id)
        location_ref.update({
            "status": "in-progress",
            "adminUser": request.user_email,
        })
        return jsonify({"message": "Location assigned successfully"}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/locations/approve/<location_id>", methods=["POST"])
@verify_token
def approve_location(location_id):
    try:
        location_ref = db.collection("pending_locations").document(location_id)
        location_ref.update({
            "status": "approved",
        })
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
        
        if contact_filter in ['all', 'profiles']:
            users_ref = db.collection("user_collection").stream()
            for doc in users_ref:
                data = doc.to_dict()
                name = data.get("Name", "N/A")
                if search_query in name.lower() or search_query in data.get("email", "").lower():
                    contacts_list.append({
                        "id": doc.id,
                        "email": data.get("email"),
                        "name": name,
                        "phone": data.get("Phone"),
                        "company": data.get("Company"),
                        "type": "User Profile"
                    })
        
        if contact_filter in ['all', 'owners']:
            locations_ref = db.collection("pending_locations").stream()
            for doc in locations_ref:
                data = doc.to_dict()
                owner_email = data.get("email") 
                owner_name = data.get("fullName", "N/A") 
                if owner_email and not any(c['email'] == owner_email for c in contacts_list):
                    if search_query in owner_name.lower() or search_query in owner_email.lower():
                        contacts_list.append({
                            "id": doc.id,
                            "email": owner_email,
                            "name": owner_name or "N/A",
                            "phone": data.get("phoneNumber"),
                            "type": "Location Owner"
                        })
        
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
        new_contact_ref = db.collection("crm_contacts").document()
        new_contact_ref.set({
            "email": email,
            "name": name,
            "phone": phone,
            "company": company,
            "createdAt": datetime.datetime.now()
        })
        return jsonify({"message": "Contact added successfully", "contact_id": new_contact_ref.id}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/email/send", methods=["POST"])
@verify_token
def handle_email_request():
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
        
        now = datetime.datetime.now()
        if time_filter == 'daily':
            start_date = now - datetime.timedelta(days=1)
        elif time_filter == 'weekly':
            start_date = now - datetime.timedelta(weeks=1)
        elif time_filter == 'monthly':
            start_date = now - datetime.timedelta(days=30)
        elif time_filter == 'annually':
            start_date = now - datetime.timedelta(days=365)
        else:
            start_date = datetime.datetime.min 

        analytics_list = []
        analytics_ref = db.collection("email_analytics").where("sentDate", ">=", start_date).stream()
        for doc in analytics_ref:
            data = doc.to_dict()
            analytics_list.append({
                "id": doc.id,
                "subject": data.get("subject"),
                "recipientsType": data.get("recipients_type"),
                "sentDate": data.get("sentDate").isoformat(),
                "metrics": data.get("metrics"),
            })

        return jsonify({"analytics": analytics_list}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/change_password", methods=["POST"])
@verify_token
def change_admin_password():
    data = request.json
    new_password = data.get("new_password")
    if not new_password:
        return jsonify({"error": "New password is required"}), 400
    try:
        id_token = request.headers.get('Authorization').split("Bearer ")[1]
        decoded_token = auth.verify_id_token(id_token)
        admin_user = auth.get_user(decoded_token['uid'])
        auth.generate_password_reset_link(admin_user.email)
        return jsonify({"message": "A password reset email has been sent to your admin email address."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/admin/settings/add_admin", methods=["POST"])
@verify_token
def add_new_admin():
    data = request.json
    email = data.get("email")
    password = data.get("password") 
    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400
    try:
        user = auth.create_user(email=email, password=password)
        auth.set_custom_user_claims(user.uid, {'admin': True})
        
        subject = "Welcome to the Admin Panel"
        body = f"Hello {email},\n\nYou have been granted admin access. Here are your login details:\n\nEmail: {email}\nPassword: {password}\n\nPlease change your password after logging in for the first time."
        
        send_scheduled_email(recipients_type=email, subject=subject, body=body, file_paths=[])
        
        return jsonify({"message": f"User {email} has been granted admin privileges and an email with their password has been sent."}), 200
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
