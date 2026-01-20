const API_URL = '/api/auth';

export const authApi = {
    async register(email: string, password: string, fullName?: string) {
        const res = await fetch(`${API_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, full_name: fullName }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Registration failed');
        return data;
    },

    async login(email: string, password: string) {
        const res = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Login failed');
        return data;
    },

    async getMe(token: string) {
        const res = await fetch(`${API_URL}/me`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Session invalid');
        return data;
    }
};
