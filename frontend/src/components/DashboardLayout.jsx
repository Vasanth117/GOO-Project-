import React, { useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import {
    Home, Leaf, Trophy, ShoppingBag, Users, Map, Brain,
    Bell, MessageCircle, Search, Settings, LogOut, Award,
    Heart, MessageSquare, Globe, Target, LayoutDashboard,
    Bot, Image, ShoppingCart, User, Gift, Ticket, Camera
} from 'lucide-react';
import logo from '../assets/images/logo.png';
import avatar from '../assets/images/9.jpg';
// Removed CameraModal import as we are using a full page now

const NAV_ITEMS = [
    { icon: Home,        label: 'Feed',        path: '/dashboard' },
    { icon: Leaf,        label: 'Missions',    path: '/missions'  },
    { icon: Trophy,      label: 'Leaderboard', path: '/leaderboard' },
    { icon: Ticket,      label: 'Rewards',     path: '/rewards'   },
    { icon: Brain,       label: 'AI Advisor',  path: '/ai'        },
    { icon: Users,       label: 'Community',   path: '/community' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
    { icon: MessageCircle, label: 'Messages',  path: '/messages'    },
    { icon: Settings,    label: 'Settings',    path: '/settings'  },
];

const TOPBAR_TITLES = {
    '/dashboard':   { icon: LayoutDashboard, title: 'Farming Feed',       sub: 'Real activities from your community' },
    '/missions':    { icon: Target,          title: 'Missions & Tasks',    sub: 'Complete eco-challenges, earn XP & badges' },
    '/leaderboard': { icon: Trophy,          title: 'Leaderboard',         sub: 'Top eco-farmers in your region' },
    '/rewards':     { icon: Gift,            title: 'Rewards Hub',         sub: 'Redeem your points for savings' },
    '/ai':          { icon: Bot,             title: 'AI Advisor',          sub: 'Your personal smart farming assistant' },
    '/map':         { icon: Map,             title: 'Field Map',           sub: 'Visualize and plan your farmland' },
    '/community':   { icon: Users,           title: 'Community',           sub: 'Connect with farmers across India' },
    '/marketplace': { icon: ShoppingCart,    title: 'Marketplace',         sub: 'Buy & sell farming products' },
    '/messages':    { icon: MessageCircle,   title: 'Direct Messages',     sub: 'Private conversations with farmers' },
    '/settings':    { icon: Settings,        title: 'Settings',            sub: 'Manage your account & preferences' },
    '/profile':     { icon: User,            title: 'Your Profile',        sub: 'Manage your farming identity' },
};

const DashboardLayout = () => {
    const [sidebarHovered, setSidebarHovered] = useState(false);
    const [notifOpen, setNotifOpen] = useState(false);
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const currentPath = location.pathname;
    const pageInfo = TOPBAR_TITLES[currentPath] || { icon: Leaf, title: 'GOO', sub: '' };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const sidebarVariants = {
        collapsed: { width: 72 },
        expanded:  { width: 240 },
    };

    return (
        <div className="dashboard-root">
            <motion.aside
                className="sidebar"
                variants={sidebarVariants}
                animate={sidebarHovered ? 'expanded' : 'collapsed'}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
                onMouseEnter={() => setSidebarHovered(true)}
                onMouseLeave={() => setSidebarHovered(false)}
            >
                <div className="sidebar-logo" style={{ cursor: 'pointer' }} onClick={() => navigate('/dashboard')}>
                    <motion.img
                        src={logo} alt="GOO"
                        className="sidebar-logo-img"
                        whileHover={{ rotate: 360 }}
                        transition={{ duration: 0.8 }}
                    />
                    <AnimatePresence>
                        {sidebarHovered && (
                            <motion.span
                                className="sidebar-logo-text"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.2 }}
                            >
                                goo
                            </motion.span>
                        )}
                    </AnimatePresence>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item, i) => {
                        const isActive = currentPath === item.path;
                        return (
                            <motion.button
                                key={item.label}
                                className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
                                onClick={() => navigate(item.path)}
                                whileHover={{ x: 4 }}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                title={!sidebarHovered ? item.label : ''}
                            >
                                <motion.div
                                    className="sidebar-icon-wrap"
                                    whileHover={{ scale: 1.15 }}
                                    animate={isActive ? { rotate: [0, -10, 10, 0] } : {}}
                                    transition={{ duration: 0.4 }}
                                >
                                    <item.icon size={20} />
                                </motion.div>

                                <AnimatePresence>
                                    {sidebarHovered && (
                                        <motion.span
                                            className="sidebar-label"
                                            initial={{ opacity: 0, x: -8 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -8 }}
                                            transition={{ duration: 0.15 }}
                                        >
                                            {item.label}
                                        </motion.span>
                                    )}
                                </AnimatePresence>

                                {isActive && (
                                    <motion.div className="sidebar-active-dot" layoutId="activeDot" />
                                )}
                            </motion.button>
                        );
                    })}
                </nav>

                <motion.button
                    className="sidebar-nav-item"
                    style={{ marginTop: 'auto', color: '#e63946' }}
                    whileHover={{ x: 4 }}
                    onClick={handleLogout}
                    title={!sidebarHovered ? 'Logout' : ''}
                >
                    <div className="sidebar-icon-wrap" style={{ color: '#e63946' }}>
                        <LogOut size={20} />
                    </div>
                    <AnimatePresence>
                        {sidebarHovered && (
                            <motion.span
                                className="sidebar-label"
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -8 }}
                                transition={{ duration: 0.15 }}
                                style={{ color: '#e63946' }}
                            >
                                Logout
                            </motion.span>
                        )}
                    </AnimatePresence>
                </motion.button>
            </motion.aside>

            <div className="dashboard-main">
                <header className="topbar">
                    <div className="topbar-left">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <pageInfo.icon size={20} color="#2d5a27" />
                            <h2 className="topbar-title">{pageInfo.title}</h2>
                        </div>
                        <span className="topbar-sub">{pageInfo.sub}</span>
                    </div>

                    <div className="topbar-right">
                        <div className="topbar-search">
                            <Search size={16} color="#aaa" />
                            <input type="text" placeholder="Search farmers, missions, crops..." />
                        </div>

                        {/* 🗺️ FIELD MAP BUTTON (RELOCATED AS REQUESTED) */}
                        <motion.button 
                            className="topbar-icon-btn" 
                            whileHover={{ scale: 1.1, background: '#f0f7f0' }} 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/map')}
                            title="Field Map"
                        >
                            <Map size={20} color="#2d5a27" />
                        </motion.button>

                        <motion.button 
                            className="topbar-icon-btn camera-trigger" 
                            whileHover={{ scale: 1.1, background: '#f0f7f0' }} 
                            whileTap={{ scale: 0.9 }}
                            onClick={() => navigate('/camera')}
                            title="Field Capture"
                        >
                            <Camera size={20} color="#2d5a27" />
                        </motion.button>

                        <motion.button
                            className="topbar-icon-btn" whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                            onClick={() => setNotifOpen(!notifOpen)}
                        >
                            <Bell size={20} />
                            <span className="topbar-badge">5</span>
                        </motion.button>

                        <motion.div
                            className="topbar-user"
                            style={{ cursor: 'pointer' }}
                            whileHover={{ scale: 1.03 }}
                            onClick={() => navigate('/profile')}
                        >
                            <img src={avatar} alt="me" className="topbar-avatar" />
                            <div>
                                <div style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1a1c19' }}>
                                    {user?.name || 'Farmer'}
                                </div>
                                <div style={{ fontSize: '0.72rem', color: '#888', textTransform: 'capitalize' }}>
                                    {user?.role || 'GOO Member'}
                                </div>
                            </div>
                        </motion.div>
                    </div>

                    <AnimatePresence>
                        {notifOpen && (
                            <motion.div
                                className="notif-dropdown"
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            >
                                <div className="notif-header">
                                    <strong>Notifications</strong>
                                    <button style={{ fontSize: '0.75rem', color: '#2d5a27', background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Mark all read
                                    </button>
                                </div>
                                {[
                                    { icon: Trophy,      text: 'You completed the "Water Saver" mission!', time: '2m ago',  color: '#d4af37' },
                                    { icon: Heart,       text: 'Priya Sharma liked your post',              time: '15m ago', color: '#e63946' },
                                    { icon: Award,       text: 'You earned a new Eco Badge!',               time: '1h ago',  color: '#2d5a27' },
                                    { icon: MessageSquare, text: 'Amit Patel commented on your post',       time: '2h ago',  color: '#768953' },
                                    { icon: Globe,       text: '5 new farmers joined your region',          time: '5h ago',  color: '#4c7c42' },
                                ].map((n, i) => (
                                    <motion.div
                                        key={i} className="notif-item"
                                        whileHover={{ background: '#f5faf4' }}
                                        initial={{ opacity: 0, x: 10 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: i * 0.05 }}
                                    >
                                        <div className="notif-icon" style={{ background: n.color + '20', color: n.color }}>
                                            <n.icon size={14} />
                                        </div>
                                        <div>
                                            <div style={{ fontSize: '0.82rem' }}>{n.text}</div>
                                            <div style={{ fontSize: '0.72rem', color: '#aaa' }}>{n.time}</div>
                                        </div>
                                    </motion.div>
                                ))}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </header>

                <Outlet />
            </div>
        </div>
    );
};

export default DashboardLayout;
