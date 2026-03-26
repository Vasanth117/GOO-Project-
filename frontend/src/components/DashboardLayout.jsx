import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import {
    Home, Leaf, Trophy, ShoppingBag, Users, Map, Brain,
    Bell, MessageCircle, Search, Settings, LogOut, Award,
    Heart, MessageSquare, Globe, Target, LayoutDashboard,
    Bot, Image, ShoppingCart, User, Gift, Ticket, Camera, Loader2
} from 'lucide-react';
import logo from '../assets/images/logo.png';

const NAV_ITEMS = [
    { icon: Home,        label: 'Feed',        path: '/dashboard' },
    { icon: Leaf,        label: 'Missions',    path: '/missions'  },
    { icon: Trophy,      label: 'Leaderboard', path: '/leaderboard' },
    { icon: Ticket,      label: 'Rewards',     path: '/rewards'   },
    { icon: Brain,       label: 'AI Advisor',  path: '/ai'        },
    { icon: Users,       label: 'Community',   path: '/community' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: MessageSquare, label: 'Messages',    path: '/messages'  },
    { icon: Settings,    label: 'Settings',    path: '/settings'  },
];


const TOPBAR_TITLES = {
    '/dashboard':   { icon: LayoutDashboard, title: 'Farming Feed',       sub: 'Real activities from your community' },
    '/missions':    { icon: Target,          title: 'Missions & Tasks',    sub: 'Complete eco-challenges, earn XP & badges' },
    '/leaderboard': { icon: Trophy,          title: 'Leaderboard',         sub: 'Top eco-farmers in your region' },
    '/rewards':     { icon: Gift,            title: 'Rewards Hub',         sub: 'Redeem your points for savings' },
    '/ai':          { icon: Bot,             title: 'AI Advisor',          sub: 'Your personal smart farming assistant' },
    '/map':         { icon: Map,             title: 'Live Farm Map',       sub: 'Real-time farm discovery & live network' },
    '/community':   { icon: Users,           title: 'Community',           sub: 'Connect with farmers across India' },
    '/marketplace': { icon: ShoppingCart,    title: 'Marketplace',         sub: 'Buy & sell farming products' },
    '/messages':    { icon: MessageCircle,   title: 'Direct Messages',     sub: 'Private conversations with farmers' },
    '/settings':    { icon: Settings,        title: 'Settings',            sub: 'Manage your account & preferences' },
    '/profile':     { icon: User,            title: 'Your Profile',        sub: 'Manage your farming identity' },
};

