import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Package, ShoppingCart, DollarSign, Star, Plus, 
    Edit3, Trash2, Eye, TrendingUp, Filter, Search,
    ChevronRight, Clock, CheckCircle, Truck, XCircle,
    ArrowUpRight, ArrowDownRight, MessageSquare, Tag,
    Image as ImageIcon, Award, ShieldCheck, AlertCircle,
    Loader2, MoreVertical, RefreshCw, ArrowRight
} from 'lucide-react';
import { apiService } from '../../services/apiService';
import { useAuth } from '../../context/AuthContext';
import ManageProducts from './ManageProducts';
import ManageOrders from './ManageOrders';

// ─── COMPONENTS ──────────────────────────────────────────────

const StatCard = ({ icon: Icon, label, value, trend, color }) => (
    <motion.div 
        whileHover={{ y: -5 }}
        className="card"
        style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ padding: '12px', borderRadius: '16px', background: `${color}15`, color: color }}>
                <Icon size={24} />
            </div>
            {trend && (
                <div style={{ 
                    display: 'flex', alignItems: 'center', gap: 4, 
                    fontSize: '0.75rem', fontWeight: 800,
                    color: trend > 0 ? '#10b981' : '#ef4444',
                    background: trend > 0 ? '#10b98110' : '#ef444410',
                    padding: '4px 8px', borderRadius: '8px'
                }}>
                    {trend > 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                    {Math.abs(trend)}%
                </div>
            )}
        </div>
        <div>
            <div style={{ fontSize: '0.85rem', color: '#666', fontWeight: 700, marginBottom: 4 }}>{label}</div>
            <div style={{ fontSize: '1.75rem', fontWeight: 950, color: '#1a1c19' }}>{value}</div>
        </div>
    </motion.div>
);

