import AppError from '../utils/AppError.js';

const rbac = (...allowedPermissions) => {
  return (req, _res, next) => {
    try {
      const userPermissions = req.user?.role?.permissions || [];

      const hasAccess = allowedPermissions.some((perm) => {
        const [resource, action] = perm.split('.');
        return userPermissions.some((up) => {
          if (up === '*') return true;
          if (up === `${resource}.*`) return true;
          return up === perm;
        });
      });

      if (!hasAccess) {
        throw new AppError('Insufficient permissions', 403, 'FORBIDDEN');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default rbac;
