// Centralized list of valid roles
const ROLES = [
  'viewer',
  'banned',
  'editor_all',
  'editor_own',
  'contributor'
];

// Business logic helpers
function isEditor(role) {
  return role === 'editor_all' || role === 'editor_own';
}

function isViewer(role) {
  return role === 'viewer';
}

function isContributor(role) {
  return role === 'contributor';
}

function isBanned(role) {
  return role === 'banned';
}

module.exports = {
  ROLES,
  isEditor,
  isViewer,
  isContributor,
  isBanned
}; 
