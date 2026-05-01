import { body, param } from 'express-validator';

export const createProjectValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Project title is required.')
    .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('status')
    .optional()
    .isIn(['active', 'archived']).withMessage('Status must be active or archived.'),

  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date.')
    .toDate(),
];

export const updateProjectValidator = [
  param('id')
    .isMongoId().withMessage('Invalid project ID.'),

  body('title')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 }).withMessage('Title must be between 2 and 100 characters.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('status')
    .optional()
    .isIn(['active', 'archived']).withMessage('Status must be active or archived.'),

  body('deadline')
    .optional()
    .isISO8601().withMessage('Deadline must be a valid date.')
    .toDate(),
];

export const addMemberValidator = [
  param('id')
    .isMongoId().withMessage('Invalid project ID.'),

  body('userId')
    .notEmpty().withMessage('User ID is required.')
    .isMongoId().withMessage('Invalid user ID.'),
];
