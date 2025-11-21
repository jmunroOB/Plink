// src/pages/SavedLocations.jsx

import React, { useState, useEffect, useRef, useContext } from "react";
import { Link } from 'react-router-dom';
import {
    Eye, Trash2, X, ChevronLeft, ChevronRight, MessageSquare, Tag, Car, Maximize, Cloud,
    CheckCircle, CreditCard, Wallet, Download, Share2, Mail, MessageSquareText, HardDrive, Box,
    MapPin, Calendar, Layout, Send as SendIcon, Home
} from 'lucide-react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { AppContext } from '../App'; // <-- Import FirebaseContext

// Helper function for creating a promise-based image load
const loadImage = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
});

// Location Details Modal Component
const LocationDetailsModal = ({ location, onClose, onMessageOwnerClick }) => {
    const [isSlideshowOpen, setIsSlideshowOpen] = useState(false);
    const [slideshowStartIndex, setSlideshowStartIndex] = useState(0);

    const openSlideshow = (index) => {
        setSlideshowStartIndex(index);
        setIsSlideshowOpen(true);
    };

    const closeSlideshow = () => {
        setIsSlideshowOpen(false);
    };

    const ImageSlideshow = ({ images, startIndex, onClose }) => {
        const [currentIndex, setCurrentIndex] = useState(startIndex);
        const goToNext = () => setCurrentIndex((prevIndex) => (prevIndex + 1) % images.length);
        const goToPrevious = () => setCurrentIndex((prevIndex) => (prevIndex - 1 + images.length) % images.length);

        useEffect(() => {
            const handleKeyDown = (event) => {
                if (event.key === 'Escape') onClose();
                else if (event.key === 'ArrowRight') goToNext();
                else if (event.key === 'ArrowLeft') goToPrevious();
            };
            window.addEventListener('keydown', handleKeyDown);
            return () => window.removeEventListener('keydown', handleKeyDown);
        }, [onClose, goToNext, goToPrevious]);

        if (!images || images.length === 0) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4">
                <div className="relative max-w-4xl max-h-full w-full h-full flex flex-col items-center justify-center">
                    <button onClick={onClose} className="absolute top-4 right-4 text-white hover:text-gray-300 z-10 p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 transition" aria-label="Close slideshow">
                        <X className="h-8 w-8" />
                    </button>
                    <img
                        src={images[currentIndex]}
                        alt={`Slideshow image ${currentIndex + 1}`}
                        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-lg"
                        onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x600/E0E0E0/333333?text=Image+Load+Error"; }}
                    />
                    {images.length > 1 && (
                        <>
                            <button onClick={goToPrevious} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 transition" aria-label="Previous image">
                                <ChevronLeft className="h-10 w-10" />
                            </button>
                            <button onClick={goToNext} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 p-2 rounded-full bg-gray-800 bg-opacity-50 hover:bg-opacity-75 transition" aria-label="Next image">
                                <ChevronRight className="h-10 w-10" />
                            </button>
                        </>
                    )}
                    {images.length > 0 && (
                        <div className="absolute bottom-4 text-white bg-gray-800 bg-opacity-50 px-4 py-2 rounded-full text-sm">
                            {currentIndex + 1} / {images.length}
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const handleMessageOwner = () => {
        onMessageOwnerClick(location.propertyType);
    };

    useEffect(() => {
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!location) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-40 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full relative flex flex-col max-h-[95vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition" aria-label="Close details">
                    <X className="h-6 w-6" />
                </button>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 h-full">
                    <div className="relative w-full h-48 md:h-full bg-gray-200 rounded-t-lg md:rounded-l-lg md:rounded-tr-none overflow-hidden md:col-span-2">
                        {location.images && location.images.length > 0 && (
                            <img
                                src={location.images[0]}
                                alt={`Main image of ${location.propertyType}`}
                                className="w-full h-full object-contain cursor-pointer"
                                onClick={() => openSlideshow(0)}
                                onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/800x600/E0E0E0/333333?text=Image+Missing"; }}
                            />
                        )}
                        {location.images.length > 1 && (
                            <div className="absolute bottom-1 right-1 bg-black bg-opacity-60 text-white text-xs px-1 py-0.5 rounded-full">
                                {location.images.length} photos
                            </div>
                        )}
                    </div>
                    <div className="p-3 flex-grow overflow-y-auto text-xs md:col-span-1">
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{location.propertyType} in {location.locationType}</h3>
                        <p className="text-gray-600 mb-2 leading-tight">{location.interior.substring(0, 80)}...</p>
                        <div className="grid grid-cols-1 gap-1 text-gray-700 mb-2">
                            <p className="flex items-center gap-1"><Tag className="h-3 w-3 text-gray-500" /><span className="font-semibold">Type:</span> {location.propertyType}</p>
                            <p className="flex items-center gap-1"><MapPin className="h-3 w-3 text-gray-500" /><span className="font-semibold">Location:</span> {location.locationType}</p>
                            <p className="flex items-center gap-1"><Calendar className="h-3 w-3 text-gray-500" /><span className="font-semibold">Age:</span> {location.age}</p>
                            <p className="flex items-center gap-1"><Layout className="h-3 w-3 text-gray-500" /><span className="font-semibold">Rooms:</span> {location.rooms}</p>
                            <p className="flex items-center gap-1"><Car className="h-3 w-3 text-gray-500" /><span className="font-semibold">Parking:</span> {location.parking}</p>
                        </div>
                        <h4 className="text-sm font-semibold mb-1 text-gray-800 flex items-center gap-1"><Maximize className="h-3 w-3" /> Interior:</h4>
                        <p className="text-gray-700 mb-2 leading-tight">{location.interior}</p>
                        <h4 className="text-sm font-semibold mb-1 text-gray-800 flex items-center gap-1"><Cloud className="h-3 w-3" /> Exterior:</h4>
                        <p className="text-gray-700 mb-3 leading-tight">{location.exterior}</p>
                        <button onClick={handleMessageOwner} className="w-full bg-black text-white px-3 py-1.5 rounded-md font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-opacity-50 transition duration-150 ease-in-out flex items-center justify-center gap-1 text-xs">
                            <MessageSquare className="h-4 w-4" /> Message Owner
                        </button>
                    </div>
                </div>
            </div>
            {isSlideshowOpen && (
                <ImageSlideshow
                    images={location.images}
                    startIndex={slideshowStartIndex}
                    onClose={closeSlideshow}
                />
            )}
        </div>
    );
};

// New Chat Modal Component
const ChatModal = ({ recipientName, onClose }) => {
    const [messages, setMessages] = useState([
        { id: 1, sender: 'Owner', text: `Hi, thanks for your interest in ${recipientName}! How can I help you?` },
    ]);
    const [newMessage, setNewMessage] = useState('');
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    useEffect(scrollToBottom, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (newMessage.trim()) {
            setMessages((prevMessages) => [
                ...prevMessages,
                { id: prevMessages.length + 1, sender: 'You', text: newMessage.trim() },
            ]);
            setNewMessage('');
            setTimeout(() => {
                setMessages((prevMessages) => [
                    ...prevMessages,
                    { id: prevMessages.length + 1, sender: 'Owner', text: 'Got it! I will get back to you shortly.' },
                ]);
            }, 1500);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-sm w-full relative flex flex-col max-h-[90vh]" onClick={(e) => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900">Chat with {recipientName}</h3>
                    <button onClick={onClose} className="text-gray-600 hover:text-gray-900 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition" aria-label="Close chat">
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <div className="flex-grow p-4 overflow-y-auto space-y-3">
                    {messages.map((msg) => (
                        <div key={msg.id} className={`flex ${msg.sender === 'You' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] p-2 rounded-lg ${msg.sender === 'You' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    <div ref={messagesEndRef} />
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200 flex items-center gap-2">
                    <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Type your message..." className="flex-grow p-2 border rounded-md focus:outline-none focus:ring-1 focus:ring-black"/>
                    <button type="submit" className="bg-black text-white p-2 rounded-md hover:bg-gray-800 transition" aria-label="Send message">
                        <SendIcon className="h-5 w-5" />
                    </button>
                </form>
            </div>
        </div>
    );
};

// Share/Download Modal Component
const ShareDownloadModal = ({ savedLocations, onClose }) => {
    const generatePdf = async () => {
        const doc = new jsPDF();
        const margin = 10;
        let yOffset = margin;
        const lineHeight = 7;
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(18);
        doc.text("Your Saved Locations", doc.internal.pageSize.width / 2, yOffset, { align: 'center' });
        yOffset += 15;

        for (const location of savedLocations) {
            if (yOffset + 100 > pageHeight) {
                doc.addPage();
                yOffset = margin;
            }
            doc.setFontSize(14);
            doc.text(`${location.propertyType} in ${location.locationType}`, margin, yOffset);
            yOffset += lineHeight;
            doc.setFontSize(10);
            doc.text(`Age: ${location.age}`, margin, yOffset);
            yOffset += lineHeight;
            doc.text(`Rooms: ${location.rooms}`, margin, yOffset);
            yOffset += lineHeight;
            doc.text(`Parking: ${location.parking}`, margin, yOffset);
            yOffset += lineHeight;
            doc.text(`Interior: ${location.interior.substring(0, 100)}...`, margin, yOffset);
            yOffset += lineHeight;
            doc.text(`Exterior: ${location.exterior.substring(0, 100)}...`, margin, yOffset);
            yOffset += (lineHeight * 2);
            if (location.images && location.images.length > 0) {
                try {
                    const img = await loadImage(location.images[0]);
                    const canvas = await html2canvas(img, { scale: 2 });
                    const imgData = canvas.toDataURL('image/png');
                    const imgWidth = 50;
                    const imgHeight = (canvas.height * imgWidth) / canvas.width;
                    if (yOffset + imgHeight + 10 > pageHeight) {
                        doc.addPage();
                        yOffset = margin;
                    }
                    doc.addImage(imgData, 'PNG', margin, yOffset, imgWidth, imgHeight);
                    yOffset += (imgHeight + lineHeight);
                } catch (error) {
                    console.error("Error adding image to PDF:", error);
                }
            }
        }
        doc.save('saved_locations.pdf');
        alert('PDF of saved locations generated!');
        onClose();
    };

    const shareViaWhatsApp = () => {
        const text = savedLocations.map(loc => `${loc.propertyType} in ${loc.locationType} - ${loc.interior.substring(0, 50)}...`).join('\n\n');
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent("Check out these amazing locations on Project Disrupt:\n\n" + text)}`;
        window.open(whatsappUrl, '_blank');
        alert('Opening WhatsApp...');
        onClose();
    };

    const shareViaEmail = () => {
        const subject = "My Saved Locations from Project Disrupt";
        const body = savedLocations.map(loc => `Location: ${loc.propertyType} in ${loc.locationType}\nDescription: ${loc.interior}\n`).join('\n---\n');
        const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        window.open(mailtoUrl, '_blank');
        alert('Opening email client...');
        onClose();
    };

    const shareViaGoogleDrive = () => {
        alert("Google Drive integration would require backend authentication. (Simulated)");
        onClose();
    };

    const shareViaSmugBox = () => {
        alert("SmugBox integration would require specific API access. (Simulated)");
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full relative flex flex-col p-6 text-center" onClick={(e) => e.stopPropagation()}>
                <button onClick={onClose} className="absolute top-3 right-3 text-gray-600 hover:text-gray-900 z-10 p-1 rounded-full bg-gray-100 hover:bg-gray-200 transition" aria-label="Close">
                    <X className="h-6 w-6" />
                </button>
                <Share2 className="h-16 w-16 text-black mx-auto mb-4" />
                <h3 className="text-2xl font-bold text-gray-900 mb-4">Share & Download</h3>
                <p className="text-gray-700 mb-6">Choose how you'd like to share or download your saved locations list.</p>
                <div className="flex flex-col gap-3">
                    <button onClick={generatePdf} className="w-full bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition duration-150 ease-in-out flex items-center justify-center gap-2">
                        <Download className="h-5 w-5" /> Download as PDF
                    </button>
                    <button onClick={shareViaWhatsApp} className="w-full bg-green-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-green-600 transition duration-150 ease-in-out flex items-center justify-center gap-2">
                        <MessageSquareText className="h-5 w-5" /> Share via WhatsApp
                    </button>
                    <button onClick={shareViaEmail} className="w-full bg-blue-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-blue-600 transition duration-150 ease-in-out flex items-center justify-center gap-2">
                        <Mail className="h-5 w-5" /> Share via Email
                    </button>
                    <button onClick={shareViaGoogleDrive} className="w-full bg-orange-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-orange-600 transition duration-150 ease-in-out flex items-center justify-center gap-2">
                        <HardDrive className="h-5 w-5" /> Share to Google Drive
                    </button>
                    <button onClick={shareViaSmugBox} className="w-full bg-purple-500 text-white px-6 py-3 rounded-md font-semibold hover:bg-purple-600 transition duration-150 ease-in-out flex items-center justify-center gap-2">
                        <Box className="h-5 w-5" /> Share to SmugBox
                    </button>
                </div>
            </div>
        </div>
    );
};


export default function SavedLocations() {
    const { auth, db } = useContext(AppContext);
    const [savedLocations, setSavedLocations] = useState(() => {
        try {
            const storedLocations = localStorage.getItem('savedLocations');
            return storedLocations ? JSON.parse(storedLocations) : [];
        } catch (error) {
            console.error("Failed to parse saved locations from localStorage:", error);
            return [];
        }
    });

    useEffect(() => {
        try {
            localStorage.setItem('savedLocations', JSON.stringify(savedLocations));
        } catch (error) {
            console.error("Failed to save locations to localStorage:", error);
        }
    }, [savedLocations]);

    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
    const [selectedLocation, setSelectedLocation] = useState(null);
    const [isShareDownloadModalOpen, setIsShareDownloadModalOpen] = useState(false);
    const [isChatModalOpen, setIsChatModalOpen] = useState(false);
    const [chatRecipientName, setChatRecipientName] = useState('');

    const openChatModal = (recipient) => {
        setChatRecipientName(recipient);
        setIsChatModalOpen(true);
    };

    const closeChatModal = () => {
        setIsChatModalOpen(false);
        setChatRecipientName('');
    };

    const handleRemoveSaved = (id) => {
        setSavedLocations(savedLocations.filter(location => location.id !== id));
        console.log(`Location with ID ${id} removed from saved list.`);
    };

    const openLocationDetails = (location) => {
        setSelectedLocation(location);
        setIsDetailsModalOpen(true);
    };

    const closeLocationDetails = () => {
        setIsDetailsModalOpen(false);
        setSelectedLocation(null);
    };

    const openShareDownloadModal = () => {
        setIsShareDownloadModalOpen(true);
    };

    const closeShareDownloadModal = () => {
        setIsShareDownloadModalOpen(false);
    };

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">Your Saved Locations</h2>
            {savedLocations.length > 0 && (
                <div className="text-center mb-6">
                    <button onClick={openShareDownloadModal} className="bg-black text-white px-6 py-3 rounded-md font-semibold hover:bg-gray-800 transition duration-150 ease-in-out flex items-center justify-center mx-auto gap-2">
                        <Share2 className="h-5 w-5" /> Share / Download All
                    </button>
                </div>
            )}
            {savedLocations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedLocations.map((location) => (
                        <div key={location.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            {location.images && location.images.length > 0 && (
                                <img
                                    src={location.images[0]}
                                    alt={`Image of ${location.propertyType}`}
                                    className="w-full h-48 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => openLocationDetails(location)}
                                    onError={(e) => { e.target.onerror = null; e.target.src = "https://placehold.co/600x400/E0E0E0/333333?text=Image+Missing"; }}
                                />
                            )}
                            <div className="p-4">
                                <h4 className="text-xl font-semibold mb-2">{location.propertyType} in {location.locationType}</h4>
                                <p className="text-gray-700 mb-1"><span className="font-medium">Age:</span> {location.age}</p>
                                <p className="text-gray-700 mb-1"><span className="font-medium">Rooms:</span> {location.rooms}</p>
                                <p className="text-gray-700 text-sm mt-2">{location.interior.substring(0, 100)}...</p>
                                <div className="flex justify-between items-center mt-4">
                                    <button onClick={() => openLocationDetails(location)} className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800 flex items-center justify-center gap-1">
                                        <Eye className="h-4 w-4" /> View Details
                                    </button>
                                    <button onClick={() => handleRemoveSaved(location.id)} className="text-red-600 hover:text-red-800 font-medium flex items-center justify-center gap-1">
                                        <Trash2 className="h-4 w-4" /> Remove
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-600">You haven't saved any locations yet. Start searching to find some!</p>
            )}
            {isDetailsModalOpen && selectedLocation && (
                <LocationDetailsModal
                    location={selectedLocation}
                    onClose={closeLocationDetails}
                    onMessageOwnerClick={openChatModal}
                />
            )}
            {isShareDownloadModalOpen && (
                <ShareDownloadModal
                    savedLocations={savedLocations}
                    onClose={closeShareDownloadModal}
                />
            )}
            {isChatModalOpen && (
                <ChatModal
                    recipientName={chatRecipientName}
                    onClose={closeChatModal}
                />
            )}
        </div>
    );
}