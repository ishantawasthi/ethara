import { body, param, query } from 'express-validator';

export const createTaskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Task title is required.')
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),

  body('project')
    .notEmpty().withMessage('Project ID is required.')
    .isMongoId().withMessage('Invalid project ID.'),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID for assignedTo.'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date.')
    .toDate(),
];

export const updateTaskValidator = [
  param('id')
    .isMongoId().withMessage('Invalid task ID.'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 150 }).withMessage('Title must be between 2 and 150 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters.'),

  body('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid user ID for assignedTo.'),

  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Status must be todo, in-progress, or done.'),

  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Priority must be low, medium, or high.'),

  body('dueDate')
    .optional()
    .isISO8601().withMessage('Due date must be a valid date.')
    .toDate(),
];

export const listTasksValidator = [
  query('project')
    .optional()
    .isMongoId().withMessage('Invalid project ID filter.'),

  query('assignedTo')
    .optional()
    .isMongoId().withMessage('Invalid assignedTo filter.'),

  query('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done']).withMessage('Invalid status filter.'),

  query('priority')
    .optional()
    .isIn(['low', 'medium', 'high']).withMessage('Invalid priority filter.'),
];
