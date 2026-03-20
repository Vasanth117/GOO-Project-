/* global L */
import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Search, Filter, Ghost, Activity, Eye, Info, Crosshair, 
    TrendingUp, MessageCircle, UserPlus, ShoppingBag, MapPin, 
    Star, Users, ChevronRight, Zap, Target, Layers
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiService } from '../services/apiService';
import avatar1 from '../assets/images/9.jpg';

const CENTER = [10.6629, 77.0065]; 

const HEATMAP_POINTS = [
    { pos: [10.6720, 77.0160], intensity: 0.8 },
    { pos: [10.6420, 77.0060], intensity: 0.9 },
    { pos: [10.6820, 77.0360], intensity: 0.75 },
];

const FieldMapPage = () => {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef([]);
    const heatLayerRef = useRef([]);
    const navigate = useNavigate();
    const { user } = useAuth();

    const [nearbyFarmers, setNearbyFarmers] = useState([]);
    const [selectedUser, setSelectedUser] = useState(null);
    const [ghostMode, setGhostMode] = useState(false);
    const [heatmapVisible, setHeatmapVisible] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchFarmers = async () => {
        try {
            const data = await apiService.getNearbyFarmers(10.6629, 77.0065);
            setNearbyFarmers(data || []);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFarmers();
    }, []);

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

        return () => {
            clearInterval(initPolling);
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    const initMap = () => {
        if (!mapRef.current || mapInstance.current) return;
        const L = window.L;
        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false }).setView(CENTER, 13);
        mapInstance.current = map;
        
        // Using OpenStreetMap Standard Tiles for better visibility/contrast as requested
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
        }).addTo(map);

        renderLayers();
    };

    useEffect(() => {
        if (mapInstance.current) renderLayers();
    }, [ghostMode, heatmapVisible, searchQuery, selectedUser, nearbyFarmers]);

    const renderLayers = () => {
        const L = window.L;
        const map = mapInstance.current;
        if (!L || !map) return;

        markersRef.current.forEach(m => map.removeLayer(m));
        heatLayerRef.current.forEach(h => map.removeLayer(h));
        markersRef.current = [];
        heatLayerRef.current = [];

        if (heatmapVisible) {
            HEATMAP_POINTS.forEach(pt => {
                const circle = L.circle(pt.pos, { radius: 450, fillOpacity: 0.6, stroke: false, className: 'heatmap-spot-pulse' }).addTo(map);
                heatLayerRef.current.push(circle);
            });
        }

        nearbyFarmers.filter(f => f.name.toLowerCase().includes(searchQuery.toLowerCase())).forEach(farmer => {
            const icon = L.divIcon({
                className: 'custom-map-marker',
                html: `
                    <div class="elite-marker-wrap ${farmer.status}">
                        <div class="marker-avatar"><img src="${avatar1}" /></div>
                        <div class="marker-label">
                            <span class="label-heading">${farmer.isSeller ? 'STORE' : 'FARMER'}</span>
                            <span class="label-name">${farmer.name.split(' ')[0]} ${farmer.name.split(' ')[1].charAt(0)}.</span>
                        </div>
                    </div>
                `,
                iconSize: [120, 50], iconAnchor: [60, 45] // Center the marker stem
            });
            const marker = L.marker(farmer.pos, { icon }).on('click', () => setSelectedUser(farmer)).addTo(map);
            markersRef.current.push(marker);
        });

        if (!ghostMode) {
            const myIcon = L.divIcon({ className: 'current-loc', html: `<div class="me-pulse"></div><div class="me-dot"></div>`, iconSize: [30, 30], iconAnchor: [15, 15] });
            markersRef.current.push(L.marker(CENTER, { icon: myIcon }).addTo(map));
        }
    };

    const recenter = () => { if (mapInstance.current) mapInstance.current.setView(CENTER, 14); };

    return (
        <div className="field-map-layout">
            {/* 1. SIDEBAR (LEFT) */}
            <div className="map-left-discover">
                <div className="discover-header">
                    <h3>Explore Neighbors</h3>
                    <p>Real-time community activity</p>
                </div>
                <div className="discover-scroll">
                    {nearbyFarmers.map(f => (
                        <div key={f.id} className={`discover-card ${selectedUser?.id === f.id ? 'active' : ''}`} onClick={() => { setSelectedUser(f); mapInstance.current.setView(f.pos, 15); }}>
                            <div className="d-avatar-wrap">
                                <img src={avatar1} />
                                <div className={`d-status ${f.status}`} />
                            </div>
                            <div className="d-info">
                                <strong>{f.name}</strong>
                                <span>{f.activity}</span>
                            </div>
                        </div>
                    ))}
                </div>
                <div className="map-footer-discovery">
                    <Target size={24} color="#d4af37" />
                    <p>Community Impact Goal</p>
                    <div className="goal-bar"><div className="goal-fill" style={{ width: '65%' }} /></div>
                </div>
            </div>

            {/* 2. MAIN MAP CONTAINER */}
            <div className="map-canvas-container" style={{ flex: 1, position: 'relative' }}>
                <div ref={mapRef} className="leaflet-map-target" />
                
                {/* FLOATING OVERLAYS (STAY INSIDE MAP AREA) */}
                <div className="map-interface-top">
                    <div className="map-search-pill">
                        <Search size={18} color="#888" />
                        <input type="text" placeholder="Search neighbors..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
                        <div className="search-stats"><Activity size={12} color="#4ade80" /><span>Live Network</span></div>
                    </div>
                </div>

                <div className="map-toolbar-right">
                    <button className={`toolbar-btn ${heatmapVisible ? 'active' : ''}`} onClick={() => setHeatmapVisible(!heatmapVisible)}><TrendingUp size={18} /><span>Heatmap</span></button>
                    <button className={`toolbar-btn ${ghostMode ? 'ghost' : ''}`} onClick={() => setGhostMode(!ghostMode)}><Ghost size={18} /><span>{ghostMode ? 'Ghost' : 'Share'}</span></button>
                    <button className="toolbar-btn" onClick={recenter}><Crosshair size={18} /><span>Center</span></button>
                </div>

                <AnimatePresence>
                    {selectedUser && (
                        <motion.div className="map-profile-overlay" initial={{ y: 200, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 200, opacity: 0 }}>
                            <button className="po-close" onClick={() => setSelectedUser(null)}><X size={20} /></button>
                            <div className="po-content">
                                <div className="po-left"><img src={avatar1} /><div className="po-badges"><div className="m-badge">S-Tier</div></div></div>
                                <div className="po-right">
                                    <div className="po-meta"><h4>{selectedUser.name}</h4><p>{selectedUser.role} • <span>{selectedUser.status === 'online' ? 'Active Now' : 'Recent'}</span></p></div>
                                    <div className="po-stats">
                                        <div className="pos-item"><strong>{selectedUser.score}</strong><span>Impact</span></div>
                                        <div className="pos-item"><strong>1.2k</strong><span>Followers</span></div>
                                    </div>
                                    <div className="po-actions">
                                        <button className="btn-m-chat" onClick={() => navigate('/messages')}><MessageCircle size={18} /> Chat</button>
                                        <button className="btn-m-follow"><UserPlus size={18} /> Follow</button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* ── SVG GRADIENTS ── */}
            <svg style={{ position: 'absolute', width: 0, height: 0 }}>
                <defs>
                    <radialGradient id="heatmapGradient">
                        <stop offset="0%" stopColor="rgba(255, 0, 0, 0.8)" /><stop offset="50%" stopColor="rgba(255, 255, 0, 0.4)" /><stop offset="100%" stopColor="rgba(0, 255, 0, 0)" />
                    </radialGradient>
                </defs>
            </svg>
        </div>
    );
};
export default FieldMapPage;
