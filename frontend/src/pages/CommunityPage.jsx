import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Search, Filter, MessageSquare, ThumbsUp, 
    Share2, Bookmark, Award, ShieldCheck, UserCheck,
    MapPin, Sprout, Target, ChevronRight, Plus, 
    CheckCircle2, Info, Globe, HelpCircle, GraduationCap,
    Send, UserPlus, Clock, Loader2
} from 'lucide-react';
import avatar2 from '../assets/images/2.jpg';
import avatar3 from '../assets/images/3.jpg';
import avatar4 from '../assets/images/4.jpg';
import img1 from '../assets/images/1.jpg';

import avatar from '../assets/images/9.jpg';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';

const GROUPS = [
    { id: 1, name: 'Warangal Rice Union', members: '1.2k', type: 'Location' },
    { id: 2, name: 'Organic Pioneers', members: '850', type: 'Interest' },
    { id: 3, name: 'Vegetable Tech', members: '2.4k', type: 'Crop' },
    { id: 4, name: 'Eco-Water Saviors', members: '300', type: 'Impact' },
    { id: 5, name: 'Solar IoT Network', members: '1.5k', type: 'Tech' },
    { id: 6, name: 'Pest Control Alliance', members: '4.1k', type: 'Interest' },
    { id: 7, name: 'North India Wheat Group', members: '3.2k', type: 'Location' },
    { id: 8, name: 'Drone Surveillance Crew', members: '950', type: 'Tech' }
];

