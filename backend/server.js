require('dotenv').config();
const express = require('express');
const cors = require('cors');
const geminiService = require('./services/geminiService');
const chatRoutes = require('./routes/chat');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Test endpoint
app.get('/', (req, res) => {
  res.json({
    message: '🐍 BC WildWatch Chatbot API is running!',
    status: 'active',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      chat: '/api/chat/*',
      gemini: '/api/gemini/*'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY,
    powerAutomateConfigured: !!process.env.POWER_AUTOMATE_FLOW_URL
  });
});

// Chat routes
app.use('/api/chat', chatRoutes);

// Test Gemini connection
app.get('/api/gemini/test', async (req, res) => {
  console.log('🤖 Testing Gemini connection...');
  const result = await geminiService.testGemini();
  res.json(result);
});

// Chat with Gemini (direct - for testing)
app.post('/api/gemini/chat', async (req, res) => {
  const { message, context } = req.body;
  
  if (!message) {
    return res.status(400).json({
      success: false,
      error: 'Message is required'
    });
  }

  console.log('💬 Gemini chat:', message);
  const result = await geminiService.chat(message, context);
  res.json(result);
});

// Get safety tip for animal (from Gemini - for testing)
app.get('/api/gemini/safety-tip/:animal', async (req, res) => {
  const { animal } = req.params;
  console.log('🛡️ Getting safety tip for:', animal);
  const result = await geminiService.getSafetyTip(animal);
  res.json(result);
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/health', '/api/chat/message', '/api/chat/safety-tips']
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 BC WildWatch API Server running on http://localhost:${PORT}`);
  console.log(`📝 Test it: http://localhost:${PORT}/`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`💬 Chat endpoint: POST http://localhost:${PORT}/api/chat/message`);
  console.log(`\n🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
  console.log(`🔄 Power Automate: ${process.env.POWER_AUTOMATE_FLOW_URL ? '✅ Configured' : '⚠️  Not configured (optional for testing)'}`);
});