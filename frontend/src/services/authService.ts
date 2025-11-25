import api from './api';
import { jwtDecode } from 'jwt-decode';
import Cookies from 'js-cookie';

export interface User {
    userId: string;
    username: string;
    role: 'admin' | 'user' | 'guest' | 'editor';
}

export interface LoginResponse {
    access_token: string;
    user?: any;
    role: string;
}

class AuthService {
    async login(username: string, password: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login', { username, password });
        if (response.data.access_token) {
            Cookies.set('token', response.data.access_token, { expires: 7 });
        }
        return response.data;
    }

    async loginGuest(code: string): Promise<LoginResponse> {
        const response = await api.post<LoginResponse>('/auth/login-guest', { code });
        if (response.data.access_token) {
            Cookies.set('token', response.data.access_token, { expires: 7 });
        }
        return response.data;
    }

    logout() {
        Cookies.remove('token');
        window.location.href = '/login';
    }

    getCurrentUser(): User | null {
        const token = Cookies.get('token');
        if (token) {
            try {
                const decoded = jwtDecode<User>(token);
                return decoded;
            } catch (error) {
                return null;
            }
        }
        return null;
    }

    getToken(): string | undefined {
        return Cookies.get('token');
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    isAdmin(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'admin';
    }

    isGuest(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'guest';
    }

    isEditor(): boolean {
        const user = this.getCurrentUser();
        return user?.role === 'editor';
    }

    // Admin only methods
    async generateGuestCode(duration: number, note: string, role: string = 'view') {
        return api.post('/auth/guest-code', { duration, note, role });
    }

    async listGuestCodes() {
        return api.get('/auth/guest-code');
    }

    async revokeGuestCode(id: string) {
        return api.delete(`/auth/guest-code/${id}`);
    }
}

export default new AuthService();
