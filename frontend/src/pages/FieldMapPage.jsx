/* global L */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Search, Ghost, Activity, Crosshair,
    TrendingUp, MessageCircle, UserPlus, ShoppingBag, MapPin,
    Star, Users, Zap, Target, Layers, Navigation, Eye, EyeOff,
    Clock, Leaf, ShieldCheck, ChevronRight, Flame, Award, UserCheck,
    Radio, Wifi, WifiOff, Filter, BarChart2, Info, Bot
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import avatar1 from '../assets/images/9.jpg';
import './FieldMapPage.css';

const FieldMapPage = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const heatLayerRef = useRef([]);
    const activityLayerRef = useRef([]);
    const routingControlRef = useRef(null);
    const locationWatchId = useRef(null);
    const pingIntervalRef = useRef(null);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [followStatus, setFollowStatus] = useState('none'); // none, requested, following
    const [myPos, setMyPos] = useState(null);
    const [nearbyFarmers, setNearbyFarmers] = useState([]);
    const [activityMarkers, setActivityMarkers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [ghostMode, setGhostMode] = useState(false);
    const [privacyMode, setPrivacyMode] = useState('live'); // live, farm_only, ghost
    const [heatmapVisible, setHeatmapVisible] = useState(true);
    const [activityVisible, setActivityVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [locating, setLocating] = useState(false);
    const [activeDirection, setActiveDirection] = useState(null);
    const [viewMode, setViewMode] = useState('all'); // all, sellers, online
    const [showPrivacyPanel, setShowPrivacyPanel] = useState(false);
    const [showAIInsights, setShowAIInsights] = useState(true);
    const [networkStatus, setNetworkStatus] = useState('live');

    // ── FETCH DATA ───────────────────────────────────────────
    const fetchData = useCallback(async (lat = null, lng = null) => {
        try {
            const useLat = lat ?? myPos?.[0] ?? 10.6629;
            const useLng = lng ?? myPos?.[1] ?? 77.0065;
            const [farmersData, markersData] = await Promise.all([
                apiService.getNearbyFarmers(useLat, useLng),
                apiService.getActivityMarkers().catch(() => [])
            ]);
            setNearbyFarmers(farmersData || []);
            setActivityMarkers(markersData || []);
            setNetworkStatus('live');
        } catch (err) {
            console.error('Map fetch failed:', err);
            setNetworkStatus('offline');
        } finally {
            setLoading(false);
        }
    }, [myPos]);

    // ── GPS TRACKING ─────────────────────────────────────────
    const startGPS = useCallback(() => {
        if (!navigator.geolocation) return;
        setLocating(true);
        locationWatchId.current = navigator.geolocation.watchPosition(
            async (pos) => {
                const { latitude, longitude } = pos.coords;
                setMyPos([latitude, longitude]);
                setLocating(false);
                // Ping server with live location every update
                if (privacyMode === 'live') {
                    try { await apiService.pingLocation(latitude, longitude); } catch (_) { }
                }
                // Re-centre map on first fix
                if (mapInstance.current && !myPos) {
                    mapInstance.current.setView([latitude, longitude], 14);
                }
                // Fetch fresh data around new position
                fetchData(latitude, longitude);
            },
            (err) => { console.warn('GPS error:', err); setLocating(false); },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
        );
    }, [privacyMode, fetchData]);

    // ── LIFECYCLE ─────────────────────────────────────────────
    useEffect(() => {
        fetchData();
        startGPS();
        // Refresh map every 30s for real-time feel
        pingIntervalRef.current = setInterval(() => fetchData(), 30000);
        return () => {
            if (locationWatchId.current) navigator.geolocation.clearWatch(locationWatchId.current);
            if (pingIntervalRef.current) clearInterval(pingIntervalRef.current);
            if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
        };
    }, []);

    // ── MAP INIT ──────────────────────────────────────────────
    useEffect(() => {
        let pollCount = 0;
        const initPolling = setInterval(() => {
            if (window.L && !mapInstance.current) {
                initMap();
                clearInterval(initPolling);
            }
            pollCount++;
            if (pollCount > 20) clearInterval(initPolling);
        }, 500);
        return () => clearInterval(initPolling);
    }, []);

    const initMap = () => {
        if (!mapRef.current || mapInstance.current) return;
        const L = window.L;
        const center = myPos || [10.6629, 77.0065];
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(center, 13);
        mapInstance.current = map;

        // Satellite-style dark map tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }).addTo(map);

        // Custom zoom
        L.control.zoom({ position: 'bottomright' }).addTo(map);

        renderLayers();
    };

    // ── RENDER ALL MARKERS ────────────────────────────────────
    useEffect(() => {
        if (mapInstance.current) renderLayers();
    }, [ghostMode, heatmapVisible, activityVisible, searchQuery, selectedUser, nearbyFarmers, activityMarkers, myPos, viewMode]);

    const renderLayers = () => {
        const L = window.L;
        const map = mapInstance.current;
        if (!L || !map) return;

        // Clear existing
        markersRef.current.forEach(m => map.removeLayer(m));
        heatLayerRef.current.forEach(h => map.removeLayer(h));
        activityLayerRef.current.forEach(a => map.removeLayer(a));
        markersRef.current = [];
        heatLayerRef.current = [];
        activityLayerRef.current = [];

        // ── HEATMAP ZONES ──
        if (heatmapVisible) {
            const zones = [];
            nearbyFarmers.forEach(f => {
                const score = f.score || 100;
                const color = score >= 500 ? '#22c55e' : score >= 200 ? '#eab308' : '#ef4444';
                const circle = L.circle(f.pos, {
                    radius: 800, fillOpacity: 0.18, stroke: false,
                    fillColor: color, className: 'heatmap-zone'
                }).addTo(map);
                heatLayerRef.current.push(circle);
            });
        }

        // ── ACTIVITY MARKERS ──
        if (activityVisible) {
            activityMarkers.forEach(am => {
                const icon = L.divIcon({
                    className: '',
                    html: `<div class="activity-pin"><span class="ap-icon">✓</span></div>`,
                    iconSize: [28, 28], iconAnchor: [14, 14]
                });
                const m = L.marker(am.pos, { icon }).bindPopup(`
                    <div style="font-family:sans-serif;padding:8px;min-width:150px">
                        <b>${am.title}</b><br/>
                        <small>${am.farmer_name} · ${am.farm_name}</small>
                    </div>
                `).addTo(map);
                activityLayerRef.current.push(m);
            });
        }

        // ── FARMER MARKERS ──
        const filtered = nearbyFarmers.filter(f => {
            const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (f.farm_name || '').toLowerCase().includes(searchQuery.toLowerCase());
            const matchView = viewMode === 'all' ||
                (viewMode === 'sellers' && f.isSeller) ||
                (viewMode === 'online' && f.status === 'online');
            return matchSearch && matchView;
        });

        filtered.forEach(farmer => {
            const statusColor = farmer.status === 'online' ? '#22c55e' : farmer.status === 'recent' ? '#eab308' : '#6b7280';
            const initial = (farmer.name || 'F')[0].toUpperCase();
            const icon = L.divIcon({
                className: '',
                html: `
                    <div class="snap-marker ${farmer.status} ${selectedUser?.id === farmer.id ? 'selected' : ''}" title="${farmer.name}">
                        <div class="sm-avatar">
                            ${farmer.avatar
                                ? `<img src="${farmer.avatar}" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'" />`
                                : ''}
                            <div class="sm-initial" style="display:${farmer.avatar ? 'none' : 'flex'}">${initial}</div>
                        </div>
                        <div class="sm-status-dot" style="background:${statusColor}"></div>
                        <div class="sm-label">
                            <span class="sm-type">${farmer.isSeller ? 'SELLER' : 'FARMER'}</span>
                            <span class="sm-name">${farmer.name.split(' ')[0]}</span>
                        </div>
                        <div class="sm-tail"></div>
                    </div>
                `,
                iconSize: [80, 65], iconAnchor: [40, 65]
            });
            const marker = L.marker(farmer.pos, { icon }).on('click', () => {
                handleSelectUser(farmer);
            }).addTo(map);
            markersRef.current.push(marker);
        });

        // ── MY LOCATION ──
        if (!ghostMode && myPos) {
            const myIcon = L.divIcon({
                className: '',
                html: `
                    <div class="my-loc-marker">
                        <div class="my-pulse"></div>
                        <div class="my-dot"><Crosshair /></div>
                    </div>
                `,
                iconSize: [40, 40], iconAnchor: [20, 20]
            });
            markersRef.current.push(L.marker(myPos, { icon: myIcon }).addTo(map));
        }
    };

    const handleSelectUser = async (farmer) => {
        setSelectedUser(farmer);
        setFollowStatus('none');
        if (mapInstance.current) {
            mapInstance.current.setView(farmer.pos, 15, { animate: true });
        }
        try {
            const targetId = farmer.farmer_id || farmer.id;
            const statusRes = await apiService.getFollowStatus(targetId);
            setFollowStatus(statusRes.status);
            
            // Also fetch full profile details to accurately show counts/is_private
            const fullProfile = await apiService.getAnyProfile(targetId);
            setSelectedUser(prev => ({ ...prev, ...fullProfile }));
        } catch (e) {
            console.error("Failed to fetch user follow status:", e);
        }
    };

    const handleFollowAction = async () => {
        if (!selectedUser) return;
        const targetId = selectedUser.farmer_id || selectedUser.id;
        try {
            if (followStatus === 'following' || followStatus === 'requested') {
                await apiService.unfollowUser(targetId);
                setFollowStatus('none');
            } else {
                const res = await apiService.followUser(targetId);
                setFollowStatus(res.status);
            }
        } catch (e) {
            console.error("Follow action failed:", e);
        }
    };

    const startDirections = (farmer) => {
        const L = window.L;
        const map = mapInstance.current;
        if (!L || !map || !myPos) return alert('GPS location required for directions.');
        if (routingControlRef.current) { map.removeControl(routingControlRef.current); routingControlRef.current = null; }
        if (!L.Routing) return alert('Routing engine not loaded yet.');

        const ctrl = L.Routing.control({
            waypoints: [L.latLng(myPos), L.latLng(farmer.pos)],
            routeWhileDragging: false,
            showAlternatives: true,
            lineOptions: { styles: [{ color: '#22c55e', weight: 5, opacity: 0.8 }] },
            createMarker: () => null,
            collapseBtnClass: 'lrm-collapse-btn',
        }).addTo(map);
        routingControlRef.current = ctrl;
        setActiveDirection(farmer);
        setSelectedUser(null);
        map.fitBounds([myPos, farmer.pos], { padding: [60, 60] });
    };

    const clearDirections = () => {
        const map = mapInstance.current;
        if (routingControlRef.current && map) { map.removeControl(routingControlRef.current); routingControlRef.current = null; }
        setActiveDirection(null);
    };

    const recenter = () => {
        if (!mapInstance.current) return;
        const center = myPos || [10.6629, 77.0065];
        mapInstance.current.setView(center, 14, { animate: true });
    };

    const handlePrivacyChange = async (mode) => {
        setPrivacyMode(mode);
        setGhostMode(mode === 'ghost');
        try { await apiService.setPrivacyMode(mode); } catch (_) { }
        setShowPrivacyPanel(false);
    };

    // ── FILTER FARMERS ────────────────────────────────────────
    const displayedFarmers = nearbyFarmers.filter(f => {
        const matchSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (f.farm_name || '').toLowerCase().includes(searchQuery.toLowerCase());
        const matchView = viewMode === 'all' ||
            (viewMode === 'sellers' && f.isSeller) ||
            (viewMode === 'online' && f.status === 'online');
        return matchSearch && matchView;
    });

    const onlineCount = nearbyFarmers.filter(f => f.status === 'online').length;
    const sellerCount = nearbyFarmers.filter(f => f.isSeller).length;

    if (loading) return (
        <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', background: '#0d1117', flexDirection: 'column', gap: 20 }}>
            <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ repeat: Infinity, duration: 1.5 }}>
                <MapPin size={48} color="#22c55e" />
            </motion.div>
            <p style={{ color: '#888', fontFamily: 'sans-serif' }}>Loading Live Farm Network...</p>
        </div>
    );

    return (
        <div className="field-map-layout">

            {/* ─── LEFT SIDEBAR ─────────────────────────────── */}
            <div className="map-left-discover">
                <div className="discover-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Radio size={16} color="#22c55e" />
                        <h3>Live Network</h3>
                    </div>
                    <div className="network-badge" style={{ background: networkStatus === 'live' ? '#dcfce7' : '#fee2e2', color: networkStatus === 'live' ? '#166534' : '#991b1b', fontSize: '0.7rem', fontWeight: 800, padding: '3px 8px', borderRadius: 999 }}>
                        {networkStatus === 'live' ? 'LIVE' : 'OFFLINE'}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="discover-stats-row">
                    <div className="dsr-item"><strong>{nearbyFarmers.length}</strong><span>Farmers</span></div>
                    <div className="dsr-item"><strong style={{ color: '#22c55e' }}>{onlineCount}</strong><span>Online</span></div>
                    <div className="dsr-item"><strong style={{ color: '#f59e0b' }}>{sellerCount}</strong><span>Sellers</span></div>
                </div>

                {/* View Filter */}
                <div className="discover-view-tabs">
                    {['all', 'online', 'sellers'].map(v => (
                        <button key={v} className={`dvt-btn ${viewMode === v ? 'active' : ''}`} onClick={() => setViewMode(v)}>
                            {v === 'all' ? 'All' : v === 'online' ? 'Active' : 'Sellers'}
                        </button>
                    ))}
                </div>

                {/* Farmer Cards */}
                <div className="discover-scroll">
                    {displayedFarmers.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#888', fontSize: '0.85rem' }}>
                            <Users size={32} color="#d1d5db" style={{ marginBottom: 12 }} />
                            <p>No farmers found nearby</p>
                        </div>
                    ) : displayedFarmers.map(f => (
                        <div key={f.id}
                            className={`discover-card ${selectedUser?.id === f.id ? 'active' : ''}`}
                            onClick={() => handleSelectUser(f)}
                        >
                            <div className="d-avatar-wrap">
                                {f.avatar
                                    ? <img src={f.avatar} onError={e => { e.target.style.display = 'none'; }} />
                                    : <div className="d-avatar-initial">{f.name[0]}</div>}
                                <div className={`d-status ${f.status}`} />
                            </div>
                            <div className="d-info">
                                <strong>{f.name}</strong>
                                <span>{f.activity}</span>
                                <div className="d-meta">
                                    <MapPin size={10} />
                                    <span>{f.farm_name}</span>
                                    {f.isSeller && <span className="seller-tag">SELLER</span>}
                                </div>
                            </div>
                            <div className="d-score">
                                <Zap size={12} color="#f59e0b" />
                                <span>{f.score}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Community Goal */}
                <div className="map-footer-discovery">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                        <Target size={18} color="#d4af37" />
                        <span style={{ fontWeight: 800, fontSize: '0.85rem' }}>Community Impact Goal</span>
                    </div>
                    <div className="goal-bar"><div className="goal-fill" style={{ width: `${Math.min(100, (nearbyFarmers.length / 10) * 100)}%` }} /></div>
                    <small style={{ color: '#888', fontSize: '0.75rem' }}>{nearbyFarmers.length}/10 farmers mapped</small>
                </div>
            </div>

            {/* ─── MAIN MAP ─────────────────────────────────── */}
            <div className="map-canvas-container">
                <div ref={mapRef} className="leaflet-map-target" />

                {/* TOP BAR */}
                <div className="map-interface-top">
                    <div className="map-search-pill">
                        <Search size={16} color="#888" />
                        <input type="text" placeholder="Search farmers, farms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                        <div className="search-stats">
                            <Activity size={11} color="#4ade80" />
                            <span>{displayedFarmers.length} visible</span>
                        </div>
                    </div>
                </div>

                {/* DIRECTION BANNER */}
                {activeDirection && (
                    <motion.div className="direction-banner" initial={{ y: -60 }} animate={{ y: 0 }}>
                        <Navigation size={16} color="#22c55e" />
                        <span>Navigating to <strong>{activeDirection.farm_name}</strong></span>
                        <button onClick={clearDirections}><X size={16} /></button>
                    </motion.div>
                )}

                {/* RIGHT TOOLBAR */}
                <div className="map-toolbar-right">
                    <button className={`toolbar-btn ${heatmapVisible ? 'active' : ''}`} onClick={() => setHeatmapVisible(!heatmapVisible)}>
                        <BarChart2 size={18} /><span>Heatmap</span>
                    </button>
                    <button className={`toolbar-btn ${activityVisible ? 'active' : ''}`} onClick={() => setActivityVisible(!activityVisible)}>
                        <Activity size={18} /><span>Activity</span>
                    </button>
                    <button className={`toolbar-btn ${ghostMode ? 'ghost' : ''}`} onClick={() => setShowPrivacyPanel(true)}>
                        <Ghost size={18} /><span>{privacyMode === 'ghost' ? 'Ghost' : privacyMode === 'farm_only' ? 'Farm' : 'Live'}</span>
                    </button>
                    <button className="toolbar-btn" onClick={recenter}>
                        <Crosshair size={18} />{locating && <span>Locating...</span>}
                        {!locating && <span>Center</span>}
                    </button>
                </div>

                {/* PRIVACY PANEL */}
                <AnimatePresence>
                    {showPrivacyPanel && (
                        <motion.div className="privacy-panel" initial={{ opacity: 0, x: 80 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 80 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                                <h4 style={{ margin: 0, fontSize: '1rem' }}>Location Privacy</h4>
                                <button onClick={() => setShowPrivacyPanel(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}><X size={18} /></button>
                            </div>
                            {[
                                { mode: 'live', icon: <Wifi size={18} color="#22c55e" />, label: 'Live Location', desc: 'Share real-time GPS position' },
                                { mode: 'farm_only', icon: <MapPin size={18} color="#f59e0b" />, label: 'Farm Location Only', desc: 'Show only your farm pin' },
                                { mode: 'ghost', icon: <Ghost size={18} color="#6b7280" />, label: 'Ghost Mode', desc: 'Hidden from all maps' },
                            ].map(opt => (
                                <div key={opt.mode} className={`privacy-option ${privacyMode === opt.mode ? 'selected' : ''}`} onClick={() => handlePrivacyChange(opt.mode)}>
                                    {opt.icon}
                                    <div>
                                        <strong>{opt.label}</strong>
                                        <p>{opt.desc}</p>
                                    </div>
                                    {privacyMode === opt.mode && <ShieldCheck size={16} color="#22c55e" />}
                                </div>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* AI INSIGHTS OVERLAY */}
                <AnimatePresence>
                    {showAIInsights && (
                        <motion.div className="ai-map-hint" initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9 }}>
                            <div className="ai-hint-header">
                                <Bot size={16} color="#22c55e" />
                                <span>AI Insights</span>
                                <button onClick={() => setShowAIInsights(false)}><X size={14} /></button>
                            </div>
                            <p>We found <strong>{nearbyFarmers.length}</strong> eco-farmers in your zone! Connecting with <strong>{nearbyFarmers[0]?.name || 'neighbors'}</strong> could improve your water efficiency by 12%.</p>
                            <button className="ai-hint-action" onClick={() => navigate('/community')}>Join Local Group</button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* LIVE ACTIVITY TICKER */}
                <div className="map-activity-ticker">
                    <div className="ticker-label">LATEST ACTIVITY</div>
                    <div className="ticker-wrap">
                        {activityMarkers.slice(0, 3).map((am, i) => (
                            <motion.div key={i} className="ticker-item" initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: i * 0.2 }}>
                                <Flame size={12} color="#f59e0b" />
                                <span><strong>{am.farmer_name}</strong> completed <em>{am.title}</em></span>
                            </motion.div>
                        ))}
                    </div>
                </div>

                {/* FARMER PROFILE CARD */}
                <AnimatePresence>
                    {selectedUser && (
                        <motion.div className="map-profile-overlay"
                            initial={{ y: 250, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: 250, opacity: 0 }}
                            transition={{ type: 'spring', damping: 24 }}
                        >
                            <button className="po-close" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                            <div className="po-content">
                                <div className="po-left">
                                    {selectedUser.avatar
                                        ? <img src={selectedUser.avatar} onError={e => e.target.src = avatar1} />
                                        : <div className="po-initial">{selectedUser.name[0]}</div>}
                                    <div className={`po-online-badge ${selectedUser.status}`}>{selectedUser.status === 'online' ? 'Active Now' : selectedUser.last_seen}</div>
                                </div>
                                <div className="po-right">
                                    <div className="po-meta">
                                        <h4>{selectedUser.name}</h4>
                                        <p style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                            <MapPin size={12} />
                                            {selectedUser.farm_name}
                                            {selectedUser.isSeller && <span className="seller-tag">SELLER</span>}
                                        </p>
                                    </div>

                                    <div className="po-stats">
                                        <div className="pos-item"><Zap size={14} color="#f59e0b" /><strong>{selectedUser.score}</strong><span>Score</span></div>
                                        <div className="pos-item"><Leaf size={14} color="#22c55e" /><strong>{selectedUser.farming_practices || 'organic'}</strong><span>Method</span></div>
                                        <div className="pos-item"><Target size={14} color="#3b82f6" /><strong>{selectedUser.farm_size_acres || '?'}</strong><span>Acres</span></div>
                                    </div>

                                    {selectedUser.crop_types?.length > 0 && (
                                        <div className="po-crops">
                                            {selectedUser.crop_types.slice(0, 3).map(c => (
                                                <span key={c} className="crop-tag">{c}</span>
                                            ))}
                                        </div>
                                    )}

                                    <div className="po-actions">
                                        <button className="btn-m-direction" onClick={() => startDirections(selectedUser)}>
                                            <Navigation size={16} /> Directions
                                        </button>
                                        <button className="btn-m-chat" onClick={() => navigate('/messages')}>
                                            <MessageCircle size={16} /> Message
                                        </button>
                                        <button className={`btn-m-follow ${followStatus}`} onClick={handleFollowAction}>
                                            {followStatus === 'following' ? <UserCheck size={16} /> : followStatus === 'requested' ? <Clock size={16} /> : <UserPlus size={16} />}
                                            {followStatus === 'following' ? 'Following' : followStatus === 'requested' ? 'Requested' : 'Follow'}
                                        </button>
                                    </div>
                                    {selectedUser.isSeller && (
                                        <button className="btn-m-shop" onClick={() => navigate('/marketplace')}>
                                            <ShoppingBag size={15} /> View Products
                                        </button>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* SVG gradients */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <radialGradient id="heatmapGradient">
                        <stop offset="0%" stopColor="rgba(34,197,94,0.8)" />
                        <stop offset="100%" stopColor="rgba(34,197,94,0)" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
};
export default FieldMapPage;
