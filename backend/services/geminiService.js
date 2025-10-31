const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Gemini 2.5 Flash (fastest and free)
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

// Test Gemini API connectivity and response
async function testGemini() {
  try {
    const prompt = "Say 'Hello from BC WildWatch!' in a friendly way.";
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return {
      success: true,
      text: response.text(),
      model: 'gemini-2.5-flash'
    };
  } catch (error) {
    console.error('Gemini API Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// General chat function with optional system context
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

// Generate safety tips for encountering a specific animal
async function getSafetyTip(animalType) {
  const prompt = `You are a campus safety advisor for BC WildWatch. Provide safety tips for students who encounter a ${animalType} on campus.

Return your response in this EXACT format as a numbered list:

1. [First safety tip - one clear action]
2. [Second safety tip - one clear action]  
3. [Third safety tip - one clear action]
4. [Fourth safety tip - one clear action]

Keep each tip under 15 words. Focus on immediate, actionable steps. Be clear and direct.`;
  
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    // Parse numbered list into array
    const tips = text
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());
    
    return {
      success: true,
      animalType: animalType,
      tips: tips.length > 0 ? tips : [text]
    };
  } catch (error) {
    console.error('Safety Tip Error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Extract structured incident information from user message
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