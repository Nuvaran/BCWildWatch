import { useState, useRef, useEffect } from 'react';
import { Send, Bot, ChevronUp, ChevronDown } from 'lucide-react';
import MessageList from './MessageList';
import EmergencyContacts from './EmergencyContacts';
import ReportStatus from './ReportStatus';
import apiService from '../services/apiService';

const ChatWindow = ({ userId, userName }) => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [currentButtons, setCurrentButtons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isOnline, setIsOnline] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState(null);
  const [awaitingPhotoUpload, setAwaitingPhotoUpload] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize conversation on mount
  useEffect(() => {
    initializeChat();
  }, []);

  // Check backend health
  useEffect(() => {
    checkBackendHealth();
    const interval = setInterval(checkBackendHealth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const checkBackendHealth = async () => {
    const result = await apiService.checkHealth();
    setIsOnline(result.success);
  };

  const initializeChat = async () => {
    setIsLoading(true);
    
    // Don't send any initial message, just show the greeting
    const greetingMessage = {
      id: Date.now(),
      type: 'bot',
      text: "Hello! 👋 Welcome to BC WildWatch. I can help you report a wildlife or animal incident quickly. Shall we get started?",
      timestamp: new Date()
    };
    
    setMessages([greetingMessage]);
    setCurrentButtons([
      { label: "Yes ✅", value: "yes" },
      { label: "No ❌", value: "no" }
    ]);
    
    setIsLoading(false);
  };

  const resetChat = () => {
    setMessages([]);
    setInputMessage('');
    setReportSubmitted(false);
    setReportData(null);
    setCurrentButtons([]);
    setUploadedPhoto(null);
    setAwaitingPhotoUpload(false);
    initializeChat();
  };

  const handlePhotoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please upload an image file');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const photoData = {
          name: file.name,
          size: file.size,
          type: file.type,
          dataUrl: reader.result
        };
        setUploadedPhoto(photoData);
        setAwaitingPhotoUpload(false);
        
        // Show photo uploaded message
        const photoUploadedMessage = {
          id: Date.now(),
          type: 'user',
          text: `📷 ${file.name}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, photoUploadedMessage]);
        
        // Send confirmation to backend and move to next step
        setTimeout(() => {
          handleSendMessage('Photo uploaded: ' + file.name, false);
        }, 500);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerPhotoUpload = () => {
    fileInputRef.current?.click();
  };

  const handleSendMessage = async (messageText = null, isButtonClick = false) => {
    if (!isOnline) {
      const offlineMessage = {
        id: Date.now(),
        type: 'bot',
        text: "I'm currently offline. Please try again later.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, offlineMessage]);
      return;
    }

    const textToSend = messageText || inputMessage;
    
    if (!textToSend.trim()) return;

    console.log(`📤 Sending message: "${textToSend}" (isButton: ${isButtonClick})`);

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setCurrentButtons([]);
    setIsTyping(true);

    // Send to backend
    const result = await apiService.sendMessage(
      userId, 
      textToSend,
      isButtonClick ? 'button' : 'text'
    );

    console.log('📥 Backend response:', result);

    setIsTyping(false);

    if (result.success && result.data && result.data.response) {
      const response = result.data.response;
      
      console.log('✅ Got valid response:', {
        text: response.text?.substring(0, 50),
        hasButtons: response.buttons?.length > 0,
        shouldSubmit: response.shouldSubmitReport,
        awaitingPhoto: response.awaitingPhoto
      });
      
      // Check if we're waiting for photo upload (don't add bot message)
      if (response.awaitingPhoto) {
        console.log('⏳ Awaiting photo upload, not showing bot response');
        return;
      }
      
      // Check if this is a photo upload confirmation
      if (textToSend.startsWith('Photo uploaded:')) {
        // Bot already received the confirmation, now get the actual confirmation step
        setTimeout(async () => {
          setIsTyping(true);
          const confirmResult = await apiService.sendMessage(userId, 'get_confirmation', 'system');
          setIsTyping(false);
          
          if (confirmResult.success && confirmResult.data && confirmResult.data.response) {
            const confirmResponse = confirmResult.data.response;
            const confirmMessage = {
              id: Date.now() + 5,
              type: 'bot',
              text: confirmResponse.text,
              timestamp: new Date()
            };
            setMessages(prev => [...prev, confirmMessage]);
            setCurrentButtons(confirmResponse.buttons || []);
          }
        }, 1000);
        return;
      }
      
      // Check if user said "no" at greeting or after completion
      if (response.shouldReset) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Reset conversation after 1.5 seconds
        setTimeout(() => {
          resetChat();
        }, 1500);
        return;
      }
      
      // Check if user said "no" to reporting another incident
      if (textToSend.toLowerCase() === 'no' && response.text.includes('Goodbye')) {
        const botMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: response.text,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, botMessage]);
        
        // Reset conversation after 2 seconds
        setTimeout(() => {
          resetChat();
        }, 2000);
        return;
      }
      
      // Check if report should be submitted
      if (response.shouldSubmitReport && response.reportData) {
        console.log('📋 Submitting report to Power Automate...');
        
        // Add photo data if available
        const finalReportData = {
          ...response.reportData,
          photo: uploadedPhoto ? {
            name: uploadedPhoto.name,
            size: uploadedPhoto.size,
            type: uploadedPhoto.type,
            dataUrl: uploadedPhoto.dataUrl
          } : null
        };
        
        const submitResult = await apiService.submitIncident(finalReportData);
        console.log('Submit result:', submitResult);
        
        setReportSubmitted(true);
        setReportData(finalReportData);
      }

      // Add bot response
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: response.text,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, botMessage]);
      setCurrentButtons(response.buttons || []);

      // If report was just submitted, get safety tips after a delay
      if (response.shouldSubmitReport) {
        setTimeout(async () => {
          setIsTyping(true);
          const safetyResult = await apiService.getSafetyTips(userId);
          setIsTyping(false);

          if (safetyResult.success && safetyResult.data.safetyTips) {
            const safetyMessage = {
              id: Date.now() + 2,
              type: 'bot',
              text: `Here are some safety tips for dealing with a ${safetyResult.data.safetyTips.animal}:`,
              safetyTips: safetyResult.data.safetyTips,
              timestamp: new Date()
            };

            setMessages(prev => [...prev, safetyMessage]);

            // Add the completion message
            if (safetyResult.data.nextStep) {
              setTimeout(() => {
                const completionMessage = {
                  id: Date.now() + 3,
                  type: 'bot',
                  text: safetyResult.data.nextStep.text,
                  timestamp: new Date()
                };
                setMessages(prev => [...prev, completionMessage]);
                setCurrentButtons(safetyResult.data.nextStep.buttons || []);
              }, 1000);
            }
          }
        }, 2000);
      }
    } else {
      console.error('❌ Failed to get response:', result);
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: "I'm having trouble connecting right now. Please try again.",
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  const handleButtonClick = (buttonValue) => {
    // Handle photo upload button specially
    if (buttonValue === 'upload') {
      // Add a message showing user clicked upload
      const uploadClickMessage = {
        id: Date.now(),
        type: 'user',
        text: '📷 Upload Photo',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, uploadClickMessage]);
      setCurrentButtons([]);
      
      // Show waiting message
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const waitingMessage = {
          id: Date.now() + 1,
          type: 'bot',
          text: 'Please select a photo from your device...',
          timestamp: new Date()
        };
        setMessages(prev => [...prev, waitingMessage]);
        
        // Trigger file picker
        setAwaitingPhotoUpload(true);
        triggerPhotoUpload();
      }, 500);
      return;
    }
    
    handleSendMessage(buttonValue, true);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading BCWildWatch...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">BCWildWatch</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">BCWildWatch Chat</span>
                <div className="flex items-center space-x-1.5">
                  <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
                  <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-gray-500'}`}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Messages Container */}
        <div 
          className="flex-1 overflow-y-auto px-6 py-6 space-y-4 chat-scroll"
          style={{ 
            paddingBottom: reportSubmitted ? 'calc(env(safe-area-inset-bottom) + 80px)' : '1.5rem' 
          }}
        >
          <MessageList messages={messages} isTyping={isTyping} />
          
          {/* Quick Action Buttons */}
          {currentButtons.length > 0 && !isTyping && (
            <div className="max-w-4xl mx-auto w-full">
              <div className="flex flex-wrap gap-2 ml-0 md:ml-12">
                {currentButtons.map((button, index) => (
                  <button
                    key={index}
                    onClick={() => handleButtonClick(button.value)}
                    disabled={!isOnline}
                    className="px-4 py-2 bg-white hover:bg-primary-50 border-2 border-primary-500 hover:border-primary-600 text-primary-700 hover:text-primary-800 rounded-full font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {button.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Hidden File Input for Photo Upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handlePhotoUpload}
          className="hidden"
        />

        {/* Input Area */}
        <div 
          className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0"
          style={{
            marginBottom: reportSubmitted && window.innerWidth < 1024 ? '60px' : '0'
          }}
        >
          <div className="flex items-center space-x-3 max-w-4xl mx-auto">
            <div className="flex-1 bg-gray-100 rounded-full px-5 py-3 flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isOnline ? "Type your message..." : "Bot is offline..."}
                disabled={isTyping || !isOnline}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping || !isOnline}
              className="w-11 h-11 bg-primary-400 rounded-full flex items-center justify-center hover:bg-primary-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Desktop Only - Only show when report submitted */}
      {reportSubmitted && reportData && (
        <div className="hidden lg:block w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
          <div className="p-6 space-y-6">
            <ReportStatus 
              reportId={reportData.reportId}
              animalType={reportData.animalType}
              location={reportData.location?.landmark || `${reportData.location?.longitude}, ${reportData.location?.latitude}`}
              status="Alert Sent"
            />
            <EmergencyContacts showOnlyEmergencyServices={true} />
          </div>
        </div>
      )}

      {/* Mobile Bottom Sheet - Only show when report submitted */}
      {reportSubmitted && reportData && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t-2 border-gray-200 shadow-2xl transition-all duration-300 z-50"
          style={{ 
            maxHeight: mobileSheetOpen ? '70vh' : '60px',
            paddingBottom: 'env(safe-area-inset-bottom)'
          }}
        >
          <button
            onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
            className="w-full px-4 py-3 flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <Bot className="w-4 h-4 text-primary-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-800 text-sm">Report Details</div>
                <div className="text-xs text-gray-500">{reportData.reportId} • Tap to {mobileSheetOpen ? 'close' : 'expand'}</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                Alert Sent
              </span>
              {mobileSheetOpen ? (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              )}
            </div>
          </button>

          {mobileSheetOpen && (
            <div className="overflow-y-auto px-4 pb-4 space-y-4" style={{ maxHeight: 'calc(70vh - 60px)' }}>
              <ReportStatus 
                reportId={reportData.reportId}
                animalType={reportData.animalType}
                location={reportData.location?.landmark || `${reportData.location?.longitude}, ${reportData.location?.latitude}`}
                status="Alert Sent"
              />
              <EmergencyContacts showOnlyEmergencyServices={true} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;