import axios from 'axios';
import { baseUrl } from './baseUrl';

const api = axios.create({
    baseURL: baseUrl,
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
