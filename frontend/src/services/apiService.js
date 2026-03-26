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
    if (!res.ok) {
        console.error("API ERROR BODY:", data);
        throw new Error(data.message || data.detail || 'API Request failed');
    }
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
    startMission: (id) => apiRequest(`/missions/${id}/start`, { method: 'POST' }),
    triggerAiMissions: () => apiRequest('/missions/ai-assign'),
    getMissionHistory: (page = 1) => apiRequest(`/missions/history?page=${page}`),
    getCommunityMissions: () => apiRequest('/missions/community-active'),
    submitPeriodicReport: async (formData) => {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}/reports/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            console.error("REPORT SUBMISSION FAILED:", data);
            throw new Error(data.message || data.detail || 'Report submission failed');
        }
        return data;
    },
    submitMissionProof: async (formData) => {
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}/proofs/submit`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) {
            console.error("PROOF SUBMISSION FAILED:", data);
            throw new Error(data.message || data.detail || 'Proof submission failed');
        }
        return data.data;
    },
    getMyPeriodicReports: () => apiRequest('/missions/periodic-reports/my'),

    // Leaderboard
    getLeaderboard: (scope = 'national', timeframe = 'all-time') => apiRequest(`/leaderboard/${scope}?timeframe=${timeframe.toLowerCase()}`),
    getMyRank: () => apiRequest('/leaderboard/me/rank'),

    // Map / Farm
    getNearbyFarmers: (lat, lng) => apiRequest(`/farm/nearby?lat=${lat}&lng=${lng}`),
    getFarmProfile: () => apiRequest('/farm/me'),
    createFarm: (data) => apiRequest('/farm/create', { method: 'POST', body: JSON.stringify(data) }),
    updateFarm: (data) => apiRequest('/farm/update', { method: 'PUT', body: JSON.stringify(data) }),
    pingLocation: (lat, lng) => apiRequest('/farm/location/ping', { method: 'POST', body: JSON.stringify({ lat, lng }) }),
    setPrivacyMode: (mode) => apiRequest('/farm/privacy', { method: 'PUT', body: JSON.stringify({ mode }) }),
    getActivityMarkers: () => apiRequest('/farm/activity/markers'),

    // Marketplace
    getProducts: (category = '') => apiRequest(`/marketplace/products${category ? `?category=${category}` : ''}`),
    placeOrder: (data) => apiRequest('/marketplace/orders', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    getMyOrders: () => apiRequest('/marketplace/orders/me'),
    getSellerDashboard: () => apiRequest('/marketplace/seller/dashboard'),
    createProduct: (data) => apiRequest('/marketplace/products', {
        method: 'POST',
        body: JSON.stringify(data)
    }),
    updateOrderStatus: (orderId, status) => apiRequest(`/marketplace/orders/${orderId}/status?status=${status}`, {
        method: 'PATCH'
    }),

    // Rewards
    getWallet: () => apiRequest('/rewards/wallet'),
    buyVoucher: (data) => apiRequest('/rewards/redeem-points', { method: 'POST', body: JSON.stringify(data) }),
    useVoucher: (voucherId) => apiRequest(`/rewards/vouchers/${voucherId}/use`, { method: 'POST' }),

    // Score
    getStats: () => apiRequest('/score/stats'),

    // Messaging
    getChats: () => apiRequest('/messages/inbox'),
    getMessageHistory: (receiverId) => apiRequest(`/messages/chat/${receiverId}`),
    sendMessage: (receiverId, content) => apiRequest(`/messages/send?receiver_id=${receiverId}&content=${encodeURIComponent(content)}`, {
        method: 'POST'
    }),

    // Following / Social
    followUser: (userId) => apiRequest(`/follow/${userId}`, { method: 'POST' }),
    unfollowUser: (userId) => apiRequest(`/follow/${userId}`, { method: 'DELETE' }),
    getFollowStatus: (userId) => apiRequest(`/follow/status/${userId}`),
    getPendingFollowRequests: () => apiRequest('/follow/requests'),
    respondToFollowRequest: (requestId, accept) => apiRequest(`/follow/request/${requestId}/respond?accept=${accept}`, { method: 'POST' }),
    getFollowers: (userId) => apiRequest(`/social/profile/${userId}/followers`),
    getFollowing: (userId) => apiRequest(`/social/profile/${userId}/following`),


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

    // ── Social & Community ──────────────────────────────────────
    getFeed: (page = 1, postType = '') => apiRequest(`/social/feed?page=${page}${postType ? `&post_type=${postType}` : ''}`),
    createPost: (formData) => {
        const token = localStorage.getItem('access_token');
        return fetch(`${BASE_URL}/social/posts`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        }).then(res => res.json());
    },
    toggleLike: (postId) => apiRequest(`/social/posts/${postId}/like`, { method: 'POST' }),
    addComment: (postId, content) => apiRequest(`/social/posts/${postId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content })
    }),
    getPendingVerifications: () => apiRequest('/grc/pending-verifications'),

    // ── User Profile & Settings ──────────────────────────────────
    getProfile: () => apiRequest('/user/me'),
    getAnyProfile: (userId) => apiRequest(`/user/${userId}`),

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

    getMyRank: () => apiRequest('/score/stats'),
    searchUsers: (q, page = 1, limit = 10) => apiRequest(`/user/search?q=${encodeURIComponent(q)}&page=${page}&limit=${limit}`),

    // ── Marketplace ─────────────────────────────────────────────
    getProducts: (params = {}) => {
        const query = new URLSearchParams(params).toString();
        return apiRequest(`/marketplace/products?${query}`);
    },
    getProductDetail: (id) => apiRequest(`/marketplace/products/${id}`),
    placeOrder: (data) => apiRequest('/marketplace/orders', { method: 'POST', body: JSON.stringify(data) }),
    getSellerDashboard: () => apiRequest('/marketplace/seller/dashboard'),
    createProduct: (data) => apiRequest('/marketplace/products', { method: 'POST', body: JSON.stringify(data) }),
    updateProduct: (id, data) => apiRequest(`/marketplace/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteProduct: (id) => apiRequest(`/marketplace/products/${id}`, { method: 'DELETE' }),
    updateOrderStatus: (id, status) => apiRequest(`/marketplace/orders/${id}/status?status=${status}`, { method: 'PATCH' }),
    getReviews: (productId) => apiRequest(`/marketplace/products/${productId}/reviews`),
    replyToReview: (reviewId, reply) => apiRequest(`/marketplace/reviews/${reviewId}/reply`, { method: 'POST', body: JSON.stringify({ reply }) }),
    // Notifications
    getNotifications: () => apiRequest('/notifications/'),
    markNotificationRead: (id) => apiRequest(`/notifications/${id}/read`, { method: 'PATCH' }),
    markAllNotificationsRead: () => apiRequest('/notifications/read-all', { method: 'PATCH' }),
    uploadProductImage: async (file) => {
        const formData = new FormData();
        formData.append('file', file);
        const token = localStorage.getItem('access_token');
        const res = await fetch(`${BASE_URL}/marketplace/products/upload`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` },
            body: formData
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || data.detail || 'Upload failed');
        return data.data; // { url: '...' }
    }
};
