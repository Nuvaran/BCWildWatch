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

  // Validate location coordinates
  validateLocation(longitude, latitude) {
    const lon = parseFloat(longitude);
    const lat = parseFloat(latitude);
    
    return {
      valid: !isNaN(lon) && !isNaN(lat) && 
             lon >= -180 && lon <= 180 && 
             lat >= -90 && lat <= 90,
      longitude: lon,
      latitude: lat
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
          text: "Please provide the location of the incident. You can share coordinates (longitude, latitude) or describe the nearest landmark.\n\nExample: '28.0473,-26.2041' or 'Near the library entrance'",
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
        const locationText = data.location.longitude 
          ? `${data.location.longitude}, ${data.location.latitude}`
          : data.location.landmark;
        
        return {
          text: `Thanks for providing the details! Here's a summary of your report:\n\n` +
                `• Animal: ${data.animalType}\n` +
                `• Campus: ${data.campus}\n` +
                `• Location: ${locationText}\n` +
                `• Details: ${data.details}\n` +
                `• Photo: ${data.photoUrl ? 'Uploaded ✅' : 'None'}\n\n` +
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