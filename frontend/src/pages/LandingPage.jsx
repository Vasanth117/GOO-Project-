import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { Leaf, Brain, CloudRain, ShieldCheck, TrendingUp, Users, ArrowRight, Zap, Target, Globe, Award, Database, Sprout } from 'lucide-react';

// Assets
import logo from '../assets/images/logo.png';
import bgVideo from '../assets/video/Background.mp4';
import img1 from '../assets/images/1.jpg';
import img2 from '../assets/images/2.jpg';
import img3 from '../assets/images/3.jpg';
import img4 from '../assets/images/4.jpg';
import img5 from '../assets/images/5.jpg';
import img6 from '../assets/images/6.jpg';
import img7 from '../assets/images/7.jpg';
import img8 from '../assets/images/8.jpg';
import img9 from '../assets/images/9.jpg';
import img10 from '../assets/images/10.jpg';
import img11 from '../assets/images/11.jpg';
import img12 from '../assets/images/12.jpg';
import img13 from '../assets/images/13.jpg';
import img14 from '../assets/images/14.jpg';
import img15 from '../assets/images/15.jpg';

const Section = ({ tagline, title, content, image, reversed = false, index }) => (
    <section className={`agri-section ${reversed ? 'reversed' : ''}`}>
        <motion.div 
            className="agri-image-frame"
            initial={{ opacity: 0, x: reversed ? 100 : -100 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", delay: 0.1 }}
            viewport={{ once: true, amount: 0.3 }}
        >
            <img src={image} alt={title} />
        </motion.div>
        
        <motion.div 
            className="agri-text-frame"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.3 }}
            viewport={{ once: true, amount: 0.5 }}
        >
            <span className="tag">{tagline}</span>
            <h2>{title}</h2>
            <p>{content}</p>
        </motion.div>
    </section>
);

