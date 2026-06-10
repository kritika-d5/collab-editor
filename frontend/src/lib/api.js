import axios from 'axios';
import { API_BASE } from './config';
const api = axios.create({ baseURL: API_BASE });
export function setAuthToken(token) {
    if (token) {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }
    else {
        delete api.defaults.headers.common['Authorization'];
    }
}
export default api;
