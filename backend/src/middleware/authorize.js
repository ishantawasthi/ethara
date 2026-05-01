import { sendError } from '../utils/apiResponse.js';

/**
 * Role-based access control middleware.
 * Usage: authorize('admin') or authorize('admin', 'member')
 * @param {...string} roles - Allowed roles
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, 'Authentication required.');
    }

    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied. Required role(s): ${roles.join(', ')}. Your role: ${req.user.role}.`
      );
    }

    next();
  };
};

export default authorize;
