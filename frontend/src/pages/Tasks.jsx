import React, { useState } from 'react';
import { useTasks } from '../hooks/useTasks.js';
import { useProjects } from '../hooks/useProjects.js';
import { useAuth } from '../hooks/useAuth.js';
import StatusBadge from '../components/StatusBadge.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate, isOverdue, toInputDate } from '../utils/formatDate.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants.js';
import { createTask } from '../api/tasks.js';
import { getProject } from '../api/projects.js';

function CreateTaskModal({ isOpen, onClose, projects, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [projectMembers, setProjectMembers] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleProjectChange = async (pid) => {
    setProjectId(pid);
    setAssignedTo('');
    if (pid) {
      try {
        const res = await getProject(pid);
        const p = res.data.project;
        setProjectMembers([p.owner, ...(p.members || [])]);
      } catch {
        setProjectMembers([]);
      }
    } else {
      setProjectMembers([]);
    }
  };

  const handleClose = () => {
    setTitle(''); setDescription(''); setProjectId(''); setAssignedTo('');
    setPriority('medium'); setDueDate(''); setProjectMembers([]); setError('');
    onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) return setError('Title is required.');
    if (!projectId) return setError('Please select a project.');
    setError(''); setLoading(true);
    try {
      await onCreate({
        title: title.trim(),
        description: description.trim(),
        project: projectId,
        assignedTo: assignedTo || undefined,
        priority,
        dueDate: dueDate || undefined,
      });
      handleClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="New Task">
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" placeholder="Task title" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Project *</label>
          <select className="input" value={projectId} onChange={(e) => handleProjectChange(e.target.value)}>
            <option value="">Select a project...</option>
            {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        {projectMembers.length > 0 && (
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {projectMembers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
        )}
        <div className="flex gap-3 pt-2">
          <button onClick={handleClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleCreate} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creating...' : 'Create Task'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function Tasks() {
  const { user, isAdmin } = useAuth();
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [projectFilter, setProjectFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState('');

  const filters = {};
  if (statusFilter) filters.status = statusFilter;
  if (priorityFilter) filters.priority = priorityFilter;
  if (projectFilter) filters.project = projectFilter;

  const { tasks, loading, error, updateTask, deleteTask, refetch } = useTasks(filters);
  const { projects } = useProjects();

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const handleStatusChange = async (taskId, status) => {
    try {
      await updateTask(taskId, { status });
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleEditSave = async (taskId, payload) => {
    try {
      await updateTask(taskId, payload);
      showToast('Task updated.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task.');
      throw err;
    }
  };

  const handleDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      showToast('Task deleted.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleCreate = async (payload) => {
    const res = await createTask(payload);
    refetch();
    showToast('Task created.');
    return res;
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-500 text-sm mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Task
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select className="input w-auto" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All statuses</option>
          {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
        </select>
        <select className="input w-auto" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
          <option value="">All priorities</option>
          {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
        </select>
        <select className="input w-auto" value={projectFilter} onChange={(e) => setProjectFilter(e.target.value)}>
          <option value="">All projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        {(statusFilter || priorityFilter || projectFilter) && (
          <button
            onClick={() => { setStatusFilter(''); setPriorityFilter(''); setProjectFilter(''); }}
            className="btn-ghost text-sm"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-4">✅</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-1">No tasks found</h3>
          <p className="text-gray-500 text-sm">
            {statusFilter || priorityFilter || projectFilter ? 'Try adjusting your filters.' : 'Create your first task.'}
          </p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Project</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600">Status</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Priority</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Assignee</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Due Date</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {tasks.map((task) => {
                  const overdue = isOverdue(task.dueDate) && task.status !== 'done';
                  const isAssignee = task.assignedTo?._id === user?._id;
                  const taskProject = projects.find((p) => p._id === task.project?._id);
                  const isProjectOwner = taskProject?.owner?._id === user?._id;
                  const canChangeStatus = isAssignee || isProjectOwner || isAdmin;
                  const canDelete = isProjectOwner || isAdmin;

                  return (
                    <tr key={task._id} className={`hover:bg-gray-50 ${overdue ? 'bg-red-50/30' : ''}`}>
                      <td className="px-4 py-3">
                        <p className="font-medium text-gray-900">{task.title}</p>
                        {task.description && (
                          <p className="text-xs text-gray-400 truncate max-w-xs">{task.description}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 hidden sm:table-cell text-gray-500">
                        {task.project?.title || '—'}
                      </td>
                      <td className="px-4 py-3">
                        {canChangeStatus ? (
                          <select
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                            value={task.status}
                            onChange={(e) => handleStatusChange(task._id, e.target.value)}
                          >
                            {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                          </select>
                        ) : (
                          <StatusBadge type="status" value={task.status} />
                        )}
                      </td>
                      <td className="px-4 py-3 hidden md:table-cell">
                        <StatusBadge type="priority" value={task.priority} />
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell text-gray-500">
                        {task.assignedTo?.name || '—'}
                      </td>
                      <td className={`px-4 py-3 hidden lg:table-cell text-xs ${overdue ? 'text-red-500 font-medium' : 'text-gray-500'}`}>
                        {task.dueDate ? formatDate(task.dueDate) : '—'}
                        {overdue && ' ⚠'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {canDelete && (
                          <button
                            onClick={() => handleDelete(task._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete task"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <CreateTaskModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        projects={projects}
        onCreate={handleCreate}
      />
    </div>
  );
}
