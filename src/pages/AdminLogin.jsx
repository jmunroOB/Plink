import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock } from 'lucide-react';
import { AppContext } from '../App';
import { signInWithEmailAndPassword } from 'firebase/auth';

const AdminLogin = ({ displayModal }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { auth } = useContext(AppContext);

    const handleAdminLogin = async (e) => {
        e.preventDefault();
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const idToken = await user.getIdToken();

            const response = await fetch('https://plink-backend-api.onrender.com/admin/verify_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${idToken}`
                }
            });

            const data = await response.json();
            
            if (response.ok) {
                localStorage.setItem('admin_token', idToken);
                displayModal('Admin login successful!');
                navigate('/admin/analytics'); // Redirect to a specific page within the admin dashboard
            } else {
                displayModal(`Admin login failed: ${data.error}`);
            }
        } catch (error) {
            console.error('Login failed:', error);
            displayModal(`Admin login failed: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-between p-8 min-h-screen bg-gray-100">
            <div className="flex-1 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                    <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Admin Login</h1>
                    <form onSubmit={handleAdminLogin} className="space-y-4">
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="Email"
                                required
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                required
                                className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full px-4 py-3 text-white bg-black rounded-md font-semibold hover:bg-gray-800 transition"
                        >
                            Log In as Admin
                        </button>
                    </form>
                </div>
            </div>
            {/* Global Footer */}
            <footer className="w-full text-white bg-gray-800 p-4 flex flex-col items-center flex-shrink-0 text-center mt-8">
                <div className="text-xl font-bold" style={{ color: '#00d4ff' }}>PLINK</div>
                <div className="text-sm">
                    &copy; {new Date().getFullYear()} Plink. All rights reserved.
                </div>
            </footer>
        </div>
    );
};

export default AdminLogin;