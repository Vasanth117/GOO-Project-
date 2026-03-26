import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingCart, Truck, CheckCircle, XCircle, Clock, 
    MoreVertical, Phone, MapPin, User, Package, 
    ChevronDown, ChevronUp, ExternalLink, Mail, 
    AlertCircle, Search, Filter, Loader2, RefreshCw
} from 'lucide-react';
import { apiService } from '../../services/apiService';

const ManageOrders = ({ orders, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [expandedOrder, setExpandedOrder] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    const handleUpdateStatus = async (id, newStatus) => {
        setUpdatingId(id);
        try {
            await apiService.updateOrderStatus(id, newStatus);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert('Failed to update status');
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusStyle = (status) => {
        const styles = {
            'pending':   { color: '#f59e0b', bg: '#fef3c7', icon: Clock },
            'confirmed': { color: '#3b82f6', bg: '#dbeafe', icon: CheckCircle },
            'shipped':   { color: '#8b5cf6', bg: '#ede9fe', icon: Truck },
            'delivered': { color: '#10b981', bg: '#d1fae5', icon: CheckCircle },
            'cancelled': { color: '#ef4444', bg: '#fee2e2', icon: XCircle }
        };
        return styles[status] || styles.pending;
    };

    const filtered = orders.filter(o => 
        (statusFilter === 'all' || o.status === statusFilter) &&
        (o.buyer_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         o.product_name?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Controls */}
            <div style={{ display: 'flex', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ flex: 1, display: 'flex', background: '#f4f4f2', padding: '10px 16px', borderRadius: '14px', alignItems: 'center', gap: 10 }}>
                    <Search size={18} color="#888" />
                    <input 
                        type="text" placeholder="Search orders, buyers..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.9rem', outline: 'none', fontWeight: 600 }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <div style={{ display: 'flex', background: '#f4f4f2', borderRadius: '12px', padding: '4px' }}>
                        {['all', 'pending', 'confirmed', 'shipped'].map(s => (
                            <button
                                key={s} onClick={() => setStatusFilter(s)}
                                style={{ 
                                    padding: '6px 16px', borderRadius: '10px', border: 'none', 
                                    fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer',
                                    background: statusFilter === s ? 'white' : 'transparent',
                                    color: statusFilter === s ? '#2d5a27' : '#888',
                                    boxShadow: statusFilter === s ? '0 2px 8px rgba(0,0,0,0.05)' : 'none',
                                    transition: '0.2s'
                                }}
                            >
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                            </button>
                        ))}
                    </div>
                    <button className="btn-secondary" onClick={onRefresh} style={{ padding: '10px' }}>
                        <RefreshCw size={18} />
                    </button>
                </div>
            </div>

            {/* Orders Table */}
            <div className="card" style={{ padding: '0', overflow: 'hidden', border: 'none', borderRadius: '20px' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ background: '#fbfdfb', textAlign: 'left', borderBottom: '1px solid #eeedeb' }}>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase', width: 40 }}></th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Order ID & Date</th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Customer</th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Product & Qty</th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Total</th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Status</th>
                                <th style={{ padding: '20px 24px', fontSize: '0.75rem', color: '#888', textTransform: 'uppercase' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan="7" style={{ padding: '60px', textAlign: 'center', color: '#888' }}>
                                        <ShoppingCart size={40} style={{ opacity: 0.1, marginBottom: 16 }} />
                                        <div style={{ fontWeight: 700 }}>No orders found matching your search.</div>
                                    </td>
                                </tr>
                            ) : filtered.map(o => {
                                const st = getStatusStyle(o.status);
                                const isExpanded = expandedOrder === o.id;
                                return (
                                    <React.Fragment key={o.id}>
                                        <tr style={{ borderBottom: isExpanded ? 'none' : '1px solid #f8f8f8', background: isExpanded ? '#fbfdfb' : 'transparent', transition: '0.2s' }}>
                                            <td style={{ padding: '20px 24px' }}>
                                                <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#888' }}>
                                                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                                </button>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ fontSize: '0.86rem', fontWeight: 900, color: '#1a1c19' }}>#{o.id.slice(-6).toUpperCase()}</div>
                                                <div style={{ fontSize: '0.72rem', color: '#888', fontWeight: 600 }}>{new Date(o.created_at).toLocaleDateString()}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, color: '#2d5a27' }}>{o.buyer_name[0]}</div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 750 }}>{o.buyer_name}</div>
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ fontSize: '0.85rem', fontWeight: 750 }}>{o.product_name}</div>
                                                <div style={{ fontSize: '0.75rem', color: '#888', fontWeight: 600 }}>Qty: {o.quantity} units</div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ fontSize: '1rem', fontWeight: 950, color: '#1a1c19' }}>₹{o.total_price}</div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ 
                                                    display: 'flex', alignItems: 'center', gap: 6, 
                                                    fontSize: '0.75rem', fontWeight: 900, 
                                                    color: st.color, background: st.bg,
                                                    padding: '6px 12px', borderRadius: '10px'
                                                }}>
                                                    <st.icon size={14} />
                                                    {o.status.toUpperCase()}
                                                </div>
                                            </td>
                                            <td style={{ padding: '20px 24px' }}>
                                                <div style={{ display: 'flex', gap: 8 }}>
                                                    {o.status === 'pending' && (
                                                        <>
                                                            <button 
                                                                onClick={() => handleUpdateStatus(o.id, 'confirmed')}
                                                                className="btn-primary" 
                                                                style={{ padding: '6px 14px', fontSize: '0.75rem' }}
                                                            >Confirm</button>
                                                            <button 
                                                                onClick={() => handleUpdateStatus(o.id, 'cancelled')}
                                                                className="btn-secondary" 
                                                                style={{ padding: '6px 14px', fontSize: '0.75rem', color: '#e63946' }}
                                                            >Reject</button>
                                                        </>
                                                    )}
                                                    {o.status === 'confirmed' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(o.id, 'shipped')}
                                                            className="btn-primary" 
                                                            style={{ background: '#3b82f6' }}
                                                        >Mark Shipped</button>
                                                    )}
                                                    {o.status === 'shipped' && (
                                                        <button 
                                                            onClick={() => handleUpdateStatus(o.id, 'delivered')}
                                                            className="btn-primary" 
                                                            style={{ background: '#10b981' }}
                                                        >Mark Delivered</button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {/* DETAIL EXPANSION */}
                                        <AnimatePresence>
                                            {isExpanded && (
                                                <tr>
                                                    <td colSpan="7" style={{ padding: '0 24px 24px', background: '#fbfdfb' }}>
                                                        <motion.div 
                                                            initial={{ height: 0, opacity: 0 }} 
                                                            animate={{ height: 'auto', opacity: 1 }} 
                                                            exit={{ height: 0, opacity: 0 }}
                                                            style={{ border: '1px solid #eeedeb', borderRadius: '16px', background: 'white', padding: '24px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '32px' }}
                                                        >
                                                            {/* Shipping Info */}
                                                            <div>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 950, marginBottom: 16, color: '#1a1c19' }}>
                                                                    <MapPin size={18} color="#2d5a27" /> Delivery Information
                                                                </h4>
                                                                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Recipient</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 750 }}>{o.buyer_name}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Address</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 700, lineHeight: 1.5, color: '#444' }}>{o.shipping_address || 'Not provided'}</div>
                                                                    </div>
                                                                    <div>
                                                                        <div style={{ fontSize: '0.65rem', color: '#888', fontWeight: 700, textTransform: 'uppercase' }}>Contact</div>
                                                                        <div style={{ fontSize: '0.85rem', fontWeight: 750, color: '#2d5a27' }}>{o.phone || 'No phone'}</div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Product Summary */}
                                                            <div>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 950, marginBottom: 16, color: '#1a1c19' }}>
                                                                    <Package size={18} color="#2d5a27" /> Order Items
                                                                </h4>
                                                                <div style={{ padding: '16px', background: '#f8faf8', borderRadius: '14px', border: '1px solid #eeedeb' }}>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: 750 }}>{o.product_name}</span>
                                                                        <span style={{ fontSize: '0.85rem', fontWeight: 800 }}>x{o.quantity}</span>
                                                                    </div>
                                                                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #eeedeb', paddingTop: 8, fontSize: '0.9rem', fontWeight: 950 }}>
                                                                        <span>Total Revenue</span>
                                                                        <span style={{ color: '#2d5a27' }}>₹{o.total_price}</span>
                                                                    </div>
                                                                </div>
                                                                <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
                                                                    <button className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                                        <Phone size={14} /> Call Buyer
                                                                    </button>
                                                                    <button className="btn-secondary" style={{ flex: 1, padding: '10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                                                        <ShoppingCart size={14} /> Chat
                                                                    </button>
                                                                </div>
                                                            </div>

                                                            {/* History / Status Actions */}
                                                            <div>
                                                                <h4 style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.9rem', fontWeight: 950, marginBottom: 16, color: '#1a1c19' }}>
                                                                    <Clock size={18} color="#2d5a27" /> Status Timeline
                                                                </h4>
                                                                <div style={{ position: 'relative', paddingLeft: '24px' }}>
                                                                    <div style={{ position: 'absolute', left: 8, top: 4, bottom: 4, width: 2, background: '#eeedeb' }} />
                                                                    
                                                                    <div style={{ marginBottom: 20, position: 'relative' }}>
                                                                        <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: '#10b981', border: '2px solid white', boxShadow: '0 0 0 4px #d1fae5' }} />
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 900 }}>Order Placed</div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>{new Date(o.created_at).toLocaleString()}</div>
                                                                    </div>

                                                                    <div style={{ position: 'relative' }}>
                                                                        <div style={{ position: 'absolute', left: -20, top: 4, width: 10, height: 10, borderRadius: '50%', background: o.status !== 'pending' ? '#10b981' : '#eeedeb', border: '2px solid white' }} />
                                                                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: o.status === 'pending' ? '#888' : '#1a1c19' }}>
                                                                            {o.status === 'cancelled' ? 'Order Cancelled' : 'Payment Confirmed'}
                                                                        </div>
                                                                        <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>Next Step: Prepare for Shipment</div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    </td>
                                                </tr>
                                            )}
                                        </AnimatePresence>
                                    </React.Fragment>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ManageOrders;
