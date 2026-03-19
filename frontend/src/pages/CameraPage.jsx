import React, { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Camera, Video, MapPin, Clock, ShieldCheck, 
    Settings, Image as ImageIcon, RotateCcw, Check,
    Maximize, Zap, Layers, Timer, Menu, Grid, Trash2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CameraPage = () => {
    const navigate = useNavigate();
    const { user } = useAuth();
    
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const streamRef = useRef(null); // Specialized Ref to manage hardware stream
    
    const [mode, setMode] = useState('photo'); // 'photo' or 'video'
    const [isRecording, setIsRecording] = useState(false);
    const [capturedMedia, setCapturedMedia] = useState(null); // { type, url }
    const [location, setLocation] = useState({ 
        lat: '10.6629', lng: '77.0065', 
        address: 'Pollachi, Tamil Nadu, India',
        city: 'Pollachi', region: 'Tamil Nadu'
    });
    const [timestamp, setTimestamp] = useState('');
    const [recordedChunks, setRecordedChunks] = useState([]);

    const [showGrid, setShowGrid] = useState(true);
    const [flashOn, setFlashOn] = useState(false);
    const [timer, setTimer] = useState(0); // 0, 3, 10

    useEffect(() => {
        startCamera();
        fetchLocation();
        const timeInt = setInterval(updateTime, 1000);
        return () => {
            // CRITICAL: Cleanup MUST stop hardware stream
            stopCamera();
            clearInterval(timeInt);
        };
    }, []);

    const updateTime = () => {
        const now = new Date();
        setTimestamp(now.toLocaleString('en-IN', {
            day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true
        }));
    };

    const startCamera = async () => {
        try {
            // Stop any existing stream before starting a new one
            stopCamera();
            
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment', width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: true
            });
            
            streamRef.current = mediaStream; // Keep track in ref for cleanup
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.play();
            }
        } catch (err) {
            console.error("Camera Error:", err);
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();   // Explicitly kill hardware light
                track.enabled = false;
            });
            streamRef.current = null;
        }
    };

    const fetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((pos) => {
                const { latitude, longitude } = pos.coords;
                setLocation(prev => ({
                    ...prev,
                    lat: latitude.toFixed(6),
                    lng: longitude.toFixed(6),
                }));
            });
        }
    };

    const capturePhoto = () => {
        if (timer > 0) {
            setTimeout(executeCapture, timer * 1000);
        } else {
            executeCapture();
        }
    };

    const executeCapture = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!video || !canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        applyLuxeWatermark(ctx, canvas.width, canvas.height);
        
        const url = canvas.toDataURL('image/jpeg', 0.9);
        setCapturedMedia({ type: 'photo', url });
        stopCamera(); // Turn off camera immediately after capture
    };

    const startRecording = () => {
        if (!streamRef.current) return;
        setIsRecording(true);
        setRecordedChunks([]);
        const recorder = new MediaRecorder(streamRef.current, { mimeType: 'video/webm' });
        
        recorder.ondataavailable = (e) => {
            if (e.data.size > 0) setRecordedChunks(prev => [...prev, e.data]);
        };
        
        recorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            setCapturedMedia({ type: 'video', url });
        };
        
        mediaRecorderRef.current = recorder;
        recorder.start();
    };

    const stopRecording = () => {
        setIsRecording(false);
        if (mediaRecorderRef.current) mediaRecorderRef.current.stop();
        stopCamera(); // Turn off camera after video stop
    };

    const applyLuxeWatermark = (ctx, w, h) => {
        const boxW = 380; const boxH = 180; const margin = 40;
        ctx.fillStyle = 'rgba(0,0,0,0.85)';
        ctx.beginPath();
        ctx.roundRect(w - boxW - margin, h - boxH - margin, boxW, boxH, 12);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 28px Inter, sans-serif';
        ctx.fillText(location.address, w - boxW - margin + 25, h - boxH - margin + 45);
        
        ctx.font = '500 20px Inter, sans-serif';
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        ctx.fillText(`ID: ${user?.name || 'Farmer'}`, w - boxW - margin + 25, h - boxH - margin + 85);
        ctx.fillText(`Lat: ${location.lat}°`, w - boxW - margin + 25, h - boxH - margin + 115);
        ctx.fillText(`Long: ${location.lng}°`, w - boxW - margin + 25, h - boxH - margin + 145);
        ctx.fillText(`${timestamp}`, w - boxW - margin + boxW - 250, h - boxH - margin + 145);

        const mapSize = 180;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.roundRect(margin, h - mapSize - margin, mapSize, mapSize, 12);
        ctx.fill();
        
        ctx.strokeStyle = '#eee'; ctx.lineWidth = 1;
        for(let i=0; i<mapSize; i+=30){
            ctx.beginPath(); ctx.moveTo(margin+i, h-mapSize-margin); ctx.lineTo(margin+i, h-margin); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(margin, h-mapSize-margin+i); ctx.lineTo(margin+mapSize, h-mapSize-margin+i); ctx.stroke();
        }
        
        ctx.fillStyle = '#ff4444'; ctx.beginPath(); ctx.arc(margin + mapSize/2, h - margin - mapSize/2, 8, 0, Math.PI*2); ctx.fill();
        ctx.font = '900 36px Inter, sans-serif'; ctx.fillStyle = '#ffffff';
        ctx.fillText('GOO', margin, margin + 50);
    };

    return (
        <div className="full-camera-page">
            <canvas ref={canvasRef} style={{ display: 'none' }} />

            <div className="camera-top-nav">
                <div className="ct-left">
                    <button className="ct-btn" onClick={() => navigate('/dashboard')}><Menu size={20} /></button>
                </div>
                <div className="ct-center">
                    <button className="ct-btn" style={{ color: flashOn ? '#facd14' : '#fff' }} onClick={() => setFlashOn(!flashOn)}><Zap size={20} /></button>
                    <button className="ct-btn" onClick={() => setShowGrid(!showGrid)}><Maximize size={20} /></button>
                    <button className="ct-btn" onClick={() => setTimer(timer === 0 ? 3 : (timer === 3 ? 10 : 0))}>
                        <Timer size={20} style={{ color: timer > 0 ? '#4ade80' : '#fff' }} />
                        {timer > 0 && <span style={{ fontSize: 10, position: 'absolute' }}>{timer}s</span>}
                    </button>
                    <button className="ct-btn"><Settings size={20} /></button>
                </div>
                <button className="ct-btn close" onClick={() => { stopCamera(); navigate('/dashboard'); }}><X size={24} /></button>
            </div>

            <div className="camera-viewport-full">
                {!capturedMedia ? (
                    <video ref={videoRef} autoPlay playsInline className="v-stream" muted />
                ) : (
                    capturedMedia.type === 'photo' ? (
                        <img src={capturedMedia.url} alt="captured" className="v-stream" />
                    ) : (
                        <video src={capturedMedia.url} autoPlay loop playsInline className="v-stream" />
                    )
                )}

                {!capturedMedia && (
                    <>
                        <div className="live-location-box">
                            <div className="mini-map-sim"><div className="marker" /></div>
                            <div className="location-details-luxe">
                                <h3>{location.address}</h3>
                                <p>Lat: {location.lat}° | Long: {location.lng}°</p>
                                <p>{timestamp}</p>
                                <div className="gps-label">GPS Map Camera</div>
                            </div>
                        </div>
                        {showGrid && (
                            <div className="camera-grid-lines">
                                <div className="g-line h1" /><div className="g-line h2" />
                                <div className="g-line v1" /><div className="g-line v2" />
                            </div>
                        )}
                    </>
                )}
            </div>

            <div className="camera-bottom-nav">
                {!capturedMedia ? (
                    <>
                        <div className="cb-row-modes">
                            <button className={`mode-btn ${mode === 'photo' ? 'active' : ''}`} onClick={() => setMode('photo')}>PHOTO</button>
                            <button className={`mode-btn ${mode === 'video' ? 'active' : ''}`} onClick={() => setMode('video')}>VIDEO</button>
                        </div>
                        <div className="cb-main-row">
                            <div className="cb-item" onClick={() => alert("Opening Field Collection...")}><ImageIcon size={20} /><span>Collection</span></div>
                            <div className="cb-item" onClick={() => alert("Current Satellites: 8 | High Accuracy")}><MapPin size={20} /><span>Map Data</span></div>
                            
                            <motion.button 
                                className={`shutter-luxe ${isRecording ? 'recording' : ''}`}
                                whileTap={{ scale: 0.9 }}
                                onClick={mode === 'photo' ? capturePhoto : (isRecording ? stopRecording : startRecording)}
                            >
                                <div className="s-inner" />
                            </motion.button>

                            <div className="cb-item" onClick={() => alert("Theme: Classic Eco")}><Layers size={20} /><span>Default</span></div>
                            <div className="cb-item" onClick={() => alert("Loading Report Templates...")}><Grid size={20} /><span>Template</span></div>
                        </div>
                    </>
                ) : (
                    <div className="post-capture-flow">
                        <button className="btn-discard" onClick={() => { setCapturedMedia(null); startCamera(); }}>
                            <Trash2 size={20} /> Discard
                        </button>
                        <button className="btn-save-auth" onClick={() => navigate('/dashboard')}>
                            <Check size={20} /> Post Authenticated {capturedMedia.type}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CameraPage;
