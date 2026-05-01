import Task from '../models/Task.js';
import Project from '../models/Project.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * Helper: check if user has access to a project (owner, member, or admin)
 */
const userHasProjectAccess = (project, userId, userRole) => {
  if (userRole === 'admin') return true;
  const ownerMatch = project.owner.toString() === userId.toString();
  const memberMatch = (project.members || []).map((m) => m.toString()).includes(userId.toString());
  return ownerMatch || memberMatch;
};

/**
 * @route   GET /api/v1/tasks
 * @desc    List tasks with optional filters
 * @access  Protected
 */
export const getTasks = async (req, res, next) => {
  try {
    const { project, status, priority, assignedTo } = req.query;
    const filter = {};

    if (project) filter.project = project;
    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assignedTo) filter.assignedTo = assignedTo;

    // Non-admins can only see tasks in their projects
    if (req.user.role !== 'admin') {
      const accessibleProjects = await Project.find({
        $or: [{ owner: req.user._id }, { members: req.user._id }],
      }).select('_id');
      const projectIds = accessibleProjects.map((p) => p._id);

      if (filter.project) {
        // Verify the requested project is accessible
        if (!projectIds.map((id) => id.toString()).includes(filter.project)) {
          return sendError(res, 403, 'You do not have access to this project.');
        }
      } else {
        filter.project = { $in: projectIds };
      }
    }

    const tasks = await Task.find(filter)
      .populate('project', 'title status')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Tasks retrieved successfully.', {
      count: tasks.length,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/tasks
 * @desc    Create a task (project owner or admin)
 * @access  Protected
 */
export const createTask = async (req, res, next) => {
  try {
    const { title, description, project: projectId, assignedTo, status, priority, dueDate } = req.body;

    const project = await Project.findById(projectId);
    if (!project) {
      return sendError(res, 404, 'Project not found.');
    }

    // Only project owner or admin can create tasks
    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the project owner or an admin can create tasks.');
    }

    // Validate assignedTo is a project member or owner
    if (assignedTo) {
      const isProjectOwner = project.owner.toString() === assignedTo.toString();
      const isProjectMember = (project.members || []).map((m) => m.toString()).includes(assignedTo.toString());
      if (!isProjectOwner && !isProjectMember) {
        return sendError(res, 400, 'Assigned user must be a member of the project.');
      }
    }

    const task = await Task.create({
      title,
      description,
      project: projectId,
      assignedTo: assignedTo || null,
      createdBy: req.user._id,
      status,
      priority,
      dueDate,
    });

    await task.populate('project', 'title');
    await task.populate('assignedTo', 'name email');
    await task.populate('createdBy', 'name email');

    logger.info(`Task created: "${title}" in project ${projectId} by user ${req.user._id}`);

    return sendSuccess(res, 201, 'Task created successfully.', { task });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/tasks/:id
 * @desc    Get a single task
 * @access  Protected
 */
export const getTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id)
      .populate('project', 'title status owner members')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    if (!task) {
      return sendError(res, 404, 'Task not found.');
    }

    // Check access
    if (req.user.role !== 'admin') {
      const hasAccess = userHasProjectAccess(task.project, req.user._id, req.user.role);
      if (!hasAccess) {
        return sendError(res, 403, 'You do not have access to this task.');
      }
    }

    return sendSuccess(res, 200, 'Task retrieved successfully.', { task });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/tasks/:id
 * @desc    Update a task
 *          - Assignee: can only update status
 *          - Owner/Admin: can update all fields
 * @access  Protected
 */
export const updateTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'owner members');

    if (!task) {
      return sendError(res, 404, 'Task not found.');
    }

    const isAdmin = req.user.role === 'admin';
    const isProjectOwner = task.project.owner.toString() === req.user._id.toString();
    const isAssignee =
      task.assignedTo && task.assignedTo.toString() === req.user._id.toString();

    if (!isAdmin && !isProjectOwner && !isAssignee) {
      return sendError(res, 403, 'You do not have permission to update this task.');
    }

    let updates = {};

    if (isAdmin || isProjectOwner) {
      // Full update access
      const { title, description, assignedTo, status, priority, dueDate } = req.body;
      if (title !== undefined) updates.title = title;
      if (description !== undefined) updates.description = description;
      if (assignedTo !== undefined) updates.assignedTo = assignedTo;
      if (status !== undefined) updates.status = status;
      if (priority !== undefined) updates.priority = priority;
      if (dueDate !== undefined) updates.dueDate = dueDate;
    } else if (isAssignee) {
      // Assignee can only update status
      if (req.body.status !== undefined) {
        updates.status = req.body.status;
      } else {
        return sendError(res, 403, 'As an assignee, you can only update the task status.');
      }
    }

    const updated = await Task.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('project', 'title status')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    logger.info(`Task updated: ${req.params.id} by user ${req.user._id}`);

    return sendSuccess(res, 200, 'Task updated successfully.', { task: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/tasks/:id
 * @desc    Delete a task (project owner or admin)
 * @access  Protected
 */
export const deleteTask = async (req, res, next) => {
  try {
    const task = await Task.findById(req.params.id).populate('project', 'owner');

    if (!task) {
      return sendError(res, 404, 'Task not found.');
    }

    const isProjectOwner = task.project.owner.toString() === req.user._id.toString();
    if (!isProjectOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the project owner or an admin can delete tasks.');
    }

    await task.deleteOne();

    logger.info(`Task deleted: ${req.params.id} by user ${req.user._id}`);

    return sendSuccess(res, 200, 'Task deleted successfully.');
  } catch (error) {
    next(error);
  }
};
