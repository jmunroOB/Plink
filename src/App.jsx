import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
    getAuth, 
    signInWithEmailAndPassword, 
    signOut, 
    onAuthStateChanged, 
    createUserWithEmailAndPassword, 
    signInAnonymously 
} from "firebase/auth";
import { getFirestore, doc, onSnapshot, setDoc, Timestamp } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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


// Your real Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCPzFUxkuYFr3C0epV4pz9zZum5o956HGo",
    authDomain: "disrupt-53691.firebaseapp.com",
    projectId: "disrupt-53691",
    storageBucket: "disrupt-53691.firebasestorage.app",
    messagingSenderId: "353975939726",
    appId: "1:353975939726:web:071e333a4261a89b9f4fdf",
    measurementId: "G-YMS8PD71PW",
};

// Initialize Firebase once
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services globally
const auth = getAuth(app);
const db = getFirestore(app);
const appStorage = getStorage(app);

// Context for Firebase services
export const FirebaseContext = React.createContext({ app, auth, db, storage: appStorage });

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
                        <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                            <User className="h-5 w-5" /> Profile
                        </Link>
                    ) : (
                        <Link to="/profile" className="flex items-center gap-1 text-gray-600 hover:text-black transition">
                            <LogIn className="h-5 w-5" /> Login
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

    const apiFetch = async (url, options = {}) => {
        const token = auth.currentUser ? await auth.currentUser.getIdToken() : null;

        return fetch(`http://localhost:5000${url}`, {
            ...options,
            headers: {
                ...(options.headers || {}),
                "Authorization": token ? `Bearer ${token}` : "",
                "Content-Type": "application/json",
            }
        });
    };

    const handleLogin = async ({ email, password }) => {
        try {
            await signInWithEmailAndPassword(auth, email, password);
            displayModal('Login successful!');
            navigate('/profile');
        } catch (error) {
            console.error('Login failed:', error.message);
            displayModal(`Login failed: ${error.message}`);
        }
    };

    const handleLogout = async () => {
        await signOut(auth);
        navigate('/');
    };

    const handleRegister = async ({ email, password, listing }) => {
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDocRef = doc(db, 'user_collection', user.uid);
            await setDoc(userDocRef, {
                email: user.email,
                Name: '', 
                Bio: '',
                Photo: '',
                createdAt: Timestamp.now()
            });
            displayModal('Registration successful!');
            navigate('/profile');
        } catch (error) {
            console.error('Registration failed:', error.message);
            displayModal(`Registration failed: ${error.message}`);
        }
    };

    const handleUpdateListing = async (listingData) => {
        try {
            if (currentUser && currentUser.uid) {
                const userDocRef = doc(db, 'user_collection', currentUser.uid);
                await setDoc(userDocRef, { ...currentUser, listing: listingData }, { merge: true });
                displayModal('Listing updated successfully!');
            }
        } catch (error) {
            console.error('Update failed:', error.message);
            displayModal(`Update failed: ${error.message}`);
        }
    };

    const uploadFile = async (file, path) => {
        const fileRef = ref(appStorage, path);
        const snapshot = await uploadBytes(fileRef, file);
        return getDownloadURL(snapshot.ref);
    };

    useEffect(() => {
        signInAnonymously(auth).catch(console.error);
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (user) {
                setIsLoggedIn(true);
                const userDocRef = doc(db, 'user_collection', user.uid);
                onSnapshot(userDocRef, (docSnap) => {
                    if (docSnap.exists()) {
                        setCurrentUser({ ...user, ...docSnap.data() });
                    } else {
                        setDoc(userDocRef, { email: user.email, Name: '', Bio: '', Photo: '', createdAt: Timestamp.now() });
                        setCurrentUser(user);
                    }
                });
            } else {
                setIsLoggedIn(false);
                setCurrentUser(null);
            }
        });
        return () => unsubscribe();
    }, []);

    const Modal = ({ message }) => (
        <div className="fixed top-4 right-4 bg-black text-white px-6 py-3 rounded-lg shadow-lg z-50 transition-all duration-300 transform animate-fade-in-down">
            {message}
        </div>
    );

    return (
        <FirebaseContext.Provider value={{ app, auth, db, storage: appStorage, uploadFile, apiFetch }}>
            <Header isLoggedIn={isLoggedIn} handleLogout={handleLogout} />
            <main className={isAdminRoute ? "w-full h-full" : "container mx-auto mt-8 p-4"}>
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/home" element={<HomePage />} />
                    <Route path="/search" element={<SearchPage />} />
                    <Route path="/register" element={<Register displayModal={displayModal} isLoggedIn={isLoggedIn} currentUser={currentUser} handleRegister={handleRegister} handleUpdateListing={handleUpdateListing} />} />
                    <Route path="/profile" element={<Profile isLoggedIn={isLoggedIn} currentUser={currentUser} handleLogin={handleLogin} handleLogout={handleLogout} displayModal={displayModal} />} />
                    <Route path="/saved" element={<Saved />} />
                    
                    {/* Admin Routes with nested structure */}
                    <Route path="/admin/login" element={<AdminLogin displayModal={displayModal} />} />
                    <Route path="/admin/*" element={<AdminDashboard />} />
                </Routes>
            </main>
            {!isAdminRoute && <Footer />}
            {modalContent && <Modal message={modalContent} />}
        </FirebaseContext.Provider>
    );
};

export default App;