import axiosInstance from './axiosInstance.js';

export const getDashboardStats = async () => {
  const { data } = await axiosInstance.get('/dashboard');
  return data;
};
