import Project from '../models/Project.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /api/v1/projects
 * @desc    List projects (admin: all, member: own or assigned)
 * @access  Protected
 */
export const getProjects = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    let filter = {};

    if (req.user.role !== 'admin') {
      filter.$or = [
        { owner: req.user._id },
        { members: req.user._id },
      ];
    }

    if (status) filter.status = status;
    if (search) {
      filter.title = { $regex: search, $options: 'i' };
    }

    const projects = await Project.find(filter)
      .populate('owner', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    // Attach task counts
    const projectsWithCounts = await Promise.all(
      projects.map(async (project) => {
        const taskCounts = await Task.aggregate([
          { $match: { project: project._id } },
          { $group: { _id: '$status', count: { $sum: 1 } } },
        ]);
        const counts = { todo: 0, 'in-progress': 0, done: 0 };
        taskCounts.forEach(({ _id, count }) => { counts[_id] = count; });
        return { ...project.toJSON(), taskCounts: counts };
      })
    );

    return sendSuccess(res, 200, 'Projects retrieved successfully.', {
      count: projectsWithCounts.length,
      projects: projectsWithCounts,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/projects
 * @desc    Create a new project
 * @access  Protected
 */
export const createProject = async (req, res, next) => {
  try {
    const { title, description, deadline, status } = req.body;

    const project = await Project.create({
      title,
      description,
      deadline,
      status,
      owner: req.user._id,
      members: [],
    });

    await project.populate('owner', 'name email');

    logger.info(`Project created: "${title}" by user ${req.user._id}`);

    return sendSuccess(res, 201, 'Project created successfully.', { project });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/projects/:id
 * @desc    Get a single project
 * @access  Protected (member must belong to project)
 */
export const getProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('owner', 'name email role')
      .populate('members', 'name email role');

    if (!project) {
      return sendError(res, 404, 'Project not found.');
    }

    // Members can only view projects they belong to
    if (req.user.role !== 'admin') {
      const isMember =
        project.owner._id.toString() === req.user._id.toString() ||
        project.members.some((m) => m._id.toString() === req.user._id.toString());

      if (!isMember) {
        return sendError(res, 403, 'You do not have access to this project.');
      }
    }

    const tasks = await Task.find({ project: project._id })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Project retrieved successfully.', {
      project,
      tasks,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/projects/:id
 * @desc    Update a project (owner or admin)
 * @access  Protected
 */
export const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 404, 'Project not found.');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the project owner or an admin can update this project.');
    }

    const { title, description, status, deadline } = req.body;
    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (status !== undefined) updates.status = status;
    if (deadline !== undefined) updates.deadline = deadline;

    const updated = await Project.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )
      .populate('owner', 'name email')
      .populate('members', 'name email');

    logger.info(`Project updated: ${req.params.id} by user ${req.user._id}`);

    return sendSuccess(res, 200, 'Project updated successfully.', { project: updated });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/projects/:id
 * @desc    Delete a project (admin only)
 * @access  Protected + Admin
 */
export const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 404, 'Project not found.');
    }

    // Delete all tasks belonging to this project
    await Task.deleteMany({ project: project._id });
    await project.deleteOne();

    logger.info(`Project deleted: ${req.params.id} by admin ${req.user._id}`);

    return sendSuccess(res, 200, 'Project and all associated tasks deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   POST /api/v1/projects/:id/members
 * @desc    Add a member to a project (owner or admin)
 * @access  Protected
 */
export const addMember = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return sendError(res, 404, 'Project not found.');
    }

    const isOwner = project.owner.toString() === req.user._id.toString();
    if (!isOwner && req.user.role !== 'admin') {
      return sendError(res, 403, 'Only the project owner or an admin can add members.');
    }

    const { userId } = req.body;

    const userToAdd = await User.findById(userId);
    if (!userToAdd) {
      return sendError(res, 404, 'User not found.');
    }

    // Prevent adding the owner as a member
    if (project.owner.toString() === userId) {
      return sendError(res, 400, 'The project owner is already part of this project.');
    }

    // Prevent duplicate members
    if (project.members.map((m) => m.toString()).includes(userId)) {
      return sendError(res, 409, 'User is already a member of this project.');
    }

    project.members.push(userId);
    await project.save();

    await project.populate('owner', 'name email');
    await project.populate('members', 'name email');

    logger.info(`Member ${userId} added to project ${req.params.id}`);

    return sendSuccess(res, 200, 'Member added successfully.', { project });
  } catch (error) {
    next(error);
  }
};
