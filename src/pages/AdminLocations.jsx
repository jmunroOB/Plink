import React, { useState, useEffect, useContext, useCallback } from 'react';
// Removed all Firebase imports
import { CheckCircle, XCircle, MessageSquare, Bell, Search } from 'lucide-react';

// **HIGHLIGHTED CHANGE 1: Import AppContext**
// We rely on the AppContext from App.js to get the API fetch utility and current admin user data.
import { AppContext } from '../App'; // Adjust path if necessary

const AdminLocations = () => {
    // **HIGHLIGHTED CHANGE 2: Get API and User from Context**
    const { apiFetch, currentUser } = useContext(AppContext);

    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDraftModal, setShowDraftModal] = useState(false);
    const [draftMessage, setDraftMessage] = useState('');
    const [currentLocationId, setCurrentLocationId] = useState(null);
    // Removed [db, setDb], [user, setUser]
    const [pendingCount, setPendingCount] = useState(0);

    // **HIGHLIGHTED CHANGE 3: Fetch Locations from PostgreSQL API**
    // This replaces the Firebase initialization and the live onSnapshot listener.
    const fetchLocations = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // API endpoint to fetch all pending locations, ordered by date
            const response = await apiFetch('/admin/locations/pending', { method: 'GET' }); 
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Failed to fetch locations from API.');
            }

            setLocations(data.locations);
            setPendingCount(data.locations.filter(loc => loc.status === 'pending').length);
        } catch (err) {
            console.error("Failed to fetch locations:", err);
            setError("Failed to load locations. Please check API status.");
        } finally {
            setLoading(false);
        }
    }, [apiFetch]);

    useEffect(() => {
        // We assume admin authentication is handled in the parent App component
        // and the currentUser context value reflects the authenticated admin.
        if (currentUser && currentUser.is_admin) { 
            fetchLocations();
        } else if (!currentUser) {
            // If currentUser is null, it means not logged in or loading.
            // If it's loaded and not admin, we show an error.
            // Note: Router protection should handle full redirects.
            setLoading(false);
            setError("Access Denied: You must be logged in as an administrator.");
        }
    }, [currentUser, fetchLocations]);

    // **HIGHLIGHTED CHANGE 4: Status Change Logic (API Calls)**
    const handleStatusChange = async (locationId, newStatus) => {
        if (!currentUser || !currentUser.is_admin) {
            setError("Authentication failed or not authorized.");
            return;
        }

        try {
            if (newStatus === 'live') {
                // API to approve location: moves it from pending table to live table
                const response = await apiFetch(`/admin/locations/${locationId}/approve`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail: currentUser.email })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Approval failed.');
                }
                alert("Location has been successfully approved and moved to the live collection.");
                
            } else if (newStatus === 'draft') {
                // Open modal to collect message before calling API
                setShowDraftModal(true);
                setCurrentLocationId(locationId);
                return; // Exit early, confirmation handled in handleDraftConfirm
                
            } else if (newStatus === 'pending') {
                // API to move location back to pending status
                const response = await apiFetch(`/admin/locations/${locationId}/reopen`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ adminEmail: currentUser.email })
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Re-opening failed.');
                }
                alert('Location moved back to pending status.');
            }
            // Refetch data to update the UI immediately
            fetchLocations(); 
            
        } catch (err) {
            console.error("Error updating location status:", err);
            setError(`Failed to update status: ${err.message}`);
        }
    };

    // **HIGHLIGHTED CHANGE 5: Draft Confirmation Logic (API Call)**
    const handleDraftConfirm = async () => {
        if (!currentUser || !currentLocationId || !currentUser.is_admin) return;

        try {
            const response = await apiFetch(`/admin/locations/${currentLocationId}/draft`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    adminEmail: currentUser.email, 
                    adminMessage: draftMessage 
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Draft confirmation failed.');
            }
            
            alert('Location moved to draft status. Owner has been notified.');
            setShowDraftModal(false);
            setDraftMessage('');
            setCurrentLocationId(null);
            fetchLocations(); // Refetch
            
        } catch (err) {
            console.error("Error moving to draft:", err);
            setError(`Failed to move to draft: ${err.message}`);
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

    // ... (rest of the render structure remains the same) ...

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
                                    {loc.status === 'draft' && loc.adminUser === currentUser?.email && (
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