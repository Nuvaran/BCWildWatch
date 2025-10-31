import { useState, useRef, useEffect } from 'react';
import { Send, Home, ChevronUp, ChevronDown } from 'lucide-react';
import MessageList from './MessageList';
import EmergencyContacts from './EmergencyContacts';
import Resources from './Resources';
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
  const messagesEndRef = useRef(null);

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

  const initializeChat = async () => {
    setIsLoading(true);
    
    // Send initial message to start conversation
    const result = await apiService.sendMessage(userId, 'start', 'system');
    
    console.log('Init result:', result);
    
    if (result.success && result.data && result.data.response) {
      const botMessage = {
        id: Date.now(),
        type: 'bot',
        text: result.data.response.text,
        timestamp: new Date()
      };
      
      setMessages([botMessage]);
      setCurrentButtons(result.data.response.buttons || []);
      
      console.log('✅ Chat initialized successfully');
      console.log('Buttons:', result.data.response.buttons);
    } else {
      console.error('❌ Failed to initialize chat:', result);
      
      // Fallback greeting if API fails
      const fallbackMessage = {
        id: Date.now(),
        type: 'bot',
        text: "Hello! 👋 Welcome to BC WildWatch. I can help you report a wildlife or animal incident quickly. Shall we get started?",
        timestamp: new Date()
      };
      setMessages([fallbackMessage]);
      setCurrentButtons([
        { label: "Yes ✅", value: "yes" },
        { label: "No ❌", value: "no" }
      ]);
    }
    
    setIsLoading(false);
  };

  const handleSendMessage = async (messageText = null, isButtonClick = false) => {
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
        shouldSubmit: response.shouldSubmitReport
      });
      
      // Check if report should be submitted
      if (response.shouldSubmitReport && response.reportData) {
        console.log('📋 Submitting report to Power Automate...');
        // Submit to Power Automate
        const submitResult = await apiService.submitIncident(response.reportData);
        console.log('Submit result:', submitResult);
        
        setReportSubmitted(true);
        setReportData(response.reportData);
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
      // Error handling
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
            <div className="w-10 h-10 bg-primary-500 rounded-lg flex items-center justify-center">
              <Home className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-bold text-lg text-gray-800">BCWildWatch</h1>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">BCWildWatch Chat</span>
                <div className="flex items-center space-x-1.5">
                  <div className="w-2 h-2 bg-accent-teal rounded-full animate-pulse"></div>
                  <span className="text-sm text-accent-teal font-medium">Online</span>
                </div>
              </div>
            </div>
          </div>
          <button className="text-primary-500 text-sm font-medium hover:text-primary-600 transition-colors">
            Sign Out
          </button>
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
            <div className="flex flex-wrap gap-2 max-w-2xl mx-auto">
              {currentButtons.map((button, index) => (
                <button
                  key={index}
                  onClick={() => handleButtonClick(button.value)}
                  className="px-4 py-2 bg-white hover:bg-primary-50 border-2 border-primary-200 hover:border-primary-500 text-primary-700 hover:text-primary-800 rounded-full font-medium text-sm transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  {button.label}
                </button>
              ))}
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div 
          className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0"
          style={{
            marginBottom: reportSubmitted && window.innerWidth < 1024 ? '60px' : '0'
          }}
        >
          <div className="flex items-center space-x-3 max-w-4xl mx-auto">
            <button className="w-11 h-11 flex items-center justify-center text-primary-500 hover:bg-primary-50 rounded-full transition-colors flex-shrink-0">
              <Home className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-gray-100 rounded-full px-5 py-3 flex items-center">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isTyping}
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400 disabled:opacity-50"
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!inputMessage.trim() || isTyping}
              className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
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
            <EmergencyContacts />
            <Resources />
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
                <Home className="w-4 h-4 text-primary-600" />
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
              <EmergencyContacts />
              <Resources />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ChatWindow;