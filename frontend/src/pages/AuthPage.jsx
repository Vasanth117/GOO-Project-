import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, Globe, Facebook, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const AuthPage = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const [loginData, setLoginData] = useState({ email: '', password: '' });
    const [registerData, setRegisterData] = useState({ name: '', email: '', password: '', role: 'farmer' });

    const { login, register } = useAuth();
    const navigate = useNavigate();

    const togglePanel = () => {
        setIsSignUp(!isSignUp);
        setError('');
    };

    const handleLoginChange = (e) => setLoginData({ ...loginData, [e.target.name]: e.target.value });
    const handleRegisterChange = (e) => setRegisterData({ ...registerData, [e.target.name]: e.target.value });

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        try {
            await login(loginData.email, loginData.password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Login failed. Please check your credentials.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setError('');
        if (registerData.password.length < 6) {
            setError('Password must be at least 6 characters.');
            return;
        }
        setIsLoading(true);
        try {
            await register(registerData.name, registerData.email, registerData.password, registerData.role);
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <div className={`auth-container ${isSignUp ? 'right-panel-active' : ''}`}>

                {/* ── Sign Up Form ── */}
                <div className="form-container sign-up-container">
                    <form className="auth-form" onSubmit={handleRegister}>
                        <h1>Create Account</h1>
                        <div className="social-container">
                            <a href="#"><Globe size={20} /></a>
                            <a href="#"><Facebook size={20} /></a>
                        </div>
                        <span>or register with your email</span>

                        <AnimatePresence>
                            {error && isSignUp && (
                                <motion.div
                                    className="auth-error"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <AlertCircle size={15} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="auth-input-group">
                            <User size={16} className="auth-input-icon" />
                            <input type="text" name="name" placeholder="Full Name" value={registerData.name} onChange={handleRegisterChange} required />
                        </div>
                        <div className="auth-input-group">
                            <Mail size={16} className="auth-input-icon" />
                            <input type="email" name="email" placeholder="Email" value={registerData.email} onChange={handleRegisterChange} required />
                        </div>
                        <div className="auth-input-group">
                            <select name="role" value={registerData.role} onChange={handleRegisterChange}
                                style={{ backgroundColor: '#f3f3f3', border: '1px solid transparent', borderRadius: '10px', padding: '14px 15px', width: '100%', fontSize: '14px', outline: 'none', color: '#555', cursor: 'pointer' }}>
                                <option value="farmer">🌾 Farmer</option>
                                <option value="expert">👨‍🔬 Gov / Expert</option>
                                <option value="seller">🛒 Equipment Seller</option>
                            </select>
                        </div>
                        <div className="auth-input-group" style={{ position: 'relative' }}>
                            <Lock size={16} className="auth-input-icon" />
                            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password (min 6 chars)" value={registerData.password} onChange={handleRegisterChange} required />
                            <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#aaa' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>

                        <motion.button
                            className="btn-auth-submit"
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? <span className="auth-spinner" /> : 'Sign Up'}
                        </motion.button>
                    </form>
                </div>

                {/* ── Sign In Form ── */}
                <div className="form-container sign-in-container">
                    <form className="auth-form" onSubmit={handleLogin}>
                        <h1>Sign In</h1>
                        <div className="social-container">
                            <a href="#"><Globe size={20} /></a>
                            <a href="#"><Facebook size={20} /></a>
                        </div>
                        <span>or use your account</span>

                        <AnimatePresence>
                            {error && !isSignUp && (
                                <motion.div
                                    className="auth-error"
                                    initial={{ opacity: 0, y: -8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                >
                                    <AlertCircle size={15} /> {error}
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="auth-input-group">
                            <Mail size={16} className="auth-input-icon" />
                            <input type="email" name="email" placeholder="Email" value={loginData.email} onChange={handleLoginChange} required />
                        </div>
                        <div className="auth-input-group" style={{ position: 'relative' }}>
                            <Lock size={16} className="auth-input-icon" />
                            <input type={showPassword ? 'text' : 'password'} name="password" placeholder="Password" value={loginData.password} onChange={handleLoginChange} required />
                            <div onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#aaa' }}>
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </div>
                        </div>

                        <a href="#" className="forgot-link">Forgot your password?</a>

                        <motion.button
                            className="btn-auth-submit"
                            type="submit"
                            disabled={isLoading}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.97 }}
                        >
                            {isLoading ? <span className="auth-spinner" /> : 'Sign In'}
                        </motion.button>
                    </form>
                </div>

                {/* ── Overlay Panel ── */}
                <div className="overlay-container">
                    <div className="overlay">
                        <div className="overlay-panel overlay-left">
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px', opacity: 0.85 }}>Welcome to the GOO</span>
                            <h1>Welcome Back!</h1>
                            <p>To keep connected with us please login with your personal info</p>
                            <button className="btn-ghost" onClick={togglePanel}>Sign In</button>
                        </div>
                        <div className="overlay-panel overlay-right">
                            <span style={{ fontSize: '1.2rem', fontWeight: '800', letterSpacing: '1px', marginBottom: '8px', opacity: 0.85 }}>Welcome to the GOO</span>
                            <h1>Hello, Friend!</h1>
                            <p>Enter your personal details and start your sustainable farming journey with us</p>
                            <button className="btn-ghost" onClick={togglePanel}>Sign Up</button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};
export default AuthPage;
