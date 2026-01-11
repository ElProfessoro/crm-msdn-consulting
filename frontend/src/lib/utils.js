// ============================================
// Utilities - Fonctions helper
// ============================================

// Formater une date relative (il y a 2h, Hier, etc.)
function formatRelativeTime(dateString) {
  if (!dateString) return '';

  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffSecs < 60) return 'À l\'instant';
  if (diffMins < 60) return `Il y a ${diffMins}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return 'Hier';
  if (diffDays < 7) return `Il y a ${diffDays}j`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem`;

  return date.toLocaleDateString('fr-FR');
}

// Formater une date au format français
function formatDate(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

// Formater une date et heure
function formatDateTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Formater l'heure uniquement
function formatTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

// Obtenir la classe CSS du badge de statut
function getStatusBadgeClass(status) {
  const classes = {
    'nouveau': 'badge-nouveau',
    'en_cours': 'badge-en-cours',
    'gagne': 'badge-gagne',
    'perdu': 'badge-perdu',
    'ne_plus_contacter': 'badge-ne-plus-contacter',
  };
  return classes[status] || 'badge-nouveau';
}

// Obtenir le label français du statut
function getStatusLabel(status) {
  const labels = {
    'nouveau': 'Nouveau',
    'en_cours': 'En cours',
    'gagne': 'Gagné',
    'perdu': 'Perdu',
    'ne_plus_contacter': 'Ne plus contacter',
  };
  return labels[status] || status;
}

// Obtenir le label français du statut de tâche
function getTaskStatusLabel(status) {
  const labels = {
    'a_faire': 'À faire',
    'en_cours': 'En cours',
    'termine': 'Terminé',
  };
  return labels[status] || status;
}

// Obtenir le label français de la priorité
function getPriorityLabel(priority) {
  const labels = {
    'basse': 'Basse',
    'normale': 'Normale',
    'haute': 'Haute',
  };
  return labels[priority] || priority;
}

// Vérifier si l'utilisateur est authentifié
function isAuthenticated() {
  return !!localStorage.getItem('token');
}

// Rediriger vers la page de connexion si non authentifié
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.href = '/login.html';
    return false;
  }
  return true;
}

// Obtenir les initiales d'un nom
function getInitials(firstName, lastName) {
  const first = firstName ? firstName.charAt(0).toUpperCase() : '';
  const last = lastName ? lastName.charAt(0).toUpperCase() : '';
  return first + last;
}

// Afficher un message de succès
function showSuccess(message) {
  // Simple alert pour l'instant, peut être remplacé par un toast
  alert('✓ ' + message);
}

// Afficher un message d'erreur
function showError(message) {
  alert('✗ ' + message);
}

// Parser les tags JSON
function parseTags(tagsString) {
  if (!tagsString) return [];
  try {
    return JSON.parse(tagsString);
  } catch {
    return [];
  }
}

// Debounce pour la recherche
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

// Export vers le scope global
window.utils = {
  formatRelativeTime,
  formatDate,
  formatDateTime,
  formatTime,
  getStatusBadgeClass,
  getStatusLabel,
  getTaskStatusLabel,
  getPriorityLabel,
  isAuthenticated,
  requireAuth,
  getInitials,
  showSuccess,
  showError,
  parseTags,
  debounce,
};
