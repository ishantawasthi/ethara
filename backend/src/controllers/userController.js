import User from '../models/User.js';
import { sendSuccess, sendError } from '../utils/apiResponse.js';
import logger from '../utils/logger.js';

/**
 * @route   GET /api/v1/users
 * @desc    List all users (admin only)
 * @access  Protected + Admin
 */
export const getUsers = async (req, res, next) => {
  try {
    const { search, role } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    return sendSuccess(res, 200, 'Users retrieved successfully.', {
      count: users.length,
      users,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   GET /api/v1/users/:id
 * @desc    Get a user profile (admin or self)
 * @access  Protected
 */
export const getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Only admin or the user themselves can view a profile
    if (req.user.role !== 'admin' && req.user._id.toString() !== id) {
      return sendError(res, 403, 'You can only view your own profile.');
    }

    const user = await User.findById(id);
    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    return sendSuccess(res, 200, 'User retrieved successfully.', { user });
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/users/:id
 * @desc    Update a user's name and/or email (admin only)
 * @access  Protected + Admin
 */
export const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) updates.email = email.trim().toLowerCase();

    if (Object.keys(updates).length === 0) {
      return sendError(res, 400, 'No valid fields provided for update.');
    }

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    logger.info(`User ${id} updated by admin ${req.user._id}`);

    return sendSuccess(res, 200, 'User updated successfully.', { user });
  } catch (error) {
    if (error.code === 11000) {
      return sendError(res, 409, 'Email is already in use.');
    }
    next(error);
  }
};

/**
 * @route   DELETE /api/v1/users/:id
 * @desc    Delete a user (admin only, cannot delete self)
 * @access  Protected + Admin
 */
export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user._id.toString() === id) {
      return sendError(res, 400, 'You cannot delete your own account.');
    }

    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    logger.info(`User ${id} deleted by admin ${req.user._id}`);

    return sendSuccess(res, 200, 'User deleted successfully.');
  } catch (error) {
    next(error);
  }
};

/**
 * @route   PUT /api/v1/users/:id/role
 * @desc    Change a user's role (admin only)
 * @access  Protected + Admin
 */
export const updateUserRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['admin', 'member'].includes(role)) {
      return sendError(res, 400, 'Role must be either admin or member.');
    }

    // Prevent admin from demoting themselves
    if (req.user._id.toString() === id && role !== 'admin') {
      return sendError(res, 400, 'You cannot change your own role.');
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role },
      { new: true, runValidators: true }
    );

    if (!user) {
      return sendError(res, 404, 'User not found.');
    }

    logger.info(`User ${id} role changed to ${role} by admin ${req.user._id}`);

    return sendSuccess(res, 200, `User role updated to ${role}.`, { user });
  } catch (error) {
    next(error);
  }
};
