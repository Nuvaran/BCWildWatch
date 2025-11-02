const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Gemini 1.5 Flash (fastest and free)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

/**
 * Test basic Gemini connection
 */
async function testGemini() {
  try {
    const prompt = "Say 'Hello from BC WildWatch!' in a friendly way.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      text: response.text(),
      model: 'gemini-2.5-pro'
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Send a message to Gemini and get a response
 * @param {string} message - User message
 * @param {string} systemContext - Context/instructions for the AI
 */
async function chat(message, systemContext = '') {
  try {
    // Combine system context with user message
    const fullPrompt = systemContext 
      ? `${systemContext}\n\nUser: ${message}\n\nAssistant:`
      : message;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    
    return {
      success: true,
      message: response.text(),
      tokensUsed: {
        prompt: result.response.promptTokenCount || 0,
        completion: result.response.candidatesTokenCount || 0
      }
    };
  } catch (error) {
    console.error('Gemini Chat Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Get a safety tip for a specific animal type
 * @param {string} animalType - Type of animal (snake, bee, dog, etc.)
 */
async function getSafetyTip(animalType) {
  const prompt = `You are a campus safety advisor for BC WildWatch. A student has just reported a ${animalType} on campus.

Provide exactly 4 safety tips as a simple numbered list. Each tip should be one clear, actionable sentence.

Format your response EXACTLY like this (no extra text):

1. First safety tip here
2. Second safety tip here
3. Third safety tip here
4. Fourth safety tip here

Keep each tip under 20 words. Be direct and practical.`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('📋 Raw Gemini response:', text);
    
    // Parse numbered list into array
    const lines = text.split('\n').filter(line => line.trim());
    const tips = [];
    
    for (const line of lines) {
      // Match lines that start with a number and period/dot
      const match = line.match(/^\d+[\.\)]\s*(.+)/);
      if (match && match[1]) {
        tips.push(match[1].trim());
      }
    }
    
    console.log('✅ Parsed tips:', tips);
    
    // If parsing failed, try to extract any useful content
    if (tips.length === 0) {
      console.log('⚠️ Parsing failed, using raw text');
      // Split by newlines and filter empty lines
      const fallbackTips = text
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 10 && !line.toLowerCase().includes('safety tips'));
      
      return {
        success: true,
        animalType: animalType,
        tips: fallbackTips.length > 0 ? fallbackTips : [text]
      };
    }
    
    return {
      success: true,
      animalType: animalType,
      tips: tips
    };
  } catch (error) {
    console.error('Safety Tip Error:', error);
    return {
      success: false,
      error: error.message,
      tips: [
        'Stay calm and maintain a safe distance',
        'Do not approach or provoke the animal',
        'Alert others in the area',
        'Contact campus security immediately'
      ]
    };
  }
}

/**
 * Extract incident information from natural language
 * @param {string} userMessage - User's description of the incident
 */
async function extractIncidentInfo(userMessage) {
  const prompt = `You are analyzing an animal sighting report. Extract the following information from this message:

Message: "${userMessage}"

Extract and return in this exact JSON format:
{
  "animalType": "snake/bee/dog/lizard/cockroach/ant/other",
  "location": "specific location mentioned or 'not specified'",
  "urgency": "low/medium/high",
  "description": "brief summary"
}

Rules:
- urgency is HIGH if: dangerous animal, multiple animals, someone is in danger
- urgency is MEDIUM if: animal is close to buildings/people
- urgency is LOW if: animal is far away or just a sighting
- Only return the JSON, nothing else`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Try to parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return {
        success: true,
        data: extracted
      };
    } else {
      return {
        success: false,
        error: 'Could not extract structured data'
      };
    }
  } catch (error) {
    console.error('Extract Info Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  testGemini,
  chat,
  getSafetyTip,
  extractIncidentInfo
};