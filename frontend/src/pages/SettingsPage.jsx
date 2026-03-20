import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, Lock, Bell, Globe, Bot, Shield, 
    Database, LifeBuoy, Camera, Mail,
    LogOut, ChevronRight, Save,
    Smartphone, Download, HelpCircle, 
    HardDrive, Trash2, Loader2, CheckCircle2,
    Eye, EyeOff, X
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';

const SETTINGS_SECTIONS = [
    { id: 'account', label: 'Account & Farm', icon: User },
    { id: 'privacy', label: 'Privacy & Security', icon: Shield },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'preferences', label: 'AI & Experience', icon: Bot },
    { id: 'data', label: 'Data & Storage', icon: Database },
    { id: 'support', label: 'Help & About', icon: LifeBuoy }
];

const API_BASE = 'http://localhost:8000';

const SettingsPage = () => {
    const { user, refreshUser, logout } = useAuth();
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('account');
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState(null);

    // Account form
    const [accountForm, setAccountForm] = useState({ name: '', bio: '', phone: '' });
    const [avatarFile, setAvatarFile] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(null);

    // Password form
    const [pwForm, setPwForm] = useState({ old: '', new: '', confirm: '' });
    const [showPw, setShowPw] = useState(false);

    // Notification toggles
    const [notifSettings, setNotifSettings] = useState({
        push_notifications: true,
        mission_alerts: true,
        weather_alerts: true,
        ai_suggestions: true,
    });

    // AI Preferences
    const [aiPrefs, setAiPrefs] = useState({
        advice_priority: 'Organic Standards',
        language: 'English',
        ai_smart_suggestions: true,
    });

    const showToast = (msg, type = 'success') => {
        setToast({ msg, type });
        setTimeout(() => setToast(null), 3500);
    };

    useEffect(() => {
        const load = async () => {
            try {
                const data = await apiService.getProfile();
                setProfile(data);
                setAccountForm({ name: data.name || '', bio: data.bio || '', phone: data.phone || '' });
                if (data.preferences) {
                    const p = data.preferences;
                    setNotifSettings(prev => ({ ...prev, ...p }));
                    setAiPrefs(prev => ({ ...prev, ...p }));
                }
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const saveAccountChanges = async () => {
        setSaving(true);
        try {
            const formData = new FormData();
            formData.append('name', accountForm.name);
            formData.append('bio', accountForm.bio);
            formData.append('phone', accountForm.phone);
            if (avatarFile) formData.append('avatar', avatarFile);

            const res = await apiService.updateProfile(formData);
            if (res.status === 'success') {
                await refreshUser();
                setAvatarFile(null);
                setAvatarPreview(null);
                showToast('Account updated successfully!');
            } else {
                showToast(res.message || 'Failed to update.', 'error');
            }
        } catch (e) {
            showToast('Error saving account.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const savePassword = async () => {
        if (pwForm.new !== pwForm.confirm) return showToast('Passwords do not match.', 'error');
        if (pwForm.new.length < 8) return showToast('New password must be at least 8 characters.', 'error');
        setSaving(true);
        try {
            await apiService.changePassword(pwForm.old, pwForm.new);
            setPwForm({ old: '', new: '', confirm: '' });
            showToast('Password changed successfully!');
        } catch (e) {
            showToast(e.message || 'Failed to change password.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveNotifications = async () => {
        setSaving(true);
        try {
            await apiService.updatePreferences(notifSettings);
            showToast('Notification settings saved!');
        } catch (e) {
            showToast('Failed to save.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const saveAIPrefs = async () => {
        setSaving(true);
        try {
            await apiService.updatePreferences(aiPrefs);
            showToast('AI preferences saved! The advisor will use these next session.');
        } catch (e) {
            showToast('Failed to save.', 'error');
        } finally {
            setSaving(false);
        }
    };

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    };

    const getAvatarUrl = () => {
        if (avatarPreview) return avatarPreview;
        if (profile?.profile_picture) return `${API_BASE}${profile.profile_picture}`;
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(profile?.name || 'User')}&background=2d5a27&color=fff&size=100`;
    };

    const Toggle = ({ value, onChange }) => (
        <div onClick={() => onChange(!value)} style={{
            width: 46, height: 26, borderRadius: 100, cursor: 'pointer', transition: 'all 0.3s',
            background: value ? 'linear-gradient(135deg, #2d5a27, #4a8c3f)' : '#ddd',
            display: 'flex', alignItems: 'center', padding: '3px',
        }}>
            <motion.div layout transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', marginLeft: value ? 20 : 0, boxShadow: '0 2px 6px rgba(0,0,0,0.2)' }} />
        </div>
    );

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Loader2 size={40} style={{ animation: 'spin 1s linear infinite', color: '#2d5a27' }} />
        </div>
    );

    return (
        <div className="settings-layout">

            {/* Toast */}
            <AnimatePresence>
                {toast && (
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, padding: '12px 24px', borderRadius: 12,
                            background: toast.type === 'error' ? '#e63946' : '#2d5a27', color: '#fff', fontWeight: 800,
                            fontSize: '0.9rem', boxShadow: '0 8px 30px rgba(0,0,0,0.15)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {toast.type !== 'error' && <CheckCircle2 size={16} />} {toast.msg}
                    </motion.div>
                )}
            </AnimatePresence>

            {/* ── SIDEBAR ── */}
            <aside className="settings-nav">
                <div className="settings-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                        <img src={getAvatarUrl()} alt="avatar" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', border: '2px solid #2d5a27' }} />
                        <div>
                            <h2 style={{ fontSize: '1rem', fontWeight: 900 }}>{profile?.name}</h2>
                            <p style={{ fontSize: '0.75rem', color: '#888' }}>{profile?.email}</p>
                        </div>
                    </div>
                </div>
                <div className="settings-nav-list">
                    {SETTINGS_SECTIONS.map(section => (
                        <button key={section.id} className={`settings-nav-item ${activeSection === section.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(section.id)}>
                            <section.icon size={20} />
                            <span>{section.label}</span>
                            {activeSection === section.id && <ChevronRight size={14} className="active-arrow" />}
                        </button>
                    ))}
                </div>
                <button className="btn-logout-settings" onClick={handleLogout}>
                    <LogOut size={18} /> Logout
                </button>
            </aside>

            {/* ── MAIN CONTENT ── */}
            <main className="settings-content-area">
                <AnimatePresence mode="wait">

                    {/* ACCOUNT */}
                    {activeSection === 'account' && (
                        <motion.div key="account" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="section-title-wrap">
                                <h3>Account & Farm Details</h3>
                                <p>Keep your details updated for accurate AI recommendations</p>
                            </div>

                            <div className="settings-group">
                                <div className="profile-pic-edit">
                                    <img src={getAvatarUrl()} alt="Profile" />
                                    <label htmlFor="avatar-upload" className="btn-change-pic" style={{ cursor: 'pointer' }}>
                                        <Camera size={14} /> Change
                                    </label>
                                    <input id="avatar-upload" type="file" hidden accept="image/*" onChange={e => {
                                        const f = e.target.files[0];
                                        if (f) { setAvatarFile(f); setAvatarPreview(URL.createObjectURL(f)); }
                                    }} />
                                </div>
                                <div className="input-grid">
                                    <div className="f-input">
                                        <label>Full Name</label>
                                        <input type="text" value={accountForm.name} onChange={e => setAccountForm(p => ({...p, name: e.target.value}))} />
                                    </div>
                                    <div className="f-input">
                                        <label>Email Address</label>
                                        <input type="email" value={profile?.email || ''} disabled style={{ opacity: 0.6 }} />
                                    </div>
                                    <div className="f-input">
                                        <label>Phone Number</label>
                                        <input type="text" value={accountForm.phone} onChange={e => setAccountForm(p => ({...p, phone: e.target.value}))} placeholder="+91 98765 43210" />
                                    </div>
                                </div>
                                <div className="f-input" style={{ marginTop: 15 }}>
                                    <label>Bio</label>
                                    <textarea rows={3} value={accountForm.bio} onChange={e => setAccountForm(p => ({...p, bio: e.target.value}))} placeholder="Tell others about your farm..." />
                                </div>
                            </div>

                            <button className="btn-save-settings" onClick={saveAccountChanges} disabled={saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                {saving ? 'Saving...' : 'Save Changes'}
                            </button>

                            <div className="section-divider" style={{ margin: '30px 0' }} />

                            <div className="section-title-wrap">
                                <h4>Change Password</h4>
                            </div>
                            <div className="input-grid">
                                <div className="f-input" style={{ position: 'relative' }}>
                                    <label>Current Password</label>
                                    <input type={showPw ? 'text' : 'password'} value={pwForm.old} onChange={e => setPwForm(p => ({...p, old: e.target.value}))} />
                                </div>
                                <div className="f-input">
                                    <label>New Password</label>
                                    <input type={showPw ? 'text' : 'password'} value={pwForm.new} onChange={e => setPwForm(p => ({...p, new: e.target.value}))} />
                                </div>
                                <div className="f-input">
                                    <label>Confirm New Password</label>
                                    <input type={showPw ? 'text' : 'password'} value={pwForm.confirm} onChange={e => setPwForm(p => ({...p, confirm: e.target.value}))} />
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
                                <button className="btn-outline-settings" onClick={() => setShowPw(!showPw)}>
                                    {showPw ? <EyeOff size={16} /> : <Eye size={16} />} {showPw ? 'Hide' : 'Show'} Passwords
                                </button>
                                <button className="btn-save-settings" onClick={savePassword} disabled={saving || !pwForm.old}>
                                    {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Lock size={16} />}
                                    Change Password
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* NOTIFICATIONS */}
                    {activeSection === 'notifications' && (
                        <motion.div key="notif" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="section-title-wrap">
                                <h3>Notification Settings</h3>
                                <p>Choose what alerts you want to receive</p>
                            </div>
                            <div className="toggle-list">
                                {[
                                    { key: 'push_notifications', label: 'Push Notifications', desc: 'Receive app notifications on your device' },
                                    { key: 'mission_alerts', label: 'Mission Alerts', desc: 'Get notified when new missions are available' },
                                    { key: 'weather_alerts', label: 'Weather Alerts', desc: 'Real-time weather warnings for your farm location' },
                                    { key: 'ai_suggestions', label: 'AI Smart Tips', desc: 'Weekly personalised farming advice from your AI advisor' },
                                ].map(item => (
                                    <div key={item.key} className="toggle-item">
                                        <div className="toggle-info">
                                            <strong>{item.label}</strong>
                                            <span>{item.desc}</span>
                                        </div>
                                        <Toggle value={notifSettings[item.key]} onChange={val => setNotifSettings(p => ({ ...p, [item.key]: val }))} />
                                    </div>
                                ))}
                            </div>
                            <button className="btn-save-settings" style={{ marginTop: 24 }} onClick={saveNotifications} disabled={saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                Save Notification Settings
                            </button>
                        </motion.div>
                    )}

                    {/* AI PREFERENCES */}
                    {activeSection === 'preferences' && (
                        <motion.div key="pref" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
                            <div className="section-title-wrap">
                                <h3>AI & App Experience</h3>
                                <p>Customize how the AI Advisor helps your farm — saved directly to your profile</p>
                            </div>

                            <div className="settings-group">
                                <label className="group-label">AI Advice Priority</label>
                                <div className="pill-selector">
                                    {['Water-Saving', 'Yield Improvement', 'Organic Standards', 'Pest Prevention'].map(p => (
                                        <button key={p} className={`pill-btn ${aiPrefs.advice_priority === p ? 'active' : ''}`}
                                            onClick={() => setAiPrefs(prev => ({ ...prev, advice_priority: p }))}>
                                            {p}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="toggle-item" style={{ marginTop: 24 }}>
                                <div className="toggle-info">
                                    <strong>AI Smart-Suggestions</strong>
                                    <span>Allow AI to generate weekly personalised missions based on your farm data</span>
                                </div>
                                <Toggle value={aiPrefs.ai_smart_suggestions} onChange={val => setAiPrefs(p => ({ ...p, ai_smart_suggestions: val }))} />
                            </div>

                            <div className="section-divider" style={{ margin: '30px 0' }} />

                            <div className="section-title-wrap"><h4>Interface Settings</h4></div>
                            <div className="input-grid">
                                <div className="f-input">
                                    <label>Display Language</label>
                                    <select value={aiPrefs.language} onChange={e => setAiPrefs(p => ({ ...p, language: e.target.value }))}>
                                        <option>English</option>
                                        <option>Telugu</option>
                                        <option>Hindi</option>
                                        <option>Tamil</option>
                                    </select>
                                </div>
                            </div>

                            <button className="btn-save-settings" style={{ marginTop: 24 }} onClick={saveAIPrefs} disabled={saving}>
                                {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
                                Save AI Preferences
                            </button>

                            <div style={{ marginTop: 16, padding: '12px 16px', background: '#f3f6f0', borderRadius: 12, fontSize: '0.8rem', color: '#555', fontWeight: 700 }}>
                                💡 Your AI advisor reads these preferences from the database before every conversation, automatically personalising its advice.
                            </div>
                        </motion.div>
                    )}

                    {/* PRIVACY */}
                    {activeSection === 'privacy' && (
                        <motion.div key="privacy" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Privacy & Security</h3>
                                <p>Control who sees your farming journey and secure your data</p>
                            </div>
                            <div className="toggle-list">
                                <div className="toggle-item">
                                    <div className="toggle-info"><strong>Public Profile</strong><span>Allow others to see your farm ranking and stats</span></div>
                                    <Toggle value={true} onChange={() => {}} />
                                </div>
                                <div className="toggle-item">
                                    <div className="toggle-info"><strong>Activity Visibility</strong><span>Show completed tasks on the community feed</span></div>
                                    <Toggle value={false} onChange={() => {}} />
                                </div>
                            </div>
                            <div className="section-divider" style={{ margin: '30px 0' }} />
                            <div className="section-title-wrap"><h4>Account Security</h4></div>
                            <button className="btn-outline-settings"><Smartphone size={16} /> Manage Login Devices</button>
                        </motion.div>
                    )}

                    {/* DATA */}
                    {activeSection === 'data' && (
                        <motion.div key="data" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Data & History</h3>
                                <p>Manage your personal farming records and permissions</p>
                            </div>
                            <div className="data-card">
                                <div className="data-icon"><HardDrive size={24} /></div>
                                <div className="data-info">
                                    <h4>Your Data</h4>
                                    <p>Farm profile, mission history, and AI conversations are all stored securely in your MongoDB account.</p>
                                    <div className="storage-bar"><div className="storage-fill" style={{ width: '25%' }} /></div>
                                </div>
                            </div>
                            <div className="action-list-settings">
                                <button className="settings-action-btn">
                                    <div className="act-icon"><Download size={18} /></div>
                                    <div className="act-text"><strong>Download Farming Data</strong><span>Export all records in CSV format</span></div>
                                    <ChevronRight size={18} color="#aaa" />
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* SUPPORT */}
                    {activeSection === 'support' && (
                        <motion.div key="support" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                            <div className="section-title-wrap">
                                <h3>Help & Support</h3>
                                <p>Get help from our team or learn more about GOO</p>
                            </div>
                            <div className="help-grid">
                                <div className="help-card"><HelpCircle size={24} color="#2d5a27" /><h4>Visit Help Center</h4><p>FAQs, Tutorials, and Guides</p></div>
                                <div className="help-card"><Mail size={24} color="#3b82f6" /><h4>Contact Support</h4><p>Talk to our human experts</p></div>
                            </div>
                            <div className="about-info-box">
                                <div className="info-row"><span>App Version</span><strong>v2.4.0 (Beta)</strong></div>
                                <div className="info-row"><span>Account ID</span><strong style={{ fontSize: '0.75rem', opacity: 0.7 }}>{profile?.id}</strong></div>
                                <div className="info-row"><span>System Status</span><strong><span className="dot-online" /> Systems Optimal</strong></div>
                                <div className="info-row"><span>Member Since</span><strong>{new Date(profile?.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</strong></div>
                            </div>
                        </motion.div>
                    )}

                </AnimatePresence>
            </main>
        </div>
    );
};

export default SettingsPage;
