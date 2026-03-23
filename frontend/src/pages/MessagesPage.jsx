import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, Search, MessageSquare, User, MoreVertical, 
    Image as ImageIcon, Smile, ArrowLeft, Phone, Video,
    Check, CheckCheck, Inbox, Flame, Award, Loader2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const WS_BASE = 'ws://localhost:8000/api/v1/messages/ws';

const MessagesPage = () => {
    const { user } = useAuth();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        fetchInbox();
        setupWebSocket();
        return () => ws.current?.close();
    }, []);

    useEffect(() => {
        if (activeChat) {
            fetchHistory(activeChat.user_id);
        }
    }, [activeChat]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const setupWebSocket = () => {
        if (!user?.id) return;
        ws.current = new WebSocket(`${WS_BASE}/${user.id}`);
        
        ws.current.onmessage = (event) => {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message') {
                const msg = payload.data;
                // If it's from the person we are currently chatting with, add to messages
                if (activeChat && msg.sender_id === activeChat.user_id) {
                    setMessages(prev => [...prev, {
                        id: msg.id,
                        sender_id: msg.sender_id,
                        content: msg.content,
                        created_at: msg.created_at
                    }]);
                }
                // Refresh inbox to show preview/unread
                fetchInbox();
            }
        };

        ws.current.onclose = () => {
            setTimeout(setupWebSocket, 3000); // Reconnect
        };
    };

    const fetchInbox = async () => {
        try {
            const res = await apiService.getChats();
            const data = res.data || [];
            setChats(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch inbox:", err);
            setLoading(false);
        }
    };

    const fetchHistory = async (otherId) => {
        try {
            const res = await apiService.getMessageHistory(otherId);
            setMessages(res.data || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const content = newMessage.trim();
        setNewMessage('');

        // Optimistic update
        const tempId = Date.now().toString();
        const optimisticMsg = {
            id: tempId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            status: 'sending'
        };
        setMessages(prev => [...prev, optimisticMsg]);

        try {
            const res = await apiService.sendMessage(activeChat.user_id, content);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.data.id, status: 'sent' } : m));
            fetchInbox(); // Refresh preview
        } catch (err) {
            console.error("Failed to send:", err);
            setMessages(prev => prev.filter(m => m.id !== tempId));
        }
    };

    const filteredChats = chats.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (loading) return (
        <div className="messages-loading-state">
            <Loader2 className="spinner" size={40} />
            <p>Syncing your farm network...</p>
        </div>
    );

    return (
        <div className="messages-layout-v2">
            {/* Sidebar */}
            <div className={`ms-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="ms-header">
                    <h2>Messages</h2>
                    <div className="ms-search-box">
                        <Search size={18} />
                        <input 
                            type="text" 
                            placeholder="Search farmers..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                <div className="ms-list">
                    {filteredChats.length === 0 ? (
                        <div className="empty-chats">
                            <Inbox size={48} />
                            <p>No messages yet.<br/>Start a conversation with nearby farmers!</p>
                        </div>
                    ) : (
                        filteredChats.map(chat => (
                            <div 
                                key={chat.user_id} 
                                className={`ms-item ${activeChat?.user_id === chat.user_id ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
                                onClick={() => setActiveChat(chat)}
                            >
                                <div className="ms-avatar">
                                    {chat.avatar ? (
                                        <img src={chat.avatar} alt={chat.name} />
                                    ) : (
                                        <div className="avatar-placeholder">{chat.name[0]}</div>
                                    )}
                                    {chat.unread && <div className="unread-dot"></div>}
                                </div>
                                <div className="ms-info">
                                    <div className="ms-name-row">
                                        <span className="ms-name">{chat.name}</span>
                                        <span className="ms-time">
                                            {new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="ms-preview">{chat.last_message}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window */}
            <div className={`ms-chat-window ${!activeChat ? 'no-selection' : ''}`}>
                {activeChat ? (
                    <>
                        <div className="chat-header">
                            <button className="back-btn" onClick={() => setActiveChat(null)}>
                                <ArrowLeft size={20} />
                            </button>
                            <div className="active-user-info">
                                <div className="header-avatar">
                                    {activeChat.avatar ? (
                                        <img src={activeChat.avatar} alt={activeChat.name} />
                                    ) : (
                                        <div className="avatar-placeholder">{activeChat.name[0]}</div>
                                    )}
                                </div>
                                <div className="header-text">
                                    <h3>{activeChat.name}</h3>
                                    <span className="user-status">Active now</span>
                                </div>
                            </div>
                            <div className="header-actions">
                                <button className="tool-btn"><Phone size={20} /></button>
                                <button className="tool-btn"><Video size={20} /></button>
                                <button className="tool-btn"><MoreVertical size={20} /></button>
                            </div>
                        </div>

                        <div className="chat-history-stream">
                            <div className="chat-intro-card">
                                <div className="intro-avatar">
                                    {activeChat.avatar ? <img src={activeChat.avatar} alt={activeChat.name} /> : <div className="avatar-placeholder-large">{activeChat.name[0]}</div>}
                                </div>
                                <h2>{activeChat.name}</h2>
                                <p>Farmer • Network Member</p>
                                <div className="intro-badges">
                                    <span className="badge-pill expert"><Award size={12}/> Top Contributor</span>
                                    <span className="badge-pill streak"><Flame size={12}/> 15 Day Streak</span>
                                </div>
                                <button className="btn-view-profile" onClick={() => window.location.href = `/profile/${activeChat.user_id}`}>View Profile</button>
                            </div>

                            {messages.map((msg, i) => {
                                const isMe = msg.sender_id === user?.id;
                                const showAvatar = !isMe && (i === 0 || messages[i-1].sender_id !== msg.sender_id);
                                
                                return (
                                    <div key={msg.id} className={`msg-bubble-wrap ${isMe ? 'own-msg' : 'other-msg'} ${!showAvatar && !isMe ? 'no-avatar' : ''}`}>
                                        {showAvatar && (
                                            <div className="msg-avatar">
                                                {activeChat.avatar ? <img src={activeChat.avatar} alt="" /> : <div className="mini-avatar">{activeChat.name[0]}</div>}
                                            </div>
                                        )}
                                        <div className="msg-bubble-group">
                                            <motion.div 
                                                className="bubble"
                                                initial={{ scale: 0.9, opacity: 0, y: 10 }}
                                                animate={{ scale: 1, opacity: 1, y: 0 }}
                                            >
                                                {msg.content}
                                            </motion.div>
                                            {isMe && i === messages.length - 1 && (
                                                <div className="status-indicator">
                                                    {msg.status === 'sending' ? 'Sending...' : <CheckCheck size={12} />}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                            <div ref={messagesEndRef} />
                        </div>

                        <form className="chat-input-row" onSubmit={handleSendMessage}>
                            <button type="button" className="input-tool"><ImageIcon size={20} /></button>
                            <button type="button" className="input-tool"><Smile size={20} /></button>
                            <input 
                                type="text" 
                                placeholder="Message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            {newMessage.trim() === '' ? (
                                <div className="input-tools-right">
                                    <button type="button" className="input-tool"><Phone size={20} /></button>
                                </div>
                            ) : (
                                <button type="submit" className="send-action-btn">Send</button>
                            )}
                        </form>
                    </>
                ) : (
                    <div className="ms-placeholder">
                        <div className="placeholder-content">
                            <div className="icon-badge">
                                <MessageSquare size={40} />
                            </div>
                            <h2>Your Direct Messages</h2>
                            <p>Send private photos and messages to a fellow farmer.</p>
                            <button className="primary-chat-btn" onClick={() => window.location.href = '/community'}>New Message</button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default MessagesPage;
