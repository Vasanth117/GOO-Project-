import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf, Trophy, CheckCircle, Clock, PlayCircle,
    Rocket, Target, Zap, Globe, Flame, Loader2, ChevronRight, Brain
} from "lucide-react";
import { apiService } from '../services/apiService';

const MissionsPage = () => {
    const [activeTab, setActiveTab] = useState('solo');
    const [missions, setMissions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reward, setReward] = useState(null);

    useEffect(() => {
        const load = async () => {
            try {
                const [missionData, statsData] = await Promise.all([
                    apiService.getMissions(),
                    apiService.getStats()
                ]);
                setMissions(missionData || []);
                setStats(statsData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleComplete = (task) => {
        // Here we would normally submit proof, but for demo:
        setReward({ xp: task.xp_reward, badge: 'Task Completed!' });
        setTimeout(() => setReward(null), 3000);
    };

    if (loading) return <div className="loading-full"><Loader2 className="spinner" /></div>;

    const StatCard = ({ label, val, icon: Icon, color, trendIcon: Trend }) => (
        <div className="stat-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div className="stat-label">{label}</div>
                <Icon size={18} color={color} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="stat-val">{val}</div>
                {Trend && <Trend size={16} color={color} />}
            </div>
        </div>
    );

    return (
        <div className="leaderboard-page">
            <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Target size={24} color="#2d5a27" />
                    <h2 className="topbar-title" style={{ margin: 0 }}>Missions & Tasks</h2>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: 4 }}>
                    <span className="topbar-sub">Complete eco-challenges, earn XP & improve global sustainability</span>
                    <Globe size={14} color="#888" />
                </div>
            </div>

            <div className="stats-strip">
                <StatCard label="Streak" val="6 Days" icon={Flame} color="#d4af37" trendIcon={Zap} />
                <StatCard label="Total XP" val={stats?.xp || '0'} icon={Trophy} color="#2d5a27" />
                <StatCard label="Level" val={stats?.tier?.tier || 'Explorer'} icon={Award} color="#4c7c42" />
                <StatCard label="Sustainability Score" val={stats?.sustainability_score + " / 100"} icon={Leaf} color="#2d5a27" />
            </div>

            <div className="leaderboard-controls">
                <div className="scope-tabs">
                    {['solo', 'community', 'active', 'completed'].map(t => (
                        <button 
                            key={t}
                            className={`filter-tab ${activeTab === t ? 'active' : ''}`}
                            onClick={() => setActiveTab(t)}
                            style={{ textTransform: 'capitalize' }}
                        >
                            {t} Tasks
                        </button>
                    ))}
                </div>
            </div>

            <div className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 25 }}>
                {missions.map((task, i) => (
                    <motion.div 
                        key={task.id} 
                        className="task-card"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        style={{ background: 'white', padding: 25, borderRadius: 24, border: '1.5px solid #eeedeb', boxShadow: '0 4px 15px rgba(0,0,0,0.02)' }}
                    >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
                            <div style={{ background: '#f4f7f4', padding: '6px 12px', borderRadius: 10, fontSize: '0.75rem', fontWeight: 700, color: '#2d5a27', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <Clock size={12} /> {task.category}
                            </div>
                            <div className="xp-badge" style={{ background: '#fff9e6', color: '#d4af37', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Zap size={14} /> +{task.xp_reward} XP
                            </div>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1c19', margin: '10px 0' }}>{task.title}</h4>
                        <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: 20 }}>{task.description}</p>
                        
                        <div style={{ background: '#f0f7f0', padding: 12, borderRadius: 12, marginBottom: 20 }}>
                            <div style={{ color: '#2d5a27', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Leaf size={14} /> Sustainability Bonus:
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 4 }}>High impact on soil and water preservation.</div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                            <motion.button 
                                className="btn-start-task" 
                                style={{ flex: 1, justifyContent: 'center' }}
                                onClick={() => handleComplete(task)}
                            >
                                <PlayCircle size={16} /> Start Task
                            </motion.button>
                        </div>
                    </motion.div>
                ))}
            </div>

            <AnimatePresence>
                {reward && (
                    <motion.div 
                        className="reward-toast"
                        initial={{ opacity: 0, y: 50, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                    >
                        <Trophy size={24} color="#d4af37" />
                        <div>
                            <div style={{ fontWeight: 900, color: 'white' }}>MISSION STARTED</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Good luck with your {reward.badge} journey!</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MissionsPage;
