import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin, Home, Bed, Car, ImageIcon, PlayCircle, FileText, User as UserIcon, CheckCircle, XCircle,
    CookingPot, ShowerHead, BookOpen, Warehouse, Trees, Zap
} from 'lucide-react';
import { AppContext } from '../App';

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
    'Kitchen': CookingPot, 'Bedroom (Master)': Bed, 'Bedroom (Guest)': Bed,
    'Living Room': Home, 'Dining Room': Home, 'Bathroom': ShowerHead, 'En-suite': ShowerHead,
    'Office/Study': BookOpen, 'Utility Room': Zap, 'Garage': Car, 'Conservatory': Home,
    'Basement/Cellar': Home, 'Attic/Loft': Home, 'Garden': Trees, 'Exterior of buildings': Warehouse
};

const INTERIOR_GROUP_TO_ROOMS = {
    'Kitchen': ['Kitchen'], 'Utility Room': ['Utility Room'], 'Bedroom': ['Bedroom (Master)', 'Bedroom (Guest)'],
    'Bathroom': ['Bathroom', 'En-suite'], 'Living Room': ['Living Room'], 'Dining Room': ['Dining Room'],
    'Office/Study': ['Office/Study'], 'Basement/Attic': ['Basement/Cellar', 'Attic/Loft'],
    'Conservatory': ['Conservatory'], 'General Interior': ['General Interior']
};

const Modal = ({ message, onClose, title }) => {
    if (!message) return null;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50">
            <div className="relative w-full max-w-2xl p-8 bg-white shadow-lg rounded-lg text-left">
                <h3 className="text-xl font-bold mb-4 text-gray-800">{title || "Notification"}</h3>
                <div className="space-y-3 text-gray-800 text-sm overflow-y-auto max-h-64">
                    {message.split('\n\n').map((paragraph, index) => <p key={index}>{paragraph.trim()}</p>)}
                </div>
                <div className="flex justify-end mt-4">
                    <button onClick={onClose} className="px-5 py-2 text-xs font-medium text-white bg-black rounded-md hover:bg-gray-800 transition-colors">Close</button>
                </div>
            </div>
        </div>
    );
};

const ImageCard = React.memo(({ label, isSelected, onClick, isMultiSelect }) => (
    <div onClick={onClick} className={`relative cursor-pointer border-2 rounded-lg transition-all transform hover:scale-[1.01] ${isSelected ? 'border-black ring-2 ring-black shadow-md' : 'border-gray-200 hover:border-gray-400'}`}>
        <div className="h-28 w-full overflow-hidden bg-gray-100 flex items-center justify-center text-xs text-gray-500 rounded-t-lg">
            {/* You can re-add your image URLs here later */}
            {label} Visual
        </div>
        <p className="text-center p-2 text-sm font-medium text-gray-700">{label}</p>
        {isSelected && <CheckCircle size={20} className={`absolute ${isMultiSelect ? 'top-[-10px] right-[-10px]' : 'top-1 right-1'} text-white bg-black rounded-full p-0.5 shadow-lg`} />}
    </div>
));

