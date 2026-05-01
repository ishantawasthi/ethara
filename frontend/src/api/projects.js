import axiosInstance from './axiosInstance.js';

export const getProjects = async (params = {}) => {
  const { data } = await axiosInstance.get('/projects', { params });
  return data;
};

export const getProject = async (id) => {
  const { data } = await axiosInstance.get(`/projects/${id}`);
  return data;
};

export const createProject = async (payload) => {
  const { data } = await axiosInstance.post('/projects', payload);
  return data;
};

export const updateProject = async (id, payload) => {
  const { data } = await axiosInstance.put(`/projects/${id}`, payload);
  return data;
};

export const deleteProject = async (id) => {
  const { data } = await axiosInstance.delete(`/projects/${id}`);
  return data;
};

export const addMember = async (projectId, userId) => {
  const { data } = await axiosInstance.post(`/projects/${projectId}/members`, { userId });
  return data;
};
