# Backend/admin_routes.py

from flask import request, jsonify
from functools import wraps
import firebase_admin
from firebase_admin import auth
import datetime

# A decorator to handle Firebase ID token verification.
# This decorator is now self-contained.
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

# The main function to register all admin routes.
def configure_admin_routes(app, db):

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
                category = data.get("category")
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
            locations_ref = db.collection("locations").stream()
            locations_list = []
            for doc in locations_ref:
                data = doc.to_dict()
                locations_list.append({
                    "id": doc.id,
                    "title": data.get("title", "No Title"),
                    "status": data.get("status", "not-live"),
                    "adminUser": data.get("adminUser"),
                })
            return jsonify({"locations": locations_list}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500

    @app.route("/admin/locations/assign-admin/<location_id>", methods=["POST"])
    @verify_token
    def assign_admin(location_id):
        try:
            location_ref = db.collection("locations").document(location_id)
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
            location_ref = db.collection("locations").document(location_id)
            location_ref.update({
                "status": "live",
                "approved": True,
            })
            return jsonify({"message": f"Location {location_id} approved."}), 200
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
                locations_ref = db.collection("locations").stream()
                for doc in locations_ref:
                    data = doc.to_dict()
                    owner_email = data.get("owner_email")
                    owner_name = data.get("owner_name", "N/A")
                    if owner_email and not any(c['email'] == owner_email for c in contacts_list):
                        if search_query in owner_name.lower() or search_query in owner_email.lower():
                            contacts_list.append({
                                "id": doc.id,
                                "email": owner_email,
                                "name": owner_name or "N/A",
                                "phone": data.get("owner_phone"),
                                "company": data.get("owner_company"),
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
    def send_email():
        data = request.json
        recipients = data.get("recipients")
        subject = data.get("subject")
        body = data.get("body")
        if not all([recipients, subject, body]):
            return jsonify({"error": "Missing required fields"}), 400
        try:
            emails_to_send_to = []
            if recipients == "owner" or recipients == "both":
                location_owners = db.collection("locations").stream()
                for doc in location_owners:
                    owner_email = doc.to_dict().get("owner_email")
                    if owner_email:
                        emails_to_send_to.append(owner_email)
            if recipients == "search_profiles" or recipients == "both":
                search_profiles = db.collection("user_collection").stream()
                for doc in search_profiles:
                    user_email = doc.to_dict().get("email")
                    if user_email:
                        emails_to_send_to.append(user_email)
            print(f"Sending email to: {', '.join(emails_to_send_to)} with subject: '{subject}'")
            return jsonify({"message": "Email request processed."}), 200
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
        if not email:
            return jsonify({"error": "Email is required"}), 400
        try:
            user = auth.get_user_by_email(email)
            auth.set_custom_user_claims(user.uid, {'admin': True})
            return jsonify({"message": f"User {email} has been granted admin privileges."}), 200
        except Exception as e:
            return jsonify({"error": str(e)}), 500