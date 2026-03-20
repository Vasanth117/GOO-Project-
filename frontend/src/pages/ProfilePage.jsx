import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, MapPin, Award, Droplets, Leaf, Zap, Star, 
    Settings, Edit3, Share2, CheckCircle2, TrendingUp, 
    Trophy, Globe, ChevronRight, ShieldCheck, Mail, 
    Grid, History, PieChart, MessageSquare, Flame,
    ArrowUpRight, Bot, Sprout, Beaker, AlertCircle, 
    Loader2, Camera, Save, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import cover from '../assets/images/1.jpg';

const TABS = ['Overview', 'Activity', 'Achievements', 'Analytics'];
const API_BASE = 'http://localhost:8000';

const ProfilePage = () => {
    const { user, refreshUser } = useAuth();
    const [activeTab, setActiveTab] = useState('Overview');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [editForm, setEditForm] = useState({ name: '', bio: '', phone: '' });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const fileRef = useRef();

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiService.getProfile();
                setProfile(data);
                setEditForm({ name: data.name || '', bio: data.bio || '', phone: data.phone || '' });
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('bio', editForm.bio);
            formData.append('phone', editForm.phone);
            if (avatarFile) formData.append('avatar', avatarFile);

            const res = await apiService.updateProfile(formData);
            if (res.status === 'success') {
                await refreshUser();
                const updated = await apiService.getProfile();
                setProfile(updated);
                setEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                showToast('Profile updated successfully!');
            } else {
                showToast(res.message || 'Failed to save.', 'error');
            }
        } catch (e) {
            showToast('Error saving profile.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (profile?.profile_picture) return `${API_BASE}${profile.profile_picture}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=2d5a27&color=fff&size=120`;
    };

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#2d5a27' }} />
        </div>
    );

    const farm = profile?.farm || {};
    const stats = profile?.stats || {};

    const IMPACT = [
        { label: 'Total Score', val: stats.total_score || 0, icon: Zap, color: '#d4af37' },
        { label: 'Tasks Done', val: stats.tasks_completed || 0, icon: CheckCircle2, color: '#2d5a27' },
        { label: 'Eco Streak', val: `${stats.streak_current || 0}d`, icon: Flame, color: '#e63946' },
    ];

    return (
        <div className="profile-page-wrapper">

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 24px', borderRadius: 12,
                            background: toast.type === 'error' ? '#e63946' : '#2d5a27', color: '#fff', fontWeight: 800, fontSize: '0.9rem',
                            boxShadow: '0 8px 30px rgba(0,0,0,0.15)' }}>
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Edit Modal */}
            <AnimatePresence>
                {editing && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onClick={() => setEditing(false)}>
                        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                            style={{ background: '#fff', borderRadius: 24, padding: '2rem', width: '90%', maxWidth: 500 }}
                            onClick={e => e.stopPropagation()}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                                <h3 style={{ fontSize: '1.2rem', fontWeight: 950 }}>Edit Profile</h3>
                                <button onClick={() => setEditing(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={20} /></button>
                            </div>

                            {/* Avatar change */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1.5rem' }}>
                                <img src={getAvatarUrl()} alt="avatar" style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover', border: '3px solid #2d5a27' }} />
                                <button onClick={() => fileRef.current.click()} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', background: '#f3f6f0', border: '1.5px solid #e0e5da', borderRadius: 100, fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer' }}>
                                    <Camera size={14} /> Change Photo
                                </button>
                                <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => { const f = e.target.files[0]; if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }}} />
                            </div>

                            <div className="f-input" style={{ marginBottom: '1rem' }}>
                                <label>Full Name</label>
                                <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
                            </div>
                            <div className="f-input" style={{ marginBottom: '1rem' }}>
                                <label>Bio</label>
                                <textarea rows={3} value={editForm.bio} onChange={e => setEditForm(p => ({...p, bio: e.target.value}))} />
                            </div>
                            <div className="f-input" style={{ marginBottom: '1.5rem' }}>
                                <label>Phone Number</label>
                                <input type="text" value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" />
                            </div>

                            <button onClick={handleSaveProfile} disabled={saving}
                                style={{ width: '100%', padding: '14px', background: 'linear-gradient(135deg, #2d5a27, #4a8c3f)', color: '#fff', border: 'none', borderRadius: 14, fontWeight: 900, fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                                {saving ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── COVER & IDENTITY ── */}
            <div className="profile-header-premium">
                <div className="p-hero" style={{ backgroundImage: `url(${cover})` }}>
                    <div className="p-hero-overlay" />
                    <div className="p-header-top-actions">
                        <button className="h-action-btn"><Share2 size={18} /></button>
                        <button className="h-action-btn"><Settings size={18} /></button>
                    </div>
                </div>

                <div className="p-identity-card">
                    <div className="p-avatar-section">
                        <div className="p-avatar-container">
                            <img src={getAvatarUrl()} alt={profile?.name} className="p-avatar-img" />
                            <div className="p-rank-float"><Trophy size={16} /></div>
                        </div>
                        <div className="p-main-info">
                            <div className="p-name-row">
                                <h1>{profile?.name} <ShieldCheck size={20} color="#2d5a27" /></h1>
                                <span className="p-role-tag">{profile?.role || 'Farmer'}</span>
                            </div>
                            <div className="p-username-row">
                                <span className="u-name">@{profile?.name?.toLowerCase().replace(/\s+/g, '_')}</span>
                                <span className="u-sep">•</span>
                                <span className="u-loc"><MapPin size={14} /> {farm.location ? `${farm.location.latitude?.toFixed(2)}, ${farm.location.longitude?.toFixed(2)}` : 'Location not set'}</span>
                            </div>
                            <p className="p-bio">{profile?.bio || 'No bio yet. Click Edit Profile to add one.'}</p>
                        </div>
                        <div className="p-action-btns">
                            <button className="btn-edit-p" onClick={() => setEditing(true)}><Edit3 size={16} /> Edit Profile</button>
                        </div>
                    </div>

                    <div className="p-stats-bar">
                        <div className="stat-p"><strong>{stats.total_score || 0}</strong><span>Score</span></div>
                        <div className="stat-p"><strong>{stats.tasks_completed || 0}</strong><span>Tasks</span></div>
                        <div className="stat-p"><strong>{stats.streak_current || 0}</strong><span>Streak</span></div>
                        <div className="stat-p"><strong>{farm.farm_size_acres || '—'}</strong><span>Acres</span></div>
                        <div className="stat-p"><strong>{stats.rank || 'Unranked'}</strong><span>Rank</span></div>
                    </div>
                </div>
            </div>

            {/* ── TABS ── */}
            <div className="p-tab-nav">
                {TABS.map(tab => (
                    <button key={tab} className={`p-tab-btn ${activeTab === tab ? 'active' : ''}`} onClick={() => setActiveTab(tab)}>
                        {tab}
                        {activeTab === tab && <motion.div className="tab-underline" layoutId="pTab" />}
                    </button>
                ))}
            </div>

            {/* ── CONTENT ── */}
            <div className="p-tab-content">
                <AnimatePresence mode="wait">

                    {activeTab === 'Overview' && (
                        <motion.div className="overview-tab-grid" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                            <div className="ov-left">
                                <div className="p-card sustainability-card">
                                    <div className="card-header">
                                        <div className="title-wrap"><Leaf size={18} color="#2d5a27" /><h3>Sustainability Score</h3></div>
                                        <div className="score-trend up"><ArrowUpRight size={14} /> Live</div>
                                    </div>
                                    <div className="score-display">
                                        <div className="score-num">{farm.sustainability_score || 0}</div>
                                        <div className="score-level">{farm.farming_practices || 'Conventional'} Farmer</div>
                                    </div>
                                    <div className="score-bar-bg"><div className="score-bar-fill" style={{ width: `${farm.sustainability_score || 0}%` }} /></div>
                                </div>

                                <div className="p-impact-row">
                                    {IMPACT.map(item => (
                                        <div key={item.label} className="p-impact-card">
                                            <item.icon size={20} color={item.color} />
                                            <div className="im-val">{item.val}</div>
                                            <div className="im-label">{item.label}</div>
                                        </div>
                                    ))}
                                </div>

                                <div className="p-card ai-insights">
                                    <div className="card-header"><div className="title-wrap"><Bot size={18} color="#768953" /><h3>AI Personal Advice</h3></div></div>
                                    <div className="ai-advice-list">
                                        <div className="ai-advice-item"><CheckCircle2 size={14} color="#2d5a27" /><p>Your farm uses {farm.soil_type || 'unknown'} soil — perfect for legume crops to boost sustainability score.</p></div>
                                        <div className="ai-advice-item"><CheckCircle2 size={14} color="#2d5a27" /><p>Irrigation type: {farm.irrigation_type || 'not set'}. Switching to drip irrigation can save up to 40% water.</p></div>
                                    </div>
                                </div>
                            </div>

                            <div className="ov-right">
                                <div className="p-card farm-details-card">
                                    <h3 className="widget-title">Farm Passport</h3>
                                    <div className="farm-info-grid">
                                        <div className="fi-item"><span>Farm Name</span><strong>{farm.farm_name || '—'}</strong></div>
                                        <div className="fi-item"><span>Size</span><strong>{farm.farm_size_acres ? `${farm.farm_size_acres} Acres` : '—'}</strong></div>
                                        <div className="fi-item"><span>Soil</span><strong>{farm.soil_type || '—'}</strong></div>
                                        <div className="fi-item"><span>Irrigation</span><strong>{farm.irrigation_type || '—'}</strong></div>
                                        <div className="fi-item"><span>Crops</span><strong>{farm.crop_types?.join(', ') || '—'}</strong></div>
                                        <div className="fi-item"><span>Practice</span><strong>{farm.farming_practices || '—'}</strong></div>
                                    </div>
                                </div>

                                <div className="p-card streak-card">
                                    <div className="streak-header">
                                        <Flame size={24} color="#e63946" />
                                        <div className="streak-nums">
                                            <div className="s-num">{stats.streak_current || 0} Days</div>
                                            <div className="s-label">Active Eco-Streak</div>
                                        </div>
                                    </div>
                                    <div className="longest-streak">🔥 Longest: {stats.streak_longest || 0} days</div>
                                </div>

                                <div className="p-card green-club-status">
                                    <ShieldCheck size={32} color="#d4af37" />
                                    <h3>Green Revolution Club</h3>
                                    <p>Member Since {new Date(profile?.created_at).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })}</p>
                                    <div className="verified-badge-mini">{profile?.is_verified ? 'Verified Validator' : 'Awaiting Verification'}</div>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Achievements' && (
                        <motion.div className="achievements-tab-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="badge-gallery-full">
                                {[
                                    { name: 'Eco Warrior', color: '#3b82f6', icon: Droplets, unlock: stats.tasks_completed >= 10 ? 'Unlocked' : 'Complete 10 tasks' },
                                    { name: 'Soil Master', color: '#768953', icon: Leaf, unlock: farm.soil_type ? 'Unlocked' : 'Set your soil type' },
                                    { name: 'Streak Champion', color: '#e63946', icon: Flame, unlock: stats.streak_current >= 7 ? 'Unlocked' : `${stats.streak_current || 0}/7 days` },
                                    { name: 'Bio Genius', color: '#2d5a27', icon: Beaker, unlock: profile?.bio ? 'Unlocked' : 'Add your bio' }
                                ].map((badge, i) => (
                                    <div key={i} className={`p-badge-card ${badge.unlock.includes('days') || badge.unlock.includes('task') || badge.unlock.includes('Set') || badge.unlock.includes('Add') ? 'locked' : ''}`}>
                                        <div className="b-circle" style={{ borderColor: badge.color }}>
                                            <badge.icon size={28} color={badge.color} />
                                        </div>
                                        <div className="b-name">{badge.name}</div>
                                        <div className="b-status">{badge.unlock}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'Analytics' && (
                        <motion.div className="analytics-tab-view" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                            <div className="task-history-list">
                                <h3 className="section-title">Your Live Stats</h3>
                                {[
                                    { label: 'Total GOO Score', val: stats.total_score || 0, icon: Zap, color: '#d4af37' },
                                    { label: 'Tasks Completed', val: stats.tasks_completed || 0, icon: CheckCircle2, color: '#2d5a27' },
                                    { label: 'Current Streak', val: `${stats.streak_current || 0} days`, icon: Flame, color: '#e63946' },
                                    { label: 'Sustainability Score', val: farm.sustainability_score || 0, icon: Leaf, color: '#768953' },
                                ].map((s, i) => (
                                    <div key={i} className="task-h-item completed">
                                        <div className="th-icon" style={{ color: s.color }}><s.icon size={16} /></div>
                                        <div className="th-info"><div className="th-name">{s.label}</div></div>
                                        <div className="th-pts" style={{ color: s.color, fontWeight: 900 }}>{s.val}</div>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </div>
        </div>
    );
};

export default ProfilePage;
