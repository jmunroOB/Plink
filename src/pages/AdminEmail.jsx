import React, { useState, useContext } from 'react';
import AdminCard from '../components/AdminCard';
import { FirebaseContext } from '../App';

const AdminEmail = ({ displayModal }) => {
    const { apiFetch } = useContext(FirebaseContext);
    const [form, setForm] = useState({ to: '', subject: '', body: '' });

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Placeholder for a real API call to send the email
        // A real implementation would send the email via a backend service.
        try {
            const response = await apiFetch('/admin/email/send', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            if (response.ok) {
                displayModal("Email sent successfully!");
                setForm({ to: '', subject: '', body: '' });
            } else {
                const data = await response.json();
                displayModal(`Failed to send email: ${data.error}`);
            }
        } catch (error) {
            console.error('Email send failed:', error);
            displayModal(`Failed to send email: ${error.message}`);
        }
    };

    return (
        <AdminCard title="Send Email">
            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="email"
                    placeholder="Recipient"
                    value={form.to}
                    onChange={e => setForm({ ...form, to: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
                <input
                    type="text"
                    placeholder="Subject"
                    value={form.subject}
                    onChange={e => setForm({ ...form, subject: e.target.value })}
                    className="w-full border rounded px-3 py-2"
                />
                <textarea
                    placeholder="Message"
                    value={form.body}
                    onChange={e => setForm({ ...form, body: e.target.value })}
                    className="w-full border rounded px-3 py-2 h-32"
                />
                <button
                    type="submit"
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-primaryDark"
                >
                    Send
                </button>
            </form>
        </AdminCard>
    );
};

export default AdminEmail;