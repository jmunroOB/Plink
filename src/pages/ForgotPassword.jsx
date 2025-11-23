import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming you are using react-router
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPassword = ({ displayModal, handleForgotPassword }) => {
    const [email, setEmail] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // Call the API function passed from parent (App.jsx)
            // This function should check the database.
            // If email exists -> send email.
            // If email NOT exists -> throw error.
            await handleForgotPassword(email);
            
            // Success Message
            if (displayModal) displayModal('Success! Please check your inbox for reset instructions.');
            
        } catch (error) {
            console.error("Forgot Password failed:", error.message);
            // Specific error message as requested
            if (displayModal) {
                displayModal('Sorry, your credentials are incorrect.');
            } else {
                alert('Sorry, your credentials are incorrect.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center p-8 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg">
                
                {/* Back to Login Link */}
                <div className="mb-4">
                    <Link to="/login" className="flex items-center text-sm text-gray-500 hover:text-gray-800 transition-colors">
                        <ArrowLeft size={16} className="mr-1" /> Back to Login
                    </Link>
                </div>

                <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">Forgot Password</h1>
                <p className="text-center text-gray-600 mb-8">
                    Enter your email address and we'll send you a link to reset your password.
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full px-4 py-3 text-white bg-black rounded-md font-semibold hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <p className="text-gray-600">
                        Don't have an account?{' '}
                        <Link to="/registeruser" className="text-blue-600 hover:underline font-medium">
                            Sign Up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;