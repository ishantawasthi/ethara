import React from 'react';
import { useNavigate } from 'react-router-dom';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, isOverdue } from '../utils/formatDate.js';

/**
 * Card component for displaying a project summary.
 */
export default function ProjectCard({ project }) {
  const navigate = useNavigate();

  const taskCounts = project.taskCounts || { todo: 0, 'in-progress': 0, done: 0 };
  const totalTasks = Object.values(taskCounts).reduce((a, b) => a + b, 0);
  const doneTasks = taskCounts.done || 0;
  const progress = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
  const deadlineOverdue = project.deadline && isOverdue(project.deadline) && project.status !== 'archived';

  return (
    <div
      className="card hover:shadow-md transition-shadow cursor-pointer group"
      onClick={() => navigate(`/projects/${project._id}`)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && navigate(`/projects/${project._id}`)}
      aria-label={`Project: ${project.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <h3 className="font-semibold text-gray-900 text-base line-clamp-1 flex-1">
          {project.title}
        </h3>
        <StatusBadge type="status" value={project.status} />
      </div>

      {/* Description */}
      {project.description && (
        <p className="text-sm text-gray-500 line-clamp-2 mb-4">{project.description}</p>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1.5">
          <span>{doneTasks}/{totalTasks} tasks done</span>
          <span>{progress}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* Members */}
        <div className="flex items-center gap-1.5">
          <div className="flex -space-x-1.5">
            {[project.owner, ...(project.members || [])].slice(0, 3).map((member, i) => (
              <div
                key={member?._id || i}
                className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-medium"
                title={member?.name}
              >
                {member?.name?.charAt(0).toUpperCase() || '?'}
              </div>
            ))}
          </div>
          <span>{(project.members?.length || 0) + 1} member{(project.members?.length || 0) !== 0 ? 's' : ''}</span>
        </div>

        {/* Deadline */}
        {project.deadline && (
          <span className={`flex items-center gap-1 ${deadlineOverdue ? 'text-red-500 font-medium' : ''}`}>
            {deadlineOverdue && (
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            )}
            {formatDate(project.deadline)}
          </span>
        )}
      </div>
    </div>
  );
}
