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
    PieChart, Activity, AlertCircle, HardDrive, Gift
} from 'lucide-react';

import { apiService } from '../services/apiService';

const MarketplacePage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    // phase: 'gate' | 'buyer' | 'seller'
    const [phase, setPhase] = useState('gate');
    const [activeTab, setActiveTab] = useState('shop'); // For Buyer
    const [sellerTab, setSellerTab] = useState('dash'); // For Seller

    const [showCart, setShowCart] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [showSellerProfile, setShowSellerProfile] = useState(null);
    const [showAddProduct, setShowAddProduct] = useState(false);
    const [checkoutStep, setCheckoutStep] = useState(0);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiService.getProducts();
                setProducts(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

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

                        <motion.div className="gate-cta seller-bg" whileHover={{ scale: 1.02 }} onClick={() => setPhase('seller')}>
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
                            <div className="user-pts">1,250 Pts</div>
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
                    {activeTab === 'shop' ? (
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
                                                <img src={p.img} alt="p" />
                                                <div className="badge-verify">Verified Organic</div>
                                            </div>
                                            <div className="p-card-content">
                                                <div className="pc-seller" onClick={(e) => {e.stopPropagation(); setShowSellerProfile(p.seller);}}>
                                                    <MapPin size={12} /> {p.seller}
                                                </div>
                                                <h4>{p.name}</h4>
                                                <div className="pc-price-bar">
                                                    <div className="price-main">₹{p.price}</div>
                                                    <div className="price-reward">Use Points</div>
                                                </div>
                                                <button className="btn-add-luxe">View Journey <ArrowRight size={14} /></button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="track-page-view">
                            <div className="live-track-card">
                                <div className="lt-header"><h3>Tracking #ORD-8821</h3><div className="status-badge transit">In Transit</div></div>
                                <div className="stepper-horizontal">
                                    <div className="step done"><div className="dot" /><span>Ordered</span></div>
                                    <div className="step done"><div className="dot" /><span>Packed</span></div>
                                    <div className="step active"><div className="dot" /><span>Shipped</span></div>
                                    <div className="step"><div className="dot" /><span>Arrived</span></div>
                                    <div className="track-line-progress"><div className="fill-bar" style={{width: '66%'}} /></div>
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
                                <div className="stat-card-gold"><DollarSign size={24} /><div><strong>₹1.2L</strong><span>Income</span></div></div>
                                <div className="stat-card-gold green"><ClipboardList size={24} /><div><strong>28</strong><span>Sales</span></div></div>
                            </div>
                            <div className="sales-graph-placeholder">
                                <h3>Revenue History</h3>
                                <div className="graph-bars">
                                    {[30, 60, 45, 80, 50, 90, 75].map((h, i) => <div key={i} className="g-bar" style={{height: h + '%'}} />)}
                                </div>
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
                                <img src={selectedProduct.img} alt="p" className="pd-main-img" />
                                <div className="farm-transparency-card">
                                    <h3>🌱 Farm Transparency Proof</h3>
                                    <p>Seed to Harvest proof from Ravi's Verified Missions.</p>
                                    <div className="transparency-media-row">
                                        <div className="tm-item"><img src={img1} alt="i" /><span>Planting</span></div>
                                        <div className="tm-item"><img src={img2} alt="i" /><span>Feed</span></div>
                                        <div className="tm-item"><img src={img3} alt="i" /><span>Ready</span></div>
                                    </div>
                                    <button className="btn-add-luxe" onClick={() => setShowSellerProfile(selectedProduct.seller)}>View Farmer Instagram Profile <ArrowRight size={14} /></button>
                                </div>
                            </div>
                            <div className="pd-right">
                                <button className="btn-close-pd" onClick={() => setSelectedProduct(null)}><X /></button>
                                <h1 className="pd-name">{selectedProduct.name}</h1>
                                <div className="pd-price-main">₹{selectedProduct.price}</div>
                                <p className="pd-desc">{selectedProduct.desc}</p>
                                <button className="btn-luxe-green" style={{width: '100%', marginTop: '40px'}}>Buy with Points Discount</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showSellerProfile && (
                    <div className="modal-luxe-overlay" onClick={() => setShowSellerProfile(null)}>
                        <motion.div className="insta-profile-modal" initial={{ scale: 0.9 }} animate={{ scale: 1 }} onClick={e => e.stopPropagation()}>
                            <div className="insta-header">
                                <img src={avatar2} alt="f" className="sh-avatar" />
                                <div className="sh-meta">
                                    <h2>{showSellerProfile} <ShieldCheck size={20} color="#2d5a27" /></h2>
                                    <p>Organic Rice Farmer • 15 Years Experience</p>
                                    <button className="btn-luxe-blue" style={{marginTop: '20px'}}>Follow Farmer Feed</button>
                                </div>
                            </div>
                            <div className="insta-grid">
                                {[img1, img2, img3, img1, img2, img3].map((m, i) => <div key={i} className="insta-item"><img src={m} alt="p" /></div>)}
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default MarketplacePage;

