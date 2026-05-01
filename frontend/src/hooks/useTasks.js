import { useState, useEffect, useCallback } from 'react';
import * as tasksApi from '../api/tasks.js';

/**
 * Hook for fetching and managing tasks.
 */
export function useTasks(filters = {}) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await tasksApi.getTasks(filters);
      setTasks(response.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tasks.');
    } finally {
      setLoading(false);
    }
  }, [JSON.stringify(filters)]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const createTask = async (payload) => {
    const response = await tasksApi.createTask(payload);
    setTasks((prev) => [response.data.task, ...prev]);
    return response.data.task;
  };

  const updateTask = async (id, payload) => {
    const response = await tasksApi.updateTask(id, payload);
    setTasks((prev) =>
      prev.map((t) => (t._id === id ? response.data.task : t))
    );
    return response.data.task;
  };

  const deleteTask = async (id) => {
    await tasksApi.deleteTask(id);
    setTasks((prev) => prev.filter((t) => t._id !== id));
  };

  return {
    tasks,
    loading,
    error,
    refetch: fetchTasks,
    createTask,
    updateTask,
    deleteTask,
  };
}
