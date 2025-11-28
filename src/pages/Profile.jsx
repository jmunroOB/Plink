import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
    Mail,
    Lock,
    Phone,
    User as UserIcon,
    Building,
    MapPin,
    Loader
} from 'lucide-react';

const UserProfile = ({
    displayModal,
    handleRegister,
    handleUpdateProfile, // You need to pass this new function from App.jsx
    currentUser,         // Pass the logged-in user object
    apiFetch             // Pass the apiFetch helper to load listings
}) => {
    const navigate = useNavigate();

    // Form State
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [bio, setBio] = useState('');

    // Listings State
    const [myListings, setMyListings] = useState([]);
    const [loadingListings, setLoadingListings] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 1. EFFECT: Pre-fill data if user is logged in
    useEffect(() => {
        if (currentUser) {
            setEmail(currentUser.email || '');
            setPhoneNumber(currentUser.phone_number || '');
            setBio(currentUser.bio || '');
            // We don't pre-fill password for security

            // Fetch this specific user's listings
            fetchMyListings();
        }
    }, [currentUser]);

    const fetchMyListings = async () => {
        if (!currentUser) return;
        setLoadingListings(true);
        try {
            // Assuming your backend has an endpoint to get listings for the current user
            // If not, you might need to fetch all and filter, but that's inefficient.
            const response = await apiFetch(`/users/${currentUser.id}/listings`);
            if (response.ok) {
                const data = await response.json();
                setMyListings(data.listings || data); // Adjust based on your API structure
            }
        } catch (error) {
            console.error("Failed to load listings", error);
        } finally {
            setLoadingListings(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validation: Passwords must match (if provided)
        if (password !== confirmPassword) {
            displayModal("Passwords do not match!");
            setIsSubmitting(false);
            return;
        }

        const payload = {
            email,
            phone_number: phoneNumber,
            bio
        };

        console.log("🚀 FRONTEND SENDING:", { ...payload, password });

        // Only add password to payload if the user actually typed one
        if (password) {
            payload.password = password;
        }

        try {
            if (currentUser) {
                // --- UPDATE MODE ---
                await handleUpdateProfile(payload);
                displayModal("Profile updated successfully!");
            } else {
                // --- REGISTER MODE ---
                if (!password) {
                    displayModal("Password is required for registration");
                    setIsSubmitting(false);
                    return;
                }
                await handleRegister({ ...payload, password });
                displayModal("Registration successful!");
                navigate('/profile');
            }
        } catch (error) {
            console.error("Operation failed:", error.message);
            // Handle Duplication specifically
            if (error.message.includes("409") || error.message.toLowerCase().includes("exist")) {
                displayModal("This email address is already in use. Please use a different one.");
            } else {
                displayModal(`Error: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-start p-8 min-h-[calc(100vh-100px)]">

            {/* --- PROFILE / REGISTER FORM --- */}
            <div className="w-full max-w-md p-8 bg-white shadow-lg rounded-lg mb-8">
                <h1 className="text-3xl font-bold mb-2 text-center text-gray-800">
                    {currentUser ? 'Edit Profile' : 'Register Now v2'}
                </h1>

                {currentUser && (
                    <p className="text-center text-gray-500 mb-6 text-sm">Update your details below</p>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Email */}
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

                    {/* Phone */}
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <input
                            type="tel"
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                            placeholder="Phone Number"
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>

                    {/* Bio */}
                    <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                        <textarea
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            rows="3"
                        />
                    </div>

                    {/* Password Fields */}
                    <div className="border-t border-gray-100 pt-4 mt-2">
                        <p className="text-xs text-gray-500 mb-2">
                            {currentUser ? "Leave blank to keep current password" : "Create a password"}
                        </p>
                        <div className="relative mb-4">
                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={currentUser ? "New Password (Optional)" : "Password"}
                                required={!currentUser} // Required only if registering
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
                                required={!!password} // Required only if password field is filled
                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full px-4 py-3 text-white bg-black rounded-md font-semibold hover:bg-gray-800 transition disabled:bg-gray-400"
                    >
                        {isSubmitting ? 'Saving...' : (currentUser ? 'Save Changes' : 'Register')}
                    </button>
                </form>

                {!currentUser && (
                    <div className="mt-6 text-center">
                        <p className="text-gray-600">Already have an account?</p>
                        <Link to="/login" className="text-blue-600 hover:underline font-medium">
                            Login Here
                        </Link>
                    </div>
                )}
            </div>

            {/* --- MY LISTINGS SECTION (Only visible if logged in) --- */}
            {currentUser && (
                <div className="w-full max-w-4xl">
                    <h2 className="text-2xl font-bold mb-6 text-gray-800 flex items-center">
                        <Building className="mr-2" /> My Listed Properties
                    </h2>

                    {loadingListings ? (
                        <div className="flex justify-center p-8">
                            <Loader className="animate-spin text-gray-500" />
                        </div>
                    ) : myListings.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {myListings.map((listing) => (
                                <div key={listing.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow">
                                    <div className="h-48 bg-gray-200 relative">
                                        {listing.image_url ? (
                                            <img src={listing.image_url} alt={listing.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="flex items-center justify-center h-full text-gray-400">
                                                <Building size={48} />
                                            </div>
                                        )}
                                        <div className="absolute top-2 right-2 bg-black text-white text-xs px-2 py-1 rounded">
                                            ${listing.price || '0'}/mo
                                        </div>
                                    </div>
                                    <div className="p-4">
                                        <h3 className="font-bold text-lg mb-1 truncate">{listing.title || 'Untitled Property'}</h3>
                                        <div className="flex items-center text-gray-500 text-sm mb-3">
                                            <MapPin size={14} className="mr-1" />
                                            <span className="truncate">{listing.address || 'No address provided'}</span>
                                        </div>
                                        <Link
                                            to={`/edit-listing/${listing.id}`}
                                            className="block text-center w-full py-2 border border-gray-300 rounded text-sm font-medium hover:bg-gray-50 transition"
                                        >
                                            Edit Property
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
                            <p className="text-gray-500 mb-4">You haven't listed any properties yet.</p>
                            <Link to="/add-listing" className="inline-block px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                                Add Your First Property
                            </Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default UserProfile;