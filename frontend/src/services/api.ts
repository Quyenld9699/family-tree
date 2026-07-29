import axios from 'axios';
import { baseUrl } from './baseUrl';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            Cookies.remove('token');
            // Dispatch custom event để AuthProvider bắt và redirect
            window.dispatchEvent(new CustomEvent('auth:logout'));
        }
        return Promise.reject(error);
    },
);

export default api;
