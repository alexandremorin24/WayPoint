// Centralized list of valid roles
const ROLES = [
  'viewer',
  'editor'
];

// Role permissions mapping
const ROLE_PERMISSIONS = {
  viewer: ['view'],
  editor: ['view', 'create', 'edit', 'delete']
};

// Simple helper functions
function isEditor(role) {
  return role === 'editor';
}

function isViewer(role) {
  return role === 'viewer';
}

function getRolePermissions(role) {
  return ROLE_PERMISSIONS[role] || [];
}

/**
 * Check if role has specific permission
 * @param {string} role
 * @param {string} permission
 * @returns {boolean}
 */
function hasPermission(role, permission) {
  const permissions = getRolePermissions(role);
  return permissions.includes(permission);
}

/**
 * Check if a role is valid
 * @param {string} role
 * @returns {boolean}
 */
function isValidRole(role) {
  return ROLES.includes(role);
}

module.exports = {
  ROLES,
  ROLE_PERMISSIONS,
  isEditor,
  isViewer,
  getRolePermissions,
  hasPermission,
  isValidRole
}; 
