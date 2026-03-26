import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    ShoppingBag, Search, Filter, ShoppingCart, 
    ChevronRight, Star, ShieldCheck, Leaf, 
    Tag, MapPin, Plus, Package, DollarSign,
    TrendingUp, Image as ImageIcon, CheckCircle2,
    X, ArrowRight, User, History, Wallet, Ticket, UserCheck, Zap,
    Box, Truck, CreditCard, StarHalf, MessageCircle,
    ArrowLeft, Trash2, LayoutDashboard, Store,
    ThumbsUp, Share2, Award, Clock, ClipboardList,
    PieChart, Activity, AlertCircle, HardDrive, Gift,
    Leaf as SproutIcon, Wind, Droplets
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/apiService';

const img1 = 'https://images.unsplash.com/photo-1592484050893-b0fcba0aae73?auto=format&fit=crop&q=80&w=200';
const img2 = 'https://images.unsplash.com/photo-1598177579172-880ac8b839cd?auto=format&fit=crop&q=80&w=200';
const img3 = 'https://images.unsplash.com/photo-1574315042733-149b2513f56e?auto=format&fit=crop&q=80&w=200';
const avatar2 = 'https://images.unsplash.com/photo-1531649666632-132d7ab266a2?auto=format&fit=crop&q=80&w=150';

