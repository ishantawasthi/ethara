import { Router } from 'express';
import { getUsers, getUserById, updateUser, updateUserRole, deleteUser } from '../../controllers/userController.js';
import verifyToken from '../../middleware/auth.js';
import authorize from '../../middleware/authorize.js';
import validate from '../../middleware/validate.js';
import { body, param } from 'express-validator';

const router = Router();

router.use(verifyToken);

/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management endpoints
 */

/**
 * @swagger
 * /users:
 *   get:
 *     summary: List all users (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *           enum: [admin, member]
 *     responses:
 *       200:
 *         description: List of users
 *       403:
 *         description: Admin only
 */
router.get('/', authorize('admin'), getUsers);

/**
 * @swagger
 * /users/{id}:
 *   get:
 *     summary: Get a user profile (admin or self)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User profile
 *       403:
 *         description: Access denied
 */
router.get('/:id', getUserById);

/**
 * @swagger
 * /users/{id}/role:
 *   put:
 *     summary: Change a user's role (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [role]
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [admin, member]
 *     responses:
 *       200:
 *         description: Role updated
 */
router.put(
  '/:id/role',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID.'),
    body('role').isIn(['admin', 'member']).withMessage('Role must be admin or member.'),
  ],
  validate,
  updateUserRole
);

/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user's name/email (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: User updated
 */
router.put(
  '/:id',
  authorize('admin'),
  [
    param('id').isMongoId().withMessage('Invalid user ID.'),
    body('name').optional().isLength({ min: 2, max: 50 }).withMessage('Name must be 2–50 characters.'),
    body('email').optional().isEmail().withMessage('Please provide a valid email.'),
  ],
  validate,
  updateUser
);

/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user (admin only)
 *     tags: [Users]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User deleted
 */
router.delete(
  '/:id',
  authorize('admin'),
  [param('id').isMongoId().withMessage('Invalid user ID.')],
  validate,
  deleteUser
);

export default router;
