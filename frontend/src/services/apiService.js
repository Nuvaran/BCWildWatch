import axios from 'axios';

// Configure base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});

// API Service Methods
const apiService = {
  // ==== CHATBOT INTERACTIONS ==== //
  async sendMessage(userId, message, messageType = 'text') {
    try {
      const response = await api.post('/api/chat/message', {
        userId,
        message,
        messageType
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Send message failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Retrieve safety tips for a user
  async getSafetyTips(userId) {
    try {
      const response = await api.post('/api/chat/safety-tips', { userId });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get safety tips failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Submit incident report
  async submitIncident(reportData) {
    try {
      const response = await api.post('/api/chat/submit-incident', { reportData });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Submit incident failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Reset conversation for a user
  async resetConversation(userId) {
    try {
      const response = await api.post('/api/chat/reset', { userId });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Reset conversation failed:', error);
      return { success: false, error: error.message };
    }
  },

  // ==== SYSTEM HEALTH CHECKS ==== //
  async testConnection() {
    try {
      const response = await api.get('/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  async checkHealth() {
    try {
      const response = await api.get('/health');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Health check failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test Gemini integration
  async testGemini() {
    try {
      const response = await api.get('/api/gemini/test');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Gemini test failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default apiService;