const LandingPage = () => {
    const navigate = useNavigate();
    const { scrollYProgress } = useScroll();
    
    // Animation Constants
    const headlineWords = "The AI-driven, gamified sustainable farming platform.".split(" ");
    
    const container = {
        hidden: { opacity: 0 },
        visible: (i = 1) => ({
            opacity: 1,
            transition: { staggerChildren: 0.1, delayChildren: 0.3 * i },
        }),
    };
    
    const child = {
        visible: {
            opacity: 1,
            y: 0,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
        hidden: {
            opacity: 0,
            y: 20,
            transition: {
                type: "spring",
                damping: 12,
                stiffness: 100,
            },
        },
    };

    return (
        <div className="landing-root">
            <motion.div className="scroll-progress-bar" style={{ scaleX: scrollYProgress }} />

            {/* Premium Navigation */}
            <nav className="nav-premium">
                <div className="nav-content">
                    <motion.div className="logo-group" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 1 }}>
                        <img src={logo} alt="GOO" className="logo-img" />
                        <span className="logo-text">goo</span>
                    </motion.div>
                    
                    <div className="nav-links">
                        <a href="#vision">The Vision</a>
                        <a href="#ecosystem">Ecosystem</a>
                        <a href="#impact">Our Impact</a>
                        <a href="#faq">Resources</a>
                        <button className="btn-cta" onClick={() => navigate('/login')}>Login</button>
                    </div>
                </div>
            </nav>

            {/* Cinematic Hero - FIXED HEADLINE & ANIMATIONS */}
            <header className="hero-canvas">
                <div className="hero-text-block">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <span className="hero-badge">Welcome to the GOO</span>
                    </motion.div>
                    
                    <motion.h1
                        variants={container}
                        initial="hidden"
                        animate="visible"
                        style={{ 
                            display: "flex", flexWrap: "wrap", gap: "0.25rem",
                            fontSize: "clamp(2.5rem, 5vw, 4rem)", // Reduced from 5.5rem
                            marginBottom: "1.5rem"                // Reduced from 3rem
                        }}
                    >
                        {headlineWords.map((word, index) => (
                            <motion.span
                                variants={child}
                                key={index}
                                style={{ color: word.includes("AI-driven") ? "#d4af37" : "inherit" }}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </motion.h1>

                    <motion.div 
                        className="cta-row" 
                        style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }} // Tightened
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 1.2 }}
                    >
                        <button className="btn-cta">Explore Network</button>
                        <button className="btn-cta" style={{ background: '#d4af37', border: 'none' }} onClick={() => navigate('/login')}>Login Dashboard</button>
                    </motion.div>
                </div>

                <div className="hero-video-window" style={{ position: 'relative' }}>
                    {/* Floating Decorative Elements */}
                    <div className="float-element" style={{ position: 'absolute', top: -50, right: 20, zIndex: 10, color: '#768953' }}>
                        <Sprout size={48} />
                    </div>
                    <div className="float-element" style={{ position: 'absolute', bottom: 30, left: -60, zIndex: 10, color: '#d4af37', animationDelay: '2s' }}>
                        <TrendingUp size={40} />
                    </div>

                    <video className="bg-video" autoPlay loop muted playsInline>
                        <source src={bgVideo} type="video/mp4" />
                    </video>
                    <div className="hero-overlay-mask" 
                        style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(29, 28, 25, 0.4), transparent)' }} 
                    />
                </div>
            </header>

            {/* Statistics Banner */}
            <section className="stats-grid-row">
                <motion.div className="stat-box" whileInView={{ scale: [0.9, 1] }}>
                    <span className="stat-val">1.2K+</span>
                    <p>Verified Farmers</p>
                </motion.div>
                <div className="stat-box">
                    <span className="stat-val">45K+</span>
                    <p>Missions Complete</p>
                </div>
                <div className="stat-box">
                    <span className="stat-val">85%</span>
                    <p>Resource Efficacy</p>
                </div>
                <div className="stat-box">
                    <span className="stat-val">12M+</span>
                    <p>Carbon Credits Generated</p>
                </div>
            </section>

            {/* MASSIVE CONTENT SYSTEM */}
            <div id="vision">
                <Section 
                    tagline="Vision & Mission"
                    title="Restoring the Earth, One Acre at a Time."
                    content="Agriculture is the backbone of civilization, but the era of resource depletion is over. GOO uses Llama 3 AI to help farmers transition toward regenerative practices without sacrificing profitability."
                    image={img1}
                />
            </div>

            <div id="ecosystem">
                <Section 
                    tagline="AI Intelligence"
                    title="Prescriptive Analytics for Smart Growth."
                    content="Why guess when you can know? Our AI core analyzes satellite imaging and soil sensors to provide daily prescriptions for water, nutrient, and pest management. Up to 40% reduction in chemical dependency."
                    image={img2}
                    reversed={true}
                />
            </div>

            {/* Step-by-Step Transition Section */}
            <section className="step-container">
                <span className="tag" style={{ textAlign: 'center', display: 'block' }}>The Roadmap</span>
                <h2 style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: '5rem', color: '#2d5a27' }}>How the Revolution Works</h2>
                <div className="step-grid">
                    <motion.div className="step-card" whileHover={{ y: -10 }}>
                        <div className="step-num">01</div>
                        <h3>Digital ID</h3>
                        <p>Create your Farm Digital Profile. Connect your location and historical data to build your baseline score.</p>
                    </motion.div>
                    <motion.div className="step-card" whileHover={{ y: -10 }}>
                        <div className="step-num">02</div>
                        <h3>Eco-Missions</h3>
                        <p>Receive weekly missions tailored to your specific ecosystem. Complete tasks to earn Eco-Coins and platform badges.</p>
                    </motion.div>
                    <motion.div className="step-card" whileHover={{ y: -10 }}>
                        <div className="step-num">03</div>
                        <h3>AI Verification</h3>
                        <p>Submit photo and GPS proof. Our Llama Vision 3.2 model verifies your actions in seconds to release your rewards.</p>
                    </motion.div>
                    <motion.div className="step-card" whileHover={{ y: -10 }}>
                        <div className="step-num">04</div>
                        <h3>Marketplace</h3>
                        <p>Redeem your credits for heavy equipment, premium seeds, or direct cash subsidized by carbon credit markets.</p>
                    </motion.div>
                </div>
            </section>

            <Section 
                tagline="Bio-Diversity"
                title="Protecting Local Pollinators and Soil Life."
                content="Sustainability isn't just about output; it's about life. GOO identifies bio-hotspots on your farm and provides incentive programs to build dedicated pollinator corridors and native bio-buffers."
                image={img3}
            />

            <Section 
                tagline="Global Network"
                title="Connect with a Community of Experts."
                content="You are not alone in this transition. Our social hub connects you with 1,200+ local farmers and GRC experts. Share knowledge, view leaderboard rankings, and participate in regional yield-boosting challenges."
                image={img4}
                reversed={true}
            />

            <section id="impact" className="gallery-strip">
                {[img5, img6, img7, img8, img9, img10].map((src, i) => (
                    <motion.img 
                        key={i}
                        src={src} 
                        className="strip-img"
                        animate={{ x: [0, -1000] }}
                        transition={{ duration: 30, repeat: Infinity, ease: 'linear' }}
                    />
                ))}
            </section>

            <Section 
                tagline="Transparency"
                title="Blockchain-Subsidized Farming Records."
                content="Transparency builds trust. Our immutable record system allows you to share your sustainability audit trail directly with banks for lower interest rates or with government agencies for direct subsidies."
                image={img11}
            />

            <Section 
                tagline="Marketplace"
                title="Premium Access to Sustainable Goods."
                content="Browse thousands of 'GOO Verified' products. From organic fertilizers to next-gen moisture sensors, use your platform rewards to access the tools of the future at significantly lower costs."
                image={img12}
                reversed={true}
            />

            {/* FAQ / Resources Section */}
            <section id="faq" className="step-container" style={{ background: '#fdfbf7' }}>
                <span className="tag" style={{ textAlign: 'center', display: 'block' }}>RESOURCES</span>
                <h2 style={{ fontSize: '3.5rem', textAlign: 'center', marginBottom: '5rem', color: '#2d5a27' }}>Common Questions</h2>
                <div className="step-grid">
                    <div className="step-card">
                        <h3>Is GOO free for small farmers?</h3>
                        <p>Yes, our basic tier is free forever. We believe every farmer deserves access to AI sustainability tools.</p>
                    </div>
                    <div className="step-card">
                        <h3>How do carbon credits work?</h3>
                        <p>Our platform verifies your CO2 sequestration through Llama Vision 3.2. Verified credits are then sold to our corporate partners, and 90% of the proceeds go directly back to you.</p>
                    </div>
                    <div className="step-card">
                        <h3>What equipment do I need?</h3>
                        <p>Simply a smartphone with a camera. Our AI handles the high-precision analysis from your photos and GPS data.</p>
                    </div>
                </div>
            </section>

            <section style={{ padding: '10rem 10%', background: '#f8faf7', display: 'flex', gap: '6rem', alignItems: 'center' }}>
                <div style={{ flex: 1.2 }}>
                    <img src={img13} style={{ width: '100%', borderRadius: '40px', boxShadow: '0 40px 80px rgba(0,0,0,0.1)' }} />
                </div>
                <div style={{ flex: 1 }}>
                    <Award size={64} color="#d4af37" style={{ marginBottom: '2rem' }} />
                    <h2 style={{ fontSize: '3rem', marginBottom: '2rem', color: '#2d5a27' }}>"GOO increased my yield by 22% while cutting my costs in half."</h2>
                    <p style={{ fontSize: '1.4rem', fontStyle: 'italic', color: '#555' }}>— David Thompson, Green Revolution Member since 2024</p>
                </div>
            </section>

            <section style={{ 
                padding: '8rem 5%', 
                background: 'var(--color-primary)', 
                color: 'white', 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                textAlign: 'center',
                position: 'relative',
                overflow: 'hidden'
            }}>
                {/* Subtle Decorative Elements */}
                <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', filter: 'blur(100px)' }} />
                <div style={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '30%', height: '30%', background: 'rgba(74, 222, 128, 0.1)', borderRadius: '50%', filter: 'blur(80px)' }} />

                <motion.h2 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    style={{ fontSize: '3.5rem', marginBottom: '1.5rem', fontWeight: 1000, letterSpacing: '-0.02em', position: 'relative' }}
                >
                    Ready to Scale?
                </motion.h2>
                <motion.p 
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.1 }}
                    style={{ maxWidth: '800px', fontSize: '1.2rem', marginBottom: '3rem', opacity: 0.9, lineHeight: 1.6, fontWeight: 700, position: 'relative' }}
                >
                    Join the fastest-growing agri-tech ecosystem in the world today.<br /> 
                    Start your 30-day premium expert trial for free.
                </motion.p>
                <div style={{ display: 'flex', gap: '2rem', position: 'relative' }}>
                    <motion.button 
                        whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(0,0,0,0.2)' }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-cta" 
                        style={{ background: 'var(--color-gold)', color: 'white', border: 'none', padding: '15px 40px', fontSize: '1rem', fontWeight: 900, borderRadius: '15px', cursor: 'pointer' }}
                    >
                        Create My Farm Profile
                    </motion.button>
                    <motion.button 
                        whileHover={{ scale: 1.05, background: 'rgba(255,255,255,0.1)' }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-cta" 
                        style={{ background: 'transparent', color: 'white', border: '2px solid white', padding: '15px 40px', fontSize: '1rem', fontWeight: 900, borderRadius: '15px', cursor: 'pointer' }}
                    >
                        Connect with Specialist
                    </motion.button>
                </div>
            </section>

            <footer className="final-footer">
                <div className="footer-grid">
                    <div>
                        <h3 className="logo-text" style={{ fontSize: '2rem', marginBottom: '1.5rem', color: 'white' }}>goo</h3>
                        <p style={{ color: '#666' }}>Pioneering regenerative agriculture through high-precision AI and community-driven verification systems.</p>
                    </div>
                    <div>
                        <h4>Company</h4>
                        <ul><li>Mission</li><li>The GRC</li><li>Careers</li><li>Press</li></ul>
                    </div>
                    <div>
                        <h4>Resources</h4>
                        <ul><li>API Documentation</li><li>Privacy Policy</li><li>Bio-service Terms</li><li>Security</li></ul>
                    </div>
                    <div>
                        <h4>Stay Updated</h4>
                        <p style={{ color: '#666', marginBottom: '1.5rem' }}>Get the latest Agri-tech news delivered to your farm.</p>
                        <input type="email" placeholder="farmer@farm.com" style={{ width: '100%', background: '#222', border: 'none', padding: '1rem', borderRadius: '10px', color: 'white' }} />
                    </div>
                </div>
                <div style={{ marginTop: '8rem', borderTop: '1px solid #222', paddingTop: '3rem', color: '#444', textAlign: 'center' }}>
                    © 2026 GOO SUSTAINABILITY INC. ALL RIGHTS RESERVED.
                </div>
            </footer>
        </div>
    );
};

export default LandingPage;
