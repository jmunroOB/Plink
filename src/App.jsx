import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Navigate } from 'react-router-dom'; 
import { Home, Search, PlusSquare, User, LogIn, LogOut, Heart } from 'lucide-react';

// Import Page Components
import Profile from './pages/Profile';
import RegisterUser from './pages/RegisterUser'; // <--- AUTH PAGE (Login/Sign Up)
import Register from './pages/Register';         // <--- BUILDING REGISTRATION (List Location)
import SearchPage from './pages/Search';
import HomePage from './pages/Home';
import Login from './pages/Login';
import Saved from './pages/Saved';
import Footer from './components/Footer';

// Admin Page Imports
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';

export const AppContext = React.createContext({ 
    currentUser: null, 
    apiFetch: () => Promise.resolve(), 
    uploadFile: () => Promise.resolve(),
});

// ** UPDATED: Redirects to /registeruser (The Auth Page) if not logged in **
const ProtectedRoute = ({ isLoggedIn, children, redirectPath = '/registeruser' }) => {
    const location = useLocation();

    // If not logged in AND not already on the login page, redirect
    if (!isLoggedIn && location.pathname !== redirectPath) {
        return <Navigate to={redirectPath} replace state={{ from: location }} />;
    }

    return children;
};

const Header = ({ isLoggedIn, handleLogout }) => {
    const location = useLocation();
    const isAdminRoute = location.pathname.startsWith('/admin');

    if (isAdminRoute) return null;

    return (
        <nav className="bg-white shadow-md p-4 sticky top-0 z-40">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-2xl font-bold text-gray-800">Plink</Link>
                <div className="flex items-center space-x-4">
                    <Link to="/home" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                        <Home className="h-5 w-5" /> Home
                    </Link>
                    
                    {/* "List Location" goes to /register (Building Registration) */}
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
                        <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                            <User className="h-5 w-5" /> Profile
                        </Link>
                    ) : (
                        // "Login/Sign Up" goes to /registeruser (Auth Page)
                        <Link to="/registeruser" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
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

    const BASE_API_URL = process.env.REACT_APP_API_URL || 'https://plink-backend-api.onrender.com';

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
        if (response.status === 401) handleLogout(); 
        return response;
    };

    const handleLogin = async ({ email, password }) => {
        try {
            const response = await apiFetch('/auth/login', { 
                method: 'POST',
                body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Login failed');

            localStorage.setItem('authToken', data.token); 
            setCurrentUser(data.user); 
            setIsLoggedIn(true);
            displayModal('Login successful!');
            
            // Redirect back to where they tried to go (e.g. List Location), or Profile
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
            if (!response.ok) throw new Error(data.message || 'Registration failed');

            await handleLogin({ email, password }); 
            displayModal('Registration successful!');
        } catch (error) {
            console.error('Registration failed:', error.message);
            displayModal(`Registration failed: ${error.message}`);
        }
    };
    
    // Function for Building Registration (Listing)
    const handleUpdateListing = async (listingData) => {
        try {
            const response = await apiFetch('/users/listing', {
                method: 'PUT', 
                body: JSON.stringify({ listing: listingData })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to update listing');

            setCurrentUser(prev => ({ ...prev, listing: listingData }));
            displayModal('Listing updated successfully!');
        } catch (error) {
            console.error('Update failed:', error.message);
            displayModal(`Update failed: ${error.message}`);
        }
    };

    const uploadFile = async (file) => {
        const formData = new FormData();
        formData.append('file', file); 
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch(`${BASE_API_URL}/upload`, {
                method: 'POST',
                headers: { "Authorization": token ? `Bearer ${token}` : "" },
                body: formData
            });
            if (!response.ok) throw new Error('File upload failed');
            const data = await response.json();
            return data.url; 
        } catch (error) {
            console.error("Upload error:", error);
            displayModal("Failed to upload image");
            throw error;
        }
    };

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
                    {/* --- PUBLIC ROUTES --- */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    
                    {/* ROUTE 1: USER AUTHENTICATION (Login / User Sign Up)
                      Accessible at /registeruser. 
                      If they are already logged in, we can redirect them to profile.
                    */}
                    <Route path="/registeruser" element={
                        isLoggedIn ? <Navigate to="/profile" /> : (
                            <RegisterUser 
                                displayModal={displayModal} 
                                handleLogin={handleLogin}
                                handleRegister={handleRegister} 
                            />
                        )
                    } />

                    <Route path="/login" element={
                        isLoggedIn ? <Navigate to="/profile" /> : (
                            <Login 
                                displayModal={displayModal} 
                                handleLogin={handleLogin}
                                handleRegister={handleRegister} 
                            />
                        )
                    } />
                    
                    {/* --- PROTECTED ROUTES --- */}
                    
                    {/* ROUTE 2: BUILDING REGISTRATION (List Location)
                      Accessible at /register. 
                      User MUST be logged in to list a building.
                    */}
                    <Route path="/register" element={
                        <ProtectedRoute isLoggedIn={isLoggedIn} redirectPath="/registeruser">
                            <Register 
                                displayModal={displayModal} 
                                currentUser={currentUser} 
                                handleUpdateListing={handleUpdateListing} 
                                uploadFile={uploadFile}
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="/profile" element={
                        <ProtectedRoute isLoggedIn={isLoggedIn} redirectPath="/registeruser">
                            <Profile 
                                isLoggedIn={isLoggedIn} 
                                currentUser={currentUser} 
                                handleLogin={handleLogin} 
                                handleLogout={handleLogout} 
                                displayModal={displayModal} 
                            />
                        </ProtectedRoute>
                    } />

                    <Route path="/saved" element={
                        <ProtectedRoute isLoggedIn={isLoggedIn} redirectPath="/registeruser">
                            <Saved />
                        </ProtectedRoute>
                    } />

                    {/* Admin Routes */}
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