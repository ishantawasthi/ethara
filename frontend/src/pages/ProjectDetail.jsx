import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject, updateProject, deleteProject, addMember } from '../api/projects.js';
import { createTask, updateTask, deleteTask } from '../api/tasks.js';
import { getUsers } from '../api/users.js';
import { useAuth } from '../hooks/useAuth.js';
import StatusBadge from '../components/StatusBadge.jsx';
import TaskCard from '../components/TaskCard.jsx';
import Modal from '../components/Modal.jsx';
import { formatDate, toInputDate } from '../utils/formatDate.js';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants.js';

function EditProjectModal({ isOpen, onClose, project, onSave }) {
  const [title, setTitle] = useState(project?.title || '');
  const [description, setDescription] = useState(project?.description || '');
  const [status, setStatus] = useState(project?.status || 'active');
  const [deadline, setDeadline] = useState(toInputDate(project?.deadline));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (project) {
      setTitle(project.title);
      setDescription(project.description || '');
      setStatus(project.status);
      setDeadline(toInputDate(project.deadline));
    }
  }, [project]);

  const handleSave = async () => {
    if (!title.trim()) return setError('Title is required.');
    setError(''); setLoading(true);
    try {
      await onSave({ title: title.trim(), description: description.trim(), status, deadline: deadline || undefined });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Project">
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div>
          <label className="label">Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="active">Active</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div>
          <label className="label">Deadline</label>
          <input className="input" type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} />
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function CreateTaskModal({ isOpen, onClose, projectId, members, owner, onCreate }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [priority, setPriority] = useState('medium');
  const [dueDate, setDueDate] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const allMembers = owner ? [owner, ...(members || [])] : (members || []);

  const handleClose = () => {
    setTitle(''); setDescription(''); setAssignedTo(''); setPriority('medium'); setDueDate(''); setError('');
    onClose();
  };

  const handleCreate = async () => {
    if (!title.trim()) return setError('Title is required.');
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
        <div>
          <label className="label">Assign To</label>
          <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
            <option value="">Unassigned</option>
            {allMembers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
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

function EditTaskModal({ isOpen, onClose, task, members, owner, onSave }) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState(task?.status || 'todo');
  const [priority, setPriority] = useState(task?.priority || 'medium');
  const [assignedTo, setAssignedTo] = useState(task?.assignedTo?._id || '');
  const [dueDate, setDueDate] = useState(toInputDate(task?.dueDate));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority);
      setAssignedTo(task.assignedTo?._id || '');
      setDueDate(toInputDate(task.dueDate));
      setError('');
    }
  }, [task]);

  const allMembers = owner ? [owner, ...(members || [])] : (members || []);

  const handleSave = async () => {
    if (!title.trim()) return setError('Title is required.');
    setError(''); setLoading(true);
    try {
      await onSave(task._id, {
        title: title.trim(),
        description: description.trim(),
        status,
        priority,
        assignedTo: assignedTo || null,
        dueDate: dueDate || null,
      });
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Task">
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="label">Title *</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} autoFocus />
        </div>
        <div>
          <label className="label">Description</label>
          <textarea className="input resize-none" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {TASK_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Assign To</label>
            <select className="input" value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
              <option value="">Unassigned</option>
              {allMembers.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="label">Due Date</label>
            <input className="input" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleSave} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function AddMemberModal({ isOpen, onClose, onAdd, existingMemberIds }) {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getUsers().then((res) => {
        const available = (res.data.users || []).filter(
          (u) => !existingMemberIds.includes(u._id)
        );
        setUsers(available);
      }).catch(() => setError('Failed to load users.'));
    }
  }, [isOpen, existingMemberIds]);

  const handleAdd = async () => {
    if (!selectedUser) return setError('Please select a user.');
    setError(''); setLoading(true);
    try {
      await onAdd(selectedUser);
      setSelectedUser('');
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add Member">
      {error && <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">{error}</div>}
      <div className="space-y-4">
        <div>
          <label className="label">Select User</label>
          <select className="input" value={selectedUser} onChange={(e) => setSelectedUser(e.target.value)}>
            <option value="">Choose a user...</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.email})</option>)}
          </select>
        </div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn-secondary flex-1">Cancel</button>
          <button onClick={handleAdd} disabled={loading} className="btn-primary flex-1">
            {loading ? 'Adding...' : 'Add Member'}
          </button>
        </div>
      </div>
    </Modal>
  );
}

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [view, setView] = useState('kanban'); // 'kanban' | 'list'
  const [showEdit, setShowEdit] = useState(false);
  const [showCreateTask, setShowCreateTask] = useState(false);
  const [showAddMember, setShowAddMember] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [toast, setToast] = useState('');

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(''), 3000);
  };

  const fetchProject = async () => {
    try {
      const res = await getProject(id);
      setProject(res.data.project);
      setTasks(res.data.tasks || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProject(); }, [id]);

  const isOwner = project?.owner?._id === user?._id;
  const canEdit = isOwner || isAdmin;

  const handleUpdateProject = async (payload) => {
    const res = await updateProject(id, payload);
    setProject(res.data.project);
    showToast('Project updated.');
  };

  const handleDeleteProject = async () => {
    if (!window.confirm('Delete this project and all its tasks? This cannot be undone.')) return;
    try {
      await deleteProject(id);
      navigate('/projects');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete project.');
    }
  };

  const handleCreateTask = async (payload) => {
    const res = await createTask(payload);
    setTasks((prev) => [res.data.task, ...prev]);
    showToast('Task created.');
  };

  const handleUpdateTaskStatus = async (taskId, status) => {
    try {
      const res = await updateTask(taskId, { status });
      setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to update task.');
    }
  };

  const handleUpdateTask = async (taskId, payload) => {
    const res = await updateTask(taskId, payload);
    setTasks((prev) => prev.map((t) => (t._id === taskId ? res.data.task : t)));
    showToast('Task updated.');
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
      showToast('Task deleted.');
    } catch (err) {
      showToast(err.response?.data?.message || 'Failed to delete task.');
    }
  };

  const handleAddMember = async (userId) => {
    const res = await addMember(id, userId);
    setProject(res.data.project);
    showToast('Member added.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">{error}</div>;
  }

  const tasksByStatus = {
    todo: tasks.filter((t) => t.status === 'todo'),
    'in-progress': tasks.filter((t) => t.status === 'in-progress'),
    done: tasks.filter((t) => t.status === 'done'),
  };

  const existingMemberIds = [
    project?.owner?._id,
    ...(project?.members?.map((m) => m._id) || []),
  ];

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm shadow-lg">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <button onClick={() => navigate('/projects')} className="text-gray-400 hover:text-gray-600 text-sm">
              ← Projects
            </button>
          </div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">{project?.title}</h1>
            <StatusBadge type="status" value={project?.status} />
          </div>
          {project?.description && (
            <p className="text-gray-500 text-sm mt-1">{project.description}</p>
          )}
          {project?.deadline && (
            <p className="text-xs text-gray-400 mt-1">Deadline: {formatDate(project.deadline)}</p>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {canEdit && (
            <>
              <button onClick={() => setShowAddMember(true)} className="btn-secondary gap-1.5 text-sm">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                </svg>
                Add Member
              </button>
              <button onClick={() => setShowEdit(true)} className="btn-secondary text-sm">Edit</button>
            </>
          )}
          {isAdmin && (
            <button onClick={handleDeleteProject} className="btn-danger text-sm">Delete</button>
          )}
          {canEdit && (
            <button onClick={() => setShowCreateTask(true)} className="btn-primary gap-1.5 text-sm">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Task
            </button>
          )}
        </div>
      </div>

      {/* Members */}
      <div className="card">
        <h2 className="font-semibold text-gray-900 mb-3">Team Members</h2>
        <div className="flex flex-wrap gap-3">
          {/* Owner */}
          <div className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2">
            <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
              {project?.owner?.name?.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{project?.owner?.name}</p>
              <p className="text-xs text-blue-600">Owner</p>
            </div>
          </div>
          {project?.members?.map((member) => (
            <div key={member._id} className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2">
              <div className="w-7 h-7 bg-gray-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {member.name?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{member.name}</p>
                <p className="text-xs text-gray-500">Member</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Tasks */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Tasks ({tasks.length})</h2>
          <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setView('kanban')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'kanban' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Kanban
            </button>
            <button
              onClick={() => setView('list')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'list' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              List
            </button>
          </div>
        </div>

        {view === 'kanban' ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { key: 'todo', label: 'To Do', color: 'bg-gray-100' },
              { key: 'in-progress', label: 'In Progress', color: 'bg-blue-50' },
              { key: 'done', label: 'Done', color: 'bg-green-50' },
            ].map(({ key, label, color }) => (
              <div key={key} className={`${color} rounded-xl p-3`}>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-semibold text-gray-700">{label}</h3>
                  <span className="text-xs bg-white rounded-full px-2 py-0.5 text-gray-500 font-medium">
                    {tasksByStatus[key].length}
                  </span>
                </div>
                <div className="space-y-2">
                  {tasksByStatus[key].map((task) => (
                    <TaskCard
                      key={task._id}
                      task={task}
                      canEdit={canEdit}
                      canDelete={canEdit}
                      onClick={() => setEditTask(task)}
                      onStatusChange={handleUpdateTaskStatus}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                  {tasksByStatus[key].length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-4">No tasks</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            {tasks.length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-8">No tasks yet.</p>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden sm:table-cell">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden md:table-cell">Priority</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 hidden lg:table-cell">Assignee</th>
                    {canEdit && <th className="px-4 py-3" />}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {tasks.map((task) => (
                    <tr key={task._id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-900">{task.title}</td>
                      <td className="px-4 py-3 hidden sm:table-cell">
                        {canEdit ? (
                          <select
                            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white"
                            value={task.status}
                            onChange={(e) => handleUpdateTaskStatus(task._id, e.target.value)}
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
                      {canEdit && (
                        <td className="px-4 py-3 text-right">
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                            aria-label="Delete task"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </div>

      {/* Modals */}
      <EditProjectModal
        isOpen={showEdit}
        onClose={() => setShowEdit(false)}
        project={project}
        onSave={handleUpdateProject}
      />
      <CreateTaskModal
        isOpen={showCreateTask}
        onClose={() => setShowCreateTask(false)}
        projectId={id}
        members={project?.members}
        owner={project?.owner}
        onCreate={handleCreateTask}
      />
      <AddMemberModal
        isOpen={showAddMember}
        onClose={() => setShowAddMember(false)}
        onAdd={handleAddMember}
        existingMemberIds={existingMemberIds}
      />
      {editTask && (
        <EditTaskModal
          isOpen={Boolean(editTask)}
          onClose={() => setEditTask(null)}
          task={editTask}
          members={project?.members}
          owner={project?.owner}
          onSave={handleUpdateTask}
        />
      )}
    </div>
  );
}
