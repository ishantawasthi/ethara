import React from 'react';
import StatusBadge from './StatusBadge.jsx';
import { formatDate, isOverdue } from '../utils/formatDate.js';

/**
 * Card component for displaying a task summary.
 * Supports quick status cycling and edit/delete actions.
 */
export default function TaskCard({ task, onClick, onDelete, onStatusChange, canDelete, canEdit }) {
  const overdue = isOverdue(task.dueDate) && task.status !== 'done';

  const statusFlow = { todo: 'in-progress', 'in-progress': 'done', done: 'todo' };
  const statusLabel = { todo: '▶ Start', 'in-progress': '✓ Complete', done: '↺ Reopen' };
  const statusBtnColor = {
    todo: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    'in-progress': 'bg-green-50 text-green-600 hover:bg-green-100',
    done: 'bg-gray-50 text-gray-500 hover:bg-gray-100',
  };

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow group"
      role="article"
      aria-label={`Task: ${task.title}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3
          className="text-sm font-semibold text-gray-900 line-clamp-2 flex-1 cursor-pointer hover:text-blue-600 transition-colors"
          onClick={onClick}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
        >
          {task.title}
        </h3>
        <div className="flex items-center gap-1 flex-shrink-0">
          {canEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onClick?.(); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 transition-all"
              aria-label="Edit task"
              title="Edit task"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </button>
          )}
          {canDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete?.(task._id); }}
              className="opacity-0 group-hover:opacity-100 p-1 rounded text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"
              aria-label="Delete task"
              title="Delete task"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Description */}
      {task.description && (
        <p className="text-xs text-gray-400 line-clamp-2 mb-2">{task.description}</p>
      )}

      {/* Priority badge */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <StatusBadge type="priority" value={task.priority} />
        {overdue && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-600">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            Overdue
          </span>
        )}
      </div>

      {/* Quick status button */}
      {onStatusChange && (
        <button
          onClick={(e) => { e.stopPropagation(); onStatusChange(task._id, statusFlow[task.status]); }}
          className={`w-full text-xs font-medium py-1.5 px-3 rounded-lg transition-colors mb-3 ${statusBtnColor[task.status]}`}
          aria-label={`Mark task as ${statusFlow[task.status]}`}
        >
          {statusLabel[task.status]}
        </button>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between text-xs text-gray-500">
        {/* Assignee */}
        <div className="flex items-center gap-1.5">
          {task.assignedTo ? (
            <>
              <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs font-medium">
                {task.assignedTo.name?.charAt(0).toUpperCase()}
              </div>
              <span className="truncate max-w-[80px]">{task.assignedTo.name}</span>
            </>
          ) : (
            <span className="text-gray-400 italic">Unassigned</span>
          )}
        </div>

        {/* Due date */}
        {task.dueDate && (
          <span className={`flex items-center gap-1 ${overdue ? 'text-red-500 font-medium' : ''}`}>
            {formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}
