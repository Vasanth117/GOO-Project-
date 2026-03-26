import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bot, Mic, Send, Camera, Thermometer, Droplets, 
    Wind, CloudRain, ShieldCheck, Zap, AlertTriangle, 
    ChevronRight, Sparkles, Sprout, Brain, BarChart, 
    Image as ImageIcon, Upload, Info, CheckCircle2,
    Activity, Microscope, Search, Loader2, User
} from 'lucide-react';

// ─────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────
const formatAIResponse = (text) => {
    if (!text) return "";
    // Force conversion to string to prevent ".replace is not a function" errors
    // If it's an object, try to join its values (to handle accidental nested translation objects)
    const str = typeof text === 'string' 
        ? text 
        : (typeof text === 'object' && text !== null 
            ? Object.values(text).filter(v => typeof v === 'string').join('\n\n') 
            
            : JSON.stringify(text));
    
    // Extremely basic markdown-like formatter
    let formatted = str
        .replace(/### (.*?)\n/g, '<h4 class="ai-msg-h3">$1</h4>')
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\n\n/g, '<div class="ai-msg-gap"></div>')
        .replace(/\n/g, '<br/>');
    return formatted;
};

const QUICK_ACTIONS = [
    { label: "Check Soil Health", icon: Sprout },
    { label: "Irrigation Advice", icon: Droplets },
    { label: "Pest Control", icon: ShieldCheck },
    { label: "Crop Suggestion", icon: Brain }
];

import { apiService } from '../services/apiService';
import { useAuth } from '../context/AuthContext';

