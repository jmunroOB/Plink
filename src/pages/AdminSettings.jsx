import React, { useState, useContext } from 'react';
import { FirebaseContext } from '../App';

const AdminSettings = () => {
    const { apiFetch } = useContext(FirebaseContext);
    const [passwordForm, setPasswordForm] = useState({ newPassword: '' });
    const [adminForm, setAdminForm] = useState({ email: '', password: '' });
    const [passwordMessage, setPasswordMessage] = useState('');
    const [adminMessage, setAdminMessage] = useState('');

    const generatePassword = () => {
        const length = 12;
        const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()";
        let newPassword = "";
        for (let i = 0; i < length; i++) {
            newPassword += charset.charAt(Math.floor(Math.random() * charset.length));
        }
        setAdminForm(prevForm => ({ ...prevForm, password: newPassword }));
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();
        setPasswordMessage('');
        try {
            const response = await apiFetch('/admin/settings/change_password', {
                method: 'POST',
                body: JSON.stringify({ new_password: passwordForm.newPassword }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to send password reset email.');
            }
            setPasswordMessage(data.message);
            setPasswordForm({ newPassword: '' });
        } catch (err) {
            setPasswordMessage(`Error: ${err.message}`);
        }
    };

    const handleAddAdmin = async (e) => {
        e.preventDefault();
        setAdminMessage('');
        try {
            const response = await apiFetch('/admin/settings/add_admin', {
                method: 'POST',
                body: JSON.stringify(adminForm),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.error || 'Failed to add new admin.');
            }
            setAdminMessage(data.message);
            setAdminForm({ email: '', password: '' });
        } catch (err) {
            setAdminMessage(`Error: ${err.message}`);
        }
    };

    return (
        <div className="space-y-8 p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Admin Settings</h1>
            
            {/* Change Password Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
                <form onSubmit={handleChangePassword} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">New Password</label>
                        <input
                            type="password"
                            value={passwordForm.newPassword}
                            onChange={(e) => setPasswordForm({ newPassword: e.target.value })}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                        />
                    </div>
                    <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition">
                        Send Password Reset
                    </button>
                </form>
                {passwordMessage && <p className="mt-4 text-center text-sm">{passwordMessage}</p>}
            </div>

            {/* Add New Admin Section */}
            <div className="bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-semibold mb-4">Add New Admin</h2>
                <form onSubmit={handleAddAdmin} className="space-y-4">
                    <div>
                        <label className="block text-gray-700">Email</label>
                        <input
                            type="email"
                            value={adminForm.email}
                            onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                            className="w-full mt-1 p-2 border rounded-md"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700">Password</label>
                        <div className="flex items-center gap-2">
                            <input
                                type="text"
                                value={adminForm.password}
                                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                                className="w-full mt-1 p-2 border rounded-md"
                                required
                            />
                            <button
                                type="button"
                                onClick={generatePassword}
                                className="bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition"
                            >
                                Generate Password
                            </button>
                        </div>
                    </div>
                    <button type="submit" className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition">
                        Add Admin
                    </button>
                </form>
                {adminMessage && <p className="mt-4 text-center text-sm">{adminMessage}</p>}
            </div>
        </div>
    );
};

export default AdminSettings;