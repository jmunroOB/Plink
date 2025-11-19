// src/pages/Register.jsx

import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FirebaseContext } from '../App';
import { Mail, Lock, Phone, User as UserIcon, LogIn as LogInIcon } from 'lucide-react';

const Register = ({ displayModal, handleRegister }) => {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [phone_number, setPhone_number] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bio, setBio] = useState('');

    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            displayModal("Passwords do not match!");
            return;
        }

        try {
            await handleRegister({ email, password, bio });
            displayModal("Registration successful!");
            navigate('/profile');
        } catch (error) {
            console.error("Registration failed:", error.message);
            displayModal(`Registration failed: ${error.message}`);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Register</h1>
                <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Email"
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="phone_number"
                            value={phone_number}
                            onChange={(e) => setPhone_number(e.target.value)}
                            placeholder="Phone Number"
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm Password"
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="4"
                        />
                    </div>
                    <button
                        type="submit"
                        className="w-full px-4 py-3 text-white bg-black rounded-md font-semibold hover:bg-gray-800 transition"
                    >
                        Register
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">Already have an account?</p>
                    <Link to="/profile" className="text-blue-600 hover:underline font-medium">
                        Login Here
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Register;