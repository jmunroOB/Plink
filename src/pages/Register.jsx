/* global __firebase_config, __initial_auth_token, __app_id */
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    MapPin, Home, Bed, Car, ImageIcon, PlayCircle, FileText, User as UserIcon, Mail, Phone, CheckCircle, XCircle, 
    ChevronDown, ChevronUp, CookingPot, ShowerHead, BookOpen, Warehouse, Trees, Zap 
} from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { FirebaseContext } from '../App';

// --- CORE STATIC DATA ---

const PROPERTY_STRUCTURAL_TYPES = [
    'Detached', 'Semi-Detached', 'Terraced-Row', 'Attached', 'Flat / Apartment',
    'Loft Apartment', 'Bungalow', 'Cottage', 'Barn Conversion', 'Farms',
    'Villa', 'Country House', 'Converted Church', 'House - family',
    'Townhouse', 'Statley Home', 'Castle', 'Chocolate Box',
];

const PROPERTY_STYLE_ERAS = [
    'Victorian', 'Georgian', 'Edwardian', 'Regency', 'Tudor', 'Mock Tudor', 'Art Deco', 'Brutalist',
    'Mid-Century Modern', 'Contemporary furnished', 'Minimalist', 'Industrial', 'Modern Interiors - residential',
    '1930\'s', '1950\'s', '1960\'s', '1970\'s', '1980\'s', '1920 and 1930', '1940 and 1950',
    'American', 'Asian', 'Derelict', 'Eco', 'European', 'Faded grandeur',
    'Feminine', 'Gothic', 'Grand / High End', 'Japanese', 'Medieval / Tudor',
    'Nouveau Riche', 'Ornate / Opulent', 'Retro / Vintage',
    'Rundown Grungy Squat', 'Shabby Chic / Bohemian', 'Studenty / Student House',
    'Suburban', 'Traditional / Original interiors', 'Un-occupied',
    'Weird and wonderful', 'White space'
];

const ROOM_TYPES = [
    'Kitchen', 'Bedroom (Master)', 'Bedroom (Guest)', 'Living Room', 'Dining Room',
    'Bathroom', 'En-suite', 'Office/Study', 'Utility Room', 'Garage',
    'Conservatory', 'Basement/Cellar', 'Attic/Loft', 'Garden', 'Exterior of buildings'
];

const FEATURE_MAPPING = {
    'Kitchen': ['Aga', 'Kitchen - island', 'Kitchen - Island Hob', 'Kitchen - Two in same building', 'Modern Open-Plan'],
    'Utility Room': ['Utility room'],
    'Bedroom': ['Bedroom - adult', 'Walk-in Wardrobe', 'Period Features', 'Exposed Brick/Stone'],
    'Bathroom': ['Bathroom', 'Shower', 'Tiled', 'Marble', 'Concrete floor', 'Bathroom - ensuite'],
    'Living Room': ['Drawing Room', 'Fireplace as a feature', 'Piano', 'Home Cinema', 'High Ceilings (10ft+)'],
    'Dining Room': ['Fireplace/Log Burner', 'Chandeliers'],
    'Office/Study': ['Home office', 'Study', 'Library', 'Panelled room'],
    'Basement/Attic': ['Basement', 'Crypts / cellar', 'Wine cellar', 'Rundown Grungy Squat', 'Attic', 'Skylights', 'Exposed beams'],
    'Conservatory': ['Conservatory', 'Floor to ceiling windows'],
    'General Interior': ['Arches', 'Spiral staircase', 'Stairs', 'Stone', 'Telephone box', 'Textured wall', 'Wallpaper - patterned', 'Unfurnished', 'White spaces', 'Original Wood Flooring', 'Skylights/Atrium'],

    'Garden': ['Large Garden/Yard', 'Greenhouse', 'Patio / Decking', 'Garden - Formal', 'Garden - Vegetable', 'Garden - Walled', 'Summer House', 'Outdoor Kitchen', 'Trees'],
    'Garage/Parking': ['Garage', 'Repair workshop', 'Hardstanding', 'Drive-in', 'Gated Entrance', 'Driveway/Private Parking'],
    'Building Exterior': ['Balcony', 'Roof terrace/Deck', 'Historic Facade', 'Alley', 'Front Doors', 'Sheds / outhouse', 'Thatched roof', 'Exterior of buildings', 'Ruins', 'Stone', 'Cobbled'],
    'Rural/Land': ['Farms', 'Fields', 'Orchard', 'Woods', 'Paddock / horse field', 'Shepherd Hut / Yurt', 'Barns', 'Stables', 'Windmill / Watermill'],
    'Water/Coastal': ['Beach', 'Private Beach Access', 'Lake / reservoir', 'River', 'Views - sea', 'Views - lake', 'View - River', 'Boats', 'Cliffs', 'Piers / Jetty / Sea fort'],
    'Recreational': ['Swimming pool - exterior', 'Hot tub / Jacuzzi', 'Tennis court', 'Playground'],
};

