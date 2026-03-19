import React, { useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, X, RefreshCw, Check, MapPin, Clock, User as UserIcon, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const CameraModal = ({ isOpen, onClose, onCapture }) => {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [capturedImage, setCapturedImage] = useState(null);
    const [location, setLocation] = useState(null);
    const [timestamp, setTimestamp] = useState(null);
    const [isCameraReady, setIsCameraReady] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            startCamera();
            fetchLocation();
            setTimestamp(new Date().toLocaleString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            }));
        } else {
            stopCamera();
            setCapturedImage(null);
        }
    }, [isOpen]);

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'environment' }, // Default to back camera
                audio: false
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setIsCameraReady(true);
            }
        } catch (err) {
            console.error("Error accessing camera:", err);
            alert("Could not access camera. Please ensure you have given permission.");
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
            setIsCameraReady(false);
        }
    };

    const fetchLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const { latitude, longitude } = position.coords;
                    // In a real app, you'd reverse geocode here. 
                    // For now, we'll just use coordinates + a placeholder.
                    setLocation({
                        lat: latitude.toFixed(4),
                        lng: longitude.toFixed(4),
                        display: `Village Near ${latitude.toFixed(2)}, ${longitude.toFixed(2)}`
                    });
                },
                (err) => {
                    console.error("Location error:", err);
                    setLocation({ display: "Location Access Denied" });
                }
            );
        }
    };

    const capturePhoto = () => {
        if (!videoRef.current || !canvasRef.current) return;

        const canvas = canvasRef.current;
        const video = videoRef.current;
        const context = canvas.getContext('2d');

        // Set canvas size to video size
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Draw video frame to canvas
        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        // Apply Watermark
        applyWatermark(context, canvas.width, canvas.height);

        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setCapturedImage(dataUrl);
        stopCamera();
    };

    const applyWatermark = (ctx, width, height) => {
        // Gradient overlay for readability
        const gradient = ctx.createLinearGradient(0, height - 120, 0, height);
        gradient.addColorStop(0, 'rgba(0,0,0,0)');
        gradient.addColorStop(1, 'rgba(0,0,0,0.7)');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, height - 120, width, 120);

        ctx.fillStyle = '#ffffff';
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 4;

        // Brand Name
        ctx.font = 'bold 32px Inter, sans-serif';
        ctx.fillText('GOO — Green Organic Origins', 30, height - 70);

        // Details Row
        ctx.font = '600 20px Inter, sans-serif';
        const detailText = `📍 ${location?.display || 'Locating...'}  |  🕒 ${timestamp}  |  🆔 ${user?.name || 'Farmer'}`;
        ctx.fillText(detailText, 30, height - 35);
        
        ctx.shadowBlur = 0;
    };

    const handleAction = () => {
        if (capturedImage && onCapture) {
            onCapture(capturedImage);
            onClose();
        }
    };

    if (!isOpen) return null;

    return (
        <div className="camera-overlay">
            <motion.div 
                className="camera-modal"
                initial={{ opacity: 0, scale: 0.9, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 20 }}
            >
                <div className="camera-header">
                    <div className="c-header-left">
                        <Camera size={20} color="#2d5a27" />
                        <span>Authentic Field Capture</span>
                    </div>
                    <button className="c-close-btn" onClick={onClose}><X size={20} /></button>
                </div>

                <div className="camera-viewport">
                    {!capturedImage ? (
                        <>
                            <video 
                                ref={videoRef} 
                                autoPlay 
                                playsInline 
                                className="camera-video"
                            />
                            {!isCameraReady && (
                                <div className="camera-loading">
                                    <RefreshCw className="spin" size={32} color="#fff" />
                                    <span>Initializing Lens...</span>
                                </div>
                            )}
                            
                            <div className="camera-indicators">
                                <div className="c-indicator">
                                    <MapPin size={12} />
                                    <span>{location?.display || 'Locating...'}</span>
                                </div>
                                <div className="c-indicator">
                                    <Clock size={12} />
                                    <span>{timestamp}</span>
                                </div>
                                <div className="c-indicator">
                                    <UserIcon size={12} />
                                    <span>{user?.name || 'Farmer'}</span>
                                </div>
                            </div>
                        </>
                    ) : (
                        <img src={capturedImage} alt="captured" className="camera-preview" />
                    )}
                    
                    {/* Hidden canvas for processing */}
                    <canvas ref={canvasRef} style={{ display: 'none' }} />
                </div>

                <div className="camera-controls">
                    {!capturedImage ? (
                        <button 
                            className="shutter-btn" 
                            disabled={!isCameraReady}
                            onClick={capturePhoto}
                        >
                            <div className="shutter-inner" />
                        </button>
                    ) : (
                        <div className="capture-actions">
                            <button className="btn-c-retake" onClick={() => { setCapturedImage(null); startCamera(); }}>
                                <RefreshCw size={18} /> Retake
                            </button>
                            <button className="btn-c-confirm" onClick={handleAction}>
                                <Check size={18} /> Use Authentic Photo
                            </button>
                        </div>
                    )}
                </div>

                <div className="camera-footer">
                    <ShieldCheck size={14} color="#888" />
                    <span>Real-time capture secured by GOO Trusted Protocol</span>
                </div>
            </motion.div>
        </div>
    );
};

export default CameraModal;
