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
          // Reset conversation and show greeting again
          conversationManager.resetConversation(userId);
          botResponse = {
            text: "No problem! Feel free to start whenever you're ready.",
            buttons: [],
            expectsInput: 'none',
            shouldReset: true // Signal frontend to reset
          };
          console.log('❌ User declined, resetting conversation');
        } else {
          botResponse = conversationManager.generateResponse(conversation);
          console.log('⚠️ Invalid response, showing greeting again');
        }
        break;

      case STEPS.ANIMAL_TYPE:
        const animal = conversationManager.validateAnimal(message);
        if (animal) {
          conversationManager.updateConversation(userId, {
            data: { animalType: animal }
          });
          
          // Check if we're editing
          const conv = conversationManager.getConversation(userId);
          if (conv.editingField) {
            // Return to confirmation after editing
            conversationManager.updateConversation(userId, { 
              step: STEPS.CONFIRM,
              editingField: null
            });
            const confirmationResponse = conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            );
            botResponse = {
              text: `✅ Animal type updated to ${animal}.\n\n${confirmationResponse.text}`,
              buttons: confirmationResponse.buttons,
              expectsInput: confirmationResponse.expectsInput
            };
          } else {
            conversationManager.updateConversation(userId, { step: STEPS.CAMPUS });
            botResponse = conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            );
          }
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
            data: { campus }
          });
          
          // Check if we're editing
          const convCamp = conversationManager.getConversation(userId);
          if (convCamp.editingField) {
            conversationManager.updateConversation(userId, { 
              step: STEPS.CONFIRM,
              editingField: null
            });
            const confirmationResponse = conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            );
            botResponse = {
              text: `✅ Campus updated to ${campus}.\n\n${confirmationResponse.text}`,
              buttons: confirmationResponse.buttons,
              expectsInput: confirmationResponse.expectsInput
            };
          } else {
            conversationManager.updateConversation(userId, { step: STEPS.LOCATION });
            botResponse = conversationManager.generateResponse(
              conversationManager.getConversation(userId)
            );
          }
        } else {
          botResponse = {
            text: "Please select a valid campus: Stellenbosch, Kempton Park, or Pretoria.",
            buttons: conversationManager.generateResponse(conversation).buttons,
            expectsInput: 'button_or_text'
          };
        }
        break;

      case STEPS.LOCATION:
        // Try to validate as coordinates
        const validation = conversationManager.validateLocation(message);
        
        if (validation.valid) {
          conversationManager.updateConversation(userId, {
            data: { 
              location: { 
                longitude: validation.longitude, 
                latitude: validation.latitude,
                originalFormat: validation.originalFormat
              } 
            }
          });
          console.log('✅ Valid coordinates provided');
        } else {
          // Treat as landmark description
          conversationManager.updateConversation(userId, {
            data: { location: { landmark: message } }
          });
          console.log('✅ Landmark description provided');
        }
        
        // Check if we're editing
        const convLoc = conversationManager.getConversation(userId);
        if (convLoc.editingField) {
          conversationManager.updateConversation(userId, { 
            step: STEPS.CONFIRM,
            editingField: null
          });
          const confirmationResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
          botResponse = {
            text: `✅ Location updated.\n\n${confirmationResponse.text}`,
            buttons: confirmationResponse.buttons,
            expectsInput: confirmationResponse.expectsInput
          };
        } else {
          conversationManager.updateConversation(userId, { step: STEPS.DETAILS });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        }
        break;

      case STEPS.DETAILS:
        conversationManager.updateConversation(userId, {
          data: { details: message }
        });
        
        // Check if we're editing
        const convDet = conversationManager.getConversation(userId);
        if (convDet.editingField) {
          conversationManager.updateConversation(userId, { 
            step: STEPS.CONFIRM,
            editingField: null
          });
          const confirmationResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
          botResponse = {
            text: `✅ Details updated.\n\n${confirmationResponse.text}`,
            buttons: confirmationResponse.buttons,
            expectsInput: confirmationResponse.expectsInput
          };
        } else {
          conversationManager.updateConversation(userId, { step: STEPS.PHOTO });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        }
        break;

      case STEPS.PHOTO:
        if (message.toLowerCase() === 'skip') {
          conversationManager.updateConversation(userId, { step: STEPS.CONFIRM });
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
        } else if (message.toLowerCase() === 'upload') {
          // User clicked upload button - don't move to next step yet
          botResponse = {
            text: "Please select a photo from your device...",
            buttons: [],
            expectsInput: 'photo',
            awaitingPhoto: true
          };
          console.log('⏳ Awaiting photo upload...');
        } else if (message.startsWith('Photo uploaded:')) {
          // Photo was uploaded, move to confirmation
          const filename = message.replace('Photo uploaded: ', '').trim();
          console.log(`📸 Storing photo filename: "${filename}"`);
          
          conversationManager.updateConversation(userId, { 
            data: { photoFilename: filename },
            step: STEPS.CONFIRM 
          });
          
          // Verify it was stored
          const updatedConv = conversationManager.getConversation(userId);
          console.log('📋 Updated conversation data:', updatedConv.data);
          
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
          console.log('✅ Photo uploaded, moving to confirmation');
        } else {
          // Unknown response, show options again
          botResponse = conversationManager.generateResponse(conversation);
        }
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
            text: "Which field would you like to edit?",
            buttons: [
              { label: "Animal Type", value: "edit_animal" },
              { label: "Campus", value: "edit_campus" },
              { label: "Location", value: "edit_location" },
              { label: "Details", value: "edit_details" }
            ],
            expectsInput: 'button'
          };
        } else if (message.startsWith('edit_')) {
          // Handle edit field selection
          const field = message.replace('edit_', '');
          let targetStep;
          
          switch(field) {
            case 'animal':
              targetStep = STEPS.ANIMAL_TYPE;
              break;
            case 'campus':
              targetStep = STEPS.CAMPUS;
              break;
            case 'location':
              targetStep = STEPS.LOCATION;
              break;
            case 'details':
              targetStep = STEPS.DETAILS;
              break;
          }
          
          conversationManager.updateConversation(userId, { 
            step: targetStep,
            editingField: field
          });
          
          botResponse = conversationManager.generateResponse(
            conversationManager.getConversation(userId)
          );
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

    console.log(`🛡️ Getting safety tips for: ${animalType}`);

    // Get safety tips from Gemini
    const safetyTipResult = await geminiService.getSafetyTip(animalType);

    console.log('Safety tip result:', safetyTipResult);

    if (safetyTipResult.success && safetyTipResult.tips && safetyTipResult.tips.length > 0) {
      // Move to complete step
      conversationManager.updateConversation(userId, { step: STEPS.COMPLETE });

      res.json({
        success: true,
        safetyTips: {
          animal: animalType,
          tips: safetyTipResult.tips
        },
        nextStep: conversationManager.generateResponse(
          conversationManager.getConversation(userId)
        )
      });
    } else {
      // Return fallback tips if Gemini fails
      console.error('❌ Failed to get tips from Gemini, using fallback');
      conversationManager.updateConversation(userId, { step: STEPS.COMPLETE });
      
      res.json({
        success: true,
        safetyTips: {
          animal: animalType,
          tips: [
            'Stay calm and maintain a safe distance from the animal',
            'Do not attempt to approach, touch, or provoke the animal',
            'Alert others in the immediate area about the animal\'s presence',
            'Contact campus security immediately for assistance'
          ]
        },
        nextStep: conversationManager.generateResponse(
          conversationManager.getConversation(userId)
        )
      });
    }

  } catch (error) {
    console.error('❌ Safety tips error:', error);
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