const DashboardLayout = () => {
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    // ── SEARCH STATE ──
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [searchLoading, setSearchLoading] = useState(false);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);
    const searchTimeout = useRef(null);

    // ── NOTIFICATION STATE ──
    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [notifOpen, setNotifOpen] = useState(false);
    const [notifLoading, setNotifLoading] = useState(false);
    const ws = useRef(null);

    const currentPath = location.pathname;
    const pageInfo = TOPBAR_TITLES[currentPath] || { icon: Leaf, title: 'GOO', sub: '' };

    // ── INITIAL FETCH ──
    useEffect(() => {
        fetchNotifications();
    }, []);

    // ── REAL TIME CONNECTION ──
    useEffect(() => {
        if (!user?.id) return;

        const token = localStorage.getItem('access_token');
        const socket = new WebSocket(`ws://localhost:8000/api/v1/messages/ws/${user.id}`);
        
        socket.onopen = () => console.log('🟢 Real-time Gateway Connected');
        socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                console.log("📥 WS EVENT:", data);
                
                if (data.type === 'notification') {
                    setNotifications(prev => [data.data, ...prev]);
                    setUnreadCount(prev => prev + 1);
                }
            } catch (err) {
                console.error("WS Parse Error", err);
            }
        };

        ws.current = socket;
        return () => {
            if (socket.readyState === 1) socket.close();
        };
    }, [user?.id]);

    const fetchNotifications = async () => {
        setNotifLoading(true);
        try {
            const res = await apiService.getNotifications();
            const data = res.data || res;
            setUnreadCount(data.unread_count || 0);
            setNotifications([...(data.unread || []), ...(data.read || [])]);
        } catch (e) {
            console.error("Failed to fetch notifications", e);
        } finally {
            setNotifLoading(false);
        }
    };

    const handleMarkRead = async (id) => {
        try {
            await apiService.markNotificationRead(id);
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) { console.error(e); }
    };

    const handleMarkAllRead = async () => {
        try {
            await apiService.markAllNotificationsRead();
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (e) { console.error(e); }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const handleSearch = async (val) => {
        setSearchQuery(val);
        if (searchTimeout.current) clearTimeout(searchTimeout.current);
        
        if (!val.trim()) {
            setSearchResults([]);
            setShowSearchDropdown(false);
            return;
        }

        setShowSearchDropdown(true);
        setSearchLoading(true);

        searchTimeout.current = setTimeout(async () => {
            try {
                const res = await apiService.searchUsers(val);
                setSearchResults(res.users || []);
            } catch (err) {
                console.error("Search error", err);
            } finally {
                setSearchLoading(false);
            }
        }, 500);
    };

    const sidebarVariants = {
        collapsed: { width: 72 },
        expanded:  { width: 240 },
    };

    return (
        <div className="dashboard-root" style={{ display: 'flex', height: '100vh', background: '#fbfdfb', overflow: 'hidden' }}>
            <motion.aside
                className="sidebar"
                variants={sidebarVariants}
                animate={sidebarHovered ? 'expanded' : 'collapsed'}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
                style={{ background: 'white', borderRight: '1px solid #eeedeb', display: 'flex', flexDirection: 'column' }}
            >
                <div className="sidebar-logo" style={{ padding: '24px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12 }} onClick={() => navigate('/dashboard')}>
                    <motion.img src={logo} alt="GOO" style={{ width: 34, height: 34 }} whileHover={{ rotate: 360 }} />
                    <AnimatePresence>
                        {sidebarHovered && (
                            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontWeight: 900, fontSize: '1.7rem', color: '#2d5a27', letterSpacing: -2 }}>goo</motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <nav style={{ flex: 1, padding: '10px 0' }}>
                    {NAV_ITEMS.map((item, i) => {
                        const isActive = currentPath === item.path;
                        return (
                            <button
                                key={item.label}
                                onClick={() => navigate(item.path)}
                                style={{
                                    display: 'flex', alignItems: 'center', width: '100%', padding: '12px 24px', border: 'none', background: 'transparent',
                                    color: isActive ? '#2d5a27' : '#4a4d48', fontWeight: isActive ? 800 : 600, cursor: 'pointer', position: 'relative'
                                }}
                            >
                                <item.icon size={20} style={{ minWidth: 24 }} />
                                {sidebarHovered && <span style={{ marginLeft: 16 }}>{item.label}</span>}
                                {isActive && <div style={{ position: 'absolute', right: 0, width: 4, height: 20, background: '#2d5a27', borderRadius: '4px 0 0 4px' }} />}
                            </button>
                        );
                    })}
                </nav>

                <button onClick={handleLogout} style={{ padding: '24px', border: 'none', background: 'transparent', color: '#e63946', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                    <LogOut size={20} />
                    {sidebarHovered && <span style={{ marginLeft: 16 }}>Logout</span>}
                </button>
            </motion.aside>

            <div className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', background: '#fbfdfb', position: 'relative' }}>
                <header style={{ height: 76, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #eeedeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 1000 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <pageInfo.icon size={20} color="#2d5a27" />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>{pageInfo.title}</h2>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>{pageInfo.sub}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="topbar-search-wrap" style={{ position: 'relative' }}>
                            <div className="topbar-search" style={{ background: '#f4f4f2', padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10, width: 280 }}>
                                <Search size={16} color="#aaa" />
                                <input 
                                    type="text" 
                                    placeholder="Search farmers..." 
                                    value={searchQuery}
                                    onChange={(e) => handleSearch(e.target.value)}
                                    onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
                                    style={{ background: 'transparent', border: 'none', fontSize: '0.85rem', outline: 'none', width: '100%', fontWeight: 600 }} 
                                />
                                {searchLoading && <Loader2 size={14} className="spinner" style={{ animation: 'spin 1s linear infinite' }} />}
                            </div>

                            <AnimatePresence>
                                {showSearchDropdown && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setShowSearchDropdown(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 5, scale: 0.95 }}
                                            style={{ 
                                                position: 'absolute', top: '120%', left: 0, right: 0, 
                                                background: 'white', borderRadius: 20, 
                                                boxShadow: '0 10px 40px rgba(0,0,0,0.12)',
                                                border: '1px solid #eeedeb', padding: '12px',
                                                zIndex: 999, maxHeight: 400, overflowY: 'auto'
                                            }}
                                        >
                                            {searchResults.length === 0 && !searchLoading ? (
                                                <div style={{ padding: '20px', textAlign: 'center', color: '#888', fontSize: '0.85rem', fontWeight: 700 }}>No farmers found.</div>
                                            ) : (
                                                searchResults.map(u => (
                                                    <div 
                                                        key={u.id} 
                                                        onClick={() => {
                                                            navigate(`/profile/${u.id}`);
                                                            setShowSearchDropdown(false);
                                                            setSearchQuery('');
                                                        }}
                                                        style={{ 
                                                            display: 'flex', alignItems: 'center', gap: 12, 
                                                            padding: '10px', borderRadius: 14, cursor: 'pointer',
                                                            transition: '0.2s'
                                                        }}
                                                        onMouseEnter={(e) => e.currentTarget.style.background = '#f4fdf4'}
                                                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                                                    >
                                                        <div style={{ width: 40, height: 40, borderRadius: '50%', overflow: 'hidden', background: '#eee' }}>
                                                            {u.profile_picture ? (
                                                                <img src={u.profile_picture.startsWith('http') ? u.profile_picture : `http://localhost:8000${u.profile_picture}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#2d5a27', color: 'white', fontWeight: 900 }}>{u.name[0]}</div>
                                                            )}
                                                        </div>
                                                        <div style={{ flex: 1 }}>
                                                            <div style={{ fontWeight: 900, fontSize: '0.9rem', color: '#1a1c19' }}>{u.name}</div>
                                                            <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 700 }}>{u.role || 'Farmer'}</div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Notifications */}
                        <div style={{ position: 'relative' }}>
                            <div 
                                onClick={() => setNotifOpen(!notifOpen)}
                                style={{ position: 'relative', cursor: 'pointer', padding: 8, borderRadius: 12, transition: '0.2s', background: notifOpen ? '#f4fdf4' : 'transparent' }}
                            >
                                <Bell size={20} color={notifOpen ? '#2d5a27' : 'currentColor'} />
                                {unreadCount > 0 && (
                                    <div style={{ position: 'absolute', top: 4, right: 4, width: 14, height: 14, background: '#e63946', borderRadius: '50%', color: 'white', fontSize: '0.62rem', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid white' }}>
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </div>
                                )}
                            </div>

                            <AnimatePresence>
                                {notifOpen && (
                                    <>
                                        <div style={{ position: 'fixed', inset: 0, zIndex: 998 }} onClick={() => setNotifOpen(false)} />
                                        <motion.div 
                                            initial={{ opacity: 0, y: 10, x: -100 }}
                                            animate={{ opacity: 1, y: 0, x: -280 }}
                                            exit={{ opacity: 0, y: 5 }}
                                            style={{ 
                                                position: 'absolute', top: '140%', width: 340, 
                                                background: 'white', borderRadius: 24, 
                                                boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
                                                border: '1px solid #eeedeb', overflow: 'hidden',
                                                zIndex: 999
                                            }}
                                        >
                                            <div style={{ padding: '20px', borderBottom: '1px solid #eeedeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#fbfdfb' }}>
                                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Notifications</h3>
                                                <button onClick={handleMarkAllRead} style={{ background: 'transparent', border: 'none', color: '#2d5a27', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}>Mark all read</button>
                                            </div>
                                            <div style={{ maxHeight: 400, overflowY: 'auto' }}>
                                                {notifLoading ? (
                                                    <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="spinner" /></div>
                                                ) : notifications.length === 0 ? (
                                                    <div style={{ padding: 60, textAlign: 'center', color: '#888' }}>
                                                        <Bell size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
                                                        <div style={{ fontWeight: 700, fontSize: '0.85rem' }}>No new alerts</div>
                                                    </div>
                                                ) : (
                                                    notifications.map(n => (
                                                        <div 
                                                            key={n.id} 
                                                            onClick={() => {
                                                                handleMarkRead(n.id);
                                                                if (n.link) navigate(n.link);
                                                                setNotifOpen(false);
                                                            }}
                                                            style={{ 
                                                                padding: '16px 20px', display: 'flex', gap: 14, cursor: 'pointer',
                                                                background: n.is_read ? 'transparent' : '#f4fdf4',
                                                                borderBottom: '1px solid #f8f8f8',
                                                                transition: '0.2s'
                                                            }}
                                                            onMouseEnter={(e) => e.currentTarget.style.background = '#f9f9f9'}
                                                            onMouseLeave={(e) => e.currentTarget.style.background = n.is_read ? 'transparent' : '#f4fdf4'}
                                                        >
                                                            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(45,90,39,0.1)', color: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <Bell size={18} />
                                                            </div>
                                                            <div>
                                                                <div style={{ fontWeight: 900, fontSize: '0.85rem', color: '#1a1c19', marginBottom: 2 }}>{n.title}</div>
                                                                <div style={{ fontSize: '0.78rem', color: '#666', fontWeight: 600, lineHeight: 1.4 }}>{n.message}</div>
                                                                <div style={{ fontSize: '0.65rem', color: '#bbb', fontWeight: 700, marginTop: 6 }}>{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                                            </div>
                                                            {!n.is_read && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#2d5a27', marginTop: 16, flexShrink: 0 }} />}
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                            <div style={{ padding: '12px', textAlign: 'center', background: '#fbfdfb', borderTop: '1px solid #eeedeb' }}>
                                                <button onClick={() => { setNotifOpen(false); navigate('/settings'); }} style={{ background: 'transparent', border: 'none', color: '#888', fontSize: '0.72rem', fontWeight: 700 }}>Notification Settings</button>
                                            </div>
                                        </motion.div>
                                    </>
                                )}
                            </AnimatePresence>
                        </div>

                        <Map size={20} color={currentPath === '/map' ? '#2d5a27' : 'currentColor'} style={{ cursor: 'pointer' }} onClick={() => navigate('/map')} />
                        <Camera size={20} style={{ cursor: 'pointer' }} onClick={() => navigate('/camera')} />
                        
                        <div 
                            style={{ 
                                width: 38, height: 38, borderRadius: '50%', 
                                border: '2px solid #2d5a27', cursor: 'pointer',
                                overflow: 'hidden', background: '#eee',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}
                            onClick={() => navigate('/profile')}
                        >
                            {user?.profile_picture ? (
                                <img 
                                    src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`} 
                                    alt="me" 
                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                    onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }}
                                />
                            ) : null}
                            <div style={{ 
                                display: (user?.profile_picture ? 'none' : 'flex'), 
                                width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center',
                                background: 'var(--color-primary-soft)', color: 'var(--color-primary)',
                                fontWeight: 900, fontSize: '0.9rem'
                            }}>
                                {user?.name ? user.name[0].toUpperCase() : 'U'}
                            </div>
                        </div>
                    </div>
                </header>

                <main style={{ 
                    flex: 1, 
                    overflowY: 'auto', 
                    background: '#fbfdfb',
                    minHeight: 0 // Important for nested flex scroll
                }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
