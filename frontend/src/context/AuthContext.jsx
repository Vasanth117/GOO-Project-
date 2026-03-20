import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API = 'http://localhost:8000/api/v1';

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [accessToken, setAccessToken] = useState(localStorage.getItem('access_token') || null);
    const [loading, setLoading] = useState(true);

    // On first load – verify token is still valid by calling /auth/me
    useEffect(() => {
        const verify = async () => {
            const token = localStorage.getItem('access_token');
            if (!token) { setLoading(false); return; }
            try {
                const res = await fetch(`${API}/auth/me`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                    const data = await res.json();
                    setUser(data.data);
                    setAccessToken(token);
                } else {
                    // Token invalid – clear everything
                    localStorage.removeItem('access_token');
                    localStorage.removeItem('refresh_token');
                    setUser(null);
                    setAccessToken(null);
                }
            } catch {
                setUser(null);
            } finally {
                setLoading(false);
            }
        };
        verify();
    }, []);

    const login = async (email, password) => {
        const res = await fetch(`${API}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.message || 'Login failed');

        const { access_token, refresh_token, user: userData } = data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setAccessToken(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, role) => {
        const res = await fetch(`${API}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, email, password, role }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || data.message || 'Registration failed');

        const { access_token, refresh_token, user: userData } = data.data;
        localStorage.setItem('access_token', access_token);
        localStorage.setItem('refresh_token', refresh_token);
        setAccessToken(access_token);
        setUser(userData);
        return userData;
    };

    const logout = async () => {
        const refresh_token = localStorage.getItem('refresh_token');
        try {
            await fetch(`${API}/auth/logout`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ refresh_token }),
            });
        } catch { /* ignore */ }
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setUser(null);
        setAccessToken(null);
    };

    const refreshUser = async () => {
        const token = localStorage.getItem('access_token');
        if (!token) return;
        try {
            const res = await fetch(`${API}/auth/me`, { headers: { Authorization: `Bearer ${token}` } });
            if (res.ok) {
                const data = await res.json();
                setUser(data.data);
            }
        } catch { /* silent */ }
    };

    return (
        <AuthContext.Provider value={{ user, accessToken, login, register, logout, refreshUser, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => useContext(AuthContext);
