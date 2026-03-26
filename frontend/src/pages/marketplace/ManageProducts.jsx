import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Plus, Search, Filter, MoreVertical, Edit3, Trash2, 
    Eye, Tag, Package, Image as ImageIcon, CheckCircle, 
    XCircle, AlertCircle, ShoppingBag, ShieldCheck, Camera,
    Save, X, Upload, Info, Loader2, Sparkles, Sprout
} from 'lucide-react';
import { apiService } from '../../services/apiService';

const ManageProducts = ({ products, onRefresh }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [formData, setFormData] = useState({
        name: '', description: '', category: 'other', 
        price: '', stock: '', image_url: '', 
        proof_images: [], discount_percent: 0,
        is_featured: false,
        is_eco_certified: false
    });
    const [uploading, setUploading] = useState(false);
    const fileInputRef = React.useRef(null);

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setUploading(true);
        try {
            const result = await apiService.uploadProductImage(file);
            setFormData({ ...formData, image_url: result.url });
        } catch (err) {
            alert("Upload failed: " + err.message);
        } finally {
            setUploading(false);
        }
    };

    const handleAction = async (id, action) => {
        if (!window.confirm(`Are you sure you want to ${action} this product?`)) return;
        try {
            if (action === 'delete') await apiService.deleteProduct(id);
            else if (action === 'toggle-visibility') {
                const p = products.find(p => p.id === id);
                await apiService.updateProduct(id, { is_active: !p.is_active });
            }
            onRefresh();
        } catch (e) {
            console.error(e);
            alert('Failed to perform action');
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (editingProduct) {
                await apiService.updateProduct(editingProduct.id, formData);
            } else {
                await apiService.createProduct(formData);
            }
            setShowAddModal(false);
            setEditingProduct(null);
            onRefresh();
        } catch (e) {
            console.error(e);
            alert(`Error: ${e.message || 'Check all required fields and try again.'}`);
        } finally {
            setLoading(false);
        }
    };

    const openEdit = (p) => {
        setEditingProduct(p);
        setFormData({
            name: p.name, description: p.description, 
            category: p.category, price: p.price, 
            stock: p.stock, image_url: p.image_url || '', 
            proof_images: p.proof_images || [], 
            discount_percent: p.discount_percent || 0,
            is_featured: p.is_featured || false,
            is_eco_certified: p.is_eco_certified || false
        });
        setShowAddModal(true);
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: 1, display: 'flex', background: '#f4f4f2', padding: '10px 16px', borderRadius: '14px', alignItems: 'center', gap: 10 }}>
                    <Search size={18} color="#888" />
                    <input 
                        type="text" placeholder="Search your catalog..." 
                        value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ background: 'transparent', border: 'none', width: '100%', fontSize: '0.9rem', outline: 'none', fontWeight: 600 }} 
                    />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                    <button className="btn-secondary">
                        <Filter size={18} />
                        Filter
                    </button>
                    <button className="btn-primary" id="add-product-btn-real" onClick={() => { setEditingProduct(null); setFormData({name: '', description: '', category: 'other', price: '', stock: '', image_url: '', proof_images: [], discount_percent: 0, is_featured: false, is_eco_certified: false}); setShowAddModal(true); }}>
                        <Plus size={18} />
                        Create Listing
                    </button>
                </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                {filtered.map(p => (
                    <motion.div key={p.id} className="card" style={{ padding: '0', overflow: 'hidden' }} whileHover={{ y: -5 }}>
                        <div style={{ position: 'relative', height: '180px' }}>
                            <img src={p.image_url || 'https://via.placeholder.com/300x180'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            <div style={{ position: 'absolute', top: 12, right: 12, display: 'flex', gap: 8 }}>
                                <button onClick={() => openEdit(p)} style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                                    <Edit3 size={16} color="#2d5a27" />
                                </button>
                                <button onClick={() => handleAction(p.id, 'delete')} style={{ width: 34, height: 34, borderRadius: 10, background: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer' }}>
                                    <Trash2 size={16} color="#e63946" />
                                </button>
                            </div>
                            <div style={{ position: 'absolute', bottom: 12, left: 12 }}>
                                <span className="badge badge-green" style={{ background: 'white', color: '#1a1c19' }}>₹{p.price}</span>
                            </div>
                        </div>

                        <div style={{ padding: '20px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>{p.name}</h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#f0f9f0', padding: '4px 8px', borderRadius: 8 }}>
                                    <ShieldCheck size={14} color="#2d5a27" />
                                    <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#2d5a27' }}>GOO Verified</span>
                                </div>
                            </div>
                            <p style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '0.8rem', color: '#666', fontWeight: 600, margin: '8px 0 16px', lineHeight: 1.4 }}>
                                {p.description}
                            </p>
                            
                            <div style={{ display: 'flex', gridColumnGap: '20px', gridRowGap: '12px', flexWrap: 'wrap', borderTop: '1px solid #f8f8f8', paddingTop: '16px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: '#888' }}>
                                    <Package size={14} /> {p.stock} in stock
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: '#888' }}>
                                    <TrendingUp size={14} /> {p.sales} sales
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: '#888' }}>
                                    <Eye size={14} /> {p.views} views
                                </div>
                                {p.proof_images?.length > 0 && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.75rem', fontWeight: 800, color: '#2d5a27' }}>
                                        <Camera size={14} /> {p.proof_images.length} proofs
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* MODAL SYSTEM */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="modal-backdrop">
                        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="modal-box" style={{ maxWidth: '800px', padding: '0', overflow: 'hidden' }}>
                            <form onSubmit={handleSave}>
                                <div style={{ padding: '24px 32px', borderBottom: '1px solid #eeedeb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#fbfdfb' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <div style={{ padding: 10, borderRadius: 12, background: 'rgba(45,90,39,0.1)', color: '#2d5a27' }}>
                                            <ShoppingBag size={24} />
                                        </div>
                                        <div>
                                            <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 950 }}>{editingProduct ? 'Edit Product' : 'Add New Product'}</h2>
                                            <p style={{ margin: 0, fontSize: '0.8rem', color: '#666', fontWeight: 600 }}>Create an eco-friendly listing for the community.</p>
                                        </div>
                                    </div>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="topbar-icon-btn"><X size={20} /></button>
                                </div>

                                <div style={{ padding: '32px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', maxHeight: '70vh', overflowY: 'auto' }}>
                                    {/* Left Side: Basic Info */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 8, display: 'block' }}>Product Name</label>
                                            <input 
                                                type="text" required placeholder="e.g. Organic Seed Kit" 
                                                value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                                className="form-input" 
                                            />
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 8, display: 'block' }}>Category</label>
                                            <select 
                                                className="form-input" value={formData.category} 
                                                onChange={(e) => setFormData({...formData, category: e.target.value})}
                                            >
                                                <option value="seeds">Seeds</option>
                                                <option value="fertilizer">Fertilizer</option>
                                                <option value="tools">Tools</option>
                                                <option value="crop">Crops / Produce</option>
                                                <option value="irrigation">Irrigation</option>
                                                <option value="consultation">Consultation</option>
                                                <option value="other">Other</option>
                                            </select>
                                        </div>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <div className="input-group" style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 8, display: 'block' }}>Price (₹)</label>
                                                <input 
                                                    type="number" required placeholder="0.00" 
                                                    value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})}
                                                    className="form-input" 
                                                />
                                            </div>
                                            <div className="input-group" style={{ flex: 1 }}>
                                                <label style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 8, display: 'block' }}>Stock (units)</label>
                                                <input 
                                                    type="number" required placeholder="10" 
                                                    value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})}
                                                    className="form-input" 
                                                />
                                            </div>
                                        </div>
                                        <div className="input-group">
                                            <label style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 8, display: 'block' }}>Description</label>
                                            <textarea 
                                                required rows="4" placeholder="Tell buyers what makes this special..." 
                                                value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})}
                                                className="form-input" style={{ resize: 'none' }}
                                            ></textarea>
                                        </div>
                                    </div>

                                    {/* Right Side: Trust & Visuals */}
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                                        <div className="input-group">
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                                                <ImageIcon size={16} color="#2d5a27" />
                                                <label style={{ fontSize: '0.85rem', fontWeight: 900 }}>Main Product Image URL</label>
                                            </div>
                                            <div style={{ display: 'flex', gap: 8 }}>
                                                <input 
                                                    type="text" placeholder="https://..." 
                                                    value={formData.image_url} onChange={(e) => setFormData({...formData, image_url: e.target.value})}
                                                    className="form-input" style={{ flex: 1 }}
                                                />
                                                <input 
                                                    type="file" ref={fileInputRef} onChange={handleFileUpload}
                                                    accept="image/*" style={{ display: 'none' }}
                                                />
                                                <button 
                                                    type="button" onClick={() => fileInputRef.current.click()}
                                                    disabled={uploading}
                                                    style={{ padding: '0 16px', borderRadius: '12px', border: '2px solid #2d5a27', color: '#2d5a27', background: 'transparent', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8 }}
                                                >
                                                    {uploading ? <Loader2 className="animate-spin" size={16} /> : <Camera size={16} />}
                                                    Upload
                                                </button>
                                            </div>
                                            <p style={{ fontSize: '0.7rem', color: '#888', marginTop: 4, fontWeight: 600 }}>We recommend high-quality JPEG or PNG (800x800 minimum).</p>
                                        </div>

                                        <div style={{ background: '#f4fdf4', padding: '20px', borderRadius: '16px', border: '1px solid #dcf7dc' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                                                <div style={{ padding: 8, borderRadius: 10, background: '#2d5a27', color: 'white' }}>
                                                    <Sprout size={18} />
                                                </div>
                                                <h4 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 950, color: '#14532d' }}>Organic Proof System</h4>
                                            </div>
                                            <p style={{ fontSize: '0.75rem', color: '#166534', fontWeight: 700, marginBottom: 12, lineHeight: 1.5 }}>
                                                Upload photos of your farming process, growth stages, or organic certifications to build trust.
                                            </p>
                                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                                {formData.proof_images.map((img, i) => (
                                                    <div key={i} style={{ width: 60, height: 60, borderRadius: 10, overflow: 'hidden', position: 'relative' }}>
                                                        <img src={img} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                                        <button 
                                                            type="button" 
                                                            onClick={() => setFormData({...formData, proof_images: formData.proof_images.filter((_, idx) => idx !== i)})}
                                                            style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', color: 'white', border: 'none', borderRadius: '50%', width: 14, height: 14, fontSize: 8, cursor: 'pointer' }}
                                                        >X</button>
                                                    </div>
                                                ))}
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, proof_images: [...formData.proof_images, prompt("Enter proof image URL:")]})}
                                                    style={{ width: 60, height: 60, border: '2px dashed #a7f3d0', borderRadius: 12, background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2d5a27', cursor: 'pointer' }}
                                                >
                                                    <Plus size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div style={{ padding: '20px', borderRadius: '16px', background: '#f8f8f8', display: 'flex', flexDirection: 'column', gap: 12 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 2 }}>Featured Listing</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>Highlight this on the marketplace homepage.</div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, is_featured: !formData.is_featured})}
                                                    style={{ width: 44, height: 24, borderRadius: 12, padding: 2, background: formData.is_featured ? '#2d5a27' : '#ddd', border: 'none', cursor: 'pointer', transition: '0.3s' }}
                                                >
                                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', transform: formData.is_featured ? 'translateX(20px)' : 'translateX(0)', transition: '0.3s' }} />
                                                </button>
                                            </div>
                                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #eeedeb', paddingTop: 12 }}>
                                                <div>
                                                    <div style={{ fontSize: '0.85rem', fontWeight: 900, marginBottom: 2 }}>Eco Certified</div>
                                                    <div style={{ fontSize: '0.7rem', color: '#888', fontWeight: 600 }}>Does this product have organic certification?</div>
                                                </div>
                                                <button 
                                                    type="button"
                                                    onClick={() => setFormData({...formData, is_eco_certified: !formData.is_eco_certified})}
                                                    style={{ width: 44, height: 24, borderRadius: 12, padding: 2, background: formData.is_eco_certified ? '#2d5a27' : '#ddd', border: 'none', cursor: 'pointer', transition: '0.3s' }}
                                                >
                                                    <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', transform: formData.is_eco_certified ? 'translateX(20px)' : 'translateX(0)', transition: '0.3s' }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div style={{ padding: '24px 32px', borderTop: '1px solid #eeedeb', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#fbfdfb' }}>
                                    <button type="button" onClick={() => setShowAddModal(false)} className="btn-secondary">Cancel</button>
                                    <button type="submit" className="btn-primary" disabled={loading} style={{ minWidth: '140px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                                        {loading ? <Loader2 size={18} className="spinner" /> : (
                                            <>
                                                <Save size={18} />
                                                {editingProduct ? 'Update Listing' : 'Publish Product'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default ManageProducts;
