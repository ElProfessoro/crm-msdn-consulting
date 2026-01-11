// ============================================
// Client API - Communication avec le backend
// ============================================

const API_BASE_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:8787'
  : 'https://crm-api.msalla-youssef.workers.dev';

class APIClient {
  constructor() {
    this.token = localStorage.getItem('token');
    this.API_URL = API_BASE_URL;
  }

  setToken(token) {
    this.token = token;
    if (token) {
      localStorage.setItem('token', token);
    } else {
      localStorage.removeItem('token');
    }
  }

  async request(endpoint, options = {}) {
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const config = {
      ...options,
      headers,
    };

    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur réseau' }));
      throw new Error(error.error || 'Erreur serveur');
    }

    return response.json();
  }

  // Auth
  async login(email, password) {
    const data = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    this.setToken(data.token);
    return data;
  }

  async register(userData) {
    const data = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    this.setToken(data.token);
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  logout() {
    this.setToken(null);
    window.location.href = '/login.html';
  }

  // Leads
  async getLeads(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/leads?${params}`);
  }

  async getLead(id) {
    return this.request(`/leads/${id}`);
  }

  async createLead(leadData) {
    return this.request('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
  }

  async updateLead(id, leadData) {
    return this.request(`/leads/${id}`, {
      method: 'PUT',
      body: JSON.stringify(leadData),
    });
  }

  async deleteLead(id) {
    return this.request(`/leads/${id}`, {
      method: 'DELETE',
    });
  }

  async getLeadActivities(leadId) {
    return this.request(`/leads/${leadId}/activities`);
  }

  async addLeadActivity(leadId, activityData) {
    return this.request(`/leads/${leadId}/activities`, {
      method: 'POST',
      body: JSON.stringify(activityData),
    });
  }

  async quickAction(leadId, actionData) {
    return this.request(`/leads/${leadId}/quick-actions`, {
      method: 'POST',
      body: JSON.stringify(actionData),
    });
  }

  // Tasks
  async getTasks(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/tasks?${params}`);
  }

  async getTask(id) {
    return this.request(`/tasks/${id}`);
  }

  async createTask(taskData) {
    return this.request('/tasks', {
      method: 'POST',
      body: JSON.stringify(taskData),
    });
  }

  async updateTask(id, taskData) {
    return this.request(`/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(taskData),
    });
  }

  async deleteTask(id) {
    return this.request(`/tasks/${id}`, {
      method: 'DELETE',
    });
  }

  // Dashboard
  async getDashboardStats() {
    return this.request('/dashboard/stats');
  }

  async getPriorityTasks() {
    return this.request('/dashboard/priority-tasks');
  }

  async getRecentLeads() {
    return this.request('/dashboard/recent-leads');
  }

  async getRecentActivities() {
    return this.request('/dashboard/recent-activities');
  }

  async getNextAppointment() {
    return this.request('/dashboard/next-appointment');
  }

  // Import
  async uploadImport(file) {
    const formData = new FormData();
    formData.append('file', file);

    const headers = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${API_BASE_URL}/import/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Erreur upload' }));
      throw new Error(error.error || 'Erreur serveur');
    }

    return response.json();
  }

  async processImport(importId, mapping) {
    return this.request(`/import/${importId}/process`, {
      method: 'POST',
      body: JSON.stringify({ mapping }),
    });
  }

  async getImportHistory() {
    return this.request('/import/history');
  }

  // Users
  async getUsers() {
    return this.request('/users');
  }

  // RingOver
  async initiateCall(phoneNumber, leadId) {
    return this.request('/ringover/call', {
      method: 'POST',
      body: JSON.stringify({
        to_number: phoneNumber,
        lead_id: leadId
      }),
    });
  }

  async getRingoverCalls(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request(`/ringover/calls?${params}`);
  }
}

// Instance singleton
const api = new APIClient();

// Export
window.api = api;
