import React, { useState, useEffect, useRef, useContext } from 'react';
import { Search, Heart, X, Menu, ChevronLeft, ChevronRight, Image as ImageIcon, Loader2, PlayCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'; 
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { AppContext } from '../App'; // Import Context

// Import lists for dropdown consistency
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

const Pill = ({ text, type }) => {
    const colorClass = COLOR_MAP[type] || 'bg-gray-100 text-gray-800';
    return (
        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${colorClass} whitespace-nowrap`}>
            {text}
        </span>
    );
};

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        map.invalidateSize();
    }, [map]);
    return null;
};

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const SearchPage = () => {
    // --- Context & Navigation ---
    const { apiFetch } = useContext(AppContext);
    const navigate = useNavigate();
    const location = useLocation();

    // --- State ---
    const [locations, setLocations] = useState([]); // Empty initially, filled by DB
    const [loading, setLoading] = useState(true);
    const [isAdModalOpen, setIsAdModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [viewMode, setViewMode] = useState('list');
    const [isFilterMenuOpen, setIsFilterMenuOpen] = useState(false);
    const [searchImage, setSearchImage] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [isImageScrollerOpen, setIsImageScrollerOpen] = useState(false);
    const [currentScrollerImageIndex, setCurrentScrollerImageIndex] = useState(0);
    
    const [filters, setFilters] = useState({
        propertyType: '',
        age: '',
        rooms: '',
        postcode: '',
    });

    // --- FETCH DATA FROM DB ---
    const fetchLocations = async (filterParams = {}) => {
        setLoading(true);
        try {
            // Convert filters object to query string
            const query = new URLSearchParams(filterParams).toString();
            const response = await apiFetch(`/locations/search?${query}`);
            
            if (response.ok) {
                const data = await response.json();
                
                // MOCK COORDINATES (Since DB doesn't have them yet)
                // This spreads dots randomly around London so Map View doesn't crash
                const mappedData = data.map((loc, index) => ({
                    ...loc,
                    coords: [51.505 + (Math.random() * 0.1 - 0.05), -0.09 + (Math.random() * 0.1 - 0.05)] 
                }));
                
                setLocations(mappedData);
            } else {
                console.error("Failed to fetch locations");
            }
        } catch (error) {
            console.error("Error loading locations:", error);
        } finally {
            setLoading(false);
        }
    };

    // Load all locations on mount
    useEffect(() => {
        fetchLocations();
    }, []);

    // --- Handlers ---

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    const applyFilters = () => {
        // Pass current state filters to the API fetcher
        fetchLocations(filters);
        setIsFilterMenuOpen(false);
    };

    const clearFilters = () => {
        const emptyFilters = { propertyType: '', age: '', rooms: '', postcode: '' };
        setFilters(emptyFilters);
        fetchLocations(emptyFilters);
        setIsFilterMenuOpen(false);
    };

    // --- Search By Image (Mock for now, can connect to /ai/analyze later) ---
    const handleAISearch = async (e) => {
        e.preventDefault();
        if (!searchImage) return alert("Please select an image.");
        setIsSearching(true);
        // Simulate delay then just return all for demo
        setTimeout(() => {
            fetchLocations(); 
            setIsSearching(false);
            setIsFilterMenuOpen(false);
        }, 1500);
    };
    
    const handleSearchImageChange = (e) => {
        if (e.target.files[0]) setSearchImage(e.target.files[0]);
    };

    const handleMessageOwner = (locationId) => navigate(`/message/${locationId}`);
    
    // --- Scroller Logic ---
    const openImageScroller = (startIndex) => {
        setCurrentScrollerImageIndex(startIndex);
        setIsImageScrollerOpen(true);
    };
    const closeImageScroller = () => setIsImageScrollerOpen(false);
    const nextScrollerImage = () => {
        setCurrentScrollerImageIndex((prev) => (prev + 1) % selectedLocation.images.length);
    };
    const prevScrollerImage = () => {
        setCurrentScrollerImageIndex((prev) => (prev - 1 + selectedLocation.images.length) % selectedLocation.images.length);
    };

    // --- Render ---
    return (
        <div className="flex flex-col lg:flex-row min-h-screen w-full relative overflow-hidden"> 
            {/* Sidebar Filters */}
            <aside className="hidden lg:block lg:w-1/4 p-4 lg:p-6 bg-white shadow-lg lg:mr-0 overflow-y-auto">
                <div className="mb-8">
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Search by Image</h2>
                    <div className="space-y-4">
                        <label className="flex items-center justify-center px-4 py-2 border border-black rounded-lg cursor-pointer hover:bg-gray-50">
                            <ImageIcon className="h-5 w-5 mr-2" />
                            <span>{searchImage ? 'Change Image' : 'Upload Image'}</span>
                            <input type="file" accept="image/*" onChange={handleSearchImageChange} className="hidden" />
                        </label>
                        {searchImage && (
                            <img src={URL.createObjectURL(searchImage)} alt="Preview" className="w-full h-32 object-cover rounded-md" />
                        )}
                        <button onClick={handleAISearch} disabled={isSearching || !searchImage} className="w-full px-4 py-2 bg-black text-white rounded-lg disabled:bg-gray-400">
                            {isSearching ? 'Analyzing...' : 'Find Matches'}
                        </button>
                    </div>
                </div>

                <div>
                    <h2 className="text-xl font-bold text-gray-800 mb-4">Find Filters</h2>
                    <div className="space-y-4">
                        <select name="propertyType" value={filters.propertyType} onChange={handleFilterChange} className="w-full p-2 border rounded">
                            <option value="">Any Property Type</option>
                            {PROPERTY_STRUCTURAL_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select name="age" value={filters.age} onChange={handleFilterChange} className="w-full p-2 border rounded">
                            <option value="">Any Style / Era</option>
                            {PROPERTY_STYLE_ERAS.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <select name="rooms" value={filters.rooms} onChange={handleFilterChange} className="w-full p-2 border rounded">
                            <option value="">Any Room</option>
                            {ROOM_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <input type="text" name="postcode" value={filters.postcode} onChange={handleFilterChange} placeholder="Postcode" className="w-full p-2 border rounded" />
                        
                        <div className="flex gap-2">
                            <button onClick={applyFilters} className="flex-1 bg-black text-white py-2 rounded hover:bg-gray-800">Apply</button>
                            <button onClick={clearFilters} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded hover:bg-gray-300">Clear</button>
                        </div>
                    </div>
                </div>
            </aside>

            {/* Main Content */}
            <main className="w-full lg:w-3/4 flex flex-col p-4 lg:p-6 overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h1 className="text-3xl font-bold">Find Your Location</h1>
                    <div className="flex bg-gray-100 rounded-lg p-1">
                        <button onClick={() => setViewMode('list')} className={`px-4 py-1 rounded ${viewMode === 'list' ? 'bg-white shadow' : ''}`}>List</button>
                        <button onClick={() => setViewMode('map')} className={`px-4 py-1 rounded ${viewMode === 'map' ? 'bg-white shadow' : ''}`}>Map</button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-gray-500" />
                    </div>
                ) : viewMode === 'list' ? (
                    <div className="grid grid-cols-1 gap-6">
                        {locations.length > 0 ? locations.map((location) => (
                            <div key={location.id} className="bg-white rounded-lg shadow-lg overflow-hidden relative">
                                {/* Image Grid */}
                                <div className="relative w-full h-64 grid grid-cols-3 gap-0.5">
                                    {location.images && location.images.slice(0, 3).map((img, index) => (
                                        <img key={index} src={img} alt="Loc" className="w-full h-full object-cover" />
                                    ))}
                                    {/* Fallback if no images */}
                                    {(!location.images || location.images.length === 0) && (
                                        <div className="col-span-3 bg-gray-200 flex items-center justify-center text-gray-500">No Images Available</div>
                                    )}
                                    
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent p-4 flex flex-col justify-between pointer-events-none">
                                        <div className="flex justify-between">
                                            <span className="bg-black/50 text-white px-2 py-1 rounded text-sm backdrop-blur-sm">Ref: {location.id}</span>
                                            <Heart className="text-white h-6 w-6 cursor-pointer pointer-events-auto hover:text-red-500" />
                                        </div>
                                        <div className="pointer-events-auto">
                                            <div className="flex flex-wrap gap-2 mb-3">
                                                <Pill text={location.type} type="Type" />
                                                <Pill text={location.location} type="Other" />
                                                {location.rooms && location.rooms.slice(0,3).map(r => <Pill key={r} text={r} type="Rooms & Areas" />)}
                                            </div>
                                            <div className="flex justify-end">
                                                <button onClick={() => setSelectedLocation(location)} className="bg-white text-black px-4 py-2 rounded font-semibold hover:bg-gray-100 transition">
                                                    View Details
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <p className="text-center text-gray-500 mt-10">No locations found matching your criteria.</p>
                        )}
                    </div>
                ) : (
                    // Map View
                    <div className="w-full h-[600px] rounded-lg shadow-lg overflow-hidden">
                        <MapContainer center={[51.505, -0.09]} zoom={13} className="h-full w-full">
                            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; OpenStreetMap' />
                            {locations.map(loc => (
                                <Marker key={loc.id} position={loc.coords}>
                                    <Popup>
                                        <strong>{loc.type}</strong><br/>{loc.location}<br/>
                                        <button onClick={() => setSelectedLocation(loc)} className="text-blue-600 underline mt-1">View</button>
                                    </Popup>
                                </Marker>
                            ))}
                            <MapResizer />
                        </MapContainer>
                    </div>
                )}
            </main>

            {/* Details Modal */}
            {selectedLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                        <div className="p-6 overflow-y-auto">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-2xl font-bold">Ref: {selectedLocation.id} - {selectedLocation.title}</h2>
                                <button onClick={() => setSelectedLocation(null)} className="text-gray-500 hover:text-black text-3xl">&times;</button>
                            </div>

                            {selectedLocation.videoUrl && (
                                <video controls src={selectedLocation.videoUrl} className="w-full h-64 object-cover rounded-lg mb-4 bg-black"></video>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-6">
                                {selectedLocation.images && selectedLocation.images.map((img, idx) => (
                                    <img key={idx} src={img} onClick={() => openImageScroller(idx)} className="h-24 w-full object-cover rounded cursor-pointer hover:opacity-80" alt="Detail" />
                                ))}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <h3 className="font-bold text-lg">Features</h3>
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Pill text={selectedLocation.type} type="Type" />
                                        {selectedLocation.rooms.map(r => <Pill key={r} text={r} type="Rooms & Areas" />)}
                                        {selectedLocation.internalFeatures.map(f => <Pill key={f} text={f} type="Internal Features" />)}
                                    </div>
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Description</h3>
                                    <p className="text-gray-700">{selectedLocation.description || "No description provided."}</p>
                                </div>
                                <button onClick={() => handleMessageOwner(selectedLocation.id)} className="w-full bg-black text-white py-3 rounded-lg font-bold hover:bg-gray-800">
                                    Message Owner
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Image Scroller Modal */}
            {isImageScrollerOpen && selectedLocation && (
                <div className="fixed inset-0 bg-black bg-opacity-95 flex items-center justify-center z-[60]">
                    <button onClick={closeImageScroller} className="absolute top-4 right-4 text-white text-4xl">&times;</button>
                    <button onClick={prevScrollerImage} className="absolute left-4 text-white p-2"><ChevronLeft size={40}/></button>
                    <img src={selectedLocation.images[currentScrollerImageIndex]} className="max-h-[90vh] max-w-[90vw] object-contain" alt="Full" />
                    <button onClick={nextScrollerImage} className="absolute right-4 text-white p-2"><ChevronRight size={40}/></button>
                </div>
            )}
        </div>
    );
};

export default SearchPage;