const AIPage = () => {
    const { user } = useAuth();
    const [messages, setMessages] = useState([]);
    const [onboardingStep, setOnboardingStep] = useState(0); // 0: detecting location, 1: asking farm size, 2: asking soil type, 3: completed
    
    const [input, setInput] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [analysis, setAnalysis] = useState(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [suggestions, setSuggestions] = useState([]);

    const chatEndRef = useRef(null);
    const audioRef = useRef(new Audio());
    const fileInputRef = useRef(null);

    // ── AUTO LOCATION ──
    const [location, setLocation] = useState(null);
    
    useEffect(() => {
        if (user?.farm_profile) {
            setMessages([{ 
                role: 'ai', 
                text: `Welcome back, ${user.name}! I have your farm details from ${user.farm_profile.farm_name}. How can I assist you today?` 
            }]);
            setOnboardingStep(3);
            setSuggestions(["What crops should I plant?", "Current weather advice", "Organic growth tips"]);
            return;
        }

        const detect = async () => {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setLocation(loc);
                    setMessages([{ 
                        role: 'ai', 
                        text: `Namaste ${user?.name || 'Farmer'}! I've detected your location. To give you accurate advice, I need two details: What is your Farm Size (in acres)?` 
                    }]);
                    setOnboardingStep(1);
                },
                (err) => {
                    console.error("Location error", err);
                    setMessages([{ 
                        role: 'ai', 
                        text: `Namaste ${user?.name || 'Farmer'}! I couldn't detect your location automatically. What is your Farm Size (in acres)?` 
                    }]);
                    setOnboardingStep(1);
                }
            );
        };
        detect();
    }, [user?.name]);

    const scrollToBottom = () => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    useEffect(scrollToBottom, [messages]);

    const handleSend = async (e, textOverride = null) => {
        if (e) e.preventDefault();
        const text = textOverride || input;
        if (!text.trim()) return;

        const userMsg = { role: 'user', text };
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsTyping(true);
        setSuggestions([]);

        // 💬 ACTUAL ADVISOR API CALL
        try {
            const data = await apiService.askAdvisor(text, { 
                location,
                user_name: user?.name,
                farm_profile: user?.farm_profile
            });

            const aiMsg = { role: 'ai', text: data.response };
            setMessages(prev => [...prev, aiMsg]);
            setSuggestions(data.suggestions || []);

            if (data.audio_trigger) {
                playVoice(data.response);
            }
        } catch (err) {
            setMessages(prev => [...prev, { role: 'ai', text: "I'm having trouble connecting to my brain. Please try again later." }]);
        } finally {
            setIsTyping(false);
        }
    };

    const playVoice = async (text) => {
        try {
            const blob = await apiService.generateVoice(text);
            const url = URL.createObjectURL(blob);
            audioRef.current.src = url;
            audioRef.current.play();
        } catch (err) {
            console.error("Voice error", err);
        }
    };

    const toggleVoice = () => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            alert("Your browser does not support speech recognition.");
            return;
        }

        const recognition = new SpeechRecognition();
        recognition.lang = 'en-IN'; // Or use user's locale
        recognition.onstart = () => setIsListening(true);
        recognition.onresult = (event) => {
            const transcript = event.results[0][0].transcript;
            setInput(transcript);
            handleSend(null, transcript);
        };
        recognition.onend = () => setIsListening(false);
        recognition.start();
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        // Show a preview of the image in the chat immediately
        const previewUrl = URL.createObjectURL(file);
        setMessages(prev => [...prev, { role: 'user', text: '📷 Scanning this leaf for disease analysis...', image: previewUrl }]);
        setIsAnalyzing(true);
        setAnalysis(null);

        const formData = new FormData();
        formData.append('file', file);
        formData.append('query', 'Analyze this crop leaf for any diseases, provide precautions and safety measures.');

        try {
            const res = await apiService.analyzeCropHealth(formData);
            const data = res.data;
            setAnalysis(data);

            if (!data.is_valid_plant) {
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: `🌿 **Not a Plant Image Detected**\n\n${data.advice}\n\nPlease upload a clear photo of a plant leaf or crop.` 
                }]);
            } else {
                const isHealthy = data.diagnosis?.toLowerCase().includes('healthy');
                const confText = data.confidence ? ` (Confidence: ${data.confidence}%)` : '';
                setMessages(prev => [...prev, { 
                    role: 'ai', 
                    text: `🔬 **Scan Result: ${data.diagnosis}**${confText}\n\n${data.advice}\n\n**Severity:** ${data.severity}\n**Organic Treatment:** ${isHealthy ? 'No treatment needed — your plant is healthy! Keep up the great work.' : 'See the side panel for complete organic treatment steps and safety precautions.'}` 
                }]);
            }
        } catch (err) {
            console.error(err);
            setMessages(prev => [...prev, { role: 'ai', text: 'Sorry, I could not analyze the image. Please try again with a clearer photo.' }]);
        } finally {
            setIsAnalyzing(false);
        }
    };

    return (
        <div className="ai-page-layout">
            <div className="ai-page-inner">
                <div className="chat-container">
                <header className="chat-header">
                    <div className="ai-status">
                        <div className="pulse-circle" />
                        <div>
                            <div className="status-title">GOO AI Advisor</div>
                            <div className="status-sub">{isTyping ? 'Thinking...' : 'Ready to help'}</div>
                        </div>
                    </div>
                    {location && <div className="location-badge">📍 {location.lat.toFixed(2)}, {location.lng.toFixed(2)}</div>}
                </header>

                <div className="chat-messages">
                    <AnimatePresence mode='popLayout'>
                        {messages.map((m, i) => (
                            <motion.div 
                                key={i} 
                                className={`chat-bubble ${m.role}`}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                            >
                                <div className="bubble-avatar">
                                    {m.role === 'ai' ? <Bot size={18} /> : (
                                        user?.profile_picture ? (
                                            <img 
                                                src={user.profile_picture.startsWith('http') ? user.profile_picture : `http://localhost:8000${user.profile_picture}`} 
                                                alt="" 
                                                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} 
                                            />
                                        ) : <User size={18} />
                                    )}
                                </div>
                                <div className="bubble-body">
                                    <div dangerouslySetInnerHTML={{ __html: formatAIResponse(m.text) }}></div>
                                    {m.image && <img src={m.image} alt="upload" className="msg-img-preview" />}
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {isTyping && (
                        <div className="chat-bubble ai typing">
                            <span className="dot" /><span className="dot" /><span className="dot" />
                        </div>
                    )}
                    <div ref={chatEndRef} />
                </div>

                <div className="chat-input-area">
                    {suggestions.length > 0 && (
                        <div className="quick-action-row">
                            {suggestions.map((s, i) => {
                                const label = typeof s === 'string' ? s : (s.label || s.crop || s.text || "View Detail");
                                const sendVal = typeof s === 'string' ? s : label;
                                return (
                                    <button key={i} className="action-pill" onClick={() => handleSend(null, sendVal)}>
                                        <Sparkles size={12} /> {label}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    <form className="input-form" onSubmit={handleSend}>
                        <button type="button" className={`mic-btn ${isListening ? 'active' : ''}`} onClick={toggleVoice}>
                            <Mic size={20} />
                        </button>
                        
                        <input 
                            type="text" 
                            placeholder="Ask about crops, weather, or soil..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                        />

                        <button type="submit" className="send-btn" disabled={!input.trim()}>
                            <Send size={20} />
                        </button>
                    </form>
                </div>
            </div>

            <aside className="ai-stats-panel">
                {/* Crop Health Scan */}
                <div className="ai-widget-card">
                    <div className="widget-header">
                        <div className="icon-wrap gold"><Camera size={18} /></div>
                        <div>
                            <div className="widget-title">Crop Health Scan</div>
                            <div style={{ fontSize: '0.72rem', color: '#aaa', fontWeight: 700 }}>Powered by YOLOv8 AI</div>
                        </div>
                    </div>

                    <div className="upload-zone" onClick={() => fileInputRef.current.click()} style={{ position: 'relative' }}>
                        {isAnalyzing 
                            ? <><Loader2 size={32} color="#2d5a27" style={{ animation: 'spin 1s linear infinite' }} /><div className="upload-text" style={{ color: '#2d5a27' }}>Analyzing with YOLOv8...</div></>
                            : <><Upload size={32} color="#aaa" /><div className="upload-text">Upload a plant photo to detect disease</div><div style={{ fontSize: '0.68rem', color: '#ccc', marginTop: '6px' }}>Only plant/leaf images accepted</div></>}
                        <input type="file" ref={fileInputRef} onChange={handleImageUpload} hidden accept="image/*" />
                    </div>

                    {/* ── Analysis Result ── */}
                    {analysis && (
                        <motion.div className="analysis-box" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                            {/* Invalid plant warning */}
                            {!analysis.is_valid_plant ? (
                                <div style={{ background: '#fff7ed', border: '1.5px solid #f97316', borderRadius: '12px', padding: '14px', marginBottom: '12px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f97316', fontWeight: 900, fontSize: '0.9rem', marginBottom: '6px' }}>
                                        <AlertTriangle size={16} /> Not a Plant Image
                                    </div>
                                    <p style={{ fontSize: '0.8rem', color: '#7c3d00', fontWeight: 700 }}>{analysis.advice}</p>
                                </div>
                            ) : (
                                <>
                                    {/* Diagnosis Header */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                                        <div className="diagnosis-line">
                                            <Activity size={14} color={analysis.severity === 'High' ? '#e63946' : analysis.severity === 'Medium' ? '#f97316' : '#22c55e'} />
                                            <strong style={{ fontSize: '0.9rem' }}>{analysis.diagnosis}</strong>
                                        </div>
                                        <span style={{
                                            fontSize: '0.7rem', fontWeight: 900, padding: '3px 10px', borderRadius: '100px',
                                            background: analysis.severity === 'High' ? '#fef2f2' : analysis.severity === 'Medium' ? '#fff7ed' : '#f0fdf4',
                                            color: analysis.severity === 'High' ? '#e63946' : analysis.severity === 'Medium' ? '#f97316' : '#22c55e',
                                        }}>{analysis.severity}</span>
                                    </div>

                                    {/* Confidence Bar */}
                                    {analysis.confidence > 0 && (
                                        <div style={{ marginBottom: '12px' }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', fontWeight: 800, color: '#888', marginBottom: '4px' }}>
                                                <span>AI Confidence</span><span>{analysis.confidence}%</span>
                                            </div>
                                            <div style={{ height: '6px', background: '#eee', borderRadius: '100px', overflow: 'hidden' }}>
                                                <motion.div 
                                                    style={{ height: '100%', background: 'linear-gradient(90deg, #2d5a27, #4ade80)', borderRadius: '100px' }}
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${analysis.confidence}%` }}
                                                    transition={{ duration: 1, ease: 'easeOut' }}
                                                />
                                            </div>
                                        </div>
                                    )}

                                    {/* Advice */}
                                    <p style={{ fontSize: '0.8rem', color: '#4a4d48', fontWeight: 700, lineHeight: 1.6, marginBottom: '12px' }}>{analysis.advice}</p>

                                    {/* Precautions */}
                                    {analysis.precautions?.length > 0 && (
                                        <div className="advice-section" style={{ marginBottom: '10px' }}>
                                            <p><strong>🌿 Organic Treatment:</strong></p>
                                            <ul>{analysis.precautions.map((p, i) => <li key={i}>{p}</li>)}</ul>
                                        </div>
                                    )}

                                    {/* Safety */}
                                    {analysis.safety_measures?.length > 0 && (
                                        <div className="advice-section highlight">
                                            <p><strong>⚠️ Farmer Safety:</strong></p>
                                            <ul>{analysis.safety_measures.map((s, i) => <li key={i}>{s}</li>)}</ul>
                                        </div>
                                    )}
                                </>
                            )}
                        </motion.div>
                    )}
                </div>

                <div className="ai-widget-card alert-card">
                    <div className="widget-header">
                        <div className="icon-wrap red"><AlertTriangle size={18} /></div>
                        <div className="widget-title" style={{ color: '#e63946' }}>Real-time Precautions</div>
                    </div>
                    <div className="ai-alert-item">
                        <div className="alert-dot" />
                        Maintain 2m distance from chemical treated zones.
                    </div>
                </div>

                <div className="ai-widget-card">
                    <div className="widget-header">
                        <div className="icon-wrap blue"><CloudRain size={18} /></div>
                        <div className="widget-title">Weather Intelligence</div>
                    </div>
                    <p className="tiny-text">Ask the AI "What is the weather?" for detailed analytics.</p>
                </div>
            </aside>
            </div>
        </div>
    );
};


export default AIPage;
