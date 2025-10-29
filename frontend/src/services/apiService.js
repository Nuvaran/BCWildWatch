import axios from 'axios';

// Configure base URL (NOTE: Change URL when deployed to vercel)
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
  // Test connection
  async testConnection() {
    try {
      const response = await api.get('/');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Connection test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Test Gemini connection
  async testGemini() {
    try {
      const response = await api.get('/api/gemini/test');
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Gemini test failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Send chat message to Gemini
  async sendMessage(message, context = '') {
    try {
      const response = await api.post('/api/gemini/chat', {
        message,
        context
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Send message failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Get safety tip for specific animal
  async getSafetyTip(animalType) {
    try {
      const response = await api.get(`/api/gemini/safety-tip/${animalType}`);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Get safety tip failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Extract incident information from user message
  async extractIncident(message) {
    try {
      const response = await api.post('/api/gemini/extract-incident', {
        message
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Extract incident failed:', error);
      return { success: false, error: error.message };
    }
  },

  // Submit incident report to Power Automate
  async submitIncidentReport(incidentData) {
    try {
      // This will call your Power Automate flow endpoint (to be created)
      const response = await api.post('/api/incident/submit', incidentData);
      return { success: true, data: response.data };
    } catch (error) {
      console.error('Submit incident failed:', error);
      return { success: false, error: error.message };
    }
  }
};

export default apiService;