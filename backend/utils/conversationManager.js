// Conversation steps enum
const STEPS = {
  GREETING: 'greeting',
  ANIMAL_TYPE: 'animal_type',
  CAMPUS: 'campus',
  LOCATION: 'location',
  DETAILS: 'details',
  PHOTO: 'photo',
  CONFIRM: 'confirm',
  SUBMITTED: 'submitted',
  SAFETY_TIPS: 'safety_tips',
  COMPLETE: 'complete'
};

// Valid options for each step
const VALID_ANIMALS = ['snake', 'bee', 'wasp', 'spider', 'cat', 'dog'];
const VALID_CAMPUSES = ['stellenbosch', 'kempton park', 'pretoria'];

// In-memory conversation storage (replace with Redis in production)
const conversations = new Map();

class ConversationManager {
  constructor() {
    this.conversations = conversations;
  }

  // Initialize new conversation
  createConversation(userId) {
    const conversation = {
      userId,
      step: STEPS.GREETING,
      data: {
        animalType: null,
        campus: null,
        location: {
          longitude: null,
          latitude: null,
          landmark: null
        },
        details: null,
        photoUrl: null,
        reportId: null
      },
      timestamp: new Date()
    };
    
    this.conversations.set(userId, conversation);
    return conversation;
  }

  // Get conversation by userId
  getConversation(userId) {
    return this.conversations.get(userId) || this.createConversation(userId);
  }

  // Update conversation data
  updateConversation(userId, updates) {
    const conversation = this.getConversation(userId);
    
    if (updates.step) {
      conversation.step = updates.step;
    }
    
    if (updates.data) {
      conversation.data = { ...conversation.data, ...updates.data };
    }
    
    // Store the step to return to after editing
    if (updates.editingField) {
      conversation.returnToStep = STEPS.CONFIRM;
      conversation.editingField = updates.editingField;
    }
    
    conversation.timestamp = new Date();
    this.conversations.set(userId, conversation);
    
    return conversation;
  }

  // Move to next step
  nextStep(userId) {
    const conversation = this.getConversation(userId);
    const stepOrder = Object.values(STEPS);
    const currentIndex = stepOrder.indexOf(conversation.step);
    
    if (currentIndex < stepOrder.length - 1) {
      conversation.step = stepOrder[currentIndex + 1];
      conversation.timestamp = new Date();
      this.conversations.set(userId, conversation);
    }
    
    return conversation;
  }

  // Reset conversation
  resetConversation(userId) {
    this.conversations.delete(userId);
    return this.createConversation(userId);
  }

  // Validate animal type
  validateAnimal(input) {
    const normalized = input.toLowerCase().trim();
    return VALID_ANIMALS.find(animal => 
      normalized.includes(animal) || animal.includes(normalized)
    ) || null;
  }

  // Validate campus
  validateCampus(input) {
    const normalized = input.toLowerCase().trim();
    return VALID_CAMPUSES.find(campus => 
      normalized.includes(campus) || campus.includes(normalized)
    ) || null;
  }

