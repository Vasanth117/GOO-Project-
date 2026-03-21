import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Video, X, RotateCcw, MapPin, Loader2, Play, Square } from 'lucide-react';

const CameraCapture = ({ userLocation, onCapture, onClose }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const mediaRecorderRef = useRef(null);
    const recordedChunksRef = useRef([]);
    const streamRef = useRef(null);
    
    const [stream, setStream] = useState(null);
    const [mode, setMode] = useState('PHOTO'); // PHOTO or VIDEO
    const [isRecording, setIsRecording] = useState(false);
    const [facingMode, setFacingMode] = useState('environment');
    const [locationInfo, setLocationInfo] = useState({ city: 'LOCATING...', coords: '0.0, 0.0', timestamp: '' });

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            setLocationInfo(prev => ({
                ...prev,
                timestamp: now.toLocaleString('en-IN', { 
                    day: '2-digit', month: 'short', year: 'numeric', 
                    hour: '2-digit', minute: '2-digit', second: '2-digit',
                    hour12: true 
                }).toUpperCase()
            }));
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (userLocation) {
            setLocationInfo(prev => ({
                ...prev,
                coords: `LAT: ${userLocation.lat.toFixed(6)}° | LONG: ${userLocation.lng.toFixed(6)}°`,
                city: 'FARM ZONE' // In production, use reverse geocoding
            }));
        }
    }, [userLocation]);

    const startCamera = async () => {
        // Cleanup existing tracks if any
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
        }

        try {
            const constraints = {
                video: { 
                    facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: mode === 'VIDEO'
            };
            const newStream = await navigator.mediaDevices.getUserMedia(constraints);
            setStream(newStream);
            streamRef.current = newStream;
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error("Camera access error:", err);
            alert("Unable to access camera. Please check permissions.");
        }
    };

    useEffect(() => {
        startCamera();
        return () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
        };
    }, [facingMode, mode]);

    const takePhoto = () => {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        if (!video || !canvas) return;

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const context = canvas.getContext('2d');
        
        // 1. Draw video frame
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // 2. Draw GPS Overlay (Embedded Tag)
        const boxWidth = canvas.width * 0.45;
        const boxHeight = 160;
        const x = canvas.width / 2 - boxWidth / 2;
        const y = canvas.height - boxHeight - 150;

        // Overlay Box
        context.fillStyle = 'rgba(0, 0, 0, 0.6)';
        context.beginPath();
        if (context.roundRect) context.roundRect(x, y, boxWidth, boxHeight, 30);
        else context.rect(x, y, boxWidth, boxHeight);
        context.fill();

        // Logo/Dot
        context.fillStyle = '#ff3b30';
        context.beginPath();
        context.arc(x + 50, y + 45, 8, 0, Math.PI * 2);
        context.fill();

        // Text Styles
        context.fillStyle = 'white';
        context.textAlign = 'left';
        
        // City Name
        context.font = 'bold 36px sans-serif';
        context.fillText(locationInfo.city, x + 85, y + 55);

        // Lat/Long
        context.font = '24px monospace';
        context.fillStyle = 'rgba(255,255,255,0.8)';
        context.fillText(locationInfo.coords, x + 85, y + 95);

        // Timestamp
        context.font = '22px sans-serif';
        context.fillText(locationInfo.timestamp, x + 85, y + 130);
        
        // Brand Tag
        context.fillStyle = '#4ade80';
        context.font = 'bold 22px sans-serif';
        context.fillText('● GPS MAP CAMERA', x + boxWidth - 250, y + 130);

        // Convert to blob
        canvas.toBlob((blob) => {
            if (blob) {
                const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file, 'image');
                onClose();
            }
        }, 'image/jpeg', 0.95);
    };

    const startRecording = () => {
        if (!stream) return;
        recordedChunksRef.current = [];
        
        // Find supported mime type
        const mimeTypes = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm', 'video/mp4'];
        const supportedType = mimeTypes.find(t => MediaRecorder.isTypeSupported(t)) || '';

        const mediaRecorder = new MediaRecorder(stream, { mimeType: supportedType });
        
        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) {
                recordedChunksRef.current.push(e.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunksRef.current, { type: 'video/mp4' });
            const file = new File([blob], `video_${Date.now()}.mp4`, { type: 'video/mp4' });
            onCapture(file, 'video');
            onClose();
        };
        
        mediaRecorder.start();
        mediaRecorderRef.current = mediaRecorder;
        setIsRecording(true);
    };

    const stopRecording = () => {
        if (!mediaRecorderRef.current) return;
        mediaRecorderRef.current.stop();
        setIsRecording(false);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
    };

    return (
        <motion.div 
            className="camera-overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'black', zIndex: 10000, display: 'flex', flexDirection: 'column' }}
        >
            {/* Header */}
            <div style={{ padding: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', zIndex: 10 }}>
                <button 
                    onClick={onClose}
                    style={{ background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '50%', width: 50, height: 50, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                    <X size={24} />
                </button>
                
                <div style={{ display: 'flex', background: 'rgba(255,255,255,0.1)', borderRadius: 30, padding: 4 }}>
                    <button 
                        onClick={() => setMode('PHOTO')}
                        style={{ padding: '8px 20px', borderRadius: 25, border: 'none', background: mode === 'PHOTO' ? '#4ade80' : 'transparent', color: mode === 'PHOTO' ? 'black' : 'white', fontWeight: 900, fontSize: '0.8rem' }}
                    >PHOTO</button>
                    <button 
                        onClick={() => setMode('VIDEO')}
                        style={{ padding: '8px 20px', borderRadius: 25, border: 'none', background: mode === 'VIDEO' ? '#ee4266' : 'transparent', color: mode === 'VIDEO' ? 'white' : 'white', fontWeight: 900, fontSize: '0.8rem' }}
                    >VIDEO</button>
                </div>

                <div style={{ width: 50 }} /> {/* Spacer */}
            </div>

            {/* Viewfinder */}
            <div style={{ flex: 1, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <video 
                    ref={videoRef}
                    autoPlay playsInline muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                
                {/* Grid Overlay */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: '0.5px solid rgba(255,255,255,0.2)', pointerEvents: 'none', display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gridTemplateRows: '1fr 1fr 1fr' }}>
                    {[...Array(9)].map((_, i) => <div key={i} style={{ border: '0.5px solid rgba(255,255,255,0.1)' }} />)}
                </div>

                {/* Focus Indicator */}
                <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 80, height: 80, border: '1px solid rgba(255,255,255,0.5)', borderRadius: '50%', pointerEvents: 'none' }}>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 4, height: 4, background: '#4ade80', borderRadius: '50%' }} />
                </div>

                {/* Info Overlay (Visual) */}
                <div style={{ position: 'absolute', bottom: 150, left: '50%', transform: 'translateX(-50%)', width: '90%', maxWidth: 400, background: 'rgba(0,0,0,0.6)', padding: 15, borderRadius: 20, backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.1)', color: 'white' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <div style={{ width: 10, height: 10, background: '#ff3b30', borderRadius: '50%' }} />
                        <span style={{ fontWeight: 900, fontSize: '1.2rem' }}>{locationInfo.city}</span>
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#aaa', fontWeight: 700, fontFamily: 'monospace' }}>{locationInfo.coords}</div>
                    <div style={{ fontSize: '0.7rem', color: '#888', marginTop: 4 }}>{locationInfo.timestamp}</div>
                    <div style={{ fontSize: '0.65rem', color: '#4ade80', fontWeight: 900, marginTop: 8 }}>● GPS MAP CAMERA - ORGANIC INTEGRITY</div>
                </div>
            </div>

            {/* Controls */}
            <div style={{ height: 200, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', alignItems: 'center', padding: '0 40px', background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(20px)' }}>
                <button 
                    onClick={toggleCamera}
                    style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '50%', width: 60, height: 60, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', justifySelf: 'start' }}
                >
                    <RotateCcw size={24} />
                </button>

                <div style={{ justifySelf: 'center' }}>
                    {mode === 'PHOTO' ? (
                        <button 
                            onClick={takePhoto}
                            style={{ width: 85, height: 85, borderRadius: '50%', border: '6px solid white', background: 'transparent', padding: 5 }}
                        >
                            <div style={{ width: '100%', height: '100%', background: 'white', borderRadius: '50%' }} />
                        </button>
                    ) : (
                        <button 
                            onClick={isRecording ? stopRecording : startRecording}
                            style={{ width: 85, height: 85, borderRadius: '50%', border: '6px solid white', background: 'transparent', padding: 5, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        >
                            {isRecording ? (
                                <div style={{ width: 30, height: 30, background: '#ee4266', borderRadius: 4 }} />
                            ) : (
                                <div style={{ width: '100%', height: '100%', background: '#ee4266', borderRadius: '50%' }} />
                            )}
                        </button>
                    )}
                </div>

                <div style={{ justifySelf: 'end', display: 'flex', flexDirection: 'column', alignItems: 'center', color: '#666' }}>
                    <MapPin size={24} />
                    <span style={{ fontSize: '0.6rem', fontWeight: 900, marginTop: 4 }}>GPS ACTIVE</span>
                </div>
            </div>

            <canvas ref={canvasRef} style={{ display: 'none' }} />
        </motion.div>
    );
};

export default CameraCapture;
