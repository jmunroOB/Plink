import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'; // **<-- Added Navigate**
// Removed all Firebase imports
import { Home, Search, PlusSquare, User, LogIn, LogOut, Heart } from 'lucide-react';

// Import all your page components
import Profile from './pages/Profile';
import Register from './pages/Register';
import SearchPage from './pages/Search';
import HomePage from './pages/Home';
import Saved from './pages/Saved';
import Footer from './components/Footer';

// Admin Page Imports
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

// **HIGHLIGHTED CHANGE 1: Context for API and User Data**
export const AppContext = React.createContext({ 
    currentUser: null, 
    apiFetch: () => Promise.resolve(), 
    uploadFile: () => Promise.resolve(),
});

// **HIGHLIGHTED ADDITION 1: ProtectedRoute Component** 🔐
const ProtectedRoute = ({ isLoggedIn, children, redirectPath = '/register' }) => {
    const location = useLocation();

    // Check for the special case where /register is used for both Login and Signup.
    // If the user is on the /register page, we shouldn't redirect them *from* it.
    if (!isLoggedIn && location.pathname !== redirectPath) {
        // Redirect them to the sign-up/login page, but save the current path
        // so they can be sent back after successful login/signup.
        return <Navigate to={redirectPath} replace state={{ from: location }} />;
    }

    return children;
};

// The Header component remains largely the same, relying on isLoggedIn prop.
const Header = ({ isLoggedIn, handleLogout }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isAdminRoute) {
        return null;
    }

    return (
        <nav className="bg-white shadow-md p-4 sticky top-0 z-40">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-gray-800">Plink</Link>
                <div className="flex items-center space-x-4">
                    <Link to="/home" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                        <Home className="h-5 w-5" /> Home
                    </Link>
                    <Link to="/register" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                        <PlusSquare className="h-5 w-5" /> List Location
                    </Link>
                    <Link to="/search" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                        <Search className="h-5 w-5" /> Find Location
                    </Link>
                    <Link to="/saved" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                        <Heart className="h-5 w-5" /> Saved
                    </Link>
                    {isLoggedIn ? (
                        <Link to="/registeruser" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                            <User className="h-5 w-5" /> Profile
                        </Link>
                    ) : (
                        // Login/Sign Up link now goes directly to the Register page
                        <Link to="/register" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                            <LogIn className="h-5 w-5" /> Login/Sign Up
                        </Link>
                    )}
                    {isLoggedIn && (
                        <button onClick={handleLogout} className="flex items-center gap-1 text-red-600 hover:text-red-800 transition">
                            <LogOut className="h-5 w-5" /> Logout
                        </button>
                    )}
                </div>
            </div>
        </nav>
    );
};

const App = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [modalContent, setModalContent] = useState(null);

    const isAdminRoute = location.pathname.startsWith('/admin');

    const displayModal = (message) => {
        setModalContent(message);
        setTimeout(() => setModalContent(null), 3000);
    };

    // **apiFetch and authentication handlers (handleLogin, handleLogout, handleRegister, etc.) remain UNCHANGED**
    // ... (Your apiFetch, handleLogin, handleLogout, handleRegister, handleUpdateListing, uploadFile functions) ...
    const BASE_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000'; // Added for completeness

    const apiFetch = async (url, options = {}) => {
        const token = localStorage.getItem('authToken'); 
        
        const response = await fetch(`${BASE_API_URL}${url}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
            }
        });
        
        if (response.status === 401) {
            handleLogout(); 
        }

        return response;
    };

    const handleLogin = async ({ email, password }) => {
        try {
            const response = await apiFetch('/auth/login', { 
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('authToken', data.token); 
            setCurrentUser(data.user); 
            setIsLoggedIn(true);

            displayModal('Login successful!');
            
            // **HIGHLIGHTED LOGIN CHANGE: Redirect back to the page they tried to access**
            const redirectTo = location.state?.from?.pathname || '/profile';
            navigate(redirectTo, { replace: true });

        } catch (error) {
            console.error('Login failed:', error.message);
            displayModal(`Login failed: ${error.message}`);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem('authToken'); 
        setIsLoggedIn(false);
        setCurrentUser(null);
        navigate('/');
    };

    const handleRegister = async ({ email, password }) => { 
        try {
            const response = await apiFetch('/auth/register', { 
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // After successful registration, log the user in automatically
            await handleLogin({ email, password }); 
            
            displayModal('Registration successful!');
            // Navigation handled by handleLogin, which redirects back to the protected page
        } catch (error) {
            console.error('Registration failed:', error.message);
            displayModal(`Registration failed: ${error.message}`);
        }
    };
    
    // ... (handleUpdateListing and uploadFile functions remain here) ...
    const handleUpdateListing = async (listingData) => { /* ... */ };
    const uploadFile = async (file, path) => { /* ... */ };

    // **HIGHLIGHTED CHANGE 8: Auth state check is replaced by token validation**
    useEffect(() => {
        const token = localStorage.getItem('authToken');
        if (token) {
            apiFetch('/auth/me', { method: 'GET' })
                .then(response => response.json())
                .then(data => {
                    if (data.user) {
                        setCurrentUser(data.user);
                        setIsLoggedIn(true);
                    } else {
                        handleLogout();
                    }
                })
                .catch(error => {
                    console.error('Token validation failed:', error);
                    handleLogout();
                });
        }
    }, []); 

    const Modal = ({ message }) => (
        <div className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform animate-fade-in-down">
            {message}
        </div>
    );

    return (
        <AppContext.Provider value={{ currentUser, apiFetch, uploadFile }}>
            <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            <main className={isAdminRoute ? "w-full h-full" : "container mx-auto mt-8 p-4"}>
                <Routes>
                    {/* Public Routes - Anyone can view these */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    
                    {/* Authentication Route - Must be accessible to log in */}
                    <Route path="/register" element={<Register displayModal={displayModal} isLoggedIn={isLoggedIn} currentUser={currentUser} handleRegister={handleRegister} handleUpdateListing={handleUpdateListing} />} />
                    
                    {/* **HIGHLIGHTED CHANGE 2: Protected Routes** */}
                    {/* Wrap components that require a logged-in user inside ProtectedRoute */}
                    <Route path="/profile" element={
                        <ProtectedRoute isLoggedIn={isLoggedIn}>
                            <Profile isLoggedIn={isLoggedIn} currentUser={currentUser} handleLogin={handleLogin} handleLogout={handleLogout} displayModal={displayModal} />
                        </ProtectedRoute>
                    } />
                    <Route path="/saved" element={
                        <ProtectedRoute isLoggedIn={isLoggedIn}>
                            <Saved />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes with nested structure */}
                    <Route path="/admin/login" element={<AdminLogin displayModal={displayModal} />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                </Routes>
            </main>
            {!isAdminRoute && <Footer />}
            {modalContent && <Modal message={modalContent} />}
        </AppContext.Provider>
    );
};

export default App;