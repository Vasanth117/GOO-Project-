import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Heart, MessageSquare, Share2, Bookmark, MoreHorizontal,
    TrendingUp, Droplets, Leaf, TreePine, Zap, Trophy, Wind,
    CheckCircle, Plus, Award, Loader2, Image, X, Send,
    Camera, MapPin, Smile, Trash2, UserPlus, UserMinus
} from 'lucide-react';
import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';
import './dashboard.css';

const API_BASE = 'http://localhost:8000';

const PostCard = ({ post, onPostDeleted }) => {
    const { user } = useAuth();
    const [liked, setLiked] = useState(post.is_liked_by_me);
    const [likes, setLikes] = useState(post.likes_count);
    const [followed, setFollowed] = useState(post.author.is_followed_by_me);
    const [saved, setSaved] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [comments, setComments] = useState([]);
    const [commentContent, setCommentContent] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const isAuthor = user?.id === post.author.id;

    const handleLike = async () => {
        try {
            const res = await apiService.toggleLike(post.id);
            setLiked(res.liked);
            setLikes(res.likes_count);
        } catch (err) { console.error(err); }
    };

    const handleFollow = async () => {
        try {
            const res = await apiService.toggleFollow(post.author.id);
            setFollowed(res.followed);
        } catch (err) { console.error(err); }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this activity?')) return;
        setIsDeleting(true);
        try {
            await apiService.deletePost(post.id);
            onPostDeleted(post.id);
        } catch (err) {
            console.error(err);
            alert('Failed to delete post');
            setIsDeleting(false);
        }
    };

    const loadComments = async () => {
        if (showComments && comments.length === 0) {
            setLoadingComments(true);
            try {
                const res = await apiService.getComments(post.id);
                setComments(res.comments);
            } catch (err) { console.error(err); }
            finally { setLoadingComments(false); }
        }
    };

    useEffect(() => { loadComments(); }, [showComments]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!commentContent.trim()) return;
        try {
            const res = await apiService.addComment(post.id, commentContent);
            setComments([res, ...comments]);
            setCommentContent('');
            post.comments_count += 1;
        } catch (err) { console.error(err); }
    };

    const imageUrl = post.image_url ? (post.image_url.startsWith('http') ? post.image_url : `${API_BASE}${post.image_url}`) : null;
    const authorPic = post.author.profile_picture ? (post.author.profile_picture.startsWith('http') ? post.author.profile_picture : `${API_BASE}${post.author.profile_picture}`) : null;

    return (
        <motion.div className="feed-card"
            initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }} viewport={{ once: true }}>
            <div className="feed-card-header">
                <img src={authorPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=2d5a27&color=fff`} alt={post.author.name} className="feed-avatar" />
                <div className="feed-farmer-info">
                    <div className="feed-author-name">
                        {post.author.name}
                        {post.author.is_verified && <CheckCircle size={14} color="#2d5a27" />}
                    </div>
                    <div className="feed-author-meta">{post.author.role} · {post.author.farm_name || 'Agri Explorer'}</div>
                    <div className="feed-timestamp">{new Date(post.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {!isAuthor && (
                        <motion.button className={`follow-btn ${followed ? 'followed' : ''}`}
                            onClick={handleFollow}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            {followed ? <UserMinus size={14} /> : <UserPlus size={14} />}
                            {followed ? 'Following' : 'Follow'}
                        </motion.button>
                    )}
                    {isAuthor && (
                        <button onClick={handleDelete} disabled={isDeleting} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', padding: '5px' }}>
                            {isDeleting ? <Loader2 size={18} className="spinner" /> : <Trash2 size={18} />}
                        </button>
                    )}
                </div>
            </div>
            <p className="feed-caption">{post.content}</p>
            {imageUrl && (
                <div className="feed-img-wrapper" style={{ borderRadius: '16px', overflow: 'hidden', margin: '12px 0' }}>
                    <motion.img src={imageUrl} alt="post" className="feed-img"
                        style={{ width: '100%', height: 'auto', maxHeight: '450px', objectFit: 'cover' }}
                        whileHover={{ scale: 1.01 }} transition={{ duration: 0.4 }} />
                </div>
            )}
            
            {post.impact && (
                <div className="eco-impact-bar" style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div className="eco-chip" style={{ background: '#e8f5e9', color: '#2e7d32', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Droplets size={13} /> {post.impact.water}
                    </div>
                    <div className="eco-chip" style={{ background: '#fff3e0', color: '#e65100', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <Leaf size={13} /> {post.impact.chemical}
                    </div>
                    <div className="eco-chip" style={{ background: '#f3e5f5', color: '#7b1fa2', padding: '4px 12px', borderRadius: '8px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <TreePine size={13} /> {post.impact.method}
                    </div>
                </div>
            )}

            <div className="feed-actions">
                <motion.button className={`feed-action-btn ${liked ? 'liked' : ''}`}
                    onClick={handleLike} whileTap={{ scale: 0.85 }}>
                    <Heart size={20} fill={liked ? '#e63946' : 'none'} />
                    <span>{likes}</span>
                </motion.button>
                <motion.button className="feed-action-btn" 
                    whileTap={{ scale: 0.85 }} onClick={() => setShowComments(!showComments)}>
                    <MessageSquare size={20} /><span>{post.comments_count}</span>
                </motion.button>
                <motion.button className="feed-action-btn" whileTap={{ scale: 0.85 }}>
                    <Share2 size={20} /><span>Share</span>
                </motion.button>
                <motion.button className={`feed-action-btn ${saved ? 'saved' : ''}`}
                    onClick={() => setSaved(!saved)} whileTap={{ scale: 0.85 }} style={{ marginLeft: 'auto' }}>
                    <Bookmark size={20} fill={saved ? '#2d5a27' : 'none'} />
                </motion.button>
            </div>

            {showComments && (
                <div className="comments-section">
                    <form onSubmit={handleAddComment} className="comment-input-wrap">
                        <img src={user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE}${user.profile_picture}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=2d5a27&color=fff`} 
                            className="comment-avatar" alt="me" />
                        <input type="text" className="comment-input" placeholder="Write a comment..." value={commentContent} onChange={e => setCommentContent(e.target.value)} />
                        <button type="submit" className="comment-submit-btn" disabled={!commentContent.trim()}><Send size={18} /></button>
                    </form>

                    {loadingComments ? <Loader2 size={24} className="spinner" style={{ margin: '20px auto', display: 'block' }} /> : (
                        <div className="comments-list">
                            {comments.map(c => (
                                <div key={c.id} className="single-comment">
                                    <img src={c.author.profile_picture ? (c.author.profile_picture.startsWith('http') ? c.author.profile_picture : `${API_BASE}${c.author.profile_picture}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(c.author.name)}&background=2d5a27&color=fff`} 
                                        className="comment-avatar-small" alt={c.author.name} />
                                    <div className="comment-bubble">
                                        <div className="comment-author-name">{c.author.name}</div>
                                        <div className="comment-text">{c.content}</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </motion.div>
    );
};

const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
    const { user } = useAuth();
    const [content, setContent] = useState('');
    const [image, setImage] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [loading, setLoading] = useState(false);
    const fileInputRef = useRef();

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImage(file);
            setImagePreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async () => {
        if (!content.trim() && !image) return;
        setLoading(true);
        try {
            const formData = new FormData();
            formData.append('content', content);
            if (image) formData.append('image', image);
            formData.append('tags', 'organic,eco-friendly'); // Default tags

            await apiService.createPost(formData);
            setContent('');
            setImage(null);
            setImagePreview(null);
            onPostCreated();
            onClose();
        } catch (err) {
            console.error(err);
            alert('Failed to story farming activity. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="modal-overlay" style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(4px)' }} onClick={onClose}>
            <motion.div className="modal-content" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                style={{ background: '#fff', width: '100%', maxWidth: '500px', borderRadius: '24px', padding: '24px', boxShadow: '0 20px 50px rgba(0,0,0,0.2)' }}
                onClick={e => e.stopPropagation()}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Create Post</h3>
                    <button onClick={onClose} style={{ background: '#f5f5f5', border: 'none', borderRadius: '50%', padding: '8px', cursor: 'pointer' }}><X size={20} /></button>
                </div>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                    <img src={user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE}${user.profile_picture}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=2d5a27&color=fff`} 
                        alt="me" style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover' }} />
                    <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{user?.name}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                            <span style={{ fontSize: '0.7rem', background: '#f0f4f0', color: '#2d5a27', padding: '2px 8px', borderRadius: '4px', fontWeight: 700 }}>Public</span>
                        </div>
                    </div>
                </div>

                <textarea placeholder="Tell your fellow farmers what's happening today..." 
                    value={content} onChange={e => setContent(e.target.value)}
                    style={{ width: '100%', border: 'none', outline: 'none', fontSize: '1.1rem', minHeight: '120px', resize: 'none' }} />

                {imagePreview && (
                    <div style={{ position: 'relative', marginTop: '12px', borderRadius: '16px', overflow: 'hidden' }}>
                        <img src={imagePreview} alt="preview" style={{ width: '100%', maxHeight: '300px', objectFit: 'cover' }} />
                        <button onClick={() => { setImage(null); setImagePreview(null); }} 
                            style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', borderRadius: '50%', padding: '5px' }}>
                            <X size={16} />
                        </button>
                    </div>
                )}

                <div style={{ borderTop: '1px solid #eee', marginTop: '20px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '15px' }}>
                        <button onClick={() => fileInputRef.current.click()} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2d5a27' }}>
                            <Image size={24} />
                        </button>
                        <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImageChange} />
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#de6a1f' }}><MapPin size={24} /></button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ffb300' }}><Smile size={24} /></button>
                    </div>
                    <button className="btn-save-settings" onClick={handleSubmit} disabled={loading || (!content.trim() && !image)}
                        style={{ padding: '10px 24px', borderRadius: '12px', background: '#2d5a27', color: '#fff', fontWeight: 700, border: 'none', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                        {loading ? <Loader2 size={18} className="spinner" /> : <Send size={18} />}
                        {loading ? 'Posting...' : 'Post Activity'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [posts, setPosts] = useState([]);
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeFilter, setActiveFilter] = useState('All Posts');

    const filterMap = {
        'All Posts': null,
        'Missions': 'missions',
        'Eco Activities': 'eco',
        'Challenges': 'eco',
        'Progress': 'missions'
    };

    const loadData = async (filter = activeFilter) => {
        setLoading(true);
        try {
            const [feedData, statsData] = await Promise.all([
                apiService.getFeed(1, filterMap[filter]),
                apiService.getStats()
            ]);
            setPosts(feedData.posts);
            setStats(statsData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [activeFilter]);

    const userPic = user?.profile_picture ? (user.profile_picture.startsWith('http') ? user.profile_picture : `${API_BASE}${user.profile_picture}`) : null;

    if (loading) return (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
            <Loader2 size={48} className="spinner" color="#2d5a27" />
        </div>
    );

    return (
        <div className="feed-layout">
            <div className="feed-column">
                <motion.div className="create-post-bar" 
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setIsModalOpen(true)}>
                    <img src={userPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=2d5a27&color=fff`} alt="me" className="feed-avatar" />
                    <div className="create-post-placeholder">Share your farming activity today, {user?.name}...</div>
                    <motion.button className="create-post-btn" 
                        whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Plus size={16} /> Post
                    </motion.button>
                </motion.div>

                <div className="feed-filter-row" style={{ display: 'flex', gap: '12px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'none' }}>
                    {Object.keys(filterMap).map((f) => (
                        <motion.button key={f} className={`feed-filter-chip ${activeFilter === f ? 'active' : ''}`}
                            style={{ 
                                whiteSpace: 'nowrap', 
                                padding: '8px 20px', 
                                borderRadius: '100px', 
                                border: '1px solid #eee', 
                                background: activeFilter === f ? '#2d5a27' : '#fff', 
                                color: activeFilter === f ? '#fff' : '#555', 
                                fontWeight: activeFilter === f ? 800 : 500, 
                                cursor: 'pointer' 
                            }}
                            onClick={() => setActiveFilter(f)}
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>{f}</motion.button>
                    ))}
                </div>

                <AnimatePresence>
                    {posts.map(post => (
                        <PostCard 
                            key={post.id} 
                            post={post} 
                            onPostDeleted={(id) => setPosts(posts.filter(p => p.id !== id))} 
                        />
                    ))}
                </AnimatePresence>
            </div>

            <aside className="feed-right-panel">
                <motion.div className="widget-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="farmer-widget-header">
                        <img src={userPic || `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name)}&background=2d5a27&color=fff`} alt="me" className="farmer-widget-avatar" />
                        <div className="farmer-widget-info">
                            <div className="farmer-widget-name">{user?.name}</div>
                            <div className="farmer-widget-role">{user?.role}</div>
                            <div className="farmer-widget-tier">
                                <Award size={14} /> {stats?.tier?.tier || 'Eco Warrior'}
                            </div>
                        </div>
                    </div>
                    <div className="stats-mini-grid">
                        {[
                            { label: 'Score', val: stats?.sustainability_score || '0', icon: Leaf, color: '#2d5a27' },
                            { label: 'Eco Coins', val: stats?.xp || '0', icon: Zap, color: '#d4af37' },
                            { label: 'Badges', val: stats?.badges_count || '0', icon: Award, color: '#4c7c42' },
                            { label: 'Rank', val: stats?.rank || 'N/A', icon: Trophy, color: '#768953' },
                        ].map(s => (
                            <div key={s.label} className="stat-mini-box" style={{ borderLeft: `4px solid ${s.color}` }}>
                                <div className="stat-mini-icon" style={{ background: s.color + '15' }}>
                                    <s.icon size={18} color={s.color} />
                                </div>
                                <div className="stat-mini-val" style={{ color: s.color }}>{s.val}</div>
                                <div className="stat-mini-label">{s.label}</div>
                            </div>
                        ))}
                    </div>
                </motion.div>

                <motion.div className="widget-card" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
                    style={{ background: 'linear-gradient(135deg, #2d5a27, #1a3c1a)', borderRadius: '24px', padding: '24px', color: '#fff', position: 'relative', overflow: 'hidden' }}>
                    <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '15px', color: '#a5d6a7', fontWeight: 700, fontSize: '0.85rem' }}>
                            <TrendingUp size={16} /> Community Impact
                        </div>
                        <div className="trend-item" style={{ marginTop: '10px' }}>
                            <div style={{ fontWeight: 600, color: 'rgba(255,255,255,0.7)', fontSize: '0.85rem' }}>Global CO₂ Saved</div>
                            <div style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginTop: '2px', lineHeight: 1.2 }}>1.4M Tons</div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#81c784', fontSize: '0.78rem', marginTop: '8px', fontWeight: 700 }}>
                                <Zap size={12} fill="#81c784" /> +12% from last month
                            </div>
                        </div>
                    </div>
                    <div style={{ position: 'absolute', bottom: '-20px', right: '-20px', opacity: 0.1 }}>
                        <TreePine size={140} color="#fff" />
                    </div>
                </motion.div>
            </aside>

            <CreatePostModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                onPostCreated={loadData} 
            />
        </div>
    );
};

export default Dashboard;
