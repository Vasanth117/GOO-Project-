import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Send, Search, MessageSquare, User, MoreVertical, 
    Image as ImageIcon, Smile, ArrowLeft, Phone, Video,
    Check, CheckCheck, Inbox, Flame, Award, Loader2, Plus, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const MessagesPage = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [chats, setChats] = useState([]);
    const [activeChat, setActiveChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const ws = useRef(null);
    const messagesEndRef = useRef(null);
    const [showNewChatModal, setShowNewChatModal] = useState(false);
    const [connections, setConnections] = useState([]);
    const [loadingConnections, setLoadingConnections] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        fetchInbox();
        const interval = setInterval(fetchInbox, 10000); // Poll inbox every 10s
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (!user) return;
        
        const token = localStorage.getItem('access_token');
        const socket = new WebSocket(`ws://localhost:8000/api/v1/messages/ws/${user.id}`);
        
        socket.onopen = () => console.log('WebSocket Connected');
        socket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            if (data.type === 'new_message') {
                if (activeChat && String(data.data.sender_id) === String(activeChat.user_id)) {
                    setMessages(prev => [...prev, data.data]);
                }
                fetchInbox();
            }
        };
        
        ws.current = socket;
        return () => socket.close();
    }, [user, activeChat]);

    useEffect(() => {
        if (activeChat) {
            fetchHistory(activeChat.user_id);
        }
    }, [activeChat]);

    const fetchInbox = async () => {
        try {
            const res = await apiService.getChats();
            const data = (res.data || res) || [];
            setChats(data);
            setLoading(false);
        } catch (err) {
            console.error("Failed to fetch inbox:", err);
            setLoading(false);
        }
    };

    const fetchConnections = async () => {
        if (!user?.id) return;
        setLoadingConnections(true);
        try {
            const [followers, following] = await Promise.all([
                apiService.getFollowers(user.id),
                apiService.getFollowing(user.id)
            ]);
            
            const all = [...(followers.users || []), ...(following.users || [])];
            const unique = [];
            const ids = new Set();
            
            all.forEach(u => {
                if (!ids.has(u.id)) {
                    ids.add(u.id);
                    unique.push({
                        user_id: u.id,
                        name: u.name,
                        avatar: u.profile_picture ? `http://localhost:8000${u.profile_picture}` : null
                    });
                }
            });
            
            setConnections(unique);
        } catch (err) {
            console.error("Failed to fetch connections:", err);
        } finally {
            setLoadingConnections(false);
        }
    };

    const fetchHistory = async (otherId) => {
        try {
            const res = await apiService.getMessageHistory(otherId);
            setMessages(res || []);
        } catch (err) {
            console.error("Failed to fetch history:", err);
        }
    };

    const handleSendMessage = async (e) => {
        if (e) e.preventDefault();
        if (!newMessage.trim() || !activeChat) return;

        const content = newMessage.trim();
        const tempId = Date.now().toString();
        
        // Optimistic update
        const optimisticMsg = {
            id: tempId,
            sender_id: user.id,
            content: content,
            created_at: new Date().toISOString(),
            status: 'sending'
        };
        setMessages(prev => [...prev, optimisticMsg]);
        setNewMessage('');

        try {
            const res = await apiService.sendMessage(activeChat.user_id, content);
            setMessages(prev => prev.map(m => m.id === tempId ? { ...m, id: res.id, status: 'sent' } : m));
            fetchInbox();
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
            <Loader2 className="spinner" size={40} color="var(--color-primary)" />
            <p style={{ fontWeight: 800, color: 'var(--color-text-3)' }}>Syncing your farm network...</p>
        </div>
    );

    return (
        <div className="messages-layout-v2">
            {/* Sidebar */}
            <div className={`ms-sidebar ${activeChat ? 'mobile-hidden' : ''}`}>
                <div className="ms-header">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                        <h2 style={{ margin: 0 }}>Messages</h2>
                        <button 
                            className="new-chat-btn" 
                            onClick={() => { fetchConnections(); setShowNewChatModal(true); }}
                            style={{ 
                                background: 'var(--color-primary)', 
                                color: 'white', 
                                border: 'none', 
                                borderRadius: '50%', 
                                width: '32px', 
                                height: '32px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                cursor: 'pointer'
                            }}
                        >
                            <Plus size={18} />
                        </button>
                    </div>
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
                    {filteredChats.map(chat => {
                        const avatarUrl = chat.avatar ? (chat.avatar.startsWith('http') ? chat.avatar : `http://localhost:8000${chat.avatar}`) : null;
                        return (
                            <div 
                                key={chat.user_id} 
                                className={`ms-item ${activeChat?.user_id === chat.user_id ? 'active' : ''} ${chat.unread ? 'unread' : ''}`}
                                onClick={() => setActiveChat(chat)}
                            >
                                <div className="ms-avatar">
                                    {avatarUrl ? <img src={avatarUrl} alt="" /> : <div className="avatar-placeholder">{chat.name[0]}</div>}
                                    {chat.unread && <div className="unread-dot" />}
                                </div>
                                <div className="ms-info">
                                    <div className="ms-name-row">
                                        <span className="ms-name">{chat.name}</span>
                                        <span className="ms-time">{new Date(chat.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                    </div>
                                    <div className="ms-preview">{chat.last_message}</div>
                                </div>
                            </div>
                        );
                    })}
                    {filteredChats.length === 0 && (
                        <div style={{ textAlign: 'center', padding: '40px', color: '#888' }}>
                            No messages found.
                        </div>
                    )}
                </div>
            </div>

            {/* Chat Area */}
            {activeChat ? (
                <div className="ms-chat-window">
                    <div className="chat-header">
                        <div className="active-user-info" onClick={() => navigate(`/profile/${activeChat.user_id}`)} style={{ cursor: 'pointer' }}>
                            <button className="tool-btn mobile-only" onClick={(e) => { e.stopPropagation(); setActiveChat(null); }}><ArrowLeft size={20} /></button>
                            <div className="header-avatar">
                                {activeChat.avatar ? <img src={activeChat.avatar.startsWith('http') ? activeChat.avatar : `http://localhost:8000${activeChat.avatar}`} alt="" /> : <div className="avatar-placeholder">{activeChat.name[0]}</div>}
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
                                {activeChat.avatar ? <img src={activeChat.avatar.startsWith('http') ? activeChat.avatar : `http://localhost:8000${activeChat.avatar}`} alt="" /> : <div className="avatar-placeholder-large">{activeChat.name[0]}</div>}
                            </div>
                            <h2 style={{ margin: 0, fontWeight: 950 }}>{activeChat.name}</h2>
                            <p style={{ color: '#666', fontWeight: 600, fontSize: '0.9rem' }}>Farmer · Network Member</p>
                            <div className="intro-badges">
                                <div className="badge-pill expert"><Award size={14} /> Top Contributor</div>
                                <div className="badge-pill streak"><Flame size={14} /> 15 Day Streak</div>
                            </div>
                            <button className="btn-view-profile" onClick={() => navigate(`/profile/${activeChat.user_id}`)}>View Profile</button>
                        </div>

                        {messages.map((m, i) => {
                            const isOwn = String(m.sender_id) === String(user.id);
                            const otherAvatarUrl = activeChat.avatar ? (activeChat.avatar.startsWith('http') ? activeChat.avatar : `http://localhost:8000${activeChat.avatar}`) : null;
                            return (
                                <div key={m.id || i} className={`msg-bubble-wrap ${isOwn ? 'own-msg' : 'other-msg'}`}>
                                    {!isOwn && (
                                        <div className="msg-avatar">
                                            {otherAvatarUrl ? <img src={otherAvatarUrl} alt="" /> : <div className="mini-avatar">{activeChat.name[0]}</div>}
                                        </div>
                                    )}
                                    <div className="msg-bubble-group">
                                        <div className="bubble">
                                            {m.content}
                                        </div>
                                        <div className="status-indicator">
                                            {new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>

                    <div className="chat-input-row">
                        <button className="input-tool"><ImageIcon size={22} /></button>
                        <button className="input-tool"><Smile size={22} /></button>
                        <form onSubmit={handleSendMessage} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <input 
                                type="text" 
                                placeholder="Message..." 
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                            />
                            <button type="submit" className="send-action-btn" disabled={!newMessage.trim()}>Send</button>
                        </form>
                    </div>
                </div>
            ) : (
                <div className="ms-chat-window no-selection">
                    <div className="ms-placeholder">
                        <div className="icon-badge"><MessageSquare size={40} /></div>
                        <h2>Your Messages</h2>
                        <p>Send private photos and messages to a fellow farmer.</p>
                        <button className="primary-chat-btn" onClick={() => { fetchConnections(); setShowNewChatModal(true); }}>Send Message</button>
                    </div>
                </div>
            )}

            {/* New Chat Modal */}
            <AnimatePresence>
                {showNewChatModal && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        style={{ 
                            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            zIndex: 2000, backdropFilter: 'blur(4px)' 
                        }}
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            style={{ 
                                background: 'white', borderRadius: '32px', width: '100%', 
                                maxWidth: '400px', maxHeight: '80vh', display: 'flex', 
                                flexDirection: 'column', overflow: 'hidden' 
                            }}
                        >
                            <div style={{ padding: '24px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <h3 style={{ margin: 0, fontWeight: 900 }}>New Message</h3>
                                <button onClick={() => setShowNewChatModal(false)} style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#888' }}><X size={20} /></button>
                            </div>

                            <div style={{ padding: '12px 24px', borderBottom: '1px solid #fcfcfc' }}>
                                <div style={{ 
                                    display: 'flex', alignItems: 'center', gap: '10px', 
                                    background: '#f8faf8', padding: '10px 16px', borderRadius: '12px' 
                                }}>
                                    <Search size={16} color="#aaa" />
                                    <input 
                                        type="text" 
                                        placeholder="Search followers or following..." 
                                        style={{ border: 'none', background: 'none', outline: 'none', width: '100%', fontSize: '0.9rem', fontWeight: 600 }}
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                            </div>
                            
                            <div style={{ flex: 1, overflowY: 'auto', padding: '16px' }}>
                                {loadingConnections ? (
                                    <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><Loader2 className="spinner" /></div>
                                ) : (
                                    connections
                                    .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                    .length === 0 ? (
                                        <p style={{ textAlign: 'center', color: '#888', padding: '40px' }}>No connections found.<br/>Try following more people!</p>
                                    ) : (
                                        connections
                                        .filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map(u => (
                                            <div 
                                                key={u.user_id} 
                                                style={{ 
                                                    display: 'flex', alignItems: 'center', gap: '15px', 
                                                    padding: '12px', borderRadius: '16px', cursor: 'pointer',
                                                    transition: '0.2s', border: '1px solid transparent'
                                                }}
                                                onClick={() => {
                                                    setActiveChat(u);
                                                    setShowNewChatModal(false);
                                                    setSearchQuery('');
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.background = '#fcfdfc'}
                                                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                            >
                                                <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#eee', overflow: 'hidden' }}>
                                                    {u.avatar ? <img src={u.avatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, background: 'var(--color-primary-soft)', color: 'var(--color-primary)' }}>{u.name[0]}</div>}
                                                </div>
                                                <div style={{ fontWeight: 800 }}>{u.name}</div>
                                            </div>
                                        ))
                                    )
                                )}
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MessagesPage;
