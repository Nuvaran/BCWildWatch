const {GoogleGenerativeAI} = require('google-generative-ai');
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({model: 'gemini-1.5-flash'});

// Testing the Gemini API connection
async function testGemini(){
    try {
        const prompt = "Say 'Hello from BC WildWatch!' in a friendly way."
        const result = await model.generateContent(prompt);
        const response = await result.response;
        return {
            success: true,
            text:  response.text(),
            model: 'gemini-1.5-flash'
        };
    }
    catch (error) {
        console.error("Gemini API test failed:", error);
        return {
            success: false,
            error: error.message
        };
    };
};

// Send a message to Gemini and get a response
async function chat(message, systemContext = "") {
    try {
        const fullPrompt = systemContext
            ? `${systemContext}\nUser: ${message}\nAssistant:`
            : message;
        
        const result = await model.generateContent(fullPrompt);
        const response = await result.response;

        return {
            success: true,
            message: response.text(),
            tokensUsed: result.response.promptTokenCount || 0,
            completion: result.response.candidatesTokenCount || 0
        }
    }
    catch (error) {
        console.error("Error during Gemini chat:", error);
        return {
            success: false,
            error: error.message    
        };
    };
};

// Getting a safety tip for a specific animal type
async function getSafetyTip(animalType) {
    const prompt = `You are a campus safety advisor. Provide a brief, practical safety tip for students who encounter a ${animalType} on campus. Keep it under 50 words and actionable.`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;

        return {
            success: true,
            animalType: animalType,
            tip: response.text()
        };
    }
    catch (error) {
        console.error(`Error getting safety tip:`, error);
        return {
            success: false,
            error: error.message    
        };
    };
};

// Extracting incident information from users description
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
    }
    catch (error) {
        console.error(`Error extracting incident info:`, error);
        return {
            success: false,
            error: error.message    
        };
    };
};

module.exports = {
    testGemini,
    chat,
    getSafetyTip,
    extractIncidentInfo
}