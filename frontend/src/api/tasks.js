import axiosInstance from './axiosInstance.js';

export const getTasks = async (filters = {}) => {
  const { data } = await axiosInstance.get('/tasks', { params: filters });
  return data;
};

export const getTask = async (id) => {
  const { data } = await axiosInstance.get(`/tasks/${id}`);
  return data;
};

export const createTask = async (payload) => {
  const { data } = await axiosInstance.post('/tasks', payload);
  return data;
};

export const updateTask = async (id, payload) => {
  const { data } = await axiosInstance.put(`/tasks/${id}`, payload);
  return data;
};

export const deleteTask = async (id) => {
  const { data } = await axiosInstance.delete(`/tasks/${id}`);
  return data;
};