const CommunityPage = () => {
    const [activeCategory, setActiveCategory] = useState('All');
    const [showApplyModal, setShowApplyModal] = useState(false);
    const [hasApplied, setHasApplied] = useState(false);
    const { user } = useAuth();

    // Dynamic Social Feed & Widget States
    const [posts, setPosts] = useState([]);
    const [experts, setExperts] = useState([]);
    const [verifications, setVerifications] = useState([]);
    const [joinedGroupIds, setJoinedGroupIds] = useState([]);
    const [newPostContent, setNewPostContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [isPosting, setIsPosting] = useState(false);

    const loadFeed = async () => {
        try {
            let postType = '';
            if (activeCategory === 'Organic Farming' || activeCategory === 'Water Mgmt') postType = 'eco';
            else if (activeCategory !== 'All') postType = 'missions';

            const [feedData, expertData, verificationData, profileData] = await Promise.all([
                apiService.getFeed(1, postType),
                apiService.getLeaderboard('national').catch(() => ({ leaderboard: [] })),
                (user && user.role === 'grc') 
                    ? apiService.getPendingVerifications().catch(() => ({ verifications: [] }))
                    : Promise.resolve({ verifications: [] }),
                apiService.getProfile().catch(() => ({ preferences: {} }))
            ]);

            setPosts(feedData.posts || []);
            setExperts((expertData.leaderboard || []).slice(0, 3));
            setVerifications(verificationData.verifications || []);
            setJoinedGroupIds(profileData.preferences?.joined_groups || []);
        } catch (error) {
            console.error('Failed to load feed:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadFeed();
        // 🔄 REAL-TIME SYNC: Refresh feed & widgets every 30 seconds
        const interval = setInterval(loadFeed, 30000);
        return () => clearInterval(interval);
    }, [activeCategory]);

    const handleCreatePost = async () => {
        if (!newPostContent.trim()) return;
        setIsPosting(true);
        try {
            const formData = new FormData();
            formData.append('content', newPostContent);
            await apiService.createPost(formData);
            setNewPostContent('');
            loadFeed(); // Refresh feed after post
        } catch (error) {
            alert('Failed to post. Please try again.');
        } finally {
            setIsPosting(false);
        }
    };

    const handleToggleLike = async (postId) => {
        try {
            // Optimistic update
            setPosts(posts.map(p => 
                p.id === postId 
                    ? { ...p, is_liked_by_me: !p.is_liked_by_me, likes_count: p.is_liked_by_me ? p.likes_count - 1 : p.likes_count + 1 }
                    : p
            ));
            await apiService.toggleLike(postId);
        } catch (error) {
            // Revert on fail
            loadFeed();
        }
    };

    const handleToggleGroup = async (groupId) => {
        const isJoined = joinedGroupIds.includes(groupId);
        const newJoined = isJoined ? joinedGroupIds.filter(id => id !== groupId) : [...joinedGroupIds, groupId];
        
        // Optimistic UI update
        setJoinedGroupIds(newJoined);
        
        try {
            await apiService.updatePreferences({ joined_groups: newJoined });
        } catch (error) {
            setJoinedGroupIds(joinedGroupIds); // Revert on fail
            alert("Failed to toggle group status.");
        }
    };

    return (
        <div className="community-layout">
            
            {/* ── LEFT: DISCOVERY & GROUPS ── */}
            <aside className="community-sidebar-left">
                <div style={{ marginBottom: 25 }}>
                    <h3 className="sidebar-section-title">Communities ({GROUPS.length})</h3>
                    <div className="group-list" style={{ maxHeight: '280px', overflowY: 'auto', paddingRight: '5px' }}>
                        {GROUPS.map(group => {
                            const isJoined = joinedGroupIds.includes(group.id);
                            return (
                                <motion.div key={group.id} className="group-mini-card" whileHover={{ x: 5 }}>
                                    <div className="group-icon-box">
                                        {group.type === 'Location' ? <MapPin size={16} /> : <Sprout size={16} />}
                                    </div>
                                    <div className="group-info">
                                        <div className="group-name">{group.name}</div>
                                        <div className="group-meta">{group.members} members</div>
                                    </div>
                                    <button 
                                        onClick={() => handleToggleGroup(group.id)} 
                                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                                    >
                                        {isJoined ? <CheckCircle2 size={20} color="#2d5a27" /> : <Plus size={20} color="#aaa" />}
                                    </button>
                                </motion.div>
                            );
                        })}
                    </div>
                </div>

                <div>
                    <h3 className="sidebar-section-title">Knowledge Forum</h3>
                    <div className="forum-categories">
                        {['All', 'Crop Based', 'Organic Farming', 'Water Mgmt', 'Pest Control'].map(cat => (
                            <button 
                                key={cat} 
                                className={`forum-cat-btn ${activeCategory === cat ? 'active' : ''}`}
                                onClick={() => setActiveCategory(cat)}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </aside>

            {/* ── CENTER: DISCUSSION FEED ── */}
            <main className="community-feed-center">
                <header className="community-header">
                    <div className="search-pill-box">
                        <Search size={18} color="#888" />
                        <input type="text" placeholder="Search topics, questions, or peer farmers..." />
                        <Filter size={18} color="#888" />
                    </div>
                </header>

                <div className="create-discuss-box" style={{ flexDirection: 'column', alignItems: 'stretch' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <img src={avatar} alt="me" className="com-mini-avatar" />
                        <textarea 
                            className="fake-input-btn" 
                            style={{ flex: 1, minHeight: '50px', borderRadius: '12px', padding: '12px 18px', resize: 'none', border: '1.5px solid var(--color-border)', background: 'var(--color-surface-2)' }}
                            placeholder="Ask the community a question or share your progress..."
                            value={newPostContent}
                            onChange={(e) => setNewPostContent(e.target.value)}
                        />
                    </div>
                    {newPostContent.trim() && (
                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '10px' }}>
                            <button 
                                className="btn-primary" 
                                style={{ padding: '8px 24px', borderRadius: '8px' }}
                                onClick={handleCreatePost}
                                disabled={isPosting}
                            >
                                {isPosting ? <Loader2 size={16} className="spinner" /> : <><Send size={16} /> Post</>}
                            </button>
                        </div>
                    )}
                </div>

                <div className="discuss-list">
                    {loading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}><Loader2 size={24} className="spinner" /> Loading Feed...</div>
                    ) : posts.length === 0 ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Be the first to post something!</div>
                    ) : (
                        posts.map((post, i) => (
                            <motion.div 
                                key={post.id} className="discuss-card"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.1 }}
                            >
                                <div className="discuss-top" onClick={() => navigate(`/profile/${post.author.id}`)} style={{ cursor: 'pointer' }}>
                                    <div className="com-mini-avatar" style={{ background: '#2d5a27', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        {post.author.name[0]}
                                    </div>
                                    <div>
                                        <div className="discuss-author">
                                            {post.author.name} {post.author.score_tier && post.author.score_tier !== 'none' && <span className="expert-badge"><Award size={10} /> {post.author.score_tier}</span>}
                                        </div>
                                        <div className="discuss-meta">{new Date(post.created_at).toLocaleString()}</div>
                                    </div>
                                </div>
                                <p className="discuss-content">{post.content}</p>
                                {post.image_url && (
                                    <div style={{ marginTop: '15px', borderRadius: '12px', overflow: 'hidden' }}>
                                        <img src={`http://localhost:8000${post.image_url}`} style={{ width: '100%', maxHeight: '400px', objectFit: 'cover' }} alt="post media" />
                                    </div>
                                )}
                                <div className="discuss-tags">
                                    {post.tags && post.tags.map(tag => <span key={tag} className="d-tag">#{tag}</span>)}
                                </div>
                                <div className="discuss-actions" style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #eee' }}>
                                    <button 
                                        className="d-action" 
                                        style={{ color: post.is_liked_by_me ? '#2d5a27' : '#666' }}
                                        onClick={() => handleToggleLike(post.id)}
                                    >
                                        <ThumbsUp size={16} /> <span>{post.likes_count}</span>
                                    </button>
                                    <button className="d-action"><MessageSquare size={16} /> <span>{post.comments_count}</span></button>
                                    <button className="d-action"><Share2 size={16} /></button>
                                </div>
                            </motion.div>
                        ))
                    )}
                </div>
            </main>

            {/* ── RIGHT: CLUBS & VERIFICATION ── */}
            <aside className="community-sidebar-right">
                
                {/* Green Revolution Club - Premium Card */}
                <motion.div className="green-club-card" whileHover={{ y: -5 }}>
                    <div className="club-glow" />
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div className="club-header">
                            <ShieldCheck size={24} color="#d4af37" />
                            <span>Green Revolution Club</span>
                        </div>
                        <p className="club-desc">The elite circle of verified eco-pioneers. Help verify nearby farms and lead the movement.</p>
                        {!hasApplied ? (
                            <button className="btn-join-club" onClick={() => setShowApplyModal(true)}>
                                Apply for Membership <ChevronRight size={14} />
                            </button>
                        ) : (
                            <div className="application-pending">
                                <Clock size={14} /> Application Under Review
                            </div>
                        )}
                    </div>
                </motion.div>

                {/* Peer Verification Queue */}
                <div className="verification-widget">
                    <div className="widget-title-row">
                        <UserCheck size={18} color="#2d5a27" />
                        <span>Peer Verification ({verifications.length})</span>
                    </div>
                    {verifications.length === 0 ? (
                        <div style={{ color: '#888', fontSize: '0.85rem', padding: '10px 0' }}>No pending validations found.</div>
                    ) : (
                        verifications.map((item, i) => (
                            <div key={i} className="verify-item">
                                <div className="verify-user-info">
                                    <div className="v-name">{item.farmer_name || 'Farmer'}</div>
                                    <div className="v-task">Pending Mission: {item.mission_id}</div>
                                </div>
                                <div className="v-dist">LIVE</div>
                                <button className="v-check-btn"><ChevronRight size={14} /></button>
                            </div>
                        ))
                    )}
                    {verifications.length > 0 && <button className="view-all-btn">View All Queue</button>}
                </div>

                {/* Expert Recommendations */}
                <div className="expert-widget">
                    <div className="widget-title-row">
                        <Award size={18} color="#2d5a27" />
                        <span>Top Contributors</span>
                    </div>
                    {experts.length === 0 ? (
                        <div style={{ color: '#888', fontSize: '0.85rem', padding: '10px 0' }}>Syncing leaderboard...</div>
                    ) : (
                        experts.map((exp, i) => (
                            <div key={i} className="expert-list-item" onClick={() => navigate(`/profile/${exp.user_id || exp.id}`)} style={{ cursor: 'pointer' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.82rem' }}>#{i+1} {exp.name || 'Anonymous'}</div>
                                <div style={{ fontSize: '0.72rem', color: '#888' }}>{exp.tier || 'Farmer'} • {exp.score} XP</div>
                            </div>
                        ))
                    )}
                </div>

            </aside>

            {/* ── APPLICATION MODAL ── */}
            <AnimatePresence>
                {showApplyModal && (
                    <div className="modal-overlay" onClick={() => setShowApplyModal(false)}>
                        <motion.div 
                            className="apply-modal"
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            onClick={e => e.stopPropagation()}
                        >
                            <div className="modal-header">
                                <ShieldCheck size={32} color="#d4af37" />
                                <h3>Apply for Green Revolution Club</h3>
                            </div>
                            <div className="modal-body">
                                <p>Membership requires an active commitment to verify nearby farmers weekly and maintain a sustainability score &gt; 90.</p>
                                <div className="form-group-luxe">
                                    <label>Why do you want to join the core movement?</label>
                                    <textarea className="modal-textarea" placeholder="e.g. I want to help my local village transition to organic farming..." />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-m-cancel" onClick={() => setShowApplyModal(false)}>Cancel</button>
                                <button className="btn-m-submit" onClick={() => { setHasApplied(true); setShowApplyModal(false); }}>Submit Application</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

        </div>
    );
};

export default CommunityPage;
