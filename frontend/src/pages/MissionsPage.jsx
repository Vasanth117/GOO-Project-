import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Leaf, Trophy, CheckCircle, Clock, PlayCircle,
    Rocket, Target, Zap, Globe, Flame, Loader2, ChevronRight, Brain,
    ShieldCheck, Award, MapPin, Camera, X, Send, ListChecks, Play,
    BarChart3, Users, Crown, Filter, Calendar, Activity, CheckSquare
} from "lucide-react";
import { apiService } from '../services/apiService';
import CameraCapture from '../components/CameraCapture';

const MissionsPage = () => {
    const [activeTab, setActiveTab] = useState('solo'); // solo, community, completed
    const [timeFilter, setTimeFilter] = useState('daily'); // daily, weekly, monthly
    const [missions, setMissions] = useState([]);
    const [communityMissions, setCommunityMissions] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [reward, setReward] = useState(null);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState(null);
    const [historyMissions, setHistoryMissions] = useState([]);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const loadAll = async () => {
            try {
                const [missionData, communityData, statData, historyData] = await Promise.all([
                    apiService.getMissions(),
                    apiService.getCommunityMissions(),
                    apiService.getStats(),
                    apiService.getMissionHistory(1, 50)
                ]);
                const flattenedMissions = missionData ? Object.values(missionData).flat() : [];
                
                // If no missions, trigger AI to assign some
                if (flattenedMissions.length === 0) {
                    const aiData = await apiService.triggerAiMissions();
                    const newFlattened = aiData ? Object.values(aiData).flat() : [];
                    setMissions(newFlattened);
                } else {
                    setMissions(flattenedMissions);
                }

                setHistoryMissions(historyData?.missions || []);
                setCommunityMissions(communityData || []);
                setStats(statData);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        loadAll();
    }, []);

    const handleStart = async (progressId) => {
        try {
            await apiService.startMission(progressId);
            const missionData = await apiService.getMissions();
            const flattenedMissions = missionData ? Object.values(missionData).flat() : [];
            setMissions(flattenedMissions);
            setReward({ xp: 0, title: 'Mission Started!' });
            setTimeout(() => setReward(null), 3000);
        } catch (err) {
            alert(err.message);
        }
    };

    if (loading) return <div style={{ display: 'flex', height: '80vh', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" size={48} color="#2d5a27" /></div>;

    const activeMissions = missions.filter(m => m.status === 'in_progress' || m.status === 'pending_review');
    const availableMissions = missions.filter(m => 
        m.status === 'active' && 
        ((activeTab === 'solo' && (m.mission_type === timeFilter || (timeFilter === 'daily' && m.mission_type === 'surprise'))) ||
         (activeTab === 'community' && m.mission_type === 'community'))
    );
    const completedMissions = [
        ...missions.filter(m => m.status === 'completed'),
        ...historyMissions.filter(m => m.status === 'completed')
    ].filter((v, i, a) => a.findIndex(t => t.progress_id === v.progress_id) === i); // dedupe

    return (
        <div className="missions-container" style={{ padding: '30px 5% 100px', maxWidth: '1400px', margin: '0 auto', background: '#f8faf8', minHeight: '100vh' }}>
            
            {/* 🟢 A. HEADER SECTION */}
            <div className="missions-header" style={{ marginBottom: 40, background: 'linear-gradient(135deg, #1a3c1a 0%, #2d5a27 100%)', padding: '40px', borderRadius: '32px', color: 'white', position: 'relative', overflow: 'hidden' }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <Crown size={24} color="#ffd700" />
                        <h1 style={{ fontSize: '2.4rem', fontWeight: 950, letterSpacing: '-0.02em', margin: 0 }}>Your Missions</h1>
                    </div>
                    <p style={{ opacity: 0.9, fontSize: '1.1rem', fontWeight: 500, maxWidth: '600px' }}>Complete regenerative tasks tailored for your farm. Earn GOO points and lead the Green Revolution.</p>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 20, marginTop: 30, position: 'relative', zIndex: 2 }}>
                    <HeaderStat label="Sustainability Score" val={stats?.sustainability_score || 0} icon={Leaf} />
                    <HeaderStat label="Current Streak" val={`${stats?.current_streak || 0} Days`} icon={Flame} />
                    <HeaderStat label="Total Points" val={stats?.xp || 0} icon={Trophy} />
                </div>

                {/* Decorative background circle */}
                <div style={{ position: 'absolute', top: '-50px', right: '-50px', width: '300px', height: '300px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%' }} />
            </div>

            {/* 🟢 B. CATEGORY TABS */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30, flexWrap: 'wrap', gap: 20 }}>
                <div className="tab-group" style={{ display: 'flex', background: '#e8eee8', padding: 6, borderRadius: 16, gap: 4 }}>
                    {['solo', 'community', 'completed'].map(tab => (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                padding: '12px 28px', border: 'none', borderRadius: 12, fontSize: '0.9rem', fontWeight: 900, cursor: 'pointer',
                                background: activeTab === tab ? 'white' : 'transparent',
                                color: activeTab === tab ? '#2d5a27' : '#666',
                                boxShadow: activeTab === tab ? '0 4px 12px rgba(0,0,0,0.08)' : 'none',
                                transition: '0.3s'
                            }}
                        >
                            {tab === 'solo' ? '🧍 Solo Tasks' : tab === 'community' ? '👥 Community' : '🏆 Completed'}
                        </button>
                    ))}
                </div>

                {activeTab === 'solo' && (
                    <div style={{ display: 'flex', background: 'white', padding: 6, borderRadius: 16, gap: 4, border: '1.5px solid #e8eee8' }}>
                        {['daily', 'weekly', 'monthly'].map(filter => (
                            <button 
                                key={filter}
                                onClick={() => setTimeFilter(filter)}
                                style={{
                                    padding: '8px 20px', border: 'none', borderRadius: 10, fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer',
                                    background: timeFilter === filter ? '#2d5a27' : 'transparent',
                                    color: timeFilter === filter ? 'white' : '#666',
                                    transition: '0.3s'
                                }}
                            >
                                {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* 🧍 3️⃣ SOLO TASKS SECTION */}
            {activeTab === 'solo' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    
                    {/* 🔥 5️⃣ ACTIVE TASKS SECTION (PROGRESS) */}
                    {activeMissions.length > 0 && (
                        <section>
                            <SectionHeader icon={Activity} title="In Progress" count={activeMissions.length} color="#d97706" />
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 25 }}>
                                {activeMissions.map((task, i) => (
                                    <ActiveTaskCard key={task.progress_id} task={task} onComplete={() => { setSelectedTask(task); setShowSubmitModal(true); }} />
                                ))}
                            </div>
                        </section>
                    )}

                    <section>
                        <SectionHeader icon={Target} title={`${timeFilter.charAt(0).toUpperCase() + timeFilter.slice(1)} Personal Tasks`} color="#2d5a27" />
                        {availableMissions.length === 0 ? (
                            <EmptyState message={`No ${timeFilter} tasks available right now. Check back soon!`} />
                        ) : (
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25 }}>
                                {availableMissions.map((task, i) => (
                                    <MissionCard key={task.progress_id} task={task} index={i} onStart={handleStart} />
                                ))}
                            </div>
                        )}
                    </section>
                    
                    {/* 📊 8️⃣ PROGRESS TRACKING */}
                    <section style={{ background: 'white', padding: '35px', borderRadius: '32px', border: '1.5px solid #eeedeb' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 25 }}>
                            <SectionHeader icon={BarChart3} title="Mission Vitality" color="#2d5a27" />
                            <div style={{ fontSize: '0.85rem', fontWeight: 800, color: '#666' }}>Total Completed: {completedMissions.length}</div>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 30 }}>
                            <ProgressBox label="Weekly Completion" target={7} current={completedMissions.filter(m => (new Date() - new Date(m.completed_at)) < 7 * 24 * 3600 * 1000).length} />
                            <ProgressBox label="Monthly Milestone" target={30} current={completedMissions.filter(m => (new Date() - new Date(m.completed_at)) < 30 * 24 * 3600 * 1000).length} />
                        </div>
                    </section>
                </div>
            )}

            {/* 👥 4️⃣ COMMUNITY TASKS SECTION */}
            {activeTab === 'community' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
                    {/* Global Community Goals */}
                    <section>
                        <SectionHeader icon={Globe} title="Collective Goals" color="#1e293b" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 25 }}>
                            {communityMissions.length === 0 ? (
                                <EmptyState message="No collective community goals right now." />
                            ) : (
                                communityMissions.map((task, i) => (
                                    <CommunityCard key={task.id || i} task={task} index={i} />
                                ))
                            )}
                        </div>
                    </section>

                    {/* Individual Community Tasks (The 10 tasks assigned for individual completion) */}
                    <section>
                        <SectionHeader icon={Users} title="Your Community Tasks" color="#2d5a27" />
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25 }}>
                            {availableMissions.filter(m => m.mission_type === 'community').length === 0 ? (
                                <EmptyState message="All community tasks are in progress or completed!" />
                            ) : (
                                availableMissions.filter(m => m.mission_type === 'community').map((task, i) => (
                                    <MissionCard key={task.progress_id} task={task} index={i} onStart={handleStart} />
                                ))
                            )}
                        </div>
                    </section>
                </div>
            )}

            {/* 🏆 7️⃣ COMPLETED TASKS SECTION */}
            {activeTab === 'completed' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 25 }}>
                    {completedMissions.length === 0 ? (
                        <EmptyState message="You haven't completed any missions yet. Time to start your first challenge!" />
                    ) : (
                        completedMissions.map((task, i) => (
                            <CompletedCard key={i} task={task} />
                        ))
                    )}
                </div>
            )}

            <AnimatePresence>
                {showSubmitModal && (
                    <MissionSubmissionModal 
                        task={selectedTask}
                        submitting={submitting}
                        onClose={() => setShowSubmitModal(false)}
                        onSubmit={async (formData) => {
                            setSubmitting(true);
                            try {
                                formData.append('mission_progress_id', selectedTask.progress_id);
                                await apiService.submitMissionProof(formData);
                                const [m, s] = await Promise.all([
                                    apiService.getMissions(),
                                    apiService.getStats()
                                ]);
                                setMissions(m ? Object.values(m).flat() : []);
                                setStats(s);
                                setShowSubmitModal(false);
                                if (res.status === 'pending_review') {
                                    setReward({ 
                                        xp: 0, 
                                        title: 'Verification Pending', 
                                        subtitle: 'AI is analyzing your task. Points will be awarded after verification.' 
                                    });
                                } else {
                                    setReward({ 
                                        xp: 50, 
                                        title: 'Task Completed!', 
                                        subtitle: 'High-confidence AI approval. Points added!' 
                                    });
                                }
                                setTimeout(() => setReward(null), 5000);
                            } catch (err) { alert(err.message); } finally {
                                setSubmitting(false);
                            }
                        }}
                    />
                )}
            </AnimatePresence>

            {/* 🎁 9️⃣ REWARD FEEDBACK SYSTEM */}
            <AnimatePresence>
                {reward && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8, y: 50 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, pointerEvents: 'none' }}
                    >
                        <div style={{ background: 'white', padding: '40px 60px', borderRadius: '40px', boxShadow: '0 20px 80px rgba(0,0,0,0.3)', border: '4px solid #2d5a27', textAlign: 'center', pointerEvents: 'auto' }}>
                            <div style={{ background: '#f0fdf4', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
                                <Crown size={40} color="#2d5a27" className="animate-bounce" />
                            </div>
                            <h2 style={{ fontSize: '2.4rem', fontWeight: 950, color: '#1a1c19', margin: '0 0 10px' }}>{reward.title}</h2>
                            <p style={{ fontSize: '1.1rem', color: '#666', fontWeight: 700, margin: 0 }}>🎉 You earned <strong>+{reward.xp}</strong> Impact Points!</p>
                            {reward.subtitle && <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#2d5a27', fontWeight: 900 }}>{reward.subtitle}</div>}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

// ── SUB-COMPONENTS ───────────────────────────────────────────

const HeaderStat = ({ label, val, icon: Icon }) => (
    <div style={{ background: 'rgba(255,255,255,0.1)', padding: '15px 20px', borderRadius: '18px', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <Icon size={16} color="#4ade80" />
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
        </div>
        <div style={{ fontSize: '1.4rem', fontWeight: 950 }}>{val}</div>
    </div>
);

const SectionHeader = ({ icon: Icon, title, count, color }) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <div style={{ width: 42, height: 42, background: `${color}15`, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', color: color }}>
            <Icon size={22} />
        </div>
        <h3 style={{ fontSize: '1.25rem', fontWeight: 950, color: '#1a1c19', margin: 0 }}>{title} {count !== undefined && <span style={{ color: '#aaa', fontWeight: 700 }}>({count})</span>}</h3>
    </div>
);

const MissionCard = ({ task, index, onStart }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
        style={{ background: 'white', padding: 25, borderRadius: 28, border: '1.5px solid #eeedeb', display: 'flex', flexDirection: 'column', transition: '0.3s' }}
    >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 15 }}>
            <div style={{ background: task.difficulty === 'hard' ? '#fee2e2' : task.difficulty === 'medium' ? '#fffbeb' : '#f0fdf4', padding: '6px 12px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 900, color: task.difficulty === 'hard' ? '#ef4444' : task.difficulty === 'medium' ? '#d97706' : '#2d5a27', textTransform: 'uppercase' }}>
                {task.difficulty || 'Easy'}
            </div>
            <div style={{ background: '#f8faf8', color: '#2d5a27', padding: '6px 12px', borderRadius: 10, fontSize: '0.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Zap size={14} /> +{task.reward_points} XP
            </div>
        </div>

        {task.personalization_tag && (
            <div style={{ color: '#2d5a27', fontSize: '0.75rem', fontWeight: 900, marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Brain size={14} /> {task.personalization_tag}
            </div>
        )}
        
        <h4 style={{ fontSize: '1.15rem', fontWeight: 950, color: '#1a1c19', margin: '0 0 10px' }}>{task.title}</h4>
        <p style={{ fontSize: '0.88rem', color: '#666', lineHeight: 1.6, marginBottom: 20, flex: 1 }}>{task.description}</p>
        
        <div style={{ background: '#fcfdfc', padding: 15, borderRadius: 20, border: '1px solid #f0f4f0', marginBottom: 20 }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#2d5a27', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Leaf size={14} /> Eco Benefit
            </div>
            <div style={{ fontSize: '0.82rem', color: '#1a3c1a', fontWeight: 700 }}>{task.eco_benefit || "Reduces environmental footprint"}</div>
        </div>

        <button 
            style={{ width: '100%', height: 48, background: '#2d5a27', color: 'white', border: 'none', borderRadius: 14, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer' }}
            onClick={() => onStart(task.progress_id)}
        >
            <PlayCircle size={18} /> Start Task
        </button>
    </motion.div>
);

const ActiveTaskCard = ({ task, onComplete }) => (
    <div style={{ background: 'white', padding: 25, borderRadius: 28, border: '1.5px solid #d9770633', boxShadow: '0 10px 30px rgba(217, 119, 6, 0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 15 }}>
            <h4 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0 }}>{task.title}</h4>
            <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#d97706', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {Math.max(0, Math.ceil((new Date(task.expires_at) - new Date()) / 3600000))}h left</div>
        </div>

        <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', fontWeight: 800, color: '#666', marginBottom: 8 }}>
                <span>Next: {task.next_step || 'Verify in app'}</span>
                <span>{task.progress_percentage || 0}%</span>
            </div>
            <div style={{ height: 10, background: '#fcfcfc', border: '1px solid #f0f0f0', borderRadius: 5, overflow: 'hidden' }}>
                <motion.div initial={{ width: 0 }} animate={{ width: `${task.progress_percentage || 0}%` }} style={{ height: '100%', background: '#d97706', borderRadius: 5 }} />
            </div>
        </div>

        <button 
            style={{ 
                width: '100%', 
                height: 44, 
                background: task.status === 'pending_review' ? '#e8eee8' : '#1a1c19', 
                color: task.status === 'pending_review' ? '#2d5a27' : 'white', 
                border: task.status === 'pending_review' ? '1.5px solid #2d5a2733' : 'none', 
                borderRadius: 12, 
                fontWeight: 900, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: 8, 
                cursor: task.status === 'pending_review' ? 'default' : 'pointer',
                opacity: 1
            }}
            onClick={task.status === 'pending_review' ? null : onComplete}
            disabled={task.status === 'pending_review'}
        >
            {task.status === 'pending_review' ? (
                <><Loader2 className="animate-spin" size={18} /> AI Analyzing...</>
            ) : (
                <><Camera size={18} /> Upload Proof</>
            )}
        </button>
    </div>
);

const CommunityCard = ({ task, index }) => (
    <motion.div 
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.1 }}
        style={{ background: 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)', color: 'white', padding: 30, borderRadius: 32, position: 'relative', overflow: 'hidden' }}
    >
        <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ background: 'rgba(255,255,255,0.1)', padding: '6px 12px', borderRadius: 10, fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    🌍 {task.scope || 'National'}
                </div>
                <div style={{ color: '#ffd700', fontWeight: 900, fontSize: '0.9rem' }}>{task.reward_pool || (task.reward_points * 100)} XP Pool</div>
            </div>
            
            <h4 style={{ fontSize: '1.3rem', fontWeight: 950, margin: '10px 0' }}>{task.title}</h4>
            <p style={{ fontSize: '0.9rem', opacity: 0.8, marginBottom: 25 }}>{task.description}</p>
            
            <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, marginBottom: 25 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, opacity: 0.6 }}>Goal: {task.goal_text || "Collaborative Impact"}</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 900, color: '#4ade80' }}>{task.participants_count || 42}+ Joined</div>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.1)', borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: '45%', background: '#4ade80', borderRadius: 5 }} />
                </div>
            </div>

            <button style={{ width: '100%', height: 50, background: '#4ade80', color: '#0f172a', border: 'none', borderRadius: 14, fontWeight: 950, cursor: 'pointer', transition: '0.3s' }}>
                Join Challenge
            </button>
        </div>
    </motion.div>
);

const CompletedCard = ({ task }) => (
    <div style={{ background: '#f0fdf4', padding: 20, borderRadius: 24, border: '1px solid #d1e2d1', display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ width: 45, height: 45, borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d5a27' }}>
            <CheckCircle size={24} />
        </div>
        <div>
            <div style={{ fontWeight: 900, fontSize: '1rem', color: '#1a3c1a' }}>{task.title}</div>
            <div style={{ fontSize: '0.75rem', color: '#2d5a27', fontWeight: 800 }}>Completed • +{task.reward_points} XP</div>
        </div>
    </div>
);

const ProgressBox = ({ label, target, current }) => (
    <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>{label}</span>
            <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#2d5a27' }}>{current}/{target}</span>
        </div>
        <div style={{ height: 12, background: '#f0f4f0', borderRadius: 6, overflow: 'hidden' }}>
            <motion.div initial={{ width: 0 }} animate={{ width: `${(current/target)*100}%` }} style={{ height: '100%', background: 'linear-gradient(90deg, #2d5a27, #4ade80)', borderRadius: 6 }} />
        </div>
    </div>
);

const EmptyState = ({ message }) => (
    <div style={{ textAlign: 'center', padding: '60px 20px', background: 'white', borderRadius: '32px', border: '1.5px dashed #eeedeb' }}>
        <div style={{ width: 60, height: 60, background: '#f8faf8', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: '#aaa' }}>
            <Calendar size={30} />
        </div>
        <p style={{ color: '#666', fontWeight: 700, margin: 0 }}>{message}</p>
    </div>
);

const MissionSubmissionModal = ({ task, onClose, onSubmit, submitting }) => {
    const [summary, setSummary] = useState('');
    const [materials, setMaterials] = useState('');
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [imageType, setImageType] = useState('image');
    const [gps, setGps] = useState(null);
    const [gettingGps, setGettingGps] = useState(false);
    const [showCamera, setShowCamera] = useState(false);

    useEffect(() => {
        let watchId;
        setGettingGps(true);
        watchId = navigator.geolocation.watchPosition(
            pos => {
                setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                setGettingGps(false);
            },
            err => { console.error(err); setGettingGps(false); },
            { enableHighAccuracy: true, maximumAge: 1000 }
        );
        return () => { if (watchId) navigator.geolocation.clearWatch(watchId); };
    }, []);

    const handleSubmit = () => {
        if (!image || !gps) return alert("Proof and GPS are required!");
        const fd = new FormData();
        fd.append('file', image);
        fd.append('tasks_summary', summary);
        fd.append('organic_materials', materials);
        fd.append('latitude', gps.lat);
        fd.append('longitude', gps.lng);
        onSubmit(fd);
    };

    return (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(5px)' }}>
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} style={{ width: '100%', maxWidth: 550, background: 'white', borderRadius: '40px', padding: 40, boxShadow: '0 30px 100px rgba(0,0,0,0.4)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 30 }}>
                    <div>
                        <h2 style={{ margin: 0, fontWeight: 950, fontSize: '1.6rem' }}>Complete Mission</h2>
                        <p style={{ color: '#666', fontSize: '0.9rem', marginTop: 4 }}>{task.title}</p>
                    </div>
                    <button onClick={onClose} style={{ border: 'none', background: '#f8faf8', width: 44, height: 44, borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div className="form-group">
                        <label style={{ fontSize: '0.75rem', fontWeight: 900, color: '#aaa', textTransform: 'uppercase', marginBottom: 8, display: 'block' }}>Summary of Activities</label>
                        <textarea placeholder="Describe how you completed this task..." value={summary} onChange={e => setSummary(e.target.value)} style={{ width: '100%', padding: 15, borderRadius: 16, border: '1.5px solid #eee', minHeight: 100, fontSize: '0.95rem' }} />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 15 }}>
                        <div style={{ background: '#fcfdfc', padding: 20, borderRadius: 20, border: '1.5px dashed #d1e2d1', textAlign: 'center' }}>
                            <MapPin size={24} color={gps ? "#2d5a27" : "#aaa"} />
                            <div style={{ fontSize: '0.75rem', fontWeight: 900, marginTop: 8, color: gps ? '#2d5a27' : '#aaa' }}>{gettingGps ? 'Locating...' : (gps ? `${gps.lat.toFixed(4)}, ${gps.lng.toFixed(4)}` : 'GPS Required')}</div>
                        </div>

                        <div onClick={() => setShowCamera(true)} style={{ background: '#fcfdfc', padding: 20, borderRadius: 20, border: '1.5px dashed #2d5a27', textAlign: 'center', cursor: 'pointer', overflow: 'hidden' }}>
                            {preview ? (
                                imageType === 'image' ? <img src={preview} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ fontWeight: 900, color: '#2d5a27' }}>Video Captured</div>
                            ) : (
                                <><Camera size={24} color="#2d5a27" /><div style={{ fontSize: '0.75rem', fontWeight: 900, marginTop: 8, color: '#2d5a27' }}>Capture Evidence</div></>
                            )}
                        </div>
                    </div>

                    <button disabled={gettingGps || !image || submitting} onClick={handleSubmit} style={{ width: '100%', height: 55, background: '#2d5a27', color: 'white', border: 'none', borderRadius: 18, fontWeight: 950, cursor: 'pointer', fontSize: '1.05rem', marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                        {submitting ? <Loader2 size={24} className="animate-spin" /> : <><CheckSquare size={20} /> Submit Evidence</>}
                    </button>
                </div>

                <AnimatePresence>
                    {showCamera && (
                        <CameraCapture 
                            userLocation={gps}
                            onCapture={(file, type) => { setImage(file); setPreview(URL.createObjectURL(file)); setImageType(type); }}
                            onClose={() => setShowCamera(false)}
                        />
                    )}
                </AnimatePresence>
            </motion.div>
        </div>
    );
};

export default MissionsPage;
