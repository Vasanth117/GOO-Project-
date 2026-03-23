import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Trophy, Medal, Globe, MapPin, TrendingUp, TrendingDown, Minus,
    Search, Filter, ChevronRight, Zap, Droplets, 
    Wind, Leaf, Star, Award, Crown, Loader2
} from 'lucide-react';

import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import avatarDefault from '../assets/images/9.jpg';
import './LeaderboardPage.css';

const LeaderboardPage = () => {
    const { user } = useAuth();
    const [scope, setScope] = useState('National'); // Local, District, State, Global
    const [timeframe, setTimeframe] = useState('Monthly'); // Weekly, Monthly, All-Time
    const [leaders, setLeaders] = useState([]);
    const [myRank, setMyRank] = useState(null);
    const [loading, setLoading] = useState(true);

    const load = async () => {
        try {
            const [data, rankData] = await Promise.all([
                apiService.getLeaderboard(scope.toLowerCase()),
                apiService.getMyRank()
            ]);
            setLeaders(data.entries || []);
            setMyRank(rankData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
        // 🔄 REAL-TIME SYNC: Refresh every 30 seconds
        const interval = setInterval(load, 30000);
        return () => clearInterval(interval);
    }, [scope, timeframe]);

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

    const topThree = leaders.slice(0, 3).sort((a,b) => (a.rank || 0) - (b.rank || 0));
    const others = leaders.slice(3);

    // Arrange podium as 2nd, 1st, 3rd
    const podiumOrder = [topThree[1] || leaders[1], topThree[0] || leaders[0], topThree[2] || leaders[2]].filter(Boolean);

    return (
        <div className="leaderboard-page">
            
            {/* ── PODIUM SECTION ── */}
            {leaders.length > 0 && (
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
            )}

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
                
                {leaders.length === 0 ? (
                    <div style={{ padding: '60px 20px', textAlign: 'center', color: '#888' }}>
                        <Trophy size={48} color="#d1e2d1" style={{ marginBottom: 15 }} />
                        <h3 style={{ color: '#1a1c19', marginBottom: 5 }}>Leaderboard is Warming Up</h3>
                        <p>Complete missions and earn points to be the first on the board!</p>
                    </div>
                ) : (
                    <div className="list-items">
                        {others.map((leader, i) => (
                            <motion.div 
                                key={leader.id} 
                                className={`list-item ${leader.isUser ? 'user-highlight' : ''}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                onClick={() => navigate(`/profile/${leader.user_id || leader.id}`)}
                                style={{ cursor: 'pointer' }}
                            >
                                <div className="col-rank">#{leader.rank}</div>
                                <div className="col-farmer">
                                    <img src={leader.avatar || avatarDefault} alt="" className="item-avatar" />
                                    <div>
                                        <div className="item-name" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>{leader.name} {leader.isUser && <Star size={14} color="#d4af37" fill="#d4af37" />}</div>
                                        <div className="item-loc" style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={11} /> {leader.location || 'Unknown'}</div>
                                    </div>
                                </div>
                                <div className="col-impact">
                                    <div className="impact-pill"><Droplets size={12} /> {leader.impact?.water || '0 L'}</div>
                                    <div className="impact-pill"><Wind size={12} /> {leader.impact?.co2 || '0t'}</div>
                                </div>
                                <div className="col-points">
                                    <div className="points-val"><Zap size={14} color="#d4af37" /> {(leader.points || 0).toLocaleString()}</div>
                                    <div className={`trend-${leader.trend || 'stable'}`}>
                                         {leader.trend === 'up' ? <TrendingUp size={14} color="#22c55e" /> : leader.trend === 'down' ? <TrendingDown size={14} color="#ef4444" /> : <Minus size={14} color="#aaa" />}
                                     </div>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>

            <motion.div 
                className="user-sticky-rank"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.8 }}
            >
                <div className="sticky-content">
                    <span className="sticky-rank">Your Rank: #{myRank?.national_score_rank || 'N/A'}</span>
                    <img src={user?.profile_picture || avatarDefault} alt="" className="sticky-avatar" />
                    <div className="sticky-info">
                        <strong>{user?.name || 'Farmer'}</strong>
                        <span>{user?.farm_profile?.location_name || 'India'}</span>
                    </div>
                    <div className="sticky-progress">
                        <div className="progress-text">Score: {myRank?.current_score || 0} pts</div>
                        <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: '45%' }}></div></div>
                    </div>
                    <button className="sticky-btn">View Stats</button>
                </div>
            </motion.div>
        </div>
    );
};

export default LeaderboardPage;
