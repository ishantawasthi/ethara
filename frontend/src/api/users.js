import axiosInstance from './axiosInstance.js';

export const getUsers = async (params = {}) => {
  const { data } = await axiosInstance.get('/users', { params });
  return data;
};

export const getUserById = async (id) => {
  const { data } = await axiosInstance.get(`/users/${id}`);
  return data;
};

export const updateUserRole = async (id, role) => {
  const { data } = await axiosInstance.put(`/users/${id}/role`, { role });
  return data;
};

export const updateUser = async (id, updates) => {
  const { data } = await axiosInstance.put(`/users/${id}`, updates);
  return data;
};

export const deleteUser = async (id) => {
  const { data } = await axiosInstance.delete(`/users/${id}`);
  return data;
};