const ROOM_ICONS = {
    'Kitchen': CookingPot, 
    'Bedroom (Master)': Bed,
    'Bedroom (Guest)': Bed,
    'Living Room': Home,
    'Dining Room': Home,
    'Bathroom': ShowerHead,
    'En-suite': ShowerHead,
    'Office/Study': BookOpen,
    'Utility Room': Zap,
    'Garage': Car,
    'Conservatory': Home,
    'Basement/Cellar': Home,
    'Attic/Loft': Home,
    'Garden': Trees,
    'Exterior of buildings': Warehouse
};

const INTERIOR_GROUP_TO_ROOMS = {
    'Kitchen': ['Kitchen'],
    'Utility Room': ['Utility Room'],
    'Bedroom': ['Bedroom (Master)', 'Bedroom (Guest)'],
    'Bathroom': ['Bathroom', 'En-suite'],
    'Living Room': ['Living Room'],
    'Dining Room': ['Dining Room'],
    'Office/Study': ['Office/Study'],
    'Basement/Attic': ['Basement/Cellar', 'Attic/Loft'],
    'Conservatory': ['Conservatory'],
    'General Interior': ['General Interior']
};

// --- IMAGE MAPPING FOR VISUAL STEPS (Using external high-quality placeholders) ---
const PROPERTY_TYPE_IMAGES = {
    'Detached': 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Semi-Detached': 'https://images.unsplash.com/photo-1582268611958-abde28074ef9?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Terraced-Row': 'https://images.unsplash.com/photo-1549488314-97216664d422?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Attached': 'https://images.unsplash.com/photo-1502672260268-fe17498c8698?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Flat / Apartment': 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Loft Apartment': 'https://images.unsplash.com/photo-1606821215162-4b2a8f8d689b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Bungalow': 'https://images.unsplash.com/photo-1550999518-86d1f7051939?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Cottage': 'https://images.unsplash.com/photo-1600676767224-b15c544331dc?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Barn Conversion': 'https://images.unsplash.com/photo-1607519630737-128c7041a63b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Farms': 'https://images.unsplash.com/photo-1497931327177-8772a64c4c9e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Villa': 'https://images.unsplash.com/photo-1613490493576-b605ab871033?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Country House': 'https://images.unsplash.com/photo-1588665798950-ed60655d40a2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Converted Church': 'https://images.unsplash.com/photo-1604518774780-e83d8e92f256?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'House - family': 'https://images.unsplash.com/photo-1583608279313-095a812e105e?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Townhouse': 'https://images.unsplash.com/photo-1616788698715-6b5d0384a867?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Statley Home': 'https://images.unsplash.com/photo-1587563128114-f58c4091f09c?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Castle': 'https://images.unsplash.com/photo-1508898516053-97996c151478?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Chocolate Box': 'https://images.unsplash.com/photo-1533038590840-cd4052de7ee0?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};

const PROPERTY_STYLE_IMAGES = {
    'Victorian': 'https://images.unsplash.com/photo-1600373030305-6a56e01a1d13?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Georgian': 'https://images.unsplash.com/photo-1542456635-f093a1e1b244?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Edwardian': 'https://images.unsplash.com/photo-1588665798950-ed60655d40a2?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Brutalist': 'https://images.unsplash.com/photo-1579222645607-6c8c4a4e8d38?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Minimalist': 'https://images.unsplash.com/photo-1571597856401-447a468d7120?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Asian': 'https://images.unsplash.com/photo-1537233215569-450f37c35e82?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
    'Gothic': 'https://images.unsplash.com/photo-1627932640237-72049c661d4b?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
};
// Add more placeholder URLs for the remaining styles as needed

// --- HELPER COMPONENTS ---

const Modal = ({ message, onClose, title }) => {
    if (!message) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
            <div className="relative w-full max-w-2xl p-8 bg-white shadow-lg rounded-lg text-left">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{title || "Notification"}</h3>
                <div className="space-y-3 text-gray-800 text-sm overflow-y-auto max-h-64">
                    {message.split('\n\n').map((paragraph, index) => (
                        <p key={index}>{paragraph.trim()}</p>
                    ))}
                </div>
                <div className="flex justify-end mt-4">
                    <button
                        onClick={onClose}
                        className="px-5 py-2 text-xs font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

// ImageCard component uses the specific image map for high-quality visuals
const ImageCard = React.memo(({ label, isSelected, onClick, isMultiSelect, isPropertyType }) => {
    
    const imageMap = isPropertyType ? PROPERTY_TYPE_IMAGES : PROPERTY_STYLE_IMAGES;
    const imageUrl = imageMap[label];
    const hasImage = !!imageUrl;

    return (
        <div
            onClick={onClick}
            className={`relative cursor-pointer border-2 rounded-lg transition-all transform hover:scale-[1.01] ${
                isSelected 
                    ? 'border-black ring-2 ring-black shadow-md' 
                    : 'border-gray-200 hover:border-gray-400'
            }`}
        >
            <div className="h-28 w-full overflow-hidden">
                {hasImage ? (
                    <img 
                        src={imageUrl} 
                        alt={label}
                        className="w-full h-full object-cover rounded-t-lg"
                        // Fallback: This fallback won't be triggered for the placeholder URLs, but is good practice.
                        onError={(e) => { e.target.style.opacity = '0'; e.target.parentElement.style.backgroundColor = '#f3f4f6'; e.target.parentElement.innerHTML = `<span class="text-xs text-gray-500">${label} Visual</span>`; }}
                    />
                ) : (
                     // Placeholder text if no custom URL is defined
                    <div className="h-full bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded-t-lg">
                        {label} Visual
                    </div>
                )}
            </div>
            
            <p className="text-center p-2 text-sm font-medium text-gray-700">{label}</p>
            
            {isSelected && (
                <CheckCircle 
                    size={20} 
                    className={`absolute ${isMultiSelect ? 'top-[-10px] right-[-10px]' : 'top-1 right-1'} text-white bg-black rounded-full p-0.5 shadow-lg`} 
                />
            )}
            
            <div className={`absolute inset-0 rounded-lg transition-opacity ${isSelected ? 'opacity-0' : 'opacity-0 hover:opacity-10 bg-black'}`}></div>
        </div>
    );
});

const FeatureGroup = ({ title, features, selectedFeatures, handleTagChange, tagKey }) => {
    const uniqueFeatures = [...new Set(features)].sort();
    
    if (uniqueFeatures.length === 0) return null;

    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uniqueFeatures.map(feature => (
                    <label key={feature} className="flex items-center text-sm text-gray-600 hover:text-black cursor-pointer">
                        <input
                            type="checkbox"
                            checked={selectedFeatures.includes(feature)}
                            onChange={() => handleTagChange(tagKey, feature)}
                            className="rounded text-black focus:ring-black h-4 w-4"
                        />
                        <span className="ml-2">{feature}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};


// --- MAIN REGISTER COMPONENT ---

const Register = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); 
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDuplicate, setIsDuplicate] = useState(false);
    const [existingDocId, setExistingDocId] = useState(null);

    const { app, auth, db, storage, apiFetch } = useContext(FirebaseContext);

    const [formData, setFormData] = useState({
        fullName: '', email: '', phoneNumber: '', password: '', confirmPassword: '',
        streetAddress: '', city: '', postcode: '',

        propertyType: '', 
        propertyStyleTags: [],
        rooms: [], 
        interiorFeatures: [], 
        exteriorFeatures: [], 

        locationDescriptionText: '',
        termsAccepted: false,
    });
    
    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(user => {
            if (!user) {
                 getAuth(app).signInAnonymously().catch(console.error);
            }
        });
        return () => unsubscribe();
    }, [auth, app]);

    const displayModal = (message, title = "Notification") => {
        setModalMessage(message);
        setModalTitle(title);
    };

    const handleNext = () => {
        const passwordsMatch = formData.password.length > 0 && formData.confirmPassword === formData.password;
        
        if (step === 1 && !passwordsMatch) {
             displayModal("Password and Confirm Password must match before proceeding.", "Validation Error");
             return;
        }

        // --- Step-specific Validation and Skip Logic ---
        if (step === 4 && !formData.propertyType) {
            displayModal("Which one looks like your property?", "Validation Required");
            return;
        }
        if (step === 5 && formData.propertyStyleTags.length === 0) {
            displayModal("What style & era is your property?", "Validation Required");
            return;
        }
        if (step === 6 && formData.rooms.length === 0) {
            displayModal("What rooms do you have?", "Validation Required");
            return;
        }
        
        let nextStep = step + 1;

        // Skip Interior Features (Step 7) if no interior rooms selected
        if (step === 6) {
             const hasInteriorRooms = formData.rooms.some(room => ROOM_TYPES.slice(0, 13).includes(room));
             if (!hasInteriorRooms) {
                 nextStep = 8; // Skip directly to Step 8
             }
        }
        
        // Skip Exterior Features (Step 8) if no exterior rooms selected
        if (nextStep === 8) {
            const hasExteriorRooms = formData.rooms.some(room => ROOM_TYPES.slice(13).includes(room));
            if (!hasExteriorRooms) {
                nextStep = 9; // Skip directly to Step 9 (Video)
            }
        }
        
        setStep(nextStep);
    };

    const handleBack = () => {
        if (step === 2) {
            setIsDuplicate(false);
            setExistingDocId(null);
        }
        
        let previousStep = step - 1;

        // Logic to jump back over skipped steps
        if (step === 9) {
            const hasExteriorRooms = formData.rooms.some(room => ROOM_TYPES.slice(13).includes(room));
            if (!hasExteriorRooms) {
                previousStep = 7; // Jump back to Interior Features
            }
        }

        if (previousStep === 7) {
            const hasInteriorRooms = formData.rooms.some(room => ROOM_TYPES.slice(0, 13).includes(room));
            if (!hasInteriorRooms) {
                previousStep = 6; // Jump back to Rooms & Areas
            }
        }

        setStep(previousStep);
    };

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prevData => ({
            ...prevData,
            [name]: type === 'checkbox' ? checked : value
        }));

        if (name === 'postcode' && value.length > 3 && db) {
            checkDuplicateAddress(value);
        } else if (name === 'postcode') {
            setIsDuplicate(false);
            setExistingDocId(null);
        }
    };
    
    const checkDuplicateAddress = async (postcode) => {
        if (!postcode || !db) return;

        const collectionsToCheck = ['pending_locations', 'locations'];

        for (const colName of collectionsToCheck) {
            const q = query(collection(db, colName),
                            where('postcode', '==', postcode),
                            where('status', '!=', 'archived')
                           );
            try {
                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const existingDoc = querySnapshot.docs[0];
                    setIsDuplicate(true);
                    setExistingDocId(existingDoc.id);
                    return;
                }
            } catch (error) {
                console.error(`Error checking duplicates in ${colName}:`, error);
            }
        }

        setIsDuplicate(false);
        setExistingDocId(null);
    };

    const handleTagChange = (tagKey, tagName) => {
        setFormData(prevData => {
            const currentTags = prevData[tagKey];
            let newTags;

            if (tagKey === 'propertyType') {
                return { ...prevData, [tagKey]: currentTags === tagName ? '' : tagName };
            }

            if (currentTags.includes(tagName)) {
                newTags = currentTags.filter(name => name !== tagName);
            } else {
                newTags = [...currentTags, tagName];
            }

            return {
                ...prevData,
                [tagKey]: newTags
            };
        });
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files);
        if (files) {
            setSelectedFiles(files);
        }
    };
    
    const handleVideoChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedVideo(file);
        }
    };

    const uploadFile = async (file, path) => {
        if (!storage) {
            throw new Error("Firebase Storage not initialized.");
        }
        const fileRef = ref(storage, path);
        const snapshot = await uploadBytes(fileRef, file);
        return getDownloadURL(snapshot.ref);
    };

    const analyzeWithAI = async () => {
        if (selectedFiles.length === 0) {
            displayModal("Please choose at least one file to analyze.");
            return;
        }

        setIsAnalyzing(true);
        
        try {
            // ... AI analysis logic remains the same ...
            
            // On success, advance to Step 4 (Property Type selection)
            setStep(4); 

        } catch (error) {
            console.error("AI analysis failed:", error);
            displayModal(`AI analysis failed: ${error.message}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        if (formData.password !== formData.confirmPassword) {
            displayModal("Password and Confirm Password do not match.", "Validation Error");
            setIsSubmitting(false);
            return;
        }

        if (!db) {
            displayModal("Database is not initialized. Please try again later.", "Error");
            setIsSubmitting(false);
            return;
        }

        try {
            // ... Submission logic remains the same ...

            displayModal("Location submitted successfully! An email will be sent to confirm receipt.", "Congrats!");
            
            navigate('/home'); 
            setStep(1); 

        } catch (e) {
            console.error("Error adding document: ", e);
            displayModal("Failed to submit location. Please try again.", "Error");
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const handleTermsClick = (e) => {
        e.preventDefault();
        const termsText = `
        1. Acceptance of Terms
        ...
        `;
        displayModal(termsText, "Terms and Conditions");
    };

    const calculateTotalProgress = () => {
        const totalSteps = 10; 
        let completionScore = step;
        
        if (step >= 4) {
             if (formData.propertyType) completionScore += 0.5;
             if (formData.propertyStyleTags.length > 0) completionScore += 0.5;
             if (formData.rooms.length > 0) completionScore += 0.5;
        }
        if (formData.termsAccepted) completionScore += 0.5;

        const percentage = Math.round((completionScore / (totalSteps + 2)) * 100); 
        return `${Math.min(percentage, 99)}%`;
    };

    const getGroupedFeatures = (isInterior) => {
        const selectedRooms = formData.rooms;
        const groupedFeatures = {};
        
        const interiorRoomTypes = ROOM_TYPES.slice(0, 13);
        
        const relevantRooms = selectedRooms.filter(room => 
            isInterior 
                ? interiorRoomTypes.includes(room) 
                : !interiorRoomTypes.includes(room) 
        );

        if (isInterior && relevantRooms.some(r => interiorRoomTypes.includes(r))) {
            relevantRooms.push('General Interior');
        }
        
        const interiorGroupKeys = Object.keys(INTERIOR_GROUP_TO_ROOMS);
        const exteriorGroupKeys = Object.keys(FEATURE_MAPPING).filter(k => !interiorGroupKeys.includes(k) && k !== 'General Interior');
        
        const groupKeys = isInterior ? interiorGroupKeys : exteriorGroupKeys;
        
        groupKeys.forEach(groupKey => {
            let roomsInGroup = isInterior ? INTERIOR_GROUP_TO_ROOMS[groupKey] : [groupKey];

            const isRelevant = roomsInGroup.some(room => selectedRooms.includes(room));

            if (isRelevant || (isInterior && groupKey === 'General Interior' && relevantRooms.some(r => interiorRoomTypes.includes(r)))) {
                const features = FEATURE_MAPPING[groupKey] || FEATURE_MAPPING[roomsInGroup[0]];
                if (features && features.length > 0) {
                    groupedFeatures[groupKey] = features;
                }
            }
        });
        
        return groupedFeatures;
    };


    const renderStep = () => {
        const passwordsMatch = formData.password.length > 0 && formData.confirmPassword === formData.password;
        
        const interiorGroupedFeatures = getGroupedFeatures(true);
        const exteriorGroupedFeatures = getGroupedFeatures(false);
        
        const stepTitle = `Step ${step} of 10: `;

        switch (step) {
            case 1:
                 return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <UserIcon size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Your Contact & Account Details</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative">
                                <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="relative">
                                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email Address" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="relative">
                                <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone Number" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="relative">
                                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            
                            {formData.password && (
                                <div className="relative col-span-1">
                                    <input 
                                        type="password" 
                                        name="confirmPassword" 
                                        value={formData.confirmPassword} 
                                        onChange={handleChange} 
                                        placeholder="Confirm Password" 
                                        required 
                                        className={`w-full pl-4 pr-4 py-3 border rounded-md focus:outline-none focus:ring-2 ${
                                            formData.confirmPassword.length > 0 && formData.password !== formData.confirmPassword 
                                                ? 'border-red-500 focus:ring-red-500' 
                                                : passwordsMatch 
                                                ? 'border-green-500 focus:ring-green-500' 
                                                : 'border-gray-300 focus:ring-black'
                                        }`} 
                                    />
                                    {formData.confirmPassword.length > 0 && (
                                        <p className={`mt-1 text-sm ${passwordsMatch ? 'text-green-600' : 'text-red-600'}`}>
                                            {passwordsMatch ? <CheckCircle size={16} className="inline mr-1"/> : <XCircle size={16} className="inline mr-1"/>}
                                            {passwordsMatch ? "It's a match" : "Passwords do not match"}
                                        </p>
                                    )}
                                </div>
                            )}
                        </div>
                    </>
                );
            case 2:
                 return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <MapPin size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Location Address</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="relative col-span-2">
                                <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="Street Address" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="relative">
                                <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                            <div className="relative">
                                <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} placeholder="Postcode" required className="w-full pl-4 pr-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-black" />
                            </div>
                        </div>

                        {isDuplicate && (
                            <div className="col-span-2 bg-yellow-100 border-l-4 border-yellow-500 text-yellow-800 p-4 mt-6 rounded-md shadow-md">
                                <p className="font-bold mb-2">Location Already Registered!</p>
                                <p className="text-sm mb-4">
                                    The postcode **{formData.postcode}** appears to be linked to an existing listing.
                                </p>
                                <div className="flex space-x-3">
                                    <button 
                                        type="button" 
                                        onClick={() => setIsDuplicate(false)}
                                        className="bg-yellow-500 text-white px-3 py-1 rounded-md hover:bg-yellow-600 transition text-xs"
                                    >
                                        Add as New Location (Continue)
                                    </button>
                                    <button 
                                        type="button" 
                                        onClick={() => navigate(`/profile?edit=${existingDocId}`)}
                                        className="bg-gray-700 text-white px-3 py-1 rounded-md hover:bg-gray-800 transition text-xs"
                                    >
                                        Edit Existing Location
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                );
            case 3:
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <ImageIcon size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Add Images</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-6">
                            Upload photos to showcase your property. Our AI can analyze these to pre-fill the next steps for you!
                        </p>
                        <div className="space-y-6">
                            <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-3 sm:space-y-0 sm:space-x-4">
                                <label className="px-5 py-2 border border-black text-black rounded-md font-medium hover:bg-gray-100 transition-colors cursor-pointer w-full sm:w-auto text-center">
                                    Choose Photos
                                    <input
                                        type="file"
                                        accept="image/*"
                                        multiple 
                                        onChange={handleFileChange}
                                        className="hidden"
                                    />
                                </label>
                                <span className="text-gray-700">{selectedFiles.length > 0 ? `${selectedFiles.length} file(s) chosen` : 'No file chosen (required)'}</span>
                            </div>
                            {selectedFiles.length > 0 && (
                                <div className="flex flex-wrap gap-4 mt-4 max-h-40 overflow-y-auto">
                                    {selectedFiles.map((file, index) => (
                                        <img key={index} src={URL.createObjectURL(file)} alt={`Preview ${index + 1}`} className="w-24 h-24 object-cover rounded-md shadow" />
                                    ))}
                                </div>
                            )}
                            <div className="flex justify-between items-center pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={analyzeWithAI}
                                    disabled={isAnalyzing || selectedFiles.length === 0}
                                    className={`flex-1 flex items-center justify-center space-x-2 px-5 py-3 text-white rounded-md font-medium transition-colors ${
                                        isAnalyzing || selectedFiles.length === 0 ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                                    }`}
                                >
                                    <ImageIcon size={20} />
                                    <span>{isAnalyzing ? 'Analyzing...' : 'Analyze & Auto-fill'}</span>
                                </button>
                                <span className="mx-4 text-gray-500">or</span>
                                <button
                                    type="button"
                                    onClick={() => setStep(4)} 
                                    className="flex-1 px-5 py-3 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-100 transition-colors"
                                    disabled={selectedFiles.length === 0} 
                                >
                                    Continue Manually
                                </button>
                            </div>
                        </div>
                    </>
                );
            
            // --- NEW SUB-STEPS FOR LOCATION DETAILS (Visual Selection) ---
            
            case 4: // Property Type
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Property Type (Select one)</h2>
                            {formData.propertyType && <CheckCircle size={20} className="text-green-600 ml-2" />}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                            {PROPERTY_STRUCTURAL_TYPES.map(type => (
                                <ImageCard
                                    key={type}
                                    label={type}
                                    isSelected={formData.propertyType === type}
                                    onClick={() => handleTagChange('propertyType', type)}
                                    isMultiSelect={false}
                                    isPropertyType={true}
                                />
                            ))}
                        </div>
                    </>
                );

            case 5: // Property Style/Era
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Property Style / Era (Select all that apply)</h2>
                            {formData.propertyStyleTags.length > 0 && <CheckCircle size={20} className="text-green-600 ml-2" />}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-h-[400px] overflow-y-auto pr-2">
                            {PROPERTY_STYLE_ERAS.map(tag => (
                                <ImageCard
                                    key={tag}
                                    label={tag}
                                    isSelected={formData.propertyStyleTags.includes(tag)}
                                    onClick={() => handleTagChange('propertyStyleTags', tag)}
                                    isMultiSelect={true}
                                    isPropertyType={false}
                                />
                            ))}
                        </div>
                    </>
                );

            case 6: // Rooms & Areas
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Rooms & Areas Available (Select all that apply)</h2>
                            {formData.rooms.length > 0 && <CheckCircle size={20} className="text-green-600 ml-2" />}
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto pt-3">
                            {ROOM_TYPES.map(room => {
                                const RoomIcon = ROOM_ICONS[room] || Home;
                                return (
                                    <label key={room} className="flex items-center text-base font-medium text-gray-700 hover:text-black cursor-pointer bg-gray-100 p-3 rounded-md transition-colors border">
                                        <input
                                            type="checkbox"
                                            checked={formData.rooms.includes(room)}
                                            onChange={() => handleTagChange('rooms', room)}
                                            className="rounded text-black focus:ring-black h-4 w-4"
                                        />
                                        <RoomIcon size={20} className="ml-2 text-gray-500" />
                                        <span className="ml-2">{room}</span>
                                    </label>
                                );
                            })}
                        </div>
                    </>
                );

            case 7: // Interior Features 
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Interior Features ({formData.interiorFeatures.length} selected)</h2>
                            {formData.interiorFeatures.length > 0 && <CheckCircle size={20} className="text-green-600 ml-2" />}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2">
                            {Object.keys(interiorGroupedFeatures).sort().map(groupTitle => (
                                <FeatureGroup
                                    key={groupTitle}
                                    title={groupTitle.replace(/([A-Z])/g, ' $1').trim()}
                                    features={interiorGroupedFeatures[groupTitle]}
                                    selectedFeatures={formData.interiorFeatures}
                                    handleTagChange={handleTagChange}
                                    tagKey="interiorFeatures"
                                />
                            ))}
                        </div>
                    </>
                );

            case 8: // Exterior Features 
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Exterior Features ({formData.exteriorFeatures.length} selected)</h2>
                            {formData.exteriorFeatures.length > 0 && <CheckCircle size={20} className="text-green-600 ml-2" />}
                        </div>
                        <div className="max-h-[400px] overflow-y-auto pr-2">
                            {Object.keys(exteriorGroupedFeatures).sort().map(groupTitle => (
                                <FeatureGroup
                                    key={groupTitle}
                                    title={groupTitle.replace(/([A-Z])/g, ' $1').trim().replace(' Of ', ' of ').replace('land', ' Land')}
                                    features={exteriorGroupedFeatures[groupTitle]}
                                    selectedFeatures={formData.exteriorFeatures}
                                    handleTagChange={handleTagChange}
                                    tagKey="exteriorFeatures"
                                />
                            ))}
                        </div>
                    </>
                );
            
            case 9:
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <PlayCircle size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Virtual Tour Video (Optional)</h2>
                        </div>
                        <p className="text-gray-500 text-sm mb-4">Upload a video showcasing your property for an enhanced listing.</p>
                        <div className="flex items-center space-x-2">
                            <label className="px-5 py-3 border border-black text-black rounded-md font-medium hover:bg-gray-100 transition-colors cursor-pointer text-center">
                                Choose Video File
                                <input
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoChange}
                                    className="hidden"
                                />
                            </label>
                            <span className="text-gray-700">{selectedVideo ? selectedVideo.name : 'No file chosen'}</span>
                        </div>
                    </>
                );
            case 10:
                 return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black"/>
                            <h2 className="text-xl font-bold">{stepTitle}Review & Submit</h2>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                name="termsAccepted"
                                checked={formData.termsAccepted}
                                onChange={handleChange}
                                id="terms-checkbox"
                                className="rounded text-black focus:ring-black h-4 w-4"
                            />
                            <label htmlFor="terms-checkbox" className="ml-2 text-gray-700 text-base">
                                I confirm all information is accurate and I agree to the <a href="#" onClick={handleTermsClick} className="text-blue-600 hover:underline">Terms and Conditions</a>.
                            </label>
                        </div>
                    </>
                );
            default:
                return (
                    <div className="text-center p-8">
                        <h2 className="text-2xl font-semibold">Registration Complete!</h2>
                        <p className="text-gray-600 mt-2">Thank you for listing your location. Redirecting to home...</p>
                    </div>
                );
        }
    };

    const totalSteps = 10; 

    return (
        <div className="flex flex-col p-4 md:p-8 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-4xl mx-auto">
                <div className="p-4 md:p-8 bg-white shadow-xl rounded-lg border border-gray-100 min-h-[500px] pb-2">
                    <>
                        <h1 className="text-2xl font-bold mb-6 text-center text-gray-800">List Your Location</h1>
                        
                        <div className="mb-6">
                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div className="h-full bg-black transition-all duration-500" style={{ width: calculateTotalProgress() }}></div>
                            </div>
                            <p className="text-sm text-gray-500 text-right mt-1">Progress: {calculateTotalProgress()}</p>
                        </div>
                        
                        <form onSubmit={handleLocationSubmit} className="min-h-[400px]">
                            {renderStep()}

                            {/* Fixed bottom panel styling */}
                            <div className="flex justify-between mt-8 pt-4 border-t sticky bottom-0 bg-white"> 
                                {step > 1 && (
                                    <button
                                        type="button"
                                        onClick={handleBack}
                                        className="px-5 py-2 text-gray-700 font-medium bg-gray-200 rounded-md hover:bg-gray-300 transition-colors"
                                    >
                                        Back
                                    </button>
                                )}
                                {step < totalSteps ? (
                                    <button
                                        type="button"
                                        onClick={handleNext}
                                        // Complex disable logic is encapsulated here
                                        disabled={
                                            (step === 1 && !(formData.password.length > 0 && formData.confirmPassword === formData.password)) ||
                                            (step === 2 && (!formData.streetAddress || !formData.city || !formData.postcode)) ||
                                            (step === 3 && selectedFiles.length === 0) ||
                                            (step === 4 && !formData.propertyType) ||
                                            (step === 5 && formData.propertyStyleTags.length === 0) ||
                                            (step === 6 && formData.rooms.length === 0)
                                        }
                                        className={`ml-auto px-5 py-2 text-white rounded-md font-medium transition-colors ${
                                            (step === 1 && !(formData.password.length > 0 && formData.confirmPassword === formData.confirmPassword)) ||
                                            (step === 2 && (!formData.streetAddress || !formData.city || !formData.postcode)) ||
                                            (step === 3 && selectedFiles.length === 0) ||
                                            (step === 4 && !formData.propertyType) ||
                                            (step === 5 && formData.propertyStyleTags.length === 0) ||
                                            (step === 6 && formData.rooms.length === 0) 
                                            ? 'bg-gray-400 cursor-not-allowed' : 'bg-black hover:bg-gray-800'
                                        }`}
                                    >
                                        Next
                                    </button>
                                ) : (
                                    <button
                                        type="submit"
                                        disabled={!formData.termsAccepted || isSubmitting}
                                        className={`ml-auto px-5 py-2 text-white rounded-md font-medium transition-colors ${formData.termsAccepted && !isSubmitting ? 'bg-black hover:bg-gray-800' : 'bg-gray-400 cursor-not-allowed'}`}
                                    >
                                        {isSubmitting ? 'Submitting...' : 'Submit Location'}
                                    </button>
                                )}
                            </div>
                        </form>
                    </>
                </div>
            </div>
            <Modal message={modalMessage} onClose={() => setModalMessage('')} title={modalTitle} />
        </div>
    );
};

export default Register;