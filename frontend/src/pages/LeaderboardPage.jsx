import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Medal, Globe, MapPin, TrendingUp, 
    Search, Filter, ChevronRight, Zap, Droplets, 
    Wind, Leaf, Star, Award, Crown, Loader2
} from 'lucide-react';

import { apiService } from '../services/apiService';
import avatarDefault from '../assets/images/9.jpg';

const LeaderboardPage = () => {
    const [scope, setScope] = useState('District'); // Local, District, State, Global
    const [timeframe, setTimeframe] = useState('Monthly'); // Weekly, Monthly, All-Time
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiService.getLeaderboard(scope.toLowerCase());
                setLeaders(data || []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, [scope, timeframe]);

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

    const topThree = leaders.slice(0, 3).sort((a,b) => (a.rank || 0) - (b.rank || 0));
    const others = leaders.slice(3);

    // Arrange podium as 2nd, 1st, 3rd
    const podiumOrder = [topThree[1] || leaders[1], topThree[0] || leaders[0], topThree[2] || leaders[2]].filter(Boolean);

    return (
        <div className="leaderboard-page">
            
            {/* ── PODIUM SECTION ── */}
            <div className="podium-container">
                {podiumOrder.map((leader, i) => {
                    const isFirst = leader.rank === 1;
                    return (
                        <motion.div 
                            key={leader.id}
                            className={`podium-spot spot-${leader.rank}`}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1, duration: 0.6 }}
                        >
                            <div className="avatar-container">
                                {isFirst && <motion.div className="crown-icon" animate={{ y: [0, -5, 0] }} transition={{ repeat: Infinity, duration: 2 }}><Crown size={24} fill="#d4af37" color="#d4af37" /></motion.div>}
                                <img src={leader.avatar || avatarDefault} alt={leader.name} className="podium-avatar" />
                                <div className="rank-badge">{leader.rank}</div>
                            </div>
                            <div className="podium-name">{leader.name}</div>
                            <div className="podium-points"><Zap size={14} /> {(leader.points || 0).toLocaleString()} pts</div>
                            <div className="podium-base" style={{ height: isFirst ? '140px' : '100px' }}>
                                <div className="podium-stats">
                                    <span>{leader.badges || 0} Badges</span>
                                    <span>{leader.impact?.water || '0 L'} Water</span>
                                </div>
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* ── FILTERS ── */}
            <div className="leaderboard-controls">
                <div className="scope-tabs">
                    {['Local', 'District', 'State', 'Global'].map(s => (
                        <button 
                            key={s} 
                            className={`filter-tab ${scope === s ? 'active' : ''}`}
                            onClick={() => setScope(s)}
                        >
                            {s}
                        </button>
                    ))}
                </div>
                <div className="time-tabs">
                    {['Weekly', 'Monthly', 'All-Time'].map(t => (
                        <button 
                            key={t} 
                            className={`filter-tab ${timeframe === t ? 'active' : ''}`}
                            onClick={() => setTimeframe(t)}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── LIST SECTION ── */}
            <div className="leaderboard-list">
                <div className="list-header">
                    <span className="col-rank">Rank</span>
                    <span className="col-farmer">Farmer</span>
                    <span className="col-impact">Impact</span>
                    <span className="col-points">Points</span>
                </div>
                
                <div className="list-items">
                    {others.map((leader, i) => (
                        <motion.div 
                            key={leader.id} 
                            className={`list-item ${leader.isUser ? 'user-highlight' : ''}`}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <div className="col-rank">#{leader.rank}</div>
                            <div className="col-farmer">
                                <img src={leader.avatar || avatarDefault} alt="" className="item-avatar" />
                                <div>
                                    <div className="item-name">{leader.name} {leader.isUser && "⭐"}</div>
                                    <div className="item-loc">📍 {leader.location || 'Unknown'}</div>
                                </div>
                            </div>
                            <div className="col-impact">
                                <div className="impact-pill"><Droplets size={12} /> {leader.impact?.water || '0 L'}</div>
                                <div className="impact-pill"><Wind size={12} /> {leader.impact?.co2 || '0t'}</div>
                            </div>
                            <div className="col-points">
                                <div className="points-val"><Zap size={14} color="#d4af37" /> {(leader.points || 0).toLocaleString()}</div>
                                <div className={`trend-${leader.trend || 'stable'}`}>{leader.trend === 'up' ? '▲' : leader.trend === 'down' ? '▼' : '▬'}</div>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* ── STICKY YOUR RANK ── */}
            <motion.div 
                className="user-sticky-rank"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="sticky-content">
                    <span className="sticky-rank">Your Rank: #18</span>
                    <img src={img9} alt="" className="sticky-avatar" />
                    <div className="sticky-info">
                        <strong>Ravi Kumar</strong>
                        <span>Warangal District</span>
                    </div>
                    <div className="sticky-progress">
                        <div className="progress-text">Next Rank: 110 pts away</div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '75%' }}></div></div>
                    </div>
                    <button className="sticky-btn">View Stats</button>
                </div>
            </motion.div>
        </div>
    );
};

export default LeaderboardPage;
