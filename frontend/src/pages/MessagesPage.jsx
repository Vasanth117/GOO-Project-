import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Search, Edit, Info, Phone, Video, Image, Heart, 
    Smile, Send, MoreVertical, ChevronLeft, Check, CheckCheck, Loader2
} from 'lucide-react';
import avatar1 from '../assets/images/9.jpg';

import { apiService } from '../services/apiService';

const MessagesPage = () => {
    const [chats, setChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const chatEndRef = useRef(null);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiService.getChats();
                setChats(data || []);
                if (data && data.length > 0) setSelectedChat(data[0]);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    useEffect(() => {
        if (!selectedChat) return;
        const fetchMessages = async () => {
            try {
                const data = await apiService.getMessageHistory(selectedChat.id);
                setMessages(data || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchMessages();
    }, [selectedChat]);

    const scrollToBottom = () => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        const content = newMessage;
        setNewMessage('');

        try {
            await apiService.sendMessage(selectedChat.id, content);
            setMessages(prev => [...prev, { id: Date.now(), sender: 'me', text: content, time: 'Now' }]);
        } catch (err) {
            console.error(err);
        }
    };

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

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
                    {chats.map(chat => (
                        <div 
                            key={chat.id} 
                            className={`ms-card ${selectedChat?.id === chat.id ? 'active' : ''}`}
                            onClick={() => setSelectedChat(chat)}
                        >
                            <div className="ms-avatar-wrap">
                                <img src={chat.avatar || avatar1} alt="a" />
                                {chat.status === 'online' && <div className="ms-status-dot" />}
                            </div>
                            <div className="ms-info">
                                <div className="ms-name-row">
                                    <strong>{chat.name || 'Anonymous User'}</strong>
                                    <span>{chat.time || ''}</span>
                                </div>
                                <div className="ms-msg-row">
                                    <p className={chat.unread > 0 ? 'unread' : ''}>{chat.lastMsg || 'No messages yet'}</p>
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
