require('dotenv').config();
const express = require('express');
const cors = require('cors');

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
      test: '/api/test',
      chat: '/api/chat (coming soon)'
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    geminiConfigured: !!process.env.GEMINI_API_KEY
  });
});

// Test endpoint with parameters
app.get('/api/test', (req, res) => {
  console.log('✅ /api/test endpoint hit!');
  console.log('Query params:', req.query);
  const name = req.query.name || 'Student';
  res.json({
    message: `Hello ${name}! 👋`,
    info: 'BC WildWatch is ready to help you report animal sightings.',
    testData: {
      animalTypes: ['snake', 'bee', 'dog', 'lizard', 'cockroach'],
      campusLocations: ['Library', 'Cafeteria', 'Parking Lot', 'Sports Field']
    }
  });
});

// POST test endpoint
app.post('/api/test', (req, res) => {
  const { message } = req.body;
  res.json({
    received: message,
    echo: `You said: "${message}"`,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res, next) => {
  res.status(404).json({
    error: 'Endpoint not found',
    availableEndpoints: ['/', '/health', '/api/test']
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
  console.log(`🧪 Test endpoint: http://localhost:${PORT}/api/test?name=YourName`);
  console.log(`\n🔑 Gemini API Key: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ Missing'}`);
});