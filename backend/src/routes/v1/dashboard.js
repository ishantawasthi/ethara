import { Router } from 'express';
import { getDashboardStats } from '../../controllers/dashboardController.js';
import verifyToken from '../../middleware/auth.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Dashboard
 *   description: Dashboard statistics
 */

/**
 * @swagger
 * /dashboard:
 *   get:
 *     summary: Get dashboard statistics for the current user
 *     tags: [Dashboard]
 *     responses:
 *       200:
 *         description: Dashboard stats including project counts, task status breakdown, overdue tasks, and recent activity
 */
router.get('/', verifyToken, getDashboardStats);

export default router;