const MarketplacePage = () => {
    const navigate = useNavigate();
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [myOrders, setMyOrders] = useState([]);
    const [selectedSellerData, setSelectedSellerData] = useState(null);
    const [pointsBal, setPointsBal] = useState(0);
    const [isBuying, setIsBuying] = useState(false);
    
    // phase: 'gate' | 'buyer' | 'seller'
    const [phase, setPhase] = useState('gate');
    const [activeTab, setActiveTab] = useState('shop'); // For Buyer
    const [sellerTab, setSellerTab] = useState('dash'); // For Seller

    const [showCart, setShowCart] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSellerProfile, setShowSellerProfile] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    
    // Add Product Form
    const [newPName, setNewPName] = useState('');
    const [newPPrice, setNewPPrice] = useState('100');
    const [newPStock, setNewPStock] = useState('10');
    const [newPDesc, setNewPDesc] = useState('');
    const [newPImg, setNewPImg] = useState('https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?auto=format&fit=crop&q=80&w=200');

    const loadMarketData = async () => {
        try {
            const data = await apiService.getProducts();
            setProducts(data.products || []);
            
            if (phase === 'buyer') {
                apiService.getMyOrders().then(setMyOrders).catch(console.error);
                apiService.getWallet().then(w => setPointsBal(w.points_balance || 0)).catch(console.error);
            } else if (phase === 'seller') {
                apiService.getSellerDashboard().then(setSellerDash).catch(console.error);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (phase !== 'gate') {
            loadMarketData();
            const interval = setInterval(loadMarketData, 30000);
            return () => clearInterval(interval);
        }
    }, [phase]);

    const handleBuy = async (usePoints) => {
        if (!selectedProduct) return;
        setIsBuying(true);
        try {
            await apiService.placeOrder({
                product_id: selectedProduct.id,
                quantity: 1,
                use_points: usePoints
            });
            alert('Order Placed Successfully! You can track it in the Tracking tab.');
            setSelectedProduct(null);
            loadMarketData();
            setActiveTab('track');
        } catch(e) {
            alert('Failed to place order. Check stock or points balance.');
        } finally {
            setIsBuying(false);
        }
    };

    const handleAddProduct = async () => {
        if (!newPName) return;
        try {
            await apiService.createProduct({
                name: newPName,
                description: newPDesc,
                category: 'other',
                price: parseFloat(newPPrice),
                stock: parseInt(newPStock),
                image_url: newPImg,
                is_goo_verified: true
            });
            alert('Product published to Marketplace!');
            setShowAddProduct(false);
            loadMarketData();
            setSellerTab('inventory');
        } catch(e) {
            alert('Failed to add product.');
        }
    };

    const handleUpdateOrderStatus = async (orderId, newStatus) => {
        try {
            await apiService.updateOrderStatus(orderId, newStatus);
            loadMarketData();
        } catch(e) {
            alert('Failed to update order status');
            console.error(e);
        }
    };

    /* ── 🟢 1: ENTRY PHASE (GATE) ── */
    if (phase === 'gate') {
        return (
            <motion.div className="market-gate-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div className="gate-container">
                    <motion.div className="gate-info-sect" initial={{ y: -30 }} animate={{ y: 0 }}>
                        <Leaf size={60} color="#2d5a27" />
                        <h1>The Green Marketplace</h1>
                        <p>Welcome to the world's first transparent eco-farming trade hub. Login to start trading.</p>
                    </motion.div>
                    
                    <div className="gate-dual-split">
                        <motion.div className="gate-cta buyer-bg" whileHover={{ scale: 1.02 }} onClick={() => setPhase('buyer')}>
                            <div className="cta-icon"><ShoppingBag size={40} /></div>
                            <h2>Market Login</h2>
                            <p>Buy organic crops, seeds, and tools. Redeem your eco-rewards for instant discounts.</p>
                            <button className="btn-luxe-blue">Login as Buyer <ArrowRight size={18} /></button>
                        </motion.div>

                        <motion.div className="gate-cta seller-bg" whileHover={{ scale: 1.02 }} onClick={() => navigate('/marketplace/dashboard')}>
                            <div className="cta-icon"><Store size={40} /></div>
                            <h2>Seller Login</h2>
                            <p>List your produce, manage inventory, and provide proof of your organic farming journey.</p>
                            <button className="btn-luxe-green">Login to Studio <ArrowRight size={18} /></button>
                        </motion.div>
                    </div>
                </div>
            </motion.div>
        );
    }

    return (
        <div className="market-master-container">
            
            {/* ── SHARED NAVIGATION ── */}
            <header className="market-nav-premium">
                <div className="nav-sect-left">
                    <button className="btn-exit-p" onClick={() => setPhase('gate')}><ArrowLeft size={18} /></button>
                    <div className="market-logo-brand">
                        <Leaf size={28} color="#2d5a27" />
                        <div><strong>GOO MARKET</strong><span>{phase.toUpperCase()} PORTAL</span></div>
                    </div>
                </div>

                <div className="nav-sect-center">
                    {phase === 'buyer' ? (
                        <div className="buyer-tabs">
                            <button className={activeTab === 'shop' ? 'active' : ''} onClick={() => setActiveTab('shop')}><LayoutDashboard size={18} /> Market</button>
                            <button className={activeTab === 'track' ? 'active' : ''} onClick={() => setActiveTab('track')}><Truck size={18} /> Tracking</button>
                            <button className={activeTab === 'rewards' ? 'active' : ''} onClick={() => setActiveTab('rewards')}><Zap size={18} /> Rewards</button>
                        </div>
                    ) : (
                        <div className="seller-tabs">
                            <button className={sellerTab === 'dash' ? 'active' : ''} onClick={() => setSellerTab('dash')}><Activity size={18} /> Dash</button>
                            <button className={sellerTab === 'inventory' ? 'active' : ''} onClick={() => setSellerTab('inventory')}><Package size={18} /> Stock</button>
                            <button className={sellerTab === 'sales' ? 'active' : ''} onClick={() => setSellerTab('sales')}><ClipboardList size={18} /> Orders</button>
                        </div>
                    )}
                </div>

                <div className="nav-sect-right">
                    {phase === 'buyer' ? (
                        <div className="user-hub-pill">
                            <div className="user-pts">{pointsBal} Pts</div>
                            <button className="btn-cart-pill" onClick={() => setShowCart(true)}><ShoppingBag size={18} /><span>2</span></button>
                        </div>
                    ) : (
                        <button className="btn-luxe-green" style={{padding: '10px 20px'}} onClick={() => setShowAddProduct(true)}><Plus size={18} /> Sell Produce</button>
                    )}
                </div>
            </header>

            {/* ── 🛒 BUYER HUB ── */}
            {phase === 'buyer' && (
                <main className="buyer-hub-main">
                    {activeTab === 'shop' && (
                        <div className="shop-page-layout">
                            {/* Filter Sidebar */}
                            <aside className="shop-sidebar-luxe">
                                <div className="filter-sect">
                                    <h4>Discovery</h4>
                                    {['Organic Crops', 'Farming Inputs', 'Tools'].map(c => (
                                        <div key={c} className="f-check-row"><input type="checkbox" /> <span>{c}</span></div>
                                    ))}
                                </div>
                                <div className="filter-sect">
                                    <h4>Budget</h4>
                                    <input type="range" className="range-luxe" min="0" max="10000" />
                                    <div className="range-vals"><span>₹0</span><span>₹10k</span></div>
                                </div>
                                <div className="reward-promo-card">
                                    <Gift size={24} />
                                    <strong>Points Economy Active</strong>
                                    <p>Purchase any organic fertilizers using mission points for 50% discount.</p>
                                </div>
                            </aside>

                            <div className="shop-main-view">
                                <div className="product-wall-luxe">
                                    {products.map(p => (
                                        <motion.div key={p.id} className="p-card-luxe" whileHover={{ y: -8 }} onClick={() => setSelectedProduct(p)}>
                                            <div className="p-card-img-c">
                                                <img src={p.image_url || p.img} alt="p" />
                                                <div className="badge-verify">Verified Organic</div>
                                            </div>
                                            <div className="p-card-content">
                                                <button className="btn-text" style={{ fontSize: '0.75rem', padding: '4px 8px', marginBottom: '8px' }} onClick={(e) => {e.stopPropagation(); setShowSellerProfile(p.seller_id || p.seller);}}>
                                                    <MapPin size={12} /> Farm Vendor
                                                </button>
                                                <h4>{p.name}</h4>
                                                <div className="pc-price-bar">
                                                    <div className="price-main">₹{p.price}</div>
                                                    <div className="price-reward">Use Points</div>
                                                </div>
                                                <button className="btn-primary" style={{ height: '40px', width: '100%', fontSize: '0.85rem' }}>View Journey <ArrowRight size={14} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {activeTab === 'track' && (
                        <div className="track-page-view" style={{padding: '30px', gap: '20px', display: 'flex', flexDirection: 'column'}}>
                            <h2 style={{color: '#1a1c19', display: 'flex', alignItems: 'center', gap: '10px'}}><Package size={24} color="#2d5a27" /> Live Active Orders</h2>
                            {myOrders.length === 0 ? <p style={{color: '#888'}}>No active orders.</p> : myOrders.map(o => {
                                const st = o.status ? o.status.toUpperCase() : 'PENDING';
                                return (
                                <div key={o.id} className="live-track-card" style={{marginBottom: '20px', background: '#fff', border: '1.5px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'}}>
                                    <div className="lt-header">
                                        <h3 style={{color: '#1a1c19'}}>Tracking #{o.id.substring(0,8).toUpperCase()}</h3>
                                        <div className={`status-badge ${o.status}`}>{o.status}</div>
                                    </div>
                                    <div style={{display:'flex', gap:'15px', alignItems:'center', paddingBottom: '15px'}}>
                                        <img src={o.product_image || 'https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?w=100'} alt="P" style={{width: 60, height:60, borderRadius: 10, objectFit:'cover'}} />
                                        <div>
                                            <strong style={{fontSize: '1.2rem', color: '#1a1c19'}}>{o.product_name} (x{o.quantity})</strong>
                                            <div style={{color:'#666', fontSize:'0.9rem', marginTop: '5px'}}>Paid: <span style={{color: '#2d5a27', fontWeight: '900'}}>₹{o.final_cash_price}</span></div>
                                        </div>
                                    </div>
                                    <div className="stepper-horizontal">
                                        <div className="step done"><div className="dot" /><span>Ordered</span></div>
                                        <div className={`step ${['CONFIRMED','SHIPPED','DELIVERED'].includes(st) ? 'done' : 'active'}`}><div className="dot" /><span>Packed</span></div>
                                        <div className={`step ${['SHIPPED','DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Shipped</span></div>
                                        <div className={`step ${['DELIVERED'].includes(st) ? 'done' : ''}`}><div className="dot" /><span>Arrived</span></div>
                                        <div className="track-line-progress">
                                            <div className="fill-bar" style={{width: ['CONFIRMED'].includes(st) ? '33%' : ['SHIPPED'].includes(st) ? '66%' : ['DELIVERED'].includes(st) ? '100%' : '10%'}} />
                                        </div>
                                    </div>
                                </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'rewards' && (
                        <div className="track-page-view" style={{padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <div className="reward-promo-card" style={{padding: '40px', background: 'linear-gradient(135deg, #2d5a27, #1e3d1a)', border: 'none', borderRadius: '24px'}}>
                                <Award size={50} color="#fcd34d" />
                                <h1 style={{fontSize: '2.5rem', marginTop: '20px', color: '#fff'}}>Sustainable Rewards Hub</h1>
                                <p style={{fontSize: '1.1rem', maxWidth: '600px', color: 'rgba(255,255,255,0.9)'}}>You have successfully earned points through your farming missions. Use them to lower the cost of high-quality organic seeds and tools.</p>
                                <div className="user-pts" style={{width: 'fit-content', fontSize: '1.5rem', padding: '15px 30px', marginTop: '20px', background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)'}}>
                                    Current Balance: {pointsBal} Points
                                </div>
                                <div style={{marginTop: '20px', color: 'rgba(255,255,255,0.6)'}}>100 Points = ₹1.00 Discount</div>
                            </div>

                            <div style={{marginTop: '30px'}}>
                                <h3>Available Organic Vouchers</h3>
                                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginTop: '20px'}}>
                                    <div className="reward-promo-card" style={{background: 'rgba(255,255,255,0.05)', border: '1px dotted rgba(255,255,255,0.2)'}}>
                                        <Tag size={20} />
                                        <h4>10% Off All Seeds</h4>
                                        <p>Redeem 500 Pts</p>
                                        <button className="btn-luxe-green" style={{marginTop: '10px'}}>Acquire Voucher</button>
                                    </div>
                                    <div className="reward-promo-card" style={{background: 'rgba(255,255,255,0.05)', border: '1px dotted rgba(255,255,255,0.2)'}}>
                                        <History size={20} />
                                        <h4>Bulk Order Discount</h4>
                                        <p>Redeem 1500 Pts</p>
                                        <button className="btn-luxe-green" style={{marginTop: '10px', opacity: 0.5}}>Insufficient Points</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            )}

            {/* ── 👨‍🌾 SELLER HUB ── */}
            {phase === 'seller' && (
                <main className="seller-view">
                    {sellerTab === 'dash' && (
                        <div className="seller-dash-view">
                            <div className="stats-row-luxe">
                                <div className="stat-card-gold"><DollarSign size={24} /><div><strong>₹{sellerDash?.total_income || 0}</strong><span>Total Income</span></div></div>
                                <div className="stat-card-gold green"><ClipboardList size={24} /><div><strong>{sellerDash?.sales || 0}</strong><span>Total Sales</span></div></div>
                                <div className="stat-card-gold"><Package size={24} /><div><strong>{sellerDash?.products?.length || 0}</strong><span>Active Products</span></div></div>
                            </div>
                            <div className="sales-graph-placeholder" style={{marginTop: '30px', height: 'auto', background: 'transparent'}}>
                                <h3 style={{color: '#1a1c19'}}>Total Orders Received ({sellerDash?.recent_orders?.length || 0})</h3>
                                <div className="group-list" style={{display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '15px'}}>
                                    {sellerDash?.recent_orders?.map(so => (
                                        <div key={so.id} style={{background: '#fff', padding: '15px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'}}>
                                            <div>
                                                <strong style={{display: 'block', fontSize: '1rem', marginBottom: '5px', color: '#1a1c19'}}>{so.product_name} (x{so.quantity})</strong>
                                                <div style={{fontSize: '0.8rem', color: '#666'}}>Date: {new Date(so.created_at).toLocaleString()}</div>
                                            </div>
                                            <div style={{textAlign: 'right'}}>
                                                <div style={{fontWeight: 'bold', color: '#2d5a27', fontSize: '1.1rem', marginBottom: '5px'}}>₹{so.final_cash_price}</div>
                                                <div className={`status-badge ${so.status}`} style={{display:'inline-block'}}>{so.status}</div>
                                            </div>
                                        </div>
                                    ))}
                                    {(!sellerDash || !sellerDash.recent_orders || sellerDash.recent_orders.length === 0) && (
                                        <p style={{color: '#888', fontStyle: 'italic', padding: '10px 0'}}>No orders processed yet.</p>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                    {sellerTab === 'inventory' && (
                        <div className="track-page-view" style={{padding: '30px', display: 'flex', flexDirection: 'column', gap: '20px'}}>
                            <h2>Manage Active Inventory ({sellerDash?.products?.length || 0})</h2>
                            <div className="product-wall-luxe" style={{gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))'}}>
                                {sellerDash?.products?.map(p => (
                                    <div key={p.id} className="p-card-luxe" style={{border: '1px solid rgba(255,255,255,0.1)'}}>
                                        <div className="p-card-img-c">
                                            <img src={p.image_url || p.img || 'https://images.unsplash.com/photo-1595856728082-dd58d8e5cd8d?w=200'} alt="p" />
                                        </div>
                                        <div className="p-card-content">
                                            <h4>{p.name}</h4>
                                            <div style={{color: '#888', fontSize: '0.8rem'}}>Category: {p.category}</div>
                                            <div className="pc-price-bar" style={{marginTop:'10px'}}>
                                                <div className="price-main">₹{p.price}</div>
                                                <div style={{color: '#2d5a27', fontWeight: 'bold'}}>Stock: {p.stock}</div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {(!sellerDash || !sellerDash.products || sellerDash.products.length === 0) && (
                                    <p style={{color: '#888', gridColumn: '1 / -1'}}>You have no active products. List one above!</p>
                                )}
                            </div>
                        </div>
                    )}
                    {sellerTab === 'sales' && (
                        <div className="track-page-view" style={{padding: '30px', display: 'flex', flexDirection: 'column'}}>
                             <h2>Order Fulfillment Queue</h2>
                             <div className="group-list" style={{display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '15px'}}>
                                {sellerDash?.recent_orders?.map(so => (
                                    <div key={so.id} style={{background: '#fff', padding: '20px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-sm)'}}>
                                        <div>
                                            <strong style={{display: 'block', fontSize: '1.2rem', color: '#1a1c19'}}>{so.product_name} <span style={{fontSize:'1rem', color:'#666'}}>(x{so.quantity})</span></strong>
                                            <div style={{color: '#666', margin: '5px 0', fontSize:'0.85rem'}}>Order ID: #{so.id.substring(0,8).toUpperCase()}</div>
                                            <div style={{fontWeight: 'bold', color: '#2d5a27', fontSize: '1.2rem'}}>Total Value: ₹{so.final_cash_price}</div>
                                        </div>
                                        <div style={{textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-end'}}>
                                            <div className={`status-badge ${so.status}`}>{so.status}</div>
                                            {so.status === 'pending' && (
                                                <button className="btn-add-luxe" style={{padding: '8px 15px', fontSize: '0.9rem'}} onClick={() => handleUpdateOrderStatus(so.id, 'shipped')}>Mark as Shipped</button>
                                            )}
                                            {so.status === 'shipped' && (
                                                <button className="btn-luxe-green" style={{padding: '8px 15px', fontSize: '0.9rem'}} onClick={() => handleUpdateOrderStatus(so.id, 'delivered')}>Mark as Delivered</button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                                {(!sellerDash || !sellerDash.recent_orders || sellerDash.recent_orders.length === 0) && (
                                    <p style={{color: '#888'}}>No orders awaiting fulfillment.</p>
                                )}
                             </div>
                        </div>
                    )}
                </main>
            )}

            {/* ── MODALS & OVERLAYS ── */}
            <AnimatePresence>
                {selectedProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setSelectedProduct(null)}>
                        <motion.div className="product-detail-glass" initial={{ y: 50 }} animate={{ y: 0 }} onClick={e => e.stopPropagation()}>
                            <div className="pd-left">
                                <img src={selectedProduct.image_url || selectedProduct.img} alt="p" className="pd-main-img" />
                                <div className="farm-transparency-card">
                                    <h3>🌱 Farm Transparency Proof</h3>
                                    <p>Seed to Harvest proof from Verified Missions.</p>
                                    <div className="transparency-media-row">
                                        <div className="tm-item"><img src={img1} alt="Planting" /><span>Planting</span></div>
                                        <div className="tm-item"><img src={img2} alt="Feed" /><span>Feed</span></div>
                                        <div className="tm-item"><img src={img3} alt="Ready" /><span>Ready</span></div>
                                    </div>
                                    <button className="btn-add-luxe" style={{marginTop: '15px'}} onClick={() => setShowSellerProfile(selectedProduct.seller_id || selectedProduct.seller)}>View Farmer Profile <ArrowRight size={14} /></button>
                                </div>
                            </div>
                            <div className="pd-right">
                                <button className="btn-close-pd" onClick={() => setSelectedProduct(null)}><X /></button>
                                <h1 className="pd-name">{selectedProduct.name}</h1>
                                <div className="pd-price-main">₹{selectedProduct.price}</div>
                                <p className="pd-desc">{selectedProduct.desc}</p>
                                <button className="btn-primary" style={{ width: '100%', marginTop: '40px', padding: '16px' }} disabled={isBuying} onClick={() => handleBuy(true)}>{isBuying ? 'Processing...' : 'Buy with Points Discount 💰'}</button>
                                <button className="btn-secondary" style={{ width: '100%', marginTop: '10px' }} disabled={isBuying} onClick={() => handleBuy(false)}>Buy Normally (₹{selectedProduct?.price})</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSellerProfile && (
                    <div className="modal-luxe-overlay" onClick={() => setShowSellerProfile(null)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()} style={{position: 'relative', maxWidth: '900px'}}>
                            <button className="btn-close-pd" onClick={() => setShowSellerProfile(null)} style={{top: '30px', right: '30px'}}><X /></button>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 40 }}>
                                {/* Left Side: Farm Identity */}
                                <div style={{ borderRight: '1.5px solid #eeedeb', paddingRight: 40 }}>
                                    <div style={{ position: 'relative', width: 120, height: 120, marginBottom: 24 }}>
                                        <img src={avatar2} alt="f" style={{ width: '100%', height: '100%', borderRadius: '40px', objectFit: 'cover' }} />
                                        <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#2d5a27', color: 'white', padding: 8, borderRadius: '50%', border: '4px solid white', display: 'flex' }}>
                                            <ShieldCheck size={20} />
                                        </div>
                                    </div>
                                    <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: 4 }}>Green Oak Farm</h2>
                                    <p style={{ color: '#888', fontWeight: 700, fontSize: '0.9rem', marginBottom: 20 }}>Certified Organic since 2012</p>
                                    
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                                        <div style={{ padding: '16px', background: 'linear-gradient(135deg, #2d5a27, #1e3d1a)', borderRadius: '16px', color: 'white' }}>
                                            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', opacity: 0.8, fontWeight: 800 }}>Eco-Trust Score</div>
                                            <div style={{ fontSize: '1.75rem', fontWeight: 950, display: 'flex', alignItems: 'baseline', gap: 4 }}>
                                                842 <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>PTS</span>
                                            </div>
                                            <div style={{ height: 4, background: 'rgba(255,255,255,0.2)', borderRadius: 2, marginTop: 8 }}>
                                                <div style={{ width: '84%', height: '100%', background: '#4ade80', borderRadius: 2 }} />
                                            </div>
                                        </div>

                                        <div className="card" style={{ padding: 16, border: '1px solid #eeedeb' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 900, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <Activity size={14} color="#2d5a27" /> Farm Practice Log
                                            </div>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    <span style={{ color: '#888' }}>Soil Type</span>
                                                    <span>Clay Loam</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    <span style={{ color: '#888' }}>Irrigation</span>
                                                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Droplets size={12} color="#3b82f6" /> Drip</span>
                                                </div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700 }}>
                                                    <span style={{ color: '#888' }}>Fertilizer</span>
                                                    <span style={{ color: '#10b981' }}>100% Organic</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Side: Feed & Proofs */}
                                <div>
                                    <div style={{ display: 'flex', gap: 32, borderBottom: '1.5px solid #eeedeb', marginBottom: 24 }}>
                                        <button style={{ padding: '12px 4px', background: 'transparent', border: 'none', borderBottom: '3px solid #2d5a27', fontSize: '1rem', fontWeight: 950, color: '#1a1c19' }}>Organic Journey</button>
                                        <button style={{ padding: '12px 4px', background: 'transparent', border: 'none', fontSize: '1rem', fontWeight: 800, color: '#888' }}>Other Products</button>
                                    </div>

                                    <div className="insta-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                                        {[img1, img2, img3, img1, img2, img3].map((m, i) => (
                                            <motion.div key={i} className="insta-item" whileHover={{ scale: 1.05 }} style={{ borderRadius: 16, overflow: 'hidden', height: 160 }}>
                                                <img src={m} alt="p" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                <div style={{ position: 'absolute', top: 8, left: 8, background: 'rgba(0,0,0,0.5)', padding: '4px 8px', borderRadius: 8, color: 'white', fontSize: '0.6rem', fontWeight: 800 }}>POST #{i+1}</div>
                                            </motion.div>
                                        ))}
                                    </div>

                                    <div style={{ marginTop: 32, padding: 24, background: '#f4f4f2', borderRadius: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <div>
                                            <div style={{ fontSize: '1rem', fontWeight: 950 }}>Want live updates?</div>
                                            <p style={{ margin: 0, color: '#666', fontSize: '0.85rem', fontWeight: 600 }}>Follow this farm to see daily task completions.</p>
                                        </div>
                                        <button className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                            <UserCheck size={18} /> Follow Farm
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
                {showAddProduct && (
                    <div className="modal-luxe-overlay" onClick={() => setShowAddProduct(false)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} onClick={e => e.stopPropagation()} style={{maxWidth: '600px', background: '#fff', border: '1px solid var(--color-border)', boxShadow: '0 40px 100px rgba(0,0,0,0.1)', padding: '30px', borderRadius: '16px'}}>
                            <div className="insta-header" style={{borderBottom: '1.5px solid var(--color-border)', paddingBottom: '15px', color: '#1a1c19'}}>
                                <h2 style={{display: 'flex', alignItems: 'center', gap: '10px', fontSize: '1.4rem', margin: 0, color: '#1a1c19'}}><Store size={22} color="#2d5a27" /> Add New Store Product</h2>
                            </div>
                            <div style={{display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px'}}>
                                
                                <div style={{display: 'flex', gap: '15px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={{color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Product Name</label>
                                        <input type="text" style={{width: '100%', background: '#f9f9f9', padding:'14px', color:'#1a1c19', border:'1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem'}} value={newPName} onChange={e=>setNewPName(e.target.value)} placeholder="e.g. Organic Tomatoes" />
                                    </div>
                                </div>
 
                                <div>
                                    <label style={{color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Product Image</label>
                                    <div style={{display: 'flex', gap: '10px', alignItems: 'center'}}>
                                        <input type="text" style={{flex: 1, background: '#f9f9f9', padding:'14px', color:'#1a1c19', border:'1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '0.9rem'}} value={newPImg} onChange={e=>setNewPImg(e.target.value)} placeholder="Image URL..." />
                                        <input type="file" accept="image/*" id="file-upload" style={{display: 'none'}} onChange={(e) => {
                                            const file = e.target.files[0];
                                            if (file) {
                                                const reader = new FileReader();
                                                reader.onloadend = () => setNewPImg(reader.result);
                                                reader.readAsDataURL(file);
                                            }
                                        }} />
                                        <label htmlFor="file-upload" style={{cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', background: '#2d5a27', padding: '14px 18px', borderRadius: '8px', color: 'white', fontWeight: 'bold', fontSize: '0.9rem'}}>
                                            <ImageIcon size={18} /> Upload Local
                                        </label>
                                        {newPImg && <img src={newPImg} alt="preview" style={{width: '45px', height: '45px', borderRadius: '6px', objectFit: 'cover', border: '1px solid var(--color-border)'}} />}
                                    </div>
                                </div>

                                <div style={{display: 'flex', gap: '15px'}}>
                                    <div style={{flex: 1}}>
                                        <label style={{color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Price (₹)</label>
                                        <input type="number" style={{width: '100%', background: '#fff', padding:'14px', color:'#1a1c19', border:'1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem'}} value={newPPrice} onChange={e=>setNewPPrice(e.target.value)} />
                                    </div>
                                    <div style={{flex: 1}}>
                                        <label style={{color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Stock Amount</label>
                                        <input type="number" style={{width: '100%', background: '#fff', padding:'14px', color:'#1a1c19', border:'1px solid var(--color-border)', borderRadius: '8px', outline: 'none', fontSize: '1rem'}} value={newPStock} onChange={e=>setNewPStock(e.target.value)} />
                                    </div>
                                </div>

                                <div>
                                    <label style={{color: '#666', fontSize: '0.85rem', fontWeight: '500', marginBottom: '8px', display: 'block'}}>Description / Story</label>
                                    <textarea style={{width: '100%', background: '#fff', padding:'14px', minHeight: '100px', color:'#1a1c19', border:'1px solid var(--color-border)', borderRadius: '8px', outline: 'none', resize: 'vertical', fontSize: '0.95rem'}} value={newPDesc} onChange={e=>setNewPDesc(e.target.value)} placeholder="Tell buyers how it was grown..." />
                                </div>

                                <button className="btn-luxe-green" style={{marginTop: '20px', padding: '16px', fontSize: '1.05rem', borderRadius: '8px', fontWeight: 'bold', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', border: 'none', cursor: 'pointer'}} onClick={handleAddProduct}>
                                    <Package size={20} /> Publish to Marketplace
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MarketplacePage;

