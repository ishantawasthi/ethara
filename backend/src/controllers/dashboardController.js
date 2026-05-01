import Project from '../models/Project.js';
import Task from '../models/Task.js';
import { sendSuccess } from '../utils/apiResponse.js';

/**
 * @route   GET /api/v1/dashboard
 * @desc    Get dashboard statistics for the current user
 * @access  Protected
 */
export const getDashboardStats = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const isAdmin = req.user.role === 'admin';

    // Build project filter based on role
    const projectFilter = isAdmin
      ? {}
      : { $or: [{ owner: userId }, { members: userId }] };

    const accessibleProjects = await Project.find(projectFilter).select('_id');
    const projectIds = accessibleProjects.map((p) => p._id);

    // Build task filter
    const taskFilter = isAdmin ? {} : { project: { $in: projectIds } };

    // Run all aggregations in parallel
    const [
      totalProjects,
      activeProjects,
      archivedProjects,
      tasksByStatus,
      tasksByPriority,
      overdueTasks,
      recentTasks,
    ] = await Promise.all([
      Project.countDocuments(projectFilter),
      Project.countDocuments({ ...projectFilter, status: 'active' }),
      Project.countDocuments({ ...projectFilter, status: 'archived' }),

      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$status', count: { $sum: 1 } } },
      ]),

      Task.aggregate([
        { $match: taskFilter },
        { $group: { _id: '$priority', count: { $sum: 1 } } },
      ]),

      Task.countDocuments({
        ...taskFilter,
        dueDate: { $lt: new Date() },
        status: { $ne: 'done' },
      }),

      Task.find(taskFilter)
        .populate('project', 'title')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .limit(10),
    ]);

    // Normalize task status counts
    const statusCounts = { todo: 0, 'in-progress': 0, done: 0 };
    tasksByStatus.forEach(({ _id, count }) => { statusCounts[_id] = count; });

    const priorityCounts = { low: 0, medium: 0, high: 0 };
    tasksByPriority.forEach(({ _id, count }) => { priorityCounts[_id] = count; });

    const totalTasks = Object.values(statusCounts).reduce((a, b) => a + b, 0);

    return sendSuccess(res, 200, 'Dashboard stats retrieved successfully.', {
      projects: {
        total: totalProjects,
        active: activeProjects,
        archived: archivedProjects,
      },
      tasks: {
        total: totalTasks,
        byStatus: statusCounts,
        byPriority: priorityCounts,
        overdue: overdueTasks,
      },
      recentTasks,
    });
  } catch (error) {
    next(error);
  }
};
