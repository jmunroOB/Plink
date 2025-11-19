import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, updateDoc, doc, deleteDoc, query, orderBy, getDoc, addDoc } from 'firebase/firestore';
import { CheckCircle, XCircle, MessageSquare, Bell, Search } from 'lucide-react';

const AdminLocations = () => {
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftMessage, setDraftMessage] = useState('');
    const [currentLocationId, setCurrentLocationId] = useState(null);
    const [db, setDb] = useState(null);
    const [user, setUser] = useState(null);
    const [pendingCount, setPendingCount] = useState(0);

    useEffect(() => {
        const initializeFirebase = async () => {
            try {
                const firebaseConfig = {
                    apiKey: "AIzaSyCPzFUxkuYFr3C0epV4pz9zZum5o956HGo",
                    authDomain: "disrupt-53691.firebaseapp.com",
                    projectId: "disrupt-53691",
                    storageBucket: "disrupt-53691.firebasestorage.app",
                    messagingSenderId: "353975939726",
                    appId: "1:353975939726:web:071e333a4261a89b9f4fdf",
                    measurementId: "G-YMS8PD71PW"
                };

                const app = initializeApp(firebaseConfig);
                const firestoreDb = getFirestore(app);
                const firebaseAuth = getAuth(app);
                setDb(firestoreDb);
                await signInAnonymously(firebaseAuth);
                setUser(firebaseAuth.currentUser);
            } catch (e) {
                console.error("Error initializing Firebase:", e);
                setError("Failed to initialize Firebase. Check console for details.");
            }
        };
        initializeFirebase();
    }, []);

    useEffect(() => {
        if (!db) return;

        const pendingCollectionRef = collection(db, `pending_locations`);
        const q = query(pendingCollectionRef, orderBy('timestamp', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedLocations = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setLocations(fetchedLocations);
            setPendingCount(fetchedLocations.filter(loc => loc.status === 'pending').length);
            setLoading(false);
        }, (err) => {
            console.error("Failed to fetch locations:", err);
            setError("Failed to load locations. Please check your network and security rules.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [db]);

    const handleStatusChange = async (locationId, newStatus) => {
        if (!db || !user) {
            setError("Authentication failed. Please log in again.");
            return;
        }

        const locationRef = doc(db, 'pending_locations', locationId);
        
        try {
            if (newStatus === 'live') {
                const docSnap = await getDoc(locationRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    const liveLocationsCollection = collection(db, `locations`);
                    await addDoc(liveLocationsCollection, {
                        ...data,
                        status: 'live',
                        adminUser: user.email,
                        lastUpdated: new Date().toISOString()
                    });
                    await deleteDoc(locationRef);
                    alert("Location has been successfully approved and moved to the live collection.");
                }
            } else if (newStatus === 'draft') {
                setShowDraftModal(true);
                setCurrentLocationId(locationId);
            } else if (newStatus === 'pending') {
                await updateDoc(locationRef, {
                    status: 'pending',
                    adminUser: null,
                    lastUpdated: new Date().toISOString()
                });
                alert('Location moved back to pending status.');
            }
        } catch (err) {
            console.error("Error updating location status:", err);
            setError("Failed to update status. Please try again.");
        }
    };

    const handleDraftConfirm = async () => {
        if (!db || !user || !currentLocationId) return;

        const locationRef = doc(db, 'pending_locations', currentLocationId);
        
        try {
            await updateDoc(locationRef, {
                status: 'draft',
                adminUser: user.email,
                adminMessage: draftMessage,
                lastUpdated: new Date().toISOString()
            });
            alert('Location moved to draft status. Owner has been notified.');
            setShowDraftModal(false);
            setDraftMessage('');
            setCurrentLocationId(null);
        } catch (err) {
            console.error("Error moving to draft:", err);
            setError("Failed to move to draft. Please try again.");
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-red-500';
            case 'draft': return 'bg-yellow-500';
            case 'live': return 'bg-green-500';
            default: return 'bg-gray-400';
        }
    };
    
    const displayModal = (message, title) => {
        alert(`${title}: ${message}`);
    };

    const filteredLocations = locations.filter(loc =>
        (loc.propertyType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.locationType || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (loc.locationDescription || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return <div className="text-center mt-10">Loading locations...</div>;
    if (error) return <div className="text-center mt-10 text-red-500">Error: {error}</div>;

    return (
        <div className="p-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-6">Manage Locations</h1>
            
            <div className="flex justify-between items-center mb-6">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search locations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                </div>
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button className="px-4 py-2 text-white bg-blue-500 rounded-md flex items-center">
                            <span className="mr-2">Locations</span>
                            {pendingCount > 0 && (
                                <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                                    {pendingCount}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white shadow-md rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin User</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredLocations.length > 0 ? filteredLocations.map(loc => (
                            <tr key={loc.id}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{loc.propertyType || 'N/A'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                    <span className={`inline-block w-3 h-3 rounded-full mr-2 ${getStatusColor(loc.status)}`}></span>
                                    {loc.status}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{loc.adminUser || 'Unassigned'}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    {loc.status === 'pending' && (
                                        <>
                                            <button onClick={() => handleStatusChange(loc.id, 'live')} className="text-green-600 hover:text-green-900 mr-2" title="Set Live">
                                                <CheckCircle />
                                            </button>
                                            <button onClick={() => handleStatusChange(loc.id, 'draft')} className="text-red-600 hover:text-red-900" title="Move to Draft">
                                                <XCircle />
                                            </button>
                                        </>
                                    )}
                                    {loc.status === 'draft' && loc.adminUser === user?.email && (
                                        <>
                                            <button onClick={() => handleStatusChange(loc.id, 'live')} className="text-green-600 hover:text-green-900 mr-2" title="Set Live">
                                                <CheckCircle />
                                            </button>
                                            <button onClick={() => handleStatusChange(loc.id, 'pending')} className="text-yellow-600 hover:text-yellow-900" title="Re-open">
                                                <MessageSquare />
                                            </button>
                                        </>
                                    )}
                                </td>
                            </tr>
                        )) : (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No locations found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {showDraftModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h3 className="text-lg font-bold mb-4">Move to Draft</h3>
                        <p className="text-sm text-gray-600 mb-4">Please provide a message for the location owner.</p>
                        <textarea
                            className="w-full h-24 p-2 border rounded-md"
                            value={draftMessage}
                            onChange={(e) => setDraftMessage(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2 mt-4">
                            <button onClick={() => setShowDraftModal(false)} className="px-4 py-2 text-gray-700 font-medium bg-gray-200 rounded-md">Cancel</button>
                            <button onClick={handleDraftConfirm} className="px-4 py-2 text-white bg-red-500 rounded-md">Confirm Draft</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminLocations;