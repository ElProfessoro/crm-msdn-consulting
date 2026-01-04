// ============================================
// Composant Sidebar - Navigation principale
// ============================================

class Sidebar {
  constructor(activePage) {
    this.activePage = activePage;
    this.currentUser = null;
  }

  async init() {
    try {
      const response = await api.getMe();
      this.currentUser = response.user;
      this.render();
    } catch (error) {
      console.error('Error loading user:', error);
      api.logout();
    }
  }

  render() {
    const sidebarHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="sidebar-logo">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 11l3 3L22 4M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/>
            </svg>
          </div>
          <div class="sidebar-title">CRM Pro</div>
        </div>

        <nav class="sidebar-nav">
          <a href="/dashboard.html" class="nav-item ${this.activePage === 'dashboard' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="7" height="7"/>
              <rect x="14" y="3" width="7" height="7"/>
              <rect x="14" y="14" width="7" height="7"/>
              <rect x="3" y="14" width="7" height="7"/>
            </svg>
            Tableau de bord
          </a>

          <a href="/leads.html" class="nav-item ${this.activePage === 'leads' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
            Leads
          </a>

          <a href="/tasks.html" class="nav-item ${this.activePage === 'tasks' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4"/>
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
            </svg>
            Tâches
          </a>

          <a href="/import.html" class="nav-item ${this.activePage === 'import' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Importer
          </a>

          ${this.currentUser?.role === 'admin' ? `
          <a href="/admin.html" class="nav-item ${this.activePage === 'admin' ? 'active' : ''}">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="3"/>
              <path d="M12 1v6m0 6v6"/>
              <path d="m4.93 4.93 4.24 4.24m5.66 5.66 4.24 4.24"/>
              <path d="M1 12h6m6 0h6"/>
              <path d="m4.93 19.07 4.24-4.24m5.66-5.66 4.24-4.24"/>
            </svg>
            Administration
          </a>
          ` : ''}
        </nav>

        <div class="sidebar-footer">
          <div class="user-profile">
            <div class="user-avatar">
              ${window.utils.getInitials(this.currentUser?.first_name, this.currentUser?.last_name)}
            </div>
            <div class="user-info">
              <div class="user-name">${this.currentUser?.first_name} ${this.currentUser?.last_name}</div>
              <div class="user-role">${this.currentUser?.role === 'admin' ? 'Administrateur' : 'Collaborateur'}</div>
            </div>
          </div>
          <button
            onclick="api.logout()"
            style="margin-top: 12px; width: 100%; padding: 8px; background: #f3f4f6; border: none; border-radius: 6px; cursor: pointer; font-size: 13px; color: #6b7280;"
          >
            Déconnexion
          </button>
        </div>
      </aside>
    `;

    // Insérer au début du body
    document.body.insertAdjacentHTML('afterbegin', sidebarHTML);
  }
}

// Export
window.Sidebar = Sidebar;
