import axiosInstance from './axiosInstance.js';

export const login = async (email, password) => {
  const { data } = await axiosInstance.post('/auth/login', { email, password });
  return data;
};

export const register = async (name, email, password, role = 'member') => {
  const { data } = await axiosInstance.post('/auth/register', { name, email, password, role });
  return data;
};

export const getMe = async () => {
  const { data } = await axiosInstance.get('/auth/me');
  return data;
};
