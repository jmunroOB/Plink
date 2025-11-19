// src/pages/Search.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Search, Heart, X, Menu, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, PlayCircle, MapPin } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useLocation } from 'react-router-dom';

// Import lists from the registration page for consistency
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

// Define color mapping for pills
const COLOR_MAP = {
    'Type': 'bg-blue-100 text-blue-800',
    'Style / Era': 'bg-purple-100 text-purple-800',
    'Rooms & Areas': 'bg-green-100 text-green-800',
    'Internal Features': 'bg-yellow-100 text-yellow-800',
    'External Features': 'bg-red-100 text-red-800',
    'Other': 'bg-gray-100 text-gray-800',
};

// Pill component for displaying attributes with color coding
const Pill = ({ text, type }) => {
    const colorClass = COLOR_MAP[type] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass} whitespace-nowrap`}>
            {text}
        </span>
    );
};

// Component to handle Leaflet Map rendering inside the modal
const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};


// Fix for default marker icon not showing
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Placeholder data for locations with coordinates, images, and now a video URL
const allLocations = [
    {
        id: 1,
        title: "Victorian House 1",
        type: "Detached",
        location: "Urban",
        age: "Victorian",
        rooms: ["Living Room", "Kitchen", "Dining Room"],
        internalFeatures: ["High Ceilings", "Ornate Cornices", "Large Bay Windows", "Aga Stove", "Original Fireplace"],
        externalFeatures: ["Large Garden", "Gravel Driveway", "Victorian Facade"],
        description: "A grand Victorian house with high ceilings, ornate cornices, and large bay windows. Features include a spacious, light-filled living room perfect for period dramas or elegant interviews. The kitchen has a classic, rustic feel with an Aga stove. The property boasts a sprawling garden ideal for outdoor shoots.",
        parking: "Street parking available for multiple vehicles.",
        images: [
            "https://via.placeholder.com/600x400/87CEEB/FFFFFF?text=Victorian+Interior+1",
            "https://via.placeholder.com/600x400/B0E0E6/000000?text=Victorian+Exterior+1",
            "https://via.placeholder.com/600x400/87CEEB/000000?text=Victorian+Room+1",
            "https://via.placeholder.com/600x400/ADD8E6/000000?text=Victorian+Garden+1",
        ],
        videoUrl: "https://www.w3schools.com/html/mov_bbb.mp4", // Example video URL
        coords: [51.505, -0.09] // Example coordinates (London)
    },
    {
        id: 2,
        title: "Modern Flat 2",
        type: "Flat / Apartment",
        location: "Suburban",
        age: "Minimalist",
        rooms: ["Open Plan Living/Kitchen", "1 Bedroom", "1 Bathroom"],
        internalFeatures: ["Concrete Floors", "Exposed Brick", "Floor-to-ceiling windows", "Smart Home Tech"],
        externalFeatures: ["Balcony", "Rooftop Garden", "Modern Architecture"],
        description: "Minimalist and sleek apartment with concrete floors, exposed brick accents, and large industrial-style windows. Features a spacious living area with minimalist design, great for modern shoots. The kitchen is fully equipped with modern appliances.",
        parking: "Private underground parking space for one vehicle.",
        images: [
            "https://via.placeholder.com/600x400/A9A9A9/FFFFFF?text=Modern+Living+2",
            "https://via.placeholder.com/600x400/D3D3D3/000000?text=Modern+Kitchen+2",
            "https://via.placeholder.com/600x400/A9A9A9/000000?text=Modern+Exterior+2",
            "https://via.placeholder.com/600x400/696969/FFFFFF?text=Modern+Balcony+2",
        ],
        coords: [51.515, -0.1]
    },
    {
        id: 3,
        title: "Rustic Cottage 3",
        type: "Cottage",
        location: "Rural",
        age: "Tudor",
        rooms: ["Kitchen", "Living Room", "2 Bedrooms", "1 Bathroom"],
        internalFeatures: ["Exposed Beams", "Stone Fireplace", "Low Ceilings", "Wood Burning Stove"],
        externalFeatures: ["Cottage Garden", "Small Seating Area", "Thatched Roof"],
        description: "A charming 18th-century stone cottage with rustic charm, low ceilings, and exposed wooden beams. Features a cozy living room with a large stone fireplace, ideal for intimate, rustic-themed projects. The exterior boasts a picturesque cottage garden.",
        parking: "Private driveway parking for up to 3 cars.",
        images: [
            "https://via.placeholder.com/600x400/CD853F/FFFFFF?text=Cottage+Interior+3",
            "https://via.placeholder.com/600x400/DEB887/000000?text=Cottage+Exterior+3",
            "https://via.placeholder.com/600x400/CD853F/000000?text=Cottage+Garden+3",
            "https://via.placeholder.com/600x400/A0522D/FFFFFF?text=Cottage+Fireplace+3",
        ],
        videoUrl: "https://sample-videos.com/video123/mp4/720/big_buck_bunny_720p_1mb.mp4",
        coords: [51.52, -0.12]
    },
    {
        id: 4,
        title: "Semi-Detached 4",
        type: "Semi-Detached",
        location: "Urban",
        age: "1930s",
        rooms: ["Dining Room", "Conservatory", "Living Room", "3 Bedrooms", "1 Bathroom"],
        internalFeatures: ["Original Fireplaces", "Bright Conservatory", "Period features"],
        externalFeatures: ["Small Front Garden", "Large Back Garden", "Brick Facade"],
        description: "A classic 1930s semi-detached family home with a warm and inviting atmosphere. Features include original fireplaces, a bright conservatory, and a well-kept garden.",
        parking: "Street parking available for multiple vehicles.",
        images: [
            "https://via.placeholder.com/600x400/C0C0C0/FFFFFF?text=1930s+Interior+4",
            "https://via.placeholder.com/600x400/808080/000000?text=1930s+Exterior+4",
            "https://via.placeholder.com/600x400/C0C0C0/000000?text=1930s+Garden+4",
            "https://via.placeholder.com/600x400/A9A9A9/FFFFFF?text=1930s+Conservatory+4",
        ],
        coords: [51.51, -0.11]
    },
    {
        id: 5,
        title: "Warehouse Loft 5",
        type: "Loft Apartment",
        location: "Urban",
        age: "Industrial",
        rooms: ["Large Open Warehouse Space", "Small Office", "Restrooms"],
        internalFeatures: ["High Ceilings", "Concrete Floors", "Bay Windows", "Industrial Lighting"],
        externalFeatures: ["Loading Bay", "On-site Parking", "Metal Cladding"],
        description: "Expansive industrial warehouse space with high ceilings, concrete floors, and large bay windows. Features include a minimalist design, a small office, and restrooms.",
        parking: "On-site parking for up to 5 vehicles.",
        images: [
            "https://via.placeholder.com/600x400/696969/FFFFFF?text=Loft+Interior+5",
            "https://via.placeholder.com/600x400/2F4F4F/000000?text=Loft+Exterior+5",
            "https://via.placeholder.com/600x400/696969/000000?text=Loft+View+5",
            "https://via.placeholder.com/600x400/4F4F4F/FFFFFF?text=Loft+Office+5",
        ],
        coords: [51.50, -0.07]
    },
];

const SearchPage = () => {
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [locations, setLocations] = useState(allLocations);
    
    const [searchImage, setSearchImage] = useState(null);
    const [isSearching, setIsSearching] = useState(false);

    const [isImageScrollerOpen, setIsImageScrollerOpen] = useState(false);
    const [currentScrollerImageIndex, setCurrentScrollerImageIndex] = useState(0);
    
    const [filters, setFilters] = useState({
        keywords: '',
        propertyType: '',
        age: '',
        rooms: '',
        postcode: '',
    });

    const navigate = useNavigate();
    const location = useLocation();

    const mockAISearch = async (image) => {
        return new Promise((resolve) => {
            setTimeout(() => {
                const mockResults = image.name.toLowerCase().includes('cottage') || image.name.toLowerCase().includes('rustic')
                    ? [allLocations[2], allLocations[0]]
                    : image.name.toLowerCase().includes('modern') || image.name.toLowerCase().includes('contemporary')
                    ? [allLocations[1], allLocations[4]]
                    : [allLocations[0], allLocations[1], allLocations[2], allLocations[3]];
                resolve(mockResults);
            }, 2000);
        });
    };

    const handleAISearch = async (e) => {
        e.preventDefault();
        if (!searchImage) {
            alert("Please select an image to search.");
            return;
        }

        setIsSearching(true);
        setLocations([]);

        try {
            const results = await mockAISearch(searchImage);
            setLocations(results);
        } catch (error) {
            console.error("AI search failed:", error);
            alert("AI search failed. Please try again.");
        } finally {
            setIsSearching(false);
            setIsFilterMenuOpen(false);
        }
    };
    
    const handleSearchImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSearchImage(file);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        let filtered = allLocations.filter(loc => {
            if (filters.propertyType && loc.type !== filters.propertyType) return false;
            if (filters.age && loc.age !== filters.age) return false;
            if (filters.postcode && !loc.postcode.toLowerCase().includes(filters.postcode.toLowerCase())) return false;
            if (filters.rooms) {
                const roomExists = loc.rooms.some(room => room.toLowerCase().includes(filters.rooms.toLowerCase()));
                if (!roomExists) return false;
            }
            return true;
        });
        setLocations(filtered);
        setIsFilterMenuOpen(false);
    };

    const clearFilters = () => {
        setFilters({
            keywords: '',
            propertyType: '',
            age: '',
            rooms: '',
            postcode: '',
        });
        setLocations(allLocations);
        setIsFilterMenuOpen(false);
    };

    const openAdModal = () => setIsAdModalOpen(true);
    const closeAdModal = () => setIsAdModalOpen(false);

    const handleAdSubmit = (e) => {
        e.preventDefault();
        alert('Thank you for your inquiry! We will contact you soon.');
        setIsAdModalOpen(false);
    };

    const openDetailsModal = (location) => {
        setSelectedLocation(location);
    };

    const closeDetailsModal = () => {
        setSelectedLocation(null);
    };

    const handleMessageOwner = (locationId) => {
        navigate(`/message/${locationId}`);
    };

    // Functions for image scroller
    const openImageScroller = (startIndex) => {
        setCurrentScrollerImageIndex(startIndex);
        setIsImageScrollerOpen(true);
    };

    const closeImageScroller = () => {
        setIsImageScrollerOpen(false);
    };

    const nextScrollerImage = () => {
        setCurrentScrollerImageIndex((prevIndex) => 
            (prevIndex + 1) % selectedLocation.images.length
        );
    };

    const prevScrollerImage = () => {
        setCurrentScrollerImageIndex((prevIndex) => 
            (prevIndex - 1 + selectedLocation.images.length) % selectedLocation.images.length
        );
    };

    const ImageCarousel = ({ images }) => {
        const [currentImageIndex, setCurrentImageIndex] = useState(0);
        const timerRef = useRef(null);

        const startTimer = () => {
            if (timerRef.current) return;
            timerRef.current = setInterval(() => {
                setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
            }, 3000);
        };

        const stopTimer = () => {
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        };

        useEffect(() => {
            startTimer();
            return () => stopTimer();
        }, []);

        const prevImage = (e) => {
            e.stopPropagation();
            stopTimer();
            setCurrentImageIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);
        };

        const nextImage = (e) => {
            e.stopPropagation();
            stopTimer();
            setCurrentImageIndex((prevIndex) => (prevIndex + 1) % images.length);
        };

        return (
            <div 
                className="relative w-full overflow-hidden rounded-lg mb-4"
                onMouseEnter={stopTimer} 
                onMouseLeave={startTimer} 
            >
                <img 
                    src={images[currentImageIndex]} 
                    alt="Location" 
                    className="w-full h-48 object-cover transition-opacity duration-500"
                />
                <div className="absolute top-1/2 left-0 right-0 transform -translate-y-1/2 flex justify-between px-2 opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <button onClick={prevImage} className="bg-black/50 text-white p-1 rounded-full hover:bg-black/75 transition-colors duration-200">
                        <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button onClick={nextImage} className="bg-black/50 text-white p-1 rounded-full hover:bg-black/75 transition-colors duration-200">
                        <ChevronRight className="h-6 w-6" />
                    </button>
                </div>
            </div>
        );
    };

    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full relative overflow-hidden"> 
            {/* Filter Sidebar (Permanent on desktop) */}
            <aside className="hidden lg:block lg:w-1/4 p-4 lg:p-6 bg-white shadow-lg lg:mr-0 overflow-y-auto">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Search by Image</h2>
                    <p className="text-gray-600 text-sm mb-4">
                        Upload an image, and our AI will find the most similar locations in our database.
                    </p>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <label className="flex-1 flex items-center justify-center px-4 py-2 border border-black text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                                <ImageIcon className="h-5 w-5 mr-2" />
                                <span>{searchImage ? 'Change Image' : 'Upload Image'}</span>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleSearchImageChange}
                                    className="hidden"
                                />
                            </label>
                            {searchImage && (
                                <button onClick={() => setSearchImage(null)} className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200">
                                    <X className="h-5 w-5" />
                                </button>
                            )}
                        </div>
                        {searchImage && (
                            <div className="flex justify-center mt-2">
                                <img 
                                    src={URL.createObjectURL(searchImage)} 
                                    alt="Search preview" 
                                    className="w-32 h-32 object-cover rounded-md shadow-md"
                                />
                            </div>
                        )}
                        <button
                            onClick={handleAISearch}
                            disabled={isSearching || !searchImage}
                            className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                                isSearching || !searchImage ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                            }`}
                        >
                            {isSearching ? (
                                <>
                                    <Loader2 className="h-5 w-5 animate-spin" />
                                    <span>Finding Matches...</span>
                                </>
                            ) : (
                                <>
                                    <Search className="h-5 w-5" />
                                    <span>Find Matches</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Find Filters</h2>
                    <div className="space-y-4">
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Property Type</label>
                            <select 
                                name="propertyType"
                                value={filters.propertyType}
                                onChange={handleFilterChange}
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {PROPERTY_STRUCTURAL_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Style / Era</label>
                            <select 
                                name="age"
                                value={filters.age}
                                onChange={handleFilterChange}
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {PROPERTY_STYLE_ERAS.map(style => (
                                    <option key={style} value={style}>{style}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Rooms & Areas</label>
                            <select 
                                name="rooms"
                                value={filters.rooms}
                                onChange={handleFilterChange}
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select...</option>
                                {ROOM_TYPES.map(room => (
                                    <option key={room} value={room}>{room}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col">
                            <label className="text-sm font-medium text-gray-700 mb-1">Postcode</label>
                            <input
                                type="text"
                                name="postcode"
                                value={filters.postcode}
                                onChange={handleFilterChange}
                                placeholder="e.g., SW1A 0AA"
                                className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div className="flex justify-between space-x-2">
                             <button
                                onClick={applyFilters}
                                className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                            >
                                Apply Filters
                            </button>
                             <button
                                onClick={clearFilters}
                                className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-semibold"
                            >
                                Clear
                            </button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Mobile Filter Menu (Modal) - Unchanged */}
            {isFilterMenuOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center p-4 bg-black bg-opacity-75 lg:hidden">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 overflow-y-auto max-h-[90vh]">
                        <div className="flex justify-between items-center mb-4 border-b pb-2">
                            <h2 className="text-2xl font-bold text-gray-800">Filters</h2>
                            <button onClick={() => setIsFilterMenuOpen(false)} className="text-gray-500 hover:text-gray-800 text-3xl font-bold">&times;</button>
                        </div>
                        <div className="space-y-6">
                            <div className="mb-4">
                                <h2 className="text-xl font-bold text-gray-800 mb-4">Search by Image</h2>
                                <p className="text-gray-600 text-sm mb-4">
                                    Upload an image, and our AI will find the most similar locations in our database.
                                </p>
                                <div className="space-y-4">
                                    <div className="flex items-center space-x-2">
                                        <label className="flex-1 flex items-center justify-center px-4 py-2 border border-black text-black rounded-lg font-semibold hover:bg-gray-100 transition-colors duration-200 cursor-pointer">
                                            <ImageIcon className="h-5 w-5 mr-2" />
                                            <span>{searchImage ? 'Change Image' : 'Upload Image'}</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                onChange={handleSearchImageChange}
                                                className="hidden"
                                            />
                                        </label>
                                        {searchImage && (
                                            <button onClick={() => setSearchImage(null)} className="p-2 text-red-500 hover:text-red-700 transition-colors duration-200">
                                                <X className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                    {searchImage && (
                                        <div className="flex justify-center mt-2">
                                            <img 
                                                src={URL.createObjectURL(searchImage)} 
                                                alt="Search preview" 
                                                className="w-32 h-32 object-cover rounded-md shadow-md"
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleAISearch}
                                        disabled={isSearching || !searchImage}
                                        className={`w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
                                            isSearching || !searchImage ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-black text-white hover:bg-gray-800'
                                        }`}
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="h-5 w-5 animate-spin" />
                                                <span>Finding Matches...</span>
                                            </>
                                        ) : (
                                            <>
                                                <Search className="h-5 w-5" />
                                                <span>Find Matches</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Property Type</label>
                                    <select 
                                        name="propertyType"
                                        value={filters.propertyType}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        {PROPERTY_STRUCTURAL_TYPES.map(type => (
                                            <option key={type} value={type}>{type}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Style / Era</label>
                                    <select 
                                        name="age"
                                        value={filters.age}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        {PROPERTY_STYLE_ERAS.map(style => (
                                            <option key={style} value={style}>{style}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Rooms & Areas</label>
                                    <select 
                                        name="rooms"
                                        value={filters.rooms}
                                        onChange={handleFilterChange}
                                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select...</option>
                                        {ROOM_TYPES.map(room => (
                                            <option key={room} value={room}>{room}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex flex-col">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Postcode</label>
                                    <input
                                        type="text"
                                        name="postcode"
                                        value={filters.postcode}
                                        onChange={handleFilterChange}
                                        placeholder="e.g., SW1A 0AA"
                                        className="w-full px-4 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                                <div className="flex justify-between space-x-2">
                                     <button
                                        onClick={applyFilters}
                                        className="flex-1 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                                    >
                                        Apply Filters
                                    </button>
                                     <button
                                        onClick={clearFilters}
                                        className="flex-1 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors duration-200 font-semibold"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Main Content Area */}
            <main className="w-full lg:w-3/4 flex flex-col p-4 lg:p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-4xl font-extrabold text-center text-gray-800 flex-1 lg:text-left">
                        Find Your Perfect Location
                    </h1>
                </div>

                <p className="text-center text-gray-600 mb-8 lg:text-left">
                    Search for listings by location, type, or keywords.
                </p>

                {/* Mobile Filters Button and View Toggles */}
                <div className="flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 mb-6">
                    <button
                        onClick={() => setIsFilterMenuOpen(true)}
                        className="lg:hidden w-full sm:w-auto flex items-center gap-2 px-6 py-3 bg-black text-white rounded-lg font-semibold hover:bg-gray-800 transition-colors duration-200"
                    >
                        <Menu className="h-5 w-5" />
                        Search filters
                    </button>
                    <div className="flex justify-center w-full sm:w-auto">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-6 py-2 rounded-l-lg font-semibold transition-colors duration-200 ${
                                viewMode === 'list'
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-gray-800 text-white hover:bg-black'
                            }`}
                        >
                            List View
                        </button>
                        <button
                            onClick={() => setViewMode('map')}
                            className={`px-6 py-2 rounded-r-lg font-semibold transition-colors duration-200 ${
                                viewMode === 'map'
                                    ? 'bg-black text-white hover:bg-gray-800'
                                    : 'bg-gray-800 text-white hover:bg-black'
                            }`}
                        >
                            Map View
                        </button>
                    </div>
                </div>

                {/* Conditional Rendering based on viewMode */}
                {viewMode === 'list' ? (
                    // Enforce single column (stacked) layout
                    <div className="grid grid-cols-1 gap-6">
                        {locations.length > 0 ? (
                            locations.map((location) => (
                                <div key={location.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                                    
                                    {/* Image Container - Full width, fixed height */}
                                    <div className="relative w-full h-64 grid grid-cols-3 gap-0.5">
                                        {location.images.slice(0, 3).map((img, index) => (
                                            <img
                                                key={index}
                                                src={img}
                                                alt={`Location image ${index + 1}`}
                                                className="w-full h-full object-cover"
                                            />
                                        ))}
                                        {/* Overlay for Reference, Pills, and View Details Button */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent p-4 flex flex-col justify-between">
                                            {/* Top right for Ref number and Heart */}
                                            <div className="flex justify-between items-start">
                                                <h3 className="text-xl text-white font-bold bg-gray-700/70 px-2 py-1 rounded-md">
                                                    Reference: {location.id}
                                                </h3>
                                                <Heart className="h-6 w-6 text-white hover:text-red-400 cursor-pointer" />
                                            </div>
                                            
                                            {/* Bottom: Pills and Button */}
                                            <div className="flex flex-col space-y-3">
                                                {/* Pills */}
                                                <div className="flex flex-wrap gap-2">
                                                    <Pill text={location.type} type="Type" />
                                                    <Pill text={location.age} type="Style / Era" />
                                                    {location.rooms.map(room => (
                                                        <Pill key={room} text={room} type="Rooms & Areas" />
                                                    ))}
                                                    {location.internalFeatures.slice(0, 2).map(feature => ( // Showing only 2 internal features for space
                                                        <Pill key={feature} text={feature} type="Internal Features" />
                                                    ))}
                                                </div>
                                                {/* View Details Button - Full width, aligned right */}
                                                <div className="w-full flex justify-end">
                                                    <button
                                                        onClick={() => openDetailsModal(location)}
                                                        className="px-6 py-3 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                                                    >
                                                        View Details
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-center text-gray-500 col-span-full">No locations found. Try adjusting your search.</p>
                        )}
                    </div>
                ) : (
                    <div className="w-full h-[600px] rounded-lg shadow-lg overflow-hidden">
                        <MapContainer center={[51.505, -0.09]} zoom={13} scrollWheelZoom={false} className="h-full w-full">
                            <TileLayer
                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                            />
                            {locations.map((location) => (
                                <Marker key={location.id} position={location.coords}>
                                    <Popup>
                                        <div className="flex flex-col items-center">
                                            <h3 className="text-lg font-bold">Reference: {location.id}</h3>
                                            <p className="text-sm text-gray-600">{location.type} in {location.location}</p>
                                            <button
                                                onClick={() => handleMessageOwner(location.id)}
                                                className="mt-2 px-4 py-2 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors duration-200 text-sm"
                                            >
                                                Message Owner
                                            </button>
                                        </div>
                                    </Popup>
                                </Marker>
                            ))}
                        </MapContainer>
                    </div>
                )}
            </main>

            {/* "Advertise With Us" Modal - Unchanged */}
            {isAdModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-800">Advertise With Us!</h2>
                            <button onClick={closeAdModal} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                        </div>
                        <p className="text-gray-600 mb-4">
                            Fill out the form below, and we'll contact you to discuss your advertising needs.
                        </p>
                        <form onSubmit={handleAdSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Business Name</label>
                                <input type="text" className="w-full mt-1 p-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Person</label>
                                <input type="text" className="w-full mt-1 p-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Contact Email</label>
                                <input type="email" className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Phone Number (Optional)</label>
                                <input type="tel" className="w-full mt-1 p-2 border border-gray-300 rounded-lg" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Type of Business</label>
                                <select className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required>
                                    <option>Select...</option>
                                    <option>Production Company</option>
                                    <option>Freelancer</option>
                                    <option>Brand</option>
                                    <option>Agency</option>
                                    <option>Other</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Advertising Interest</label>
                                <select className="w-full mt-1 p-2 border border-gray-300 rounded-lg" required>
                                    <option>Select...</option>
                                    <option>Location Promotion</option>
                                    <option>Service Promotion</option>
                                    <option>Event Promotion</option>
                                    <option>General Branding</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Describe Your Advertising Needs / Budget (Optional)</label>
                                <textarea className="w-full mt-1 p-2 border border-gray-300 rounded-lg" rows="3"></textarea>
                            </div>
                            <button
                                type="submit"
                                className="w-full px-6 py-3 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                            >
                                Submit Inquiry
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* "View Details" Modal */}
            {selectedLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden">
                        <div className="p-6 md:p-8 lg:p-10 flex flex-col h-full">
                            {/* Header Row: Reference and Close Button */}
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-bold text-gray-800">Reference: {selectedLocation.id}</h2>
                                <button onClick={closeDetailsModal} className="text-gray-500 hover:text-gray-800 text-2xl font-bold">&times;</button>
                            </div>
                            
                            {/* Main Content: Single Column (Stacked) Layout */}
                            <div className="flex flex-col space-y-6 flex-grow overflow-y-auto">

                                {/* ROW 1: Media (Video + Images) */}
                                <div className="w-full flex flex-col space-y-4">
                                    {selectedLocation.videoUrl && (
                                        <div className="w-full aspect-video rounded-lg overflow-hidden relative group">
                                            <video 
                                                controls 
                                                className="w-full h-full object-cover"
                                                src={selectedLocation.videoUrl}
                                                poster="https://via.placeholder.com/600x400/000000/FFFFFF?text=Video+Thumbnail" 
                                            >
                                                Your browser does not support the video tag.
                                            </video>
                                        </div>
                                    )}

                                    {/* Image Grid - now shows ALL images and is clickable */}
                                    <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
                                        {selectedLocation.images.map((img, index) => (
                                            <img 
                                                key={index}
                                                src={img} 
                                                alt={`Location image ${index + 1}`} 
                                                className="w-full h-24 md:h-32 object-cover rounded-lg shadow-md cursor-pointer hover:opacity-80 transition-opacity"
                                                onClick={() => openImageScroller(index)}
                                            />
                                        ))}
                                    </div>
                                </div>
                                
                                {/* ROW 2: Map and Pills Stacked */}
                                <div className="w-full space-y-4">
                                    {/* Map Section */}
                                    <div className="w-full h-64 rounded-lg overflow-hidden shadow-lg">
                                        <MapContainer 
                                            center={selectedLocation.coords} 
                                            zoom={15} 
                                            scrollWheelZoom={false} 
                                            className="h-full w-full"
                                        >
                                            <TileLayer
                                                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                                                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                            />
                                            <Marker position={selectedLocation.coords}>
                                                <Popup>
                                                    <div className="text-sm font-semibold">Reference: {selectedLocation.id}</div>
                                                </Popup>
                                            </Marker>
                                            {/* Fix: Call the map invalidation component */}
                                            <MapResizer /> 
                                        </MapContainer>
                                    </div>

                                    {/* Pills (Key Features) */}
                                    <div className="space-y-2">
                                        <h3 className="text-base font-bold text-gray-800">Key Features</h3>
                                        <div className="flex flex-wrap gap-2">
                                            <Pill text={selectedLocation.type} type="Type" />
                                            <Pill text={selectedLocation.age} type="Style / Era" />
                                            {selectedLocation.rooms.map(room => (
                                                <Pill key={room} text={room} type="Rooms & Areas" />
                                            ))}
                                            {selectedLocation.internalFeatures && selectedLocation.internalFeatures.map(feature => (
                                                <Pill key={feature} text={feature} type="Internal Features" />
                                            ))}
                                            {selectedLocation.externalFeatures && selectedLocation.externalFeatures.map(feature => (
                                                <Pill key={feature} text={feature} type="External Features" />
                                            ))}
                                            {selectedLocation.parking && <Pill text={`Parking: ${selectedLocation.parking.split(' ')[0]}...`} type="Other" />}
                                        </div>
                                    </div>

                                    {/* Description */}
                                    <div className="mt-4">
                                        <h3 className="text-base font-bold text-gray-800">Description</h3>
                                        <p className="text-gray-600 text-sm break-words">{selectedLocation.description}</p>
                                    </div>
                                </div>
                                
                                {/* Final Row: Message Button (Full width) - Now placed correctly */}
                                <div className="w-full pt-4 flex justify-end flex-shrink-0">
                                    <button
                                        onClick={() => handleMessageOwner(selectedLocation.id)}
                                        className="w-full px-6 py-3 text-white bg-black rounded-lg hover:bg-gray-800 transition-colors duration-200 font-semibold"
                                    >
                                        Message Owner
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Scroller Modal */}
            {isImageScrollerOpen && selectedLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center p-4 z-[100]">
                    <button 
                        onClick={closeImageScroller} 
                        className="absolute top-4 right-4 text-white text-4xl font-bold z-[101] hover:text-gray-300"
                    >
                        &times;
                    </button>
                    <div className="relative w-full h-full flex items-center justify-center">
                        <button 
                            onClick={prevScrollerImage} 
                            className="absolute left-4 bg-black/50 text-white p-2 rounded-full z-[101] hover:bg-black/75 transition-colors duration-200"
                        >
                            <ChevronLeft className="h-8 w-8" />
                        </button>
                        <img 
                            src={selectedLocation.images[currentScrollerImageIndex]} 
                            alt={`Scrolled image ${currentScrollerImageIndex + 1}`} 
                            className="max-w-full max-h-full object-contain rounded-lg shadow-xl"
                        />
                        <button 
                            onClick={nextScrollerImage} 
                            className="absolute right-4 bg-black/50 text-white p-2 rounded-full z-[101] hover:bg-black/75 transition-colors duration-200"
                        >
                            <ChevronRight className="h-8 w-8" />
                        </button>
                    </div>
                    <div className="absolute bottom-4 text-white text-lg z-[101]">
                        {currentScrollerImageIndex + 1} / {selectedLocation.images.length}
                    </div>
                </div>
            )}
        </div>
    );
};

export default SearchPage;