const SellerDashboard = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('overview');
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchDashboard();
    }, []);

    const fetchDashboard = async () => {
        setLoading(true);
        try {
            const res = await apiService.getSellerDashboard();
            setStats(res.data);
            setError(null);
        } catch (err) {
            console.error(err);
            setError('Failed to load dashboard data');
        } finally {
            setLoading(false);
        }
    };

    if (loading) return (
        <div style={{ height: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Loader2 className="spinner" size={48} color="#2d5a27" />
        </div>
    );

    return (
        <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                <div>
                    <h1 style={{ fontSize: '2rem', fontWeight: 950, color: '#1a1c19', marginBottom: '8px' }}>Seller Central</h1>
                    <p style={{ color: '#666', fontWeight: 600 }}>Manage your products, orders, and eco-business growth.</p>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary" onClick={fetchDashboard}>
                        <RefreshCw size={18} />
                        Sync Data
                    </button>
                    {activeTab === 'products' ? (
                        <button className="btn-primary" id="add-product-btn">
                            <Plus size={18} />
                            Add New Product
                        </button>
                    ) : (
                        <button className="btn-primary" onClick={() => setActiveTab('products')}>
                             <Package size={18} />
                             Manage Stock
                        </button>
                    )}
                </div>
            </div>

            {/* Main Stats Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px', marginBottom: '40px' }}>
                <StatCard 
                    icon={Package} label="Total Products" 
                    value={stats?.stats.total_products || 0} trend={12} color="#2d5a27" 
                />
                <StatCard 
                    icon={ShoppingCart} label="Active Orders" 
                    value={stats?.stats.active_sales || 0} trend={-5} color="#3b82f6" 
                />
                <StatCard 
                    icon={DollarSign} label="Total Earnings" 
                    value={`₹${(stats?.stats.total_earnings || 0).toLocaleString()}`} trend={24} color="#10b981" 
                />
                <StatCard 
                    icon={Star} label="Store Rating" 
                    value={stats?.stats.avg_rating || 5.0} trend={2} color="#f59e0b" 
                />
            </div>

            {/* Quick Summary Section */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px', marginBottom: '40px' }}>
                {/* Earnings Chart Placeholder (We can use a simple SVG or CSS graph if no library) */}
                <div className="card" style={{ padding: '32px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900 }}>Earnings Analytics</h3>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <select className="input-sm" style={{ padding: '4px 12px' }}>
                                <option>Last 30 Days</option>
                                <option>Last 6 Months</option>
                            </select>
                        </div>
                    </div>
                    <div style={{ height: '300px', display: 'flex', alignItems: 'flex-end', gap: '8px', padding: '20px 0' }}>
                        {stats?.earnings_breakdown?.map((day, idx) => {
                            const max = Math.max(...stats.earnings_breakdown.map(d => d.amount), 1);
                            const height = (day.amount / max) * 100;
                            return (
                                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                                    <div style={{ 
                                        width: '100%', minHeight: '4px', height: `${height}%`, 
                                        background: 'linear-gradient(to top, #2d5a27, #4ade80)', 
                                        borderRadius: '8px 8px 4px 4px',
                                        transition: '0.3s'
                                    }} />
                                    {/* Show only some dates to avoid clutter */}
                                    {idx % 5 === 0 && <span style={{ fontSize: '0.65rem', color: '#999', fontWeight: 700 }}>{day.date.split('-')[2]}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Notifications & Low Stock */}
                <div className="card" style={{ padding: '32px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 900, marginBottom: '20px' }}>Business Alerts</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        {stats?.inventory.filter(p => p.stock < 10).map(p => (
                            <div key={p.id} style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: '12px', background: '#fff7ed', border: '1px solid #ffedd5' }}>
                                <AlertCircle color="#f97316" size={20} />
                                <div>
                                    <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#9a3412' }}>Low Stock Alert</div>
                                    <div style={{ fontSize: '0.75rem', color: '#c2410c', fontWeight: 600 }}>{p.name} has only {p.stock} units left.</div>
                                </div>
                            </div>
                        ))}
                        <div style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: '12px', background: '#f0f9ff', border: '1px solid #e0f2fe' }}>
                            <TrendingUp color="#0ea5e9" size={20} />
                            <div>
                                <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#0369a1' }}>Trending Product</div>
                                <div style={{ fontSize: '0.75rem', color: '#075985', fontWeight: 600 }}>Organic Fertilizer views up 40% this week.</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div style={{ display: 'flex', gap: 32, borderBottom: '1px solid #eeedeb', marginBottom: '32px' }}>
                {['overview', 'products', 'orders', 'reviews'].map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        style={{ 
                            padding: '12px 4px', background: 'transparent', border: 'none', 
                            fontSize: '0.9rem', fontWeight: 800, cursor: 'pointer',
                            color: activeTab === tab ? '#2d5a27' : '#888',
                            position: 'relative'
                        }}
                    >
                        {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        {activeTab === tab && (
                            <motion.div layoutId="tab" style={{ position: 'absolute', bottom: -1, left: 0, right: 0, height: 3, background: '#2d5a27', borderRadius: 4 }} />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <AnimatePresence mode="wait">
                <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.2 }}
                >
                    {activeTab === 'overview' && (
                        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
                            {/* Recent Orders Overview */}
                            <div className="card" style={{ padding: '0' }}>
                                <div style={{ padding: '24px', borderBottom: '1px solid #eeedeb', display: 'flex', justifyContent: 'space-between' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 900 }}>Recent Orders</h3>
                                    <button className="btn-text" onClick={() => setActiveTab('orders')}>View All Orders <ArrowRight size={14} /></button>
                                </div>
                                <div style={{ padding: '24px' }}>
                                    <ManageOrders orders={stats?.recent_orders || []} onRefresh={fetchDashboard} isCompact />
                                </div>
                            </div>

                            {/* Top Products Analytics */}
                            <div className="card" style={{ padding: '32px' }}>
                                <h3 style={{ fontSize: '1.1rem', fontWeight: 900, marginBottom: '24px' }}>Store Performance</h3>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                    {stats?.top_products.map(p => (
                                        <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                            <div style={{ width: 48, height: 48, borderRadius: 12, background: '#f4f4f2', overflow: 'hidden' }}>
                                                <img src={p.image_url || 'https://via.placeholder.com/100'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{p.name}</div>
                                                <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                                                    <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Eye size={12} /> {p.views} views
                                                    </span>
                                                    <span style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                                        <Tag size={12} /> {p.sales} sales
                                                    </span>
                                                </div>
                                            </div>
                                            <div style={{ fontSize: '1rem', fontWeight: 950, color: '#2d5a27' }}>₹{p.price}</div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'products' && (
                        <ManageProducts products={stats?.inventory || []} onRefresh={fetchDashboard} />
                    )}

                    {activeTab === 'orders' && (
                        <ManageOrders orders={stats?.recent_orders || []} onRefresh={fetchDashboard} />
                    )}
                </motion.div>
            </AnimatePresence>
        </div>
    );
};

export default SellerDashboard;