  // Validate location coordinates (supports multiple formats)
  validateLocation(input) {
    // Format 1: Decimal degrees with comma: -33.9394, 18.8480
    const decimalMatch = input.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
    
    // Format 2: DMS (Degrees Minutes Seconds): 33°56'21.7"S 18°50'52.8"E
    const dmsMatch = input.match(/(\d+)°(\d+)'([\d.]+)"([NS])\s+(\d+)°(\d+)'([\d.]+)"([EW])/);
    
    if (dmsMatch) {
      // Convert DMS to decimal degrees
      const latDeg = parseInt(dmsMatch[1]);
      const latMin = parseInt(dmsMatch[2]);
      const latSec = parseFloat(dmsMatch[3]);
      const latDir = dmsMatch[4];
      
      const lonDeg = parseInt(dmsMatch[5]);
      const lonMin = parseInt(dmsMatch[6]);
      const lonSec = parseFloat(dmsMatch[7]);
      const lonDir = dmsMatch[8];
      
      let lat = latDeg + (latMin / 60) + (latSec / 3600);
      let lon = lonDeg + (lonMin / 60) + (lonSec / 3600);
      
      if (latDir === 'S') lat = -lat;
      if (lonDir === 'W') lon = -lon;
      
      return {
        valid: true,
        latitude: lat,
        longitude: lon,
        originalFormat: input
      };
    }
    
    if (decimalMatch) {
      const lat = parseFloat(decimalMatch[1]);
      const lon = parseFloat(decimalMatch[2]);
      
      return {
        valid: !isNaN(lon) && !isNaN(lat) && 
               lon >= -180 && lon <= 180 && 
               lat >= -90 && lat <= 90,
        latitude: lat,
        longitude: lon,
        originalFormat: input
      };
    }
    
    return {
      valid: false,
      latitude: null,
      longitude: null,
      originalFormat: input
    };
  }

  // Generate bot response based on current step
  generateResponse(conversation, userMessage = '') {
    const { step, data } = conversation;

    switch (step) {
      case STEPS.GREETING:
        return {
          text: "Hello! 👋 Welcome to BC WildWatch. I can help you report a wildlife or animal incident quickly. Shall we get started?",
          buttons: [
            { label: "Yes ✅", value: "yes" },
            { label: "No ❌", value: "no" }
          ],
          expectsInput: 'button'
        };

      case STEPS.ANIMAL_TYPE:
        return {
          text: "First, what type of animal is involved in the incident?",
          buttons: [
            { label: "🐍 Snake", value: "snake" },
            { label: "🐝 Bee", value: "bee" },
            { label: "🐝 Wasp", value: "wasp" },
            { label: "🕷️ Spider", value: "spider" },
            { label: "🐱 Cat", value: "cat" },
            { label: "🐶 Dog", value: "dog" }
          ],
          expectsInput: 'button_or_text'
        };

      case STEPS.CAMPUS:
        return {
          text: "Which campus did this incident occur on?",
          buttons: [
            { label: "Stellenbosch", value: "stellenbosch" },
            { label: "Kempton Park", value: "kempton park" },
            { label: "Pretoria", value: "pretoria" }
          ],
          expectsInput: 'button_or_text'
        };

      case STEPS.LOCATION:
        return {
          text: "Please provide the location of the incident. You can use one of these formats:\n\n" +
                "• GPS Coordinates: 33°56'21.7\"S 18°50'52.8\"E\n" +
                "• Or: -33.9394, 18.8480\n" +
                "• Or describe: 'Near the library entrance'",
          buttons: [],
          expectsInput: 'text'
        };

      case STEPS.DETAILS:
        return {
          text: "Could you provide more details about the incident? For example, behavior of the animal, number of animals, or any injuries.",
          buttons: [],
          expectsInput: 'text'
        };

      case STEPS.PHOTO:
        return {
          text: "If you have any photo evidence of the incident, please upload it now. You can also skip this step.",
          buttons: [
            { label: "📷 Upload Photo", value: "upload" },
            { label: "⏭️ Skip", value: "skip" }
          ],
          expectsInput: 'button'
        };

      case STEPS.CONFIRM:
        const locationText = data.location?.longitude 
          ? `${data.location.longitude}, ${data.location.latitude}`
          : (data.location?.landmark || 'Not specified');
        
        const photoStatus = data.photoFilename ? `Uploaded: ${data.photoFilename} ✅` : 'None';
        
        console.log('📋 Generating confirmation with photo status:', photoStatus);
        console.log('📋 Full data:', data);
        
        return {
          text: `Thanks for providing the details! Here's a summary of your report:\n\n` +
                `• Animal: ${data.animalType || 'Not specified'}\n` +
                `• Campus: ${data.campus || 'Not specified'}\n` +
                `• Location: ${locationText}\n` +
                `• Details: ${data.details || 'Not specified'}\n` +
                `• Photo: ${photoStatus}\n\n` +
                `Do you want to submit this report?`,
          buttons: [
            { label: "Submit ✅", value: "submit" },
            { label: "Edit ✏️", value: "edit" }
          ],
          expectsInput: 'button'
        };

      case STEPS.SUBMITTED:
        return {
          text: `✅ Your incident has been reported successfully!\n\nYour Report ID is: ${data.reportId}\n\nThank you for helping keep our campuses safe.`,
          buttons: [],
          expectsInput: 'none'
        };

      case STEPS.COMPLETE:
        return {
          text: "Thank you for reporting! Your vigilance helps keep everyone safe. 🦺\n\nDo you want to report another incident?",
          buttons: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" }
          ],
          expectsInput: 'button'
        };

      default:
        return {
          text: "I'm not sure how to help with that. Let's start over.",
          buttons: [],
          expectsInput: 'text'
        };
    }
  }
}

module.exports = {
  ConversationManager,
  STEPS,
  VALID_ANIMALS,
  VALID_CAMPUSES
};