import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  withCredentials: true,
});

// Global 401 interceptor — redirect to login on any unauthenticated response
axiosInstance.interceptors.response.use(  // ← Changed from 'api' to 'axiosInstance'
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;