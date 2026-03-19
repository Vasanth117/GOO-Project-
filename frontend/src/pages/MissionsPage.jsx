import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf, Trophy, CheckCircle, Clock, PlayCircle, BarChart3,
    Calendar, Users, Rocket, Target, Award, ArrowRight,
    Search, Filter, ChevronRight, Upload, MapPin, Brain,
    Sprout, Zap, Globe, Flame
} from "lucide-react";
const SOLO_TASKS = [
    {
        id: 1, title: 'Apply Drip Irrigation Today', category: 'Daily', duration: '30 mins',
        xp: 150, badges: 'Water Saver', description: 'Use drip irrigation lines instead of flood irrigation for your paddy field today. Focus on slow, targeted watering at root zones.',
        ecoBenefit: 'Reduces water usage by up to 60%', difficulty: 'Easy', status: 'not-started',
        tags: ['Recommended', 'Efficient']
    },
    {
        id: 2, title: 'Zero Chemical Week', category: 'Weekly', duration: '7 days',
        xp: 500, badges: 'Eco Guardian', description: 'Avoid all synthetic pesticides and fertilizers this week. Replace with neem oil spray and compost tea for your soil.',
        ecoBenefit: 'Improves long-term soil health and biodiversity', difficulty: 'Medium', status: 'in-progress',
        tags: ['Organic', 'Soil Health']
    },
    {
        id: 3, title: 'Plant Nitrogen Fixers', category: 'Monthly', duration: '2 hours',
        xp: 800, badges: 'Soil Master', description: 'Plant legumes or nitrogen-fixing cover crops on 10% of your unused farmland to naturally restore nitrogen levels.',
        ecoBenefit: 'Restores soil nitrogen without chemical urea', difficulty: 'Hard', status: 'not-started',
        tags: ['Soil Fixer', 'Long Term']
    }
];
const COMMUNITY_TASKS = [
    {
        id: 'c1', title: 'District Water Challenge', scope: 'Warangal District', daysLeft: 5,
        goal: 'Save 1 Million Liters', progress: 72, participants: 450,
        reward: 'Top 100 get "Rainmaker" badge', status: 'joined'
    },
    {
        id: 'c2', title: 'Pollinator Corridor Project', scope: 'Telangana State', daysLeft: 12,
        goal: 'Plant 10k Flowering Shrubs', progress: 34, participants: 1200,
        reward: 'Unique Hive-Mind Badge', status: 'open'
    }
];
const MissionsPage = () => {
    const [activeTab, setActiveTab] = useState('solo');
    const [durationFilter, setDurationFilter] = useState('All');
    const [activeTasks, setActiveTasks] = useState(SOLO_TASKS);
    const [communityTasks, setCommunityTasks] = useState(COMMUNITY_TASKS);
    const [reward, setReward] = useState(null);
    const [uploadingTask, setUploadingTask] = useState(null);
    const showReward = (task) => {
        setReward({ xp: task.xp, badge: task.badges || 'Task Completed!' });
        setTimeout(() => setReward(null), 3000);
    };

    const handleComplete = (task) => {
        setActiveTasks(prev => prev.map(t => t.id === task.id ? { ...t, status: 'completed' } : t));
        showReward(task);
    };

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

            {/* ── STATS STRIP ── */}
            <div className="stats-strip">
                <StatCard label="Current Streak" val="6 Days" icon={Flame} color="#d4af37" trendIcon={Zap} />
                <StatCard label="Total XP" val="2,140" icon={Trophy} color="#2d5a27" />
                <StatCard label="Completed" val="14" icon={CheckCircle} color="#4c7c42" />
                <StatCard label="Active" val="3" icon={Rocket} color="#768953" />
                <StatCard label="Sustainability Score" val="84 / 100" icon={Sprout} color="#2d5a27" trendIcon={Leaf} />
            </div>

            {/* ── PREMIUM AI RECOMMENDED TASK ── */}
            <motion.div 
                className="ai-recommended-banner"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
            >
                <div className="ai-rec-icon-box">
                    <Brain size={28} color="#e9c46a" />
                </div>
                
                <div className="ai-banner-content">
                    <div className="ai-banner-top-row">
                        <span className="ai-banner-title">AI Powered Recommendation</span>
                        <span className="ai-badge">Personalized</span>
                    </div>
                    <div className="ai-banner-desc">
                        Based on your <strong>clay-loam soil</strong>, <strong>paddy crop</strong>, and local <strong>weather analytics</strong> — apply neem oil spray this morning for maximum pest control effectiveness.
                    </div>
                </div>

                <motion.button 
                    className="btn-start-task"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                        const aiTask = { id: 'ai-1', title: 'Apply Neem Oil Spray', xp: 250, badges: 'Pest Master' };
                        showReward(aiTask);
                    }}
                >
                    Start Now <ChevronRight size={14} />
                </motion.button>
            </motion.div>

            {/* ── TABS ── */}
            <div className="leaderboard-controls">
                <div className="scope-tabs">
                    {['solo', 'community', 'active', 'completed', 'progress'].map(t => (
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
            {/* ── TASKS GRID ── */}
            <div className="tasks-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 25 }}>
                {activeTasks.filter(t => t.status !== 'completed').map((task, i) => (
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
                                <Clock size={12} /> {task.category} • {task.duration}
                            </div>
                            <div className="xp-badge" style={{ background: '#fff9e6', color: '#d4af37', padding: '4px 10px', borderRadius: 8, fontSize: '0.8rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Zap size={14} /> +{task.xp} XP
                            </div>
                        </div>
                        <h4 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1a1c19', margin: '10px 0' }}>{task.title}</h4>
                        <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: 20 }}>{task.description}</p>
                        
                        <div style={{ background: '#f0f7f0', padding: 12, borderRadius: 12, marginBottom: 20 }}>
                            <div style={{ color: '#2d5a27', fontSize: '0.8rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                                <Leaf size={14} /> Eco-Farming Benefit:
                            </div>
                            <div style={{ fontSize: '0.82rem', color: '#555', marginTop: 4 }}>{task.ecoBenefit}</div>
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
            {/* ── REWARD TOAST ── */}
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
                            <div style={{ fontWeight: 900, color: 'white' }}>MISSION COMPLETED</div>
                            <div style={{ fontSize: '0.8rem', color: '#aaa' }}>Earned +{reward.xp} XP & {reward.badge} Badge</div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default MissionsPage;
