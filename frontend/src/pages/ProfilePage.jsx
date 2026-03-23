import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, MapPin, Award, Droplets, Leaf, Zap, Star,
    Settings, Edit3, Share2, CheckCircle2, TrendingUp,
    Trophy, Globe, ChevronRight, ShieldCheck, Mail,
    Grid, History, PieChart, MessageSquare, Flame,
    ArrowUpRight, Bot, Sprout, Beaker, AlertCircle,
    Loader2, Camera, Save, X, Navigation, Clock,
    Droplet, Wind, Sun, Package, RefreshCw, Phone,
    Activity, BarChart2, Target, Users, Lock, Unlock,
    UserPlus, UserMinus, UserCheck, Heart, Power
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import cover from '../assets/images/1.jpg';

const TABS = [
    { id: 'Overview', icon: Grid, label: 'Overview' },
    { id: 'Activity', icon: Activity, label: 'Activity' },
    { id: 'Achievements', icon: Trophy, label: 'Achievements' },
    { id: 'Analytics', icon: BarChart2, label: 'Analytics' },
];
const API_BASE = 'http://localhost:8000';

const ProfilePage = () => {
    const { userId } = useParams();
    const navigate = useNavigate();
    const { user: currentUser, refreshUser } = useAuth();
    
    const [activeTab, setActiveTab] = useState('Overview');
    const [profile, setProfile] = useState(null);
    const [missionHistory, setMissionHistory] = useState([]);
    const [followRequests, setFollowRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);
    const [locationLoading, setLocationLoading] = useState(false);
    const [editForm, setEditForm] = useState({ name: '', bio: '', phone: '', is_private: false });
    const [avatarPreview, setAvatarPreview] = useState(null);
    const [avatarFile, setAvatarFile] = useState(null);
    const [locationName, setLocationName] = useState('');
    const [followStatus, setFollowStatus] = useState('none'); // none, following, requested, self
    const fileRef = useRef();

    const isOwnProfile = !userId || userId === currentUser?.id;

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    const loadData = async () => {
        try {
            const effectiveId = userId || 'me';
            const [data, history] = await Promise.all([
                effectiveId === 'me' ? apiService.getProfile() : apiService.getAnyProfile(userId),
                apiService.getMissionHistory().catch(() => ({ missions: [] })) // History usually private if not following, but fetching anyway
            ]);
            
            setProfile(data);
            if (isOwnProfile) {
                setEditForm({ 
                    name: data.name || '', 
                    bio: data.bio || '', 
                    phone: data.phone || '',
                    is_private: data.is_private || false 
                });
                // Fetch pending follow requests if private
                if (data.is_private) {
                    const reqs = await apiService.getPendingFollowRequests();
                    setFollowRequests(reqs || []);
                }
            } else {
                // Check follow status
                const statusRes = await apiService.getFollowStatus(userId);
                setFollowStatus(statusRes.status);
            }

            setMissionHistory(history?.missions || []);

            // Resolve location name
            const loc = data?.farm?.location;
            if (loc?.latitude && loc?.longitude) {
                try {
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${loc.latitude}&lon=${loc.longitude}&format=json`);
                    const j = await r.json();
                    setLocationName(j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Unknown Location');
                } catch { setLocationName('Location detected'); }
            }
        } catch (e) {
            console.error(e);
            if (e.message?.includes('404')) showToast('User not found', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [userId]);

    const handleFollowAction = async () => {
        try {
            if (followStatus === 'following') {
                await apiService.unfollowUser(userId);
                setFollowStatus('none');
                showToast('Unfollowed user.');
            } else if (followStatus === 'requested') {
                await apiService.unfollowUser(userId);
                setFollowStatus('none');
                showToast('Follow request cancelled.');
            } else {
                const res = await apiService.followUser(userId);
                setFollowStatus(res.status); // 'following' or 'requested'
                showToast(res.message);
            }
        } catch (e) {
            showToast('Action failed.', 'error');
        }
    };

    const handleRequestResponse = async (requestId, accept) => {
        try {
            await apiService.respondToFollowRequest(requestId, accept);
            setFollowRequests(prev => prev.filter(r => r.request_id !== requestId));
            showToast(accept ? 'Request accepted!' : 'Request declined.');
            if (accept) loadData();
        } catch (e) {
            showToast('Failed to respond.', 'error');
        }
    };

    const detectLocation = () => {
        if (!navigator.geolocation) return showToast('Geolocation not supported.', 'error');
        setLocationLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                try {
                    await apiService.updateFarm({ location: { latitude, longitude } });
                    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`);
                    const j = await r.json();
                    const name = j.address?.city || j.address?.town || j.address?.village || j.address?.state || 'Location detected';
                    setLocationName(name);
                    showToast(`📍 Location set to ${name}`);
                    loadData();
                } catch { showToast('Location detected but could not save.', 'error'); }
                finally { setLocationLoading(false); }
            },
            (err) => {
                setLocationLoading(false);
                showToast('Access denied. Please enable GPS permissions.', 'error');
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', editForm.name);
            formData.append('bio', editForm.bio);
            formData.append('phone', editForm.phone);
            formData.append('is_private', editForm.is_private);
            if (avatarFile) formData.append('avatar', avatarFile);
            
            const res = await apiService.updateProfile(formData);
            if (res) {
                await refreshUser();
                await loadData();
                setEditing(false);
                setAvatarFile(null);
                setAvatarPreview(null);
                showToast('Profile updated! ✅');
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
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=2d5a27&color=fff&size=200`;
    };

    if (loading) return (
        <div className="profile-loading-screen" style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#fbfdfb', flexDirection: 'column', gap: 16 }}>
            <Loader2 size={40} className="spin-anim" style={{ color: '#2d5a27' }} />
            <p style={{ color: '#888', fontWeight: 600 }}>Loading profile network...</p>
        </div>
    );

    const farm = profile?.farm || {};
    const stats = profile?.stats || {};
    const loc = farm.location;
    const canSeeDetails = isOwnProfile || !profile?.is_private || followStatus === 'following';

    return (
        <div className="profile-page-wrapper">
            <AnimatePresence>
                {toast && (
                    <motion.div className={`profile-toast ${toast.type}`}
                        initial={{ opacity: 0, y: -30, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20 }}>
                        {toast.type !== 'error' && <CheckCircle2 size={16} />}
                        {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {editing && (
                    <motion.div className="profile-modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setEditing(false)}>
                        <motion.div className="profile-edit-modal" initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }} onClick={e => e.stopPropagation()}>
                            <div className="pem-header">
                                <h3>Edit Your Profile</h3>
                                <button className="pem-close" onClick={() => setEditing(false)}><X size={20} /></button>
                            </div>

                            <div className="pem-avatar-row">
                                <div className="pem-avatar-wrap">
                                    <img src={getAvatarUrl()} alt="avatar" />
                                    <button className="pem-cam-btn" onClick={() => fileRef.current.click()}><Camera size={16} /></button>
                                </div>
                                <div>
                                    <p className="pem-name">{editForm.name || profile?.name}</p>
                                    <p className="pem-role">{profile?.role || 'Farmer'}</p>
                                    <button className="pem-upload-btn" onClick={() => fileRef.current.click()}><Camera size={14}/> Change Photo</button>
                                </div>
                                <input type="file" ref={fileRef} hidden accept="image/*" onChange={e => {
                                    const f = e.target.files[0];
                                    if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                                }} />
                            </div>

                            <div className="pem-fields">
                                <div className="pem-field">
                                    <label>Full Name</label>
                                    <input type="text" value={editForm.name} onChange={e => setEditForm(p => ({...p, name: e.target.value}))} />
                                </div>
                                <div className="pem-field">
                                    <label>Phone Number</label>
                                    <input type="tel" value={editForm.phone} onChange={e => setEditForm(p => ({...p, phone: e.target.value}))} />
                                </div>
                                <div className="pem-field">
                                    <label>Account Privacy</label>
                                    <div className="privacy-toggle-box" onClick={() => setEditForm(p => ({...p, is_private: !p.is_private}))}>
                                        {editForm.is_private ? <Lock size={18} color="#e0a800" /> : <Unlock size={18} color="#2d5a27" />}
                                        <div style={{ flex: 1 }}>
                                            <strong>{editForm.is_private ? 'Private Account' : 'Public Account'}</strong>
                                            <p>{editForm.is_private ? 'Followers must be approved.' : 'Anyone can follow you and see posts.'}</p>
                                        </div>
                                        <div className={`raw-toggle ${editForm.is_private ? 'on' : 'off'}`} />
                                    </div>
                                </div>
                                <div className="pem-field">
                                    <label>Bio</label>
                                    <textarea rows={3} value={editForm.bio} onChange={e => setEditForm(p => ({...p, bio: e.target.value}))} />
                                </div>
                            </div>

                            <button className="pem-save-btn" onClick={handleSaveProfile} disabled={saving}>
                                {saving ? <Loader2 size={18} className="spin-anim" /> : <Save size={18} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="profile-hero-section">
                <div className="profile-cover" style={{ backgroundImage: `url(${cover})` }}>
                    <div className="profile-cover-overlay" />
                    <div className="profile-cover-actions">
                        <button className="pca-btn"><Share2 size={18} /></button>
                        <button className="pca-btn" onClick={() => navigate('/settings')}><Settings size={18} /></button>
                    </div>
                </div>

                <div className="profile-identity-card">
                    <div className="pic-left">
                        <div className="profile-avatar-wrap">
                            <img src={getAvatarUrl()} alt={profile?.name} className="profile-avatar-img" />
                            {profile?.is_private && <div className="privacy-badge"><Lock size={12} /></div>}
                        </div>
                        <div className="profile-identity-info">
                            <div className="pin-name-row">
                                <h1>{profile?.name}</h1>
                                {profile?.is_verified && <ShieldCheck size={20} color="#2d5a27" />}
                                <span className="pin-role-tag">{profile?.role || 'Farmer'}</span>
                            </div>
                            <div className="pin-meta-row">
                                <span>@{(profile?.name || 'user').toLowerCase().replace(/\s+/g, '_')}</span>
                                <span className="pin-sep">•</span>
                                <span className="pin-location-chip">
                                    <MapPin size={13} />
                                    {locationName || (loc ? `${loc.latitude?.toFixed(2)}°, ${loc.longitude?.toFixed(2)}°` : 'Location unknown')}
                                </span>
                                {isOwnProfile && (
                                    <button className="pin-detect-btn" onClick={detectLocation} disabled={locationLoading}>
                                        {locationLoading ? <RefreshCw size={13} className="spin-anim" /> : <Navigation size={13} />}
                                        {locationLoading ? '...' : 'Fix Location'}
                                    </button>
                                )}
                            </div>
                            <p className="pin-bio">{profile?.bio || 'Eco-conscious farmer from India.'}</p>
                        </div>
                    </div>
                    <div className="pic-right">
                        {isOwnProfile ? (
                            <button className="btn-edit-profile" onClick={() => setEditing(true)}>
                                <Edit3 size={16} /> Edit Profile
                            </button>
                        ) : (
                            <div style={{ display: 'flex', gap: 10 }}>
                                <button className={`btn-follow-action ${followStatus}`} onClick={handleFollowAction}>
                                    {followStatus === 'following' ? <UserCheck size={16} /> : followStatus === 'requested' ? <Clock size={16} /> : <UserPlus size={16} />}
                                    {followStatus === 'following' ? 'Following' : followStatus === 'requested' ? 'Requested' : 'Follow'}
                                </button>
                                <button className="btn-message-profile" onClick={() => navigate(`/messages?user=${userId}`)}>
                                    <MessageSquare size={16} />
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Follow Requests Section (if own profile and private) */}
                {isOwnProfile && followRequests.length > 0 && (
                    <motion.div className="follow-requests-banner" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                        <div className="fr-header">
                            <Users size={16} color="#e0a800" />
                            <span><strong>{followRequests.length}</strong> Follow Requests</span>
                        </div>
                        <div className="fr-list">
                            {followRequests.map(fr => (
                                <div key={fr.request_id} className="fr-item">
                                    <img src={fr.profile_picture || `https://ui-avatars.com/api/?name=${fr.name}`} alt={fr.name} />
                                    <div className="fr-info"><strong>{fr.name}</strong> <span>wants to follow you</span></div>
                                    <div className="fr-actions">
                                        <button className="fr-btn accept" onClick={() => handleRequestResponse(fr.request_id, true)}>Confirm</button>
                                        <button className="fr-btn decline" onClick={() => handleRequestResponse(fr.request_id, false)}>Delete</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </motion.div>
                )}

                <div className="profile-stats-bar">
                    {[
                        { label: 'Followers', val: profile?.followers_count || 0 },
                        { label: 'Following', val: profile?.following_count || 0 },
                        { label: 'Score', val: stats.total_score || 0 },
                        { label: 'Tasks', val: stats.tasks_completed || 0 },
                        { label: 'Streak', val: stats.streak_current || 0 },
                    ].map((s, i) => (
                        <div key={i} className="psb-item">
                            <strong>{s.val}</strong>
                            <span>{s.label}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Locked Content View */}
            {!canSeeDetails ? (
                <div className="profile-private-lock">
                    <div className="lock-illustration">
                        <div className="lock-circle"><Lock size={48} color="#2d5a27" /></div>
                    </div>
                    <h2>This Account is Private</h2>
                    <p>Follow this user to see their farming activity, accomplishments, and analytics.</p>
                </div>
            ) : (
                <>
                    <div className="profile-tab-nav">
                        {TABS.map(tab => (
                            <button key={tab.id}
                                className={`profile-tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                                onClick={() => setActiveTab(tab.id)}>
                                <tab.icon size={16} />
                                {tab.label}
                                {activeTab === tab.id && <motion.div className="profile-tab-line" layoutId="ptab" />}
                            </button>
                        ))}
                    </div>

                    <div className="profile-content-area">
                        <AnimatePresence mode="wait">
                            {activeTab === 'Overview' && (
                                <motion.div key="ov" className="profile-overview-grid" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <div className="pov-col">
                                        <div className="profile-card">
                                            <div className="pcard-header">
                                                <div className="pcard-title"><Leaf size={18} color="#2d5a27" /><h3>Sustainability Status</h3></div>
                                            </div>
                                            <div className="sustainability-display">
                                                <div className="sust-num">{farm.sustainability_score || 0}</div>
                                                <div className="sust-label">{farm.farming_practices || 'Sustainable'} Farmer</div>
                                            </div>
                                            <div className="sust-bar-bg">
                                                <motion.div className="sust-bar-fill" initial={{ width: 0 }} animate={{ width: `${Math.min(farm.sustainability_score || 0, 100)}%` }} />
                                            </div>
                                        </div>

                                        <div className="profile-impact-row">
                                            {[
                                                { label: 'Total XP', val: stats.total_score || 0, icon: Zap, color: '#d4af37', bg: '#fffbeb' },
                                                { label: 'Mission Wins', val: stats.tasks_completed || 0, icon: CheckCircle2, color: '#2d5a27', bg: '#f0fdf4' },
                                                { label: 'Hot Streak', val: stats.streak_current || 0, icon: Flame, color: '#e63946', bg: '#fff1f2' },
                                            ].map(item => (
                                                <div key={item.label} className="profile-impact-card" style={{ '--ic-color': item.color, '--ic-bg': item.bg }}>
                                                    <item.icon size={22} color={item.color} />
                                                    <div className="ic-val">{item.val}</div>
                                                    <div className="ic-label">{item.label}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="pov-col">
                                        <div className="profile-card">
                                            <h3 className="pcard-section-title">🚜 Farm Profile</h3>
                                            <div className="farm-passport-grid">
                                                {[
                                                    ['Name', farm.farm_name],
                                                    ['Size', farm.farm_size_acres ? `${farm.farm_size_acres} Ac` : undefined],
                                                    ['Soil', farm.soil_type],
                                                    ['Crops', farm.crop_types?.slice(0, 2).join(', ')],
                                                    ['Method', farm.farming_practices],
                                                ].map(([l, v]) => (
                                                    <div key={l} className="fpp-item"><span>{l}</span><strong>{v || 'N/A'}</strong></div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="profile-card green-club-card" style={{ background: 'linear-gradient(135deg, #2d5a27, #1a3c1a)', border: 'none', color: 'white' }}>
                                            <ShieldCheck size={42} color="#fcd34d" />
                                            <h3 style={{ color: 'white' }}>GOO Certified</h3>
                                            <p style={{ color: '#dcfce7' }}>Official member of the Green Revolution Network since {new Date(profile?.created_at).getFullYear()}.</p>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {activeTab === 'Activity' && (
                                <motion.div key="ac" className="activity-timeline-box" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {missionHistory.map((m, i) => (
                                        <div key={i} className="timeline-event">
                                            <div className="te-dot" />
                                            <div className="te-card">
                                                <strong>{m.title || m.mission_title}</strong>
                                                <div className="te-meta"><Clock size={12} /> {new Date(m.completed_at).toLocaleDateString()} • {m.points_earned} XP</div>
                                            </div>
                                        </div>
                                    ))}
                                    {missionHistory.length === 0 && <div className="no-activity">No recent activity detected.</div>}
                                </motion.div>
                            )}

                            {activeTab === 'Achievements' && (
                                <motion.div key="ach" className="badge-grid" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                                    {/* Placeholder badges */}
                                    {[1,2,3,4].map(b => (
                                        <div key={b} className="badge-item unlocked">
                                            <Award size={32} />
                                            <span>Eco Tier {b}</span>
                                        </div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProfilePage;
