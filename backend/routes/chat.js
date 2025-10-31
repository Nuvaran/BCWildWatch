const express = require('express');
const router = express.Router();
const geminiService = require('../services/geminiService');
const { ConversationManager, STEPS } = require('../utils/conversationManager');

const conversationManager = new ConversationManager();

// Start or continue conversation
router.post('/message', async (req, res) => {
  try {
    const { userId, message, messageType = 'text' } = req.body;

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'userId is required'
      });
    }

    console.log(`📩 Message from ${userId}: "${message}" (${messageType})`);

    const conversation = conversationManager.getConversation(userId);
    console.log(`📊 Current step: ${conversation.step}`);

    let botResponse = null;

    // Handle different conversation steps
    switch (conversation.step) {
      case STEPS.GREETING:
        const normalizedMessage = message.toLowerCase().trim();
        if (normalizedMessage === 'yes' || normalizedMessage === 'start') {
          conversationManager.updateConversation(userId, { step: STEPS.ANIMAL_TYPE });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
          console.log('✅ Moving to ANIMAL_TYPE step');
        } else if (normalizedMessage === 'no') {
          botResponse = {
            text: "No problem! Stay safe and have a great day. 👋",
            buttons: [],
            expectsInput: 'none'
          };
          conversationManager.resetConversation(userId);
          console.log('❌ User declined, conversation ended');
        } else {
          botResponse = conversationManager.generateResponse(conversation);
          console.log('⚠️ Invalid response, showing greeting again');
        }
        break;

      case STEPS.ANIMAL_TYPE:
        const animal = conversationManager.validateAnimal(message);
        if (animal) {
          conversationManager.updateConversation(userId, {
            data: { animalType: animal },
            step: STEPS.CAMPUS
          });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        } else {
          botResponse = {
            text: "I didn't recognize that animal type. Please choose from: Snake, Bee, Wasp, Spider, Cat, or Dog.",
            buttons: conversationManager.generateResponse(conversation).buttons,
            expectsInput: 'button_or_text'
          };
        }
        break;

      case STEPS.CAMPUS:
        const campus = conversationManager.validateCampus(message);
        if (campus) {
          conversationManager.updateConversation(userId, {
            data: { campus },
            step: STEPS.LOCATION
          });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        } else {
          botResponse = {
            text: "Please select a valid campus: Stellenbosch, Kempton Park, or Pretoria.",
            buttons: conversationManager.generateResponse(conversation).buttons,
            expectsInput: 'button_or_text'
          };
        }
        break;

      case STEPS.LOCATION:
        // Try to parse coordinates
        const coordMatch = message.match(/(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)/);
        if (coordMatch) {
          const validation = conversationManager.validateLocation(coordMatch[1], coordMatch[2]);
          if (validation.valid) {
            conversationManager.updateConversation(userId, {
              data: { 
                location: { 
                  longitude: validation.longitude, 
                  latitude: validation.latitude 
                } 
              },
              step: STEPS.DETAILS
            });
            botResponse = conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            );
          } else {
            botResponse = {
              text: "Those coordinates don't look valid. Please try again or describe the nearest landmark.",
              buttons: [],
              expectsInput: 'text'
            };
          }
        } else {
          // Treat as landmark
          conversationManager.updateConversation(userId, {
            data: { location: { landmark: message } },
            step: STEPS.DETAILS
          });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        }
        break;

      case STEPS.DETAILS:
        conversationManager.updateConversation(userId, {
          data: { details: message },
          step: STEPS.PHOTO
        });
        botResponse = conversationManager.generateResponse(
          conversationManager.getConversation(userId)
        );
        break;

      case STEPS.PHOTO:
        if (message.toLowerCase() === 'skip') {
          conversationManager.updateConversation(userId, { step: STEPS.CONFIRM });
        } else if (message.toLowerCase() === 'upload') {
          // In real app, handle file upload here
          botResponse = {
            text: "Photo upload feature coming soon! For now, let's proceed to confirmation.",
            buttons: [],
            expectsInput: 'none'
          };
          conversationManager.updateConversation(userId, { step: STEPS.CONFIRM });
        }
        botResponse = conversationManager.generateResponse(
          conversationManager.getConversation(userId)
        );
        break;

      case STEPS.CONFIRM:
        if (message.toLowerCase() === 'submit') {
          // Generate report ID
          const reportId = `BCW-${Date.now().toString().slice(-5)}`;
          
          conversationManager.updateConversation(userId, {
            data: { reportId },
            step: STEPS.SUBMITTED
          });

          const reportData = conversationManager.getConversation(userId).data;
          
          // This will be sent to Power Automate
          botResponse = {
            text: conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            ).text,
            buttons: [],
            expectsInput: 'none',
            reportData: reportData,
            shouldSubmitReport: true
          };

          // Move to safety tips after submission
          setTimeout(() => {
            conversationManager.updateConversation(userId, { step: STEPS.SAFETY_TIPS });
          }, 1000);

        } else if (message.toLowerCase() === 'edit') {
          botResponse = {
            text: "Which field would you like to edit? (animal, campus, location, details)",
            buttons: [
              { label: "Animal Type", value: "edit_animal" },
              { label: "Campus", value: "edit_campus" },
              { label: "Location", value: "edit_location" },
              { label: "Details", value: "edit_details" }
            ],
            expectsInput: 'button'
          };
        }
        break;

      case STEPS.COMPLETE:
        if (message.toLowerCase() === 'yes') {
          conversationManager.resetConversation(userId);
          conversationManager.updateConversation(userId, { step: STEPS.ANIMAL_TYPE });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        } else {
          botResponse = {
            text: "Goodbye! Stay safe. 👋",
            buttons: [],
            expectsInput: 'none'
          };
          conversationManager.resetConversation(userId);
        }
        break;

      default:
        botResponse = conversationManager.generateResponse(conversation);
        console.log('⚠️ Unknown step, showing default response');
    }

    // Ensure we always have a response
    if (!botResponse) {
      botResponse = conversationManager.generateResponse(conversation);
      console.log('⚠️ No response generated, using fallback');
    }

    console.log(`✉️ Sending response:`, botResponse.text.substring(0, 50) + '...');

    res.json({
      success: true,
      response: botResponse,
      conversationStep: conversationManager.getConversation(userId).step,
      debug: {
        receivedMessage: message,
        currentStep: conversation.step,
        hasButtons: botResponse.buttons?.length > 0
      }
    });

  } catch (error) {
    console.error('❌ Chat message error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Get safety tips (called after report submission)
router.post('/safety-tips', async (req, res) => {
  try {
    const { userId } = req.body;
    const conversation = conversationManager.getConversation(userId);
    const animalType = conversation.data.animalType;

    if (!animalType) {
      return res.status(400).json({
        success: false,
        error: 'No animal type found in conversation'
      });
    }

    // Get safety tips from Gemini
    const safetyTipResult = await geminiService.getSafetyTip(animalType);

    if (safetyTipResult.success) {
      // Move to complete step
      conversationManager.updateConversation(userId, { step: STEPS.COMPLETE });

      res.json({
        success: true,
        safetyTips: {
          animal: animalType,
          tips: safetyTipResult.tip
        },
        nextStep: conversationManager.generateResponse(
          conversationManager.getConversation(userId)
        )
      });
    } else {
      res.json({
        success: false,
        error: 'Failed to get safety tips'
      });
    }

  } catch (error) {
    console.error('Safety tips error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Submit incident to Power Automate
router.post('/submit-incident', async (req, res) => {
  try {
    const { reportData } = req.body;

    // TODO: Replace with your actual Power Automate Flow URL
    const powerAutomateUrl = process.env.POWER_AUTOMATE_FLOW_URL;

    if (!powerAutomateUrl) {
      console.warn('Power Automate Flow URL not configured');
      // For now, just simulate success
      return res.json({
        success: true,
        message: 'Report received (Power Automate not configured yet)',
        reportId: reportData.reportId
      });
    }

    // Call Power Automate Flow
    const response = await fetch(powerAutomateUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reportData)
    });

    if (response.ok) {
      res.json({
        success: true,
        message: 'Report submitted to Power Automate',
        reportId: reportData.reportId
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to submit to Power Automate'
      });
    }

  } catch (error) {
    console.error('Submit incident error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Reset conversation
router.post('/reset', async (req, res) => {
  try {
    const { userId } = req.body;
    conversationManager.resetConversation(userId);
    
    res.json({
      success: true,
      message: 'Conversation reset'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;