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

const NAV_ITEMS = [
    { icon: Home,        label: 'Feed',        path: '/dashboard' },
    { icon: Leaf,        label: 'Missions',    path: '/missions'  },
    { icon: Trophy,      label: 'Leaderboard', path: '/leaderboard' },
    { icon: Ticket,      label: 'Rewards',     path: '/rewards'   },
    { icon: Brain,       label: 'AI Advisor',  path: '/ai'        },
    { icon: Users,       label: 'Community',   path: '/community' },
    { icon: ShoppingBag, label: 'Marketplace', path: '/marketplace' },
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

            <div className="dashboard-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflowY: 'auto', background: '#fbfdfb', position: 'relative' }}>
                <header style={{ height: 76, background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid #eeedeb', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', position: 'sticky', top: 0, zIndex: 10 }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <pageInfo.icon size={20} color="#2d5a27" />
                            <h2 style={{ fontSize: '1.2rem', fontWeight: 950, margin: 0 }}>{pageInfo.title}</h2>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>{pageInfo.sub}</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                        <div className="topbar-search" style={{ background: '#f4f4f2', padding: '8px 16px', borderRadius: 12, display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Search size={16} color="#aaa" />
                            <input type="text" placeholder="Search..." style={{ background: 'transparent', border: 'none', fontSize: '0.85rem', outline: 'none' }} />
                        </div>
                        <Camera size={20} onClick={() => navigate('/camera')} style={{ cursor: 'pointer' }} />
                        <Bell size={20} onClick={() => setNotifOpen(!notifOpen)} style={{ cursor: 'pointer' }} />
                        <img src={user?.profile_picture || avatar} alt="me" style={{ width: 38, height: 38, borderRadius: '50%', border: '2px solid #2d5a27', cursor: 'pointer' }} onClick={() => navigate('/profile')} />
                    </div>
                </header>

                <main style={{ flex: 1 }}>
                    <Outlet />
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
