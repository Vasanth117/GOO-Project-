const BASE_URL = 'http://localhost:8000/api/v1';

const getHeaders = () => {
    const token = localStorage.getItem('access_token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
};

const apiRequest = async (endpoint, options = {}) => {
    const isFormData = options.body instanceof FormData;
    const headers = {
        ...(isFormData ? {} : { 'Content-Type': 'application/json' }), // Only set Content-Type if not FormData
        ...getHeaders(), // This will add Authorization and potentially override Content-Type if getHeaders() had it
        ...options.headers // Options headers can override everything
    };

    // Remove Content-Type from headers if it's FormData, as fetch handles it automatically
    if (isFormData) {
        delete headers['Content-Type'];
    }

    const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: headers,
        body: options.body // Body is passed as-is, stringified by caller for JSON, or FormData object
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.detail || 'API Request failed');
    return data.data;
};

export const apiService = {
    // Auth handled in AuthContext, but adding here for completeness
    getCurrentUser: () => apiRequest('/auth/me'),

    // Social / Feed
    getFeed: (page = 1) => apiRequest(`/social/feed?page=${page}`),
    createPost: (data) => {
        if (data instanceof FormData) {
            return apiRequest('/social/posts', { method: 'POST', body: data });
        }
        return apiRequest('/social/posts', {
            method: 'POST',
            body: JSON.stringify(data)
        });
    },
    toggleLike: (postId) => apiRequest(`/social/posts/${postId}/like`, { method: 'POST' }),
    deletePost: (postId) => apiRequest(`/social/posts/${postId}`, { method: 'DELETE' }),
    getComments: (postId) => apiRequest(`/social/posts/${postId}/comments`),
    addComment: (postId, content) => apiRequest(`/social/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),
    toggleFollow: (userId) => apiRequest(`/social/follow/${userId}`, { method: 'POST' }),

    // Missions
    getMissions: (type = 'active') => apiRequest(`/missions/${type}`),
    joinMission: (missionId) => apiRequest(`/missions/${missionId}/join`, { method: 'POST' }),
    submitProof: (missionId, formData) => {
        // Mixing fetch here as it's multipart
        const token = localStorage.getItem('access_token');
        return fetch(`${BASE_URL}/proof/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        }).then(res => res.json());
    },

    // Leaderboard
    getLeaderboard: (scope = 'national') => apiRequest(`/leaderboard/${scope}`),

    // Map / Farm
    getNearbyFarmers: (lat, lng) => apiRequest(`/farm/nearby?lat=${lat}&lng=${lng}`),
    getFarmProfile: () => apiRequest('/farm/me'),
    generateVoice: async (text) => {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}/ai/tts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            },
            body: JSON.stringify({ text })
        });
        if (!res.ok) throw new Error('Voice generation failed');
        return await res.blob();
    },
    createFarm: (data) => apiRequest('/farm/create', { method: 'POST', body: JSON.stringify(data) }),
    updateFarm: (data) => apiRequest('/farm/update', { method: 'PUT', body: JSON.stringify(data) }),

    // Marketplace
    getProducts: (category = '') => apiRequest(`/marketplace/products${category ? `?category=${category}` : ''}`),
    purchaseProduct: (productId) => apiRequest('/marketplace/purchase', {
        method: 'POST',
        body: JSON.stringify({ product_id: productId })
    }),

    // Rewards
    getRewards: () => apiRequest('/rewards/me'),
    redeemReward: (rewardId) => apiRequest(`/rewards/redeem/${rewardId}`, { method: 'POST' }),

    // Score
    getStats: () => apiRequest('/score/stats'),

    // Messaging
    getChats: () => apiRequest('/social/messages/inbox'),
    getMessageHistory: (receiverId) => apiRequest(`/social/messages/chat/${receiverId}`),
    sendMessage: (receiverId, content) => apiRequest('/social/messages/send', {
        method: 'POST',
        body: JSON.stringify({ receiver_id: receiverId, content })
    }),

    // AI 
    askAdvisor: (message, context = {}) => apiRequest('/ai/advisor', {
        method: 'POST',
        body: JSON.stringify({ message, context })
    }),
    analyzeCropHealth: (formData) => {
        const token = localStorage.getItem('access_token');
        return fetch(`${BASE_URL}/ai/analyze-health`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        }).then(res => res.json());
    },
    generateVoice: (text) => {
        const token = localStorage.getItem('access_token');
        return fetch(`${BASE_URL}/ai/tts`, {
            method: 'POST',
            headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ text })
        }).then(res => res.blob());
    },
    getRecommendation: (data) => apiRequest('/ai/recommend-crops', {
        method: 'POST',
        body: JSON.stringify(data)
    }),

    // ── User Profile & Settings ──────────────────────────────────
    getProfile: () => apiRequest('/user/me'),

    updateProfile: (formData) => {
        const token = localStorage.getItem('access_token');
        return fetch(`${BASE_URL}/user/me`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        }).then(res => res.json());
    },

    changePassword: (oldPassword, newPassword) => apiRequest('/user/password', {
        method: 'PUT',
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword })
    }),

    updatePreferences: (prefs) => apiRequest('/user/preferences', {
        method: 'PUT',
        body: JSON.stringify(prefs)
    }),
};
