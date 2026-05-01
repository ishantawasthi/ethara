import { useState, useEffect, useCallback } from 'react';
import * as projectsApi from '../api/projects.js';

/**
 * Hook for fetching and managing projects list.
 */
export function useProjects(filters = {}) {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchProjects = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await projectsApi.getProjects(filters);
      setProjects(response.data.projects || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load projects.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const createProject = async (payload) => {
    const response = await projectsApi.createProject(payload);
    setProjects((prev) => [response.data.project, ...prev]);
    return response.data.project;
  };

  const updateProject = async (id, payload) => {
    const response = await projectsApi.updateProject(id, payload);
    setProjects((prev) =>
      prev.map((p) => (p._id === id ? response.data.project : p))
    );
    return response.data.project;
  };

  const deleteProject = async (id) => {
    await projectsApi.deleteProject(id);
    setProjects((prev) => prev.filter((p) => p._id !== id));
  };

  return {
    projects,
    loading,
    error,
    refetch: fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
}
