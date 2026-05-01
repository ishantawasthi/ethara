import React from 'react';
import { STATUS_COLORS, PRIORITY_COLORS, ROLE_COLORS } from '../utils/constants.js';

/**
 * Colored pill badge for status, priority, or role values.
 */
export default function StatusBadge({ type = 'status', value }) {
  if (!value) return null;

  let colorClass = '';
  let label = value;

  if (type === 'status') {
    colorClass = STATUS_COLORS[value] || 'bg-gray-100 text-gray-600';
    const labels = { todo: 'To Do', 'in-progress': 'In Progress', done: 'Done', active: 'Active', archived: 'Archived' };
    label = labels[value] || value;
  } else if (type === 'priority') {
    colorClass = PRIORITY_COLORS[value] || 'bg-gray-100 text-gray-600';
    label = value.charAt(0).toUpperCase() + value.slice(1);
  } else if (type === 'role') {
    colorClass = ROLE_COLORS[value] || 'bg-gray-100 text-gray-600';
    label = value.charAt(0).toUpperCase() + value.slice(1);
  }

  return (
    <span className={`badge ${colorClass}`}>
      {label}
    </span>
  );
}
