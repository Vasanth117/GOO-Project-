import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Edit, Info, Phone, Video, Image, Heart, 
    Smile, Send, MoreVertical, ChevronLeft, Check, CheckCheck 
} from 'lucide-react';
import avatar1 from '../assets/images/9.jpg';

// Simulated Chat Data
const CHATS = [
    { 
        id: 1, name: 'Amit Patel', lastMsg: 'The organic fertilizer is arriving at 10 AM.', 
        time: '2m', active: true, unread: 2, avatar: avatar1, status: 'online' 
    },
    { 
        id: 2, name: 'Priya Sharma', lastMsg: 'Sent you a photo', 
        time: '14m', active: false, unread: 0, avatar: avatar1, status: 'away' 
    },
    { 
        id: 3, name: 'Suresh Kumar', lastMsg: 'Can you check the soil moisture levels?', 
        time: '1h', active: false, unread: 0, avatar: avatar1, status: 'offline' 
    },
    { 
        id: 4, name: 'Rajesh G.', lastMsg: 'Let’s meet at the sector 7 pump tomorrow.', 
        time: 'Yesterday', active: false, unread: 0, avatar: avatar1, status: 'online' 
    },
    { 
        id: 5, name: 'Kiran Rao', lastMsg: 'Your harvest looks amazing! 🌿', 
        time: 'Yesterday', active: false, unread: 0, avatar: avatar1, status: 'offline' 
    },
];

const INITIAL_MESSAGES = [
    { id: 101, sender: 'them', text: 'Hey there! How is the harvest going?', time: '10:45 AM' },
    { id: 102, sender: 'me', text: 'It is going great! Just finished the western sector.', time: '10:46 AM' },
    { id: 103, sender: 'them', text: 'Awesome. Did you notice the sudden drop in moisture levels?', time: '10:47 AM' },
    { id: 104, sender: 'me', text: 'Yes, setting up the drip irrigation now.', time: '10:48 AM' },
];

const MessagesPage = () => {
    const [selectedChat, setSelectedChat] = useState(CHATS[0]);
    const [messages, setMessages] = useState(INITIAL_MESSAGES);
    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef(null);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        const msg = {
            id: Date.now(),
            sender: 'me',
            text: newMessage,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setMessages([...messages, msg]);
        setNewMessage('');

        // Simulate reply
        setTimeout(() => {
            const reply = {
                id: Date.now() + 1,
                sender: 'them',
                text: 'Got it! I will check the pump status in sector 7 too.',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };
            setMessages(prev => [...prev, reply]);
        }, 1500);
    };

    return (
        <div className="messages-layout">
            {/* ── LEFT SIDEBAR: CHAT LIST ── */}
            <div className="messages-sidebar">
                <div className="ms-header">
                    <div className="ms-title-row">
                        <h3>{/* user.name */} Your Messages</h3>
                        <button className="btn-icon-ms"><Edit size={20} /></button>
                    </div>
                </div>

                <div className="ms-search-box">
                    <div className="ms-search-inner">
                        <Search size={16} color="#888" />
                        <input type="text" placeholder="Search friends, groups..." />
                    </div>
                </div>

                <div className="ms-list">
                    {CHATS.map(chat => (
                        <div 
                            key={chat.id} 
                            className={`ms-card ${selectedChat.id === chat.id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="ms-avatar-wrap">
                                <img src={chat.avatar} alt="a" />
                                {chat.status === 'online' && <div className="ms-status-dot" />}
                            </div>
                            <div className="ms-info">
                                <div className="ms-name-row">
                                    <strong>{chat.name}</strong>
                                    <span>{chat.time}</span>
                                </div>
                                <div className="ms-msg-row">
                                    <p className={chat.unread > 0 ? 'unread' : ''}>{chat.lastMsg}</p>
                                    {chat.unread > 0 && <div className="ms-unread-badge">{chat.unread}</div>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* ── RIGHT COLUMN: ACTIVE CHAT ── */}
            <div className="messages-chat-view">
                {selectedChat ? (
                    <div className="chat-container">
                        {/* CHAT HEADER */}
                        <div className="chat-header">
                            <div className="chat-user-info">
                                <div className="cv-avatar-wrap">
                                    <img src={selectedChat.avatar} alt="u" />
                                    {selectedChat.status === 'online' && <div className="cv-status" />}
                                </div>
                                <div className="cv-details">
                                    <h4>{selectedChat.name}</h4>
                                    <span>{selectedChat.status === 'online' ? 'Active now' : 'Active ' + selectedChat.time + ' ago'}</span>
                                </div>
                            </div>
                            <div className="chat-actions">
                                <button className="btn-chat-tool"><Phone size={20} /></button>
                                <button className="btn-chat-tool"><Video size={20} /></button>
                                <button className="btn-chat-tool"><Info size={20} /></button>
                            </div>
                        </div>

                        {/* MESSAGE HISTORY */}
                        <div className="chat-history">
                            <div className="chat-date-separator">Today</div>
                            {messages.map((msg, idx) => (
                                <motion.div 
                                    key={msg.id}
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    className={`msg-bubble-wrap ${msg.sender}`}
                                >
                                    <div className="msg-bubble">
                                        <p>{msg.text}</p>
                                    </div>
                                    <div className="msg-meta">
                                        <span>{msg.time}</span>
                                        {msg.sender === 'me' && <CheckCheck size={12} color="#3897f0" />}
                                    </div>
                                </motion.div>
                            ))}
                            <div ref={chatEndRef} />
                        </div>

                        {/* MESSAGE INPUT */}
                        <div className="chat-input-area">
                            <form className="chat-input-inner" onSubmit={handleSendMessage}>
                                <button type="button" className="btn-ms-alt"><Smile size={22} /></button>
                                <input 
                                    type="text" 
                                    placeholder="Message..." 
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                />
                                {newMessage.trim() === '' ? (
                                    <div className="chat-input-tools">
                                        <button type="button" className="btn-ms-alt"><Image size={22} /></button>
                                        <button type="button" className="btn-ms-alt"><Heart size={22} /></button>
                                    </div>
                                ) : (
                                    <button type="submit" className="btn-send-msg">Send</button>
                                )}
                            </form>
                        </div>
                    </div>
                ) : (
                    <div className="empty-chat-state">
                        <div className="empty-circle">
                            <MessageSquare size={48} color="#aaa" />
                        </div>
                        <h2>Your Messages</h2>
                        <p>Send photos and private messages to a friend or group.</p>
                        <button className="btn-primary-ms">Send Message</button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
