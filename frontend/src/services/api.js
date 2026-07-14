import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 300000, // 5 minutes (Docker pulls of large desktop images can take a while)
  headers: {
    'Content-Type': 'application/json',
  },
});

export default api;
