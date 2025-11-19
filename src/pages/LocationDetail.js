// LocationDetail.js
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { initializeApp } from 'firebase/app';
import { Paperclip, Camera, MessageSquare } from 'lucide-react';

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
const db = getFirestore(app);
const storage = getStorage(app);

const LocationDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [location, setLocation] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [message, setMessage] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchLocation = async () => {
            try {
                const docRef = doc(db, 'pending_locations', id);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setLocation(data);
                    setFormData(data);
                } else {
                    console.log("No such document!");
                }
            } catch (error) {
                console.error("Error fetching document:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchLocation();
    }, [id]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({ ...prevState, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const locationRef = doc(db, 'pending_locations', id);
            await updateDoc(locationRef, formData);
            setLocation(formData);
            setIsEditing(false);
            alert("Location data saved successfully!");
        } catch (error) {
            console.error("Error updating document:", error);
            alert("Failed to save location data.");
        }
    };

    const handleFileUpload = async (e, type) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const storageRef = ref(storage, `${id}/${type}/${file.name}`);
            await uploadBytes(storageRef, file);
            const downloadURL = await getDownloadURL(storageRef);

            const updatedLocation = { ...location };
            if (type === 'images') {
                updatedLocation.images = [...(updatedLocation.images || []), downloadURL];
            } else if (type === 'attachments') {
                updatedLocation.attachments = [...(updatedLocation.attachments || []), downloadURL];
            } else if (type === 'videos') {
                updatedLocation.videos = [...(updatedLocation.videos || []), downloadURL];
            }

            const locationRef = doc(db, 'pending_locations', id);
            await updateDoc(locationRef, updatedLocation);
            setLocation(updatedLocation);
            alert(`${type} uploaded successfully!`);
        } catch (error) {
            console.error("Error uploading file:", error);
            alert("Failed to upload file. Check console for details.");
        }
    };

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        // In a real app, you would send this message to the location owner via email or a push notification service.
        alert(`Message sent to owner: "${message}"`);
        setMessage('');
        setShowModal(false);
    };

    if (loading) return <div className="text-center mt-10">Loading location details...</div>;
    if (!location) return <div className="text-center mt-10 text-red-500">Location not found.</div>;

    return (
        <div className="p-8 bg-gray-50 min-h-screen">
            <button onClick={() => navigate(-1)} className="mb-6 px-4 py-2 text-white bg-gray-600 rounded-md">
                ← Back to Locations
            </button>
            <h1 className="text-4xl font-bold text-gray-800 mb-6">{location.propertyType || 'Location Details'}</h1>
            <div className="bg-white shadow-md rounded-lg p-6">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-semibold">Location Data</h2>
                    <div>
                        <button onClick={() => setIsEditing(!isEditing)} className="px-4 py-2 bg-blue-500 text-white rounded-md mr-2">
                            {isEditing ? 'Cancel Edit' : 'Edit'}
                        </button>
                        {isEditing && (
                            <button onClick={handleSave} className="px-4 py-2 bg-green-500 text-white rounded-md">
                                Save
                            </button>
                        )}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(formData).map(([key, value]) => (
                        <div key={key}>
                            <label className="block text-sm font-medium text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}:</label>
                            {isEditing ? (
                                <input
                                    type="text"
                                    name={key}
                                    value={value || ''}
                                    onChange={handleChange}
                                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm"
                                />
                            ) : (
                                <p className="mt-1 text-gray-900">{value || 'N/A'}</p>
                            )}
                        </div>
                    ))}
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Media & Attachments</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                            <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                                <Camera className="mr-2" /> Add Image
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, 'images')} />
                            </label>
                            <div className="mt-2 space-y-2">
                                {(location.images || []).map((url, index) => (
                                    <div key={index} className="flex items-center">
                                        <img src={url} alt={`Image ${index + 1}`} className="w-16 h-16 object-cover rounded-md mr-2" />
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">View Image {index + 1}</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                                <Paperclip className="mr-2" /> Add Attachment
                                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'attachments')} />
                            </label>
                            <div className="mt-2 space-y-2">
                                {(location.attachments || []).map((url, index) => (
                                    <div key={index} className="flex items-center">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Attachment {index + 1}</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <label className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100">
                                <Paperclip className="mr-2" /> Add Video
                                <input type="file" accept="video/*" className="hidden" onChange={(e) => handleFileUpload(e, 'videos')} />
                            </label>
                            <div className="mt-2 space-y-2">
                                {(location.videos || []).map((url, index) => (
                                    <div key={index} className="flex items-center">
                                        <a href={url} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Video {index + 1}</a>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8">
                    <h2 className="text-2xl font-semibold mb-4">Message Owner</h2>
                    <div className="flex items-end">
                        <textarea
                            className="flex-grow p-2 border rounded-md"
                            placeholder="Type a message for the location owner..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button onClick={handleSendMessage} className="ml-2 px-4 py-2 bg-purple-500 text-white rounded-md">
                            <MessageSquare size={20} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LocationDetail;