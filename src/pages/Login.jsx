import React, { useState } from 'react';
import { Mail, Lock, LogIn } from '../App';

const Login = ({ displayModal, handleLogin, onNavigate }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call your login handler (this should verify credentials against your database)
            await handleLogin({ email, password });
            displayModal("Login successful!");
            if (onNavigate) {
                onNavigate('/profile');
            }
        } catch (error) {
            console.error("Login failed:", error.message);
            displayModal(`Login failed: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                <div className="flex justify-center mb-6">
                    <LogIn className="text-blue-500" size={48} />
                </div>
                <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">Welcome Back</h1>
                <form onSubmit={handleLoginSubmit} className="space-y-4">
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
                    <div className="flex justify-end">
                        <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('/forgot-password')}
                            className="text-sm text-blue-500 hover:text-blue-600"
                        >
                            Forgot password?
                        </button>
                    </div>
                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 text-white bg-black rounded-md font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <button
                            type="button"
                            onClick={() => onNavigate && onNavigate('/register')}
                            className="text-blue-500 hover:text-blue-600 font-semibold"
                        >
                            Sign up
                        </button>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default Login;