const FeatureGroup = ({ title, features, selectedFeatures, handleTagChange, tagKey }) => {
    const uniqueFeatures = [...new Set(features)].sort();
    if (uniqueFeatures.length === 0) return null;
    return (
        <div className="border border-gray-200 rounded-lg p-3 bg-white mb-4">
            <h4 className="text-md font-semibold text-gray-800 mb-3 border-b pb-2">{title}</h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uniqueFeatures.map(feature => (
                    <label key={feature} className="flex items-center text-sm text-gray-600 hover:text-black cursor-pointer">
                        <input type="checkbox" checked={selectedFeatures.includes(feature)} onChange={() => handleTagChange(tagKey, feature)} className="rounded text-black focus:ring-black h-4 w-4" />
                        <span className="ml-2">{feature}</span>
                    </label>
                ))}
            </div>
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const { currentUser, apiFetch, uploadFile } = useContext(AppContext); // USE CONTEXT ONLY

    const [step, setStep] = useState(1);
    const [modalMessage, setModalMessage] = useState('');
    const [modalTitle, setModalTitle] = useState('');
    const [selectedFiles, setSelectedFiles] = useState([]);
    const [selectedVideo, setSelectedVideo] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [dbPropertyTypes, setDbPropertyTypes] = useState([]);
    const [dbPropertyStyles, setDbPropertyStyles] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                // We use generic fetch here because these might be public endpoints
                const typesRes = await fetch('https://plink-backend-api.onrender.com/static/property-types');
                const stylesRes = await fetch('https://plink-backend-api.onrender.com/static/property_styles');

                if (typesRes.ok) setDbPropertyTypes(await typesRes.json());
                if (stylesRes.ok) setDbPropertyStyles(await stylesRes.json());
            } catch (err) {
                console.error("Failed to load static data", err);
            }
        };
        fetchData();
    }, []);

    // Initial State - Pre-fill with User Data if available
    const [formData, setFormData] = useState({
        fullName: currentUser?.name || '',
        email: currentUser?.email || '',
        phoneNumber: currentUser?.phone_number || '',
        password: '', confirmPassword: '', // NOTE: We don't really need these if logged in, but keeping for UI consistency
        streetAddress: '', city: '', postcode: '',
        propertyType: '', propertyStyleTags: [], rooms: [],
        interiorFeatures: [], exteriorFeatures: [],
        locationDescriptionText: '', termsAccepted: false,
    });

    const displayModal = (message, title = "Notification") => {
        setModalMessage(message);
        setModalTitle(title);
    };

    const handleNext = () => {
        // Validation Logic
        if (step === 2 && (!formData.streetAddress || !formData.city || !formData.postcode)) return displayModal("Please fill in address details.");
        if (step === 4 && !formData.propertyType) return displayModal("Select a property type.");
        if (step === 5 && formData.propertyStyleTags.length === 0) return displayModal("Select a style/era.");
        if (step === 6 && formData.rooms.length === 0) return displayModal("Select at least one room.");

        let nextStep = step + 1;
        // Skip Logic
        if (step === 6 && !formData.rooms.some(r => ROOM_TYPES.slice(0, 13).includes(r))) nextStep = 8;
        if (nextStep === 8 && !formData.rooms.some(r => ROOM_TYPES.slice(13).includes(r))) nextStep = 9;
        setStep(nextStep);
    };

    const handleBack = () => setStep(step - 1);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleTagChange = (tagKey, tagName) => {
        setFormData(prev => {
            const currentTags = prev[tagKey];
            let newTags;
            if (tagKey === 'propertyType') return { ...prev, [tagKey]: currentTags === tagName ? '' : tagName };

            if (currentTags.includes(tagName)) {
                newTags = currentTags.filter(name => name !== tagName);
            } else {
                newTags = [...currentTags, tagName];
            }
            return { ...prev, [tagKey]: newTags };
        });
    };

    const handleAddressLookup = async () => {
                    const postcode = formData.postcode;
                    if (!postcode) return displayModal("Please enter a postcode first.");

                    // MOCK LOOKUP (Since we don't have a paid API key yet)
                    // In the future, replace this fetch with a real call to https://api.postcodes.io
                    try {
                        const response = await fetch(`https://api.postcodes.io/postcodes/${postcode}`);
                        const data = await response.json();

                        if (data.status === 200) {
                            setFormData(prev => ({
                                ...prev,
                                city: data.result.parish || data.result.admin_district,
                                // Note: Free APIs rarely give House Number/Street Address
                                streetAddress: "" // User still needs to fill this
                            }));
                            displayModal("City found! Please fill in your specific Street Address.");
                        } else {
                            displayModal("Postcode not found.");
                        }
                    } catch (e) {
                        displayModal("Could not fetch address data.");
                    }
                };

    const handleFileChange = (e) => setSelectedFiles(Array.from(e.target.files));
    const handleVideoChange = (e) => setSelectedVideo(e.target.files[0]);

    // --- SUBMISSION LOGIC ---
    const handleLocationSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // 1. Upload Images
            const imageUrls = [];
            for (const file of selectedFiles) {
                // Ensure uploadFile returns the object property 'url'
                const responseUrl = await uploadFile(file); 
                if (responseUrl) imageUrls.push(responseUrl);
            }
            
            // Debug Log (Check your browser console when submitting!)
            console.log("Submitting Images:", imageUrls);

            // 2. Upload Video
            let videoUrl = null;
            if (selectedVideo) {
                videoUrl = await uploadFile(selectedVideo);
            }

            // 3. Prepare Payload for Python Backend
            const payload = {
                ...formData,
                imageUrls,
                videoUrl
            };

            // 4. Send to Postgres
            const response = await apiFetch('/locations', {
                method: 'POST',
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                displayModal("Location submitted successfully!", "Success");
                navigate('/home');
            } else {
                const err = await response.json();
                throw new Error(err.error || "Submission failed");
            }

        } catch (e) {
            console.error("Error submitting:", e);
            displayModal(`Failed to submit location: ${e.message}`, "Error");
        } finally {
            setIsSubmitting(false);
        }
    };

    // Calculate Progress Bar
    const calculateTotalProgress = () => {
        return `${Math.min(Math.round((step / 10) * 100), 100)}%`;
    };

    // --- HELPER FOR GROUPING FEATURES ---
    const getGroupedFeatures = (isInterior) => {
        const selectedRooms = formData.rooms;
        const groupedFeatures = {};

        // Define which rooms are "Interior" vs "Exterior"
        const interiorRoomTypes = ROOM_TYPES.slice(0, 13); // First 13 rooms are interior

        // Filter rooms based on whether we are looking for Interior or Exterior features
        const relevantRooms = selectedRooms.filter(room =>
            isInterior
                ? interiorRoomTypes.includes(room)
                : !interiorRoomTypes.includes(room)
        );

        // If any interior room is selected, also show "General Interior" features
        if (isInterior && relevantRooms.some(r => interiorRoomTypes.includes(r))) {
            relevantRooms.push('General Interior');
        }

        // Get the list of feature categories (Kitchen, Bathroom, Garden, etc.)
        const interiorGroupKeys = Object.keys(INTERIOR_GROUP_TO_ROOMS);
        const exteriorGroupKeys = Object.keys(FEATURE_MAPPING).filter(k => !interiorGroupKeys.includes(k) && k !== 'General Interior');

        const groupKeys = isInterior ? interiorGroupKeys : exteriorGroupKeys;

        // Loop through categories and decide if we should show them
        groupKeys.forEach(groupKey => {
            // Find which rooms trigger this category (e.g., 'Kitchen' room triggers 'Kitchen' features)
            let roomsInGroup = isInterior ? INTERIOR_GROUP_TO_ROOMS[groupKey] : [groupKey];

            // Is one of the triggering rooms selected?
            const isRelevant = roomsInGroup.some(room => selectedRooms.includes(room));

            // Special case for General Interior
            const isGeneralInterior = (isInterior && groupKey === 'General Interior' && relevantRooms.some(r => interiorRoomTypes.includes(r)));

            if (isRelevant || isGeneralInterior) {
                // Get the list of features (e.g., ['Aga', 'Island'])
                const features = FEATURE_MAPPING[groupKey] || FEATURE_MAPPING[roomsInGroup[0]];

                if (features && features.length > 0) {
                    groupedFeatures[groupKey] = features;
                }
            }
        });

        return groupedFeatures;
    };
    // --- RENDER STEPS ---
    const renderStep = () => {

        const stepTitle = `Step ${step} of 10: `;
        const interiorGroupedFeatures = getGroupedFeatures(true);
        const exteriorGroupedFeatures = getGroupedFeatures(false);

        switch (step) {
            case 1: return (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Step 1: Your Contact Details</h2>
                    <input type="text" name="fullName" value={formData.fullName} onChange={handleChange} placeholder="Full Name" className="w-full p-3 border rounded" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="w-full p-3 border rounded" />
                    <input type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleChange} placeholder="Phone" className="w-full p-3 border rounded" />
                    <p className="text-sm text-gray-500">We use these details to contact you about bookings.</p>
                </div>
            );
            case 2: return (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Step 2: Location Address</h2>
                    <div className="flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="text-sm text-gray-600">Postcode</label>
                            <input type="text" name="postcode" value={formData.postcode} onChange={handleChange} placeholder="e.g. SW1A 1AA" className="w-full p-3 border rounded" />
                        </div>
                        <button type="button" onClick={handleAddressLookup} className="px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700">
                            Find Address
                        </button>
                    </div>
                    <input type="text" name="streetAddress" value={formData.streetAddress} onChange={handleChange} placeholder="Street Address" className="w-full p-3 border rounded" />
                    <input type="text" name="city" value={formData.city} onChange={handleChange} placeholder="City / Town" className="w-full p-3 border rounded" />
                </div>
            );
            case 3: return (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Step 3: Upload Images</h2>
                    <div className="border-2 border-dashed border-gray-300 p-8 text-center rounded-lg hover:bg-gray-50 transition">
                        <input 
                            type="file" 
                            multiple 
                            accept="image/*" 
                            onChange={handleFileChange} 
                            className="hidden" 
                            id="file-upload"
                        />
                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                            <ImageIcon size={48} className="text-gray-400 mb-2"/>
                            <span className="text-blue-600 font-medium">Click to upload photos</span>
                            <span className="text-sm text-gray-500">or drag and drop here</span>
                        </label>
                    </div>
                    
                    {/* Preview Area */}
                    {selectedFiles.length > 0 && (
                        <div className="grid grid-cols-3 gap-2 mt-4">
                            {selectedFiles.map((file, i) => (
                                <div key={i} className="relative h-24 w-full">
                                    <img src={URL.createObjectURL(file)} alt="preview" className="h-full w-full object-cover rounded" />
                                </div>
                            ))}
                        </div>
                    )}
                    <p className="text-sm text-gray-500 text-right">{selectedFiles.length} images selected</p>
                </div>
            );
            case 4: return (
                <div>
                    <h2 className="text-xl font-bold mb-4">Step 4: Property Type</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {/* Use dbPropertyTypes instead of static array */}
                        {dbPropertyTypes.length > 0 ? dbPropertyTypes.map(t => (
                            <div 
                                key={t.label} 
                                onClick={() => handleTagChange('propertyType', t.label)}
                                className={`cursor-pointer border rounded-lg overflow-hidden ${formData.propertyType === t.label ? 'ring-2 ring-black' : ''}`}
                            >
                                <img src={t.image_url} alt={t.label} className="h-24 w-full object-cover" />
                                <p className="text-center p-2 text-sm">{t.label}</p>
                            </div>
                        )) : <p>Loading types...</p>}
                    </div>
                </div>
            );
            case 5: return (
                <div>
                    <h2 className="text-xl font-bold mb-4">Step 5: Style & Era (Select all that apply)</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-h-[500px] overflow-y-auto pr-2">
                        {dbPropertyStyles.length > 0 ? dbPropertyStyles.map(style => {
                            const isSelected = formData.propertyStyleTags.includes(style.label);
                            return (
                                <div 
                                    key={style.label} 
                                    onClick={() => handleTagChange('propertyStyleTags', style.label)}
                                    className={`relative cursor-pointer border rounded-lg overflow-hidden transition-all ${
                                        isSelected 
                                            ? 'ring-2 ring-black shadow-md transform scale-[1.02]' 
                                            : 'hover:border-gray-400'
                                    }`}
                                >
                                    <div className="h-28 w-full bg-gray-100">
                                        {style.image_url ? (
                                            <img 
                                                src={style.image_url} 
                                                alt={style.label} 
                                                className="h-full w-full object-cover"
                                                onError={(e) => {
                                                    e.target.style.display = 'none'; // Hide broken image
                                                    e.target.parentElement.classList.add('flex', 'items-center', 'justify-center');
                                                    e.target.parentElement.innerText = 'No Image';
                                                }}
                                            />
                                        ) : (
                                            <div className="h-full flex items-center justify-center text-xs text-gray-400">
                                                {style.label}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <p className="text-center p-2 text-sm font-medium bg-white border-t">
                                        {style.label}
                                    </p>

                                    {/* Visual Checkmark for selected items */}
                                    {isSelected && (
                                        <div className="absolute top-2 right-2 bg-black text-white rounded-full p-1 shadow-sm">
                                            <CheckCircle size={14} />
                                        </div>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="col-span-full text-center py-8 text-gray-500">
                                <p>Loading property styles...</p>
                            </div>
                        )}
                    </div>
                </div>
            );
            case 6: return (
                <div>
                    <h2 className="text-xl font-bold mb-4">Step 6: Rooms</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        {ROOM_TYPES.map(r => (
                            <div key={r} onClick={() => handleTagChange('rooms', r)} className={`p-3 border rounded cursor-pointer ${formData.rooms.includes(r) ? 'bg-black text-white' : 'bg-gray-100'}`}>
                                {r}
                            </div>
                        ))}
                    </div>
                </div>
            );
            case 7: // Interior Features 
                return (
                    <>
                        <div className="flex items-center space-x-1 mb-4">
                            <FileText size={24} className="text-black" />
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
                            <FileText size={24} className="text-black" />
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
                            <PlayCircle size={24} className="text-black" />
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
            // ... (Add cases 7, 8, 9 similar to original but using handleTagChange) ...
            case 10: return (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold">Step 10: Review & Submit</h2>
                    <div className="p-4 bg-gray-50 rounded">
                        <p><strong>Name:</strong> {formData.fullName}</p>
                        <p><strong>Address:</strong> {formData.streetAddress}, {formData.postcode}</p>
                        <p><strong>Type:</strong> {formData.propertyType}</p>
                        <p><strong>Images:</strong> {selectedFiles.length} selected</p>
                    </div>
                    <label className="flex items-center space-x-2">
                        <input type="checkbox" name="termsAccepted" checked={formData.termsAccepted} onChange={handleChange} className="h-5 w-5" />
                        <span>I accept the Terms and Conditions</span>
                    </label>
                </div>
            );
            default: return null;
        }
    };

    return (
        <div className="flex flex-col p-4 md:p-8 min-h-[calc(100vh-100px)]">
            <div className="w-full max-w-4xl mx-auto bg-white shadow-xl rounded-lg p-8">
                <h1 className="text-2xl font-bold mb-4">List Your Location</h1>
                <div className="mb-6 h-2 bg-gray-200 rounded-full">
                    <div className="h-full bg-black transition-all" style={{ width: calculateTotalProgress() }}></div>
                </div>

                <form onSubmit={handleLocationSubmit}>
                    {renderStep()}

                    <div className="flex justify-between mt-8 pt-4 border-t">
                        {step > 1 && <button type="button" onClick={handleBack} className="px-6 py-2 bg-gray-200 rounded">Back</button>}
                        {step < 10 ? (
                            <button type="button" onClick={handleNext} className="ml-auto px-6 py-2 bg-black text-white rounded">Next</button>
                        ) : (
                            <button type="submit" disabled={isSubmitting || !formData.termsAccepted} className="ml-auto px-6 py-2 bg-green-600 text-white rounded">
                                {isSubmitting ? 'Submitting...' : 'Submit Location'}
                            </button>
                        )}
                    </div>
                </form>
            </div>
            <Modal message={modalMessage} onClose={() => setModalMessage('')} title={modalTitle} />
        </div>
    );
};

export default Register;


