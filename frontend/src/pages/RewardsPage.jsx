import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Gift, Trophy, Zap, Ticket, ShoppingBag, 
    History, Award, Star, TrendingUp, ShieldCheck,
    Lock, ChevronRight, CheckCircle2, Info,
    ArrowRight, Wallet, Flame, Users, Leaf, Map, Search, Filter
} from 'lucide-react';
import avatar from '../assets/images/9.jpg';
const BADGES = [
    { id: 1, name: 'Eco Beginner', desc: 'Completed your first 5 eco tasks', icon: SproutIcon, earned: true, color: '#2d5a27' },
    { id: 2, name: 'Water Saver', desc: 'Saved 500L of water through drip irrigation', icon: DropletIcon, earned: true, color: '#3b82f6' },
    { id: 3, name: 'Soil Protector', desc: 'Used zero chemical fertilizers for 1 month', icon: ShieldCheck, earned: false, color: '#768953', unlock: '2 tasks left' },
    { id: 4, name: 'Climate Champion', desc: 'Top 1% contributor in your district', icon: GlobeIcon, earned: false, color: '#d4af37', unlock: 'Reach Rank 10' }
];

const VOUCHERS = [
    { id: 'v1', title: '₹100 Off Organic Fertilizer', brand: 'Eco-Grow', expiry: '24 Mar 2026', value: 100, code: 'ECO100', used: false },
    { id: 'v2', title: '20% Discount on Seeds', brand: 'Bharat Seeds', expiry: '12 Apr 2026', value: 20, code: 'SEED20', used: false }
];

const HISTORY = [
    { id: 1, action: 'Completed Drip Irrigation Task', points: 150, date: 'Today' },
    { id: 2, action: '5-Day Streak Bonus', points: 50, date: 'Yesterday' },
    { id: 3, action: 'Community Water Challenge Participation', points: 100, date: '2 days ago' },
    { id: 4, action: 'Helpful Answer in Forum', points: 20, date: '3 days ago' }
];
// Helper icons since they weren't in the main import for simplicity
function SproutIcon(props) { return <Leaf {...props} /> }
function DropletIcon(props) { return <Zap {...props} /> } // Using Zap as placeholder for water logic
function GlobeIcon(props) { return <Trophy {...props} /> }
const RewardsPage = () => {
    const [points, setPoints] = useState(1250);
    const [vouchers, setVouchers] = useState(VOUCHERS);

    return (
        <div className="rewards-layout">
            
            {/* ── TOP: REWARDS SUMMARY ── */}
            <div className="rewards-summary-grid">
                <motion.div className="summary-card main" whileHover={{ y: -5 }}>
                    <div className="summary-info">
                        <div className="summary-label">Total Points Balance</div>
                        <div className="summary-val"><Wallet size={24} /> {points}</div>
                        <div className="summary-sub">Spend these in the Redeem Store 🛒</div>
                    </div>
                    <div className="summary-glow" />
                </motion.div>

                <div className="summary-card">
                    <div className="summary-label">Unlocked Badges</div>
                    <div className="summary-val"><Award size={24} color="#d4af37" /> 5 / 20</div>
                    <div className="summary-sub">Top 5% in your region 🔝</div>
                </div>
                <div className="summary-card">
                    <div className="summary-label">Available Vouchers</div>
                    <div className="summary-val"><Ticket size={24} color="#2d5a27" /> {vouchers.length}</div>
                    <div className="summary-sub">₹{vouchers.reduce((acc, v) => acc + (v.value || 0), 0)} total value 🎟️</div>
                </div>

                <div className="summary-card">
                    <div className="summary-label">Current Streak</div>
                    <div className="summary-val"><Flame size={24} color="#e63946" /> 6 Days</div>
                    <div className="summary-sub">Next bonus in 1 day 🔥</div>
                </div>
            </div>

            <div className="rewards-main-content">
                
                {/* ── LEFT: BADGES & STORE ── */}
                <div className="rewards-content-left">
                    <section className="rewards-section">
                        <div className="section-header">
                            <h3 className="section-title">Achievement Badges</h3>
                            <button className="view-all-link">View All <ChevronRight size={14} /></button>
                        </div>
                        <div className="badge-grid">
                            {BADGES.map(badge => (
                                <motion.div key={badge.id} className={`badge-card ${!badge.earned ? 'locked' : ''}`} whileHover={{ scale: 1.03 }}>
                                    <div className="badge-icon-wrap" style={{ 
                                        background: badge.earned ? `${badge.color}15` : '#f0f0f0',
                                        color: badge.earned ? badge.color : '#aaa' 
                                    }}>
                                        <badge.icon size={26} />
                                        {!badge.earned && <div className="lock-overlay"><Lock size={12} /></div>}
                                    </div>
                                    <div className="badge-name">{badge.name}</div>
                                    <div className="badge-desc">{badge.desc}</div>
                                    {!badge.earned && <div className="unlock-req">{badge.unlock}</div>}
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section className="rewards-section">
                        <div className="section-header">
                            <h3 className="section-title">Redeem Points Store</h3>
                            <span className="section-sub">Turn your eco-points into real farming value</span>
                        </div>
                        <div className="store-grid">
                            {[
                                { title: 'Bio-Fertilizer Pack', price: 800, icon: Leaf, cat: 'Fertilizer' },
                                { title: 'Drip Pipe Extension', price: 1200, icon: DropletIcon, cat: 'Tools' },
                                { title: 'Drought Resistant Seeds', price: 500, icon: Star, cat: 'Seeds' }
                            ].map((item, i) => (
                                <div key={i} className="store-item">
                                    <div className="store-icon"><item.icon size={20} /></div>
                                    <div className="store-info">
                                        <div className="store-cat">{item.cat}</div>
                                        <div className="store-name">{item.title}</div>
                                    </div>
                                    <button className="btn-redeem">{item.price} pts</button>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* ── RIGHT: WALLET & VOUCHERS ── */}
                <aside className="rewards-content-right">
                    
                    <div className="wallet-history-card">
                        <div className="widget-title"><History size={18} /> Points History</div>
                        <div className="history-list">
                            {HISTORY.map(h => (
                                <div key={h.id} className="history-item">
                                    <div className="h-info">
                                        <div className="h-action">{h.action}</div>
                                        <div className="h-date">{h.date}</div>
                                    </div>
                                    <div className="h-pts">+{h.points}</div>
                                </div>
                            ))}
                        </div>
                        <button className="view-full-history">View Full Ledger</button>
                    </div>

                    <div className="vouchers-widget">
                        <div className="widget-title"><Ticket size={18} /> Active Vouchers</div>
                        {vouchers.map(v => (
                            <motion.div key={v.id} className="voucher-card" whileHover={{ x: 5 }}>
                                <div className="v-cutout" />
                                <div className="v-brand">{v.brand}</div>
                                <div className="v-title">{v.title}</div>
                                <div className="v-expiry">Expires: {v.expiry}</div>
                                <div className="v-footer">
                                    <div className="v-code">{v.code}</div>
                                    <button className="btn-use-v">Use Now</button>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    <div className="streak-progress-card">
                        <div className="streak-header">
                            <Flame size={20} color="#e63946" />
                            <span>Streak Progress</span>
                        </div>
                        <div className="streak-bars">
                            {[1, 2, 3, 4, 5, 6, 7].map(d => (
                                <div key={d} className={`streak-dot ${d <= 6 ? 'active' : ''}`} />
                            ))}
                        </div>
                        <div className="streak-msg">Day 7 Reward: <strong>+100 Bonus XP</strong></div>
                    </div>

                </aside>

            </div>

        </div>
    );
};

export default RewardsPage;
