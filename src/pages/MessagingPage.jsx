// src/pages/MessagingPage.jsx
import React, { useState, useRef, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Paperclip, FileText } from 'lucide-react';
import { FirebaseContext } from '../App';
import { collection, addDoc, serverTimestamp, query, orderBy, where, onSnapshot } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

const MessagingPage = () => {
    const { locationId } = useParams();
    const navigate = useNavigate();
    const { auth, db, storage } = useContext(FirebaseContext);

    const [loading, setLoading] = useState(true);
    const [messageText, setMessageText] = useState('');
    const [messages, setMessages] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isSending, setIsSending] = useState(false);
    const messagesEndRef = useRef(null);

    // Placeholder data (should be fetched from DB)
    const locationData = {
        title: "Victorian House 1",
        ownerId: "owner_123" // Placeholder owner ID
    };

    // Fetch messages from Firestore in real-time
    useEffect(() => {
        const q = query(collection(db, 'messages'), orderBy('createdAt'));
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const fetchedMessages = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setMessages(fetchedMessages);
            setLoading(false);
        });
        return () => unsubscribe();
    }, [db, locationId]);

    const handleSendMessage = async () => {
        if (!auth.currentUser) {
            alert('You must be logged in to send a message.');
            return;
        }

        if (messageText.trim() === '' && !selectedFile) return;

        setIsSending(true);

        try {
            let fileURL = null;
            let fileName = null;

            if (selectedFile) {
                const fileRef = ref(storage, `attachments/${auth.currentUser.uid}/${selectedFile.name}`);
                await uploadBytes(fileRef, selectedFile);
                fileURL = await getDownloadURL(fileRef);
                fileName = selectedFile.name;
            }

            await addDoc(collection(db, 'messages'), {
                locationId: locationId,
                senderId: auth.currentUser.uid,
                text: messageText,
                file: fileURL,
                fileName: fileName,
                createdAt: serverTimestamp(),
            });

            setMessageText('');
            setSelectedFile(null);
        } catch (error) {
            console.error("Error sending message: ", error);
            alert("Failed to send message. Please try again.");
        } finally {
            setIsSending(false);
        }
    };

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const fileInputRef = useRef(null);

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            <div className="container mx-auto p-4 flex flex-col flex-1">
                <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-black transition mb-2">
                    <ChevronLeft className="h-5 w-5" /> Back to Search
                </button>
                <div className="bg-white rounded-lg shadow-lg flex flex-col flex-1 overflow-hidden">
                    <h1 className="text-xl font-bold text-gray-800 p-4 border-b border-gray-200">
                        Chat with Location Owner
                    </h1>
                    <div className="p-4 flex-1 overflow-y-auto space-y-4">
                        {loading ? (
                            <p className="text-center text-gray-500">Loading messages...</p>
                        ) : messages.length === 0 ? (
                            <p className="text-center text-gray-500">Start the conversation!</p>
                        ) : (
                            messages.map(msg => (
                                <div key={msg.id} className={`flex ${msg.senderId === auth.currentUser?.uid ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`p-3 rounded-lg max-w-sm ${msg.senderId === auth.currentUser?.uid ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-800'}`}>
                                        <p>{msg.text}</p>
                                        {msg.file && (
                                            <div className="mt-2 flex items-center space-x-2">
                                                <FileText className="h-4 w-4" />
                                                <a href={msg.file} target="_blank" rel="noopener noreferrer" className="text-sm underline">View Attachment</a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>
                    <div className="p-4 border-t border-gray-200 flex items-center space-x-2">
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                        />
                        <button onClick={() => fileInputRef.current.click()} className="p-3 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition">
                            <Paperclip className="h-5 w-5" />
                        </button>
                        {selectedFile && (
                            <span className="text-sm text-gray-600 truncate">{selectedFile.name}</span>
                        )}
                        <input
                            type="text"
                            placeholder="Type your message..."
                            value={messageText}
                            onChange={(e) => setMessageText(e.target.value)}
                            className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSendMessage();
                                }
                            }}
                            disabled={isSending}
                        />
                        <button 
                            onClick={handleSendMessage} 
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition"
                            disabled={isSending}
                        >
                            {isSending ? 'Sending...' : 'Send'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default MessagingPage;