const { GoogleGenerativeAI } = require('@google/generative-ai');

// Initialize Gemini API
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Use Pro model
const model = genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });

// Fallback safety tips for each animal
const fallbackTips = {
  snake: [
    "Stay calm and back away slowly.",
    "Do not attempt to touch or capture it.",
    "Alert nearby security or staff.",
    "Keep students and pets clear from area."
  ],
  bee: [
    "Move away slowly from the swarm.",
    "Do not swat at the bees.",
    "Cover your face if necessary.",
    "Alert nearby security or staff."
  ],
  dog: [
    "Keep a safe distance from the dog.",
    "Do not provoke or chase it.",
    "Alert campus security immediately.",
    "Ensure students stay calm and safe."
  ],
  cat: [
    "Do not try to approach or pick up the cat.",
    "Keep students calm and at a safe distance.",
    "Alert campus security if aggressive or injured.",
    "Do not feed or chase it."
  ],
  wasp: [
    "Move away slowly from the wasps.",
    "Avoid sudden movements or swatting.",
    "Cover your face if needed.",
    "Alert nearby staff or security."
  ],
  spider: [
    "Stay calm and back away slowly.",
    "Do not touch the spider.",
    "Alert nearby security or staff.",
    "Keep students clear from the area."
  ]
};

// Retry wrapper for temporary API overloads
async function safeGenerateContent(prompt, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      if (attempt === retries - 1) throw error;
      console.warn(`Gemini request failed (attempt ${attempt + 1}), retrying...`);
      await new Promise(res => setTimeout(res, 1000 * (attempt + 1)));
    }
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
    const text = await safeGenerateContent(prompt);

    // Parse numbered list into array
    const tips = text
      .split('\n')
      .filter(line => line.trim().match(/^\d+\./))
      .map(line => line.replace(/^\d+\.\s*/, '').trim());

    return {
      success: true,
      animalType,
      tips: tips.length > 0 ? tips : fallbackTips[animalType] || ["No tips available."]
    };
  } catch (error) {
    console.error('Safety Tip Error:', error);
    return {
      success: false,
      animalType,
      tips: fallbackTips[animalType] || ["No tips available."],
      error: error.message
    };
  }
}

// Existing functions
async function testGemini() {
  try {
    const prompt = "Say 'Hello from BC WildWatch!' in a friendly way.";
    const text = await safeGenerateContent(prompt);
    return {
      success: true,
      text,
      model: 'gemini-2.5-pro'
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function chat(message, systemContext = '') {
  try {
    const fullPrompt = systemContext 
      ? `${systemContext}\n\nUser: ${message}\n\nAssistant:`
      : message;

    const text = await safeGenerateContent(fullPrompt);
    
    return {
      success: true,
      message: text,
      tokensUsed: {} // optional
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

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
    const text = await safeGenerateContent(prompt);
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const extracted = JSON.parse(jsonMatch[0]);
      return { success: true, data: extracted };
    }
    return { success: false, error: 'Could not extract structured data' };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

module.exports = {
  testGemini,
  chat,
  getSafetyTip,
  extractIncidentInfo
};
