import { useState, useRef, useEffect } from 'react';
import { Send, Home, Phone, AlertCircle, FileText, MapPin } from 'lucide-react';
import MessageList from './MessageList';
import EmergencyContacts from './EmergencyContacts';
import Resources from './Resources';
import ReportStatus from './ReportStatus';

const ChatWindow = ({ userId, userName }) => {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      text: 'Welcome to BCWildWatch! I can help you report any animal sighting. To get started, please describe the animal you saw.',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [reportSubmitted, setReportSubmitted] = useState(false);
  const [reportData, setReportData] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      text: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsTyping(true);

    // Simulate bot response
    setTimeout(() => {
      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        text: 'Thank you for identifying the animal. Your safety is our priority. Here are some immediate safety tips for dealing with a snake:',
        safetyTips: {
          animal: 'Rinkhals',
          tips: [
            'Do NOT approach or provoke the snake',
            'Keep a safe distance of at least 6 meters',
            'Rinkhals are known to spit venom, protect your eyes',
            'Warn others in the area to stay clear'
          ]
        },
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
      setIsTyping(false);

      setTimeout(() => {
        setIsTyping(true);
        setTimeout(() => {
          const locationMessage = {
            id: Date.now() + 2,
            type: 'bot',
            text: 'Now, can you please tell me where you saw the snake?',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, locationMessage]);
          setIsTyping(false);
        }, 1000);
      }, 2000);
    }, 1500);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

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
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-4 chat-scroll">
          <MessageList messages={messages} isTyping={isTyping} />
          
          {reportSubmitted && (
            <div className="message-enter max-w-2xl">
              <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <div className="font-bold text-green-800 text-lg mb-2">Report Submitted Successfully</div>
                    <div className="text-sm text-green-700 mb-3">Report ID: BCW-98172</div>
                    <div className="text-sm text-gray-700 leading-relaxed">
                      Thank you! Your report has been sent to Campus Security. Please maintain a safe distance from the area. Your help is vital in keeping our campus safe for everyone.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0">
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
                className="flex-1 bg-transparent outline-none text-sm text-gray-800 placeholder-gray-400"
              />
            </div>
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim()}
              className="w-11 h-11 bg-primary-500 rounded-full flex items-center justify-center hover:bg-primary-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
            >
              <Send className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Right Sidebar - Desktop Only */}
      <div className="hidden lg:block w-80 xl:w-96 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-6 space-y-6">
          {/* Report Status */}
          {reportSubmitted && (
            <ReportStatus 
              reportId="BCW-98172"
              animalType="Rinkhals Snake"
              location="Library Entrance"
              status="Alert Sent"
            />
          )}

          {/* Emergency Contacts */}
          <EmergencyContacts />

          {/* Resources */}
          <Resources />

          {/* Map Section (placeholder) */}
          <div>
            <h3 className="font-bold text-gray-800 mb-3">Reported Location</h3>
            <div className="bg-gray-100 rounded-xl h-48 flex items-center justify-center">
              <div className="text-center text-gray-500">
                <MapPin className="w-8 h-8 mx-auto mb-2" />
                <p className="text-sm">Map will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet - Mobile Only */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 max-h-[50vh] overflow-y-auto">
        <div className="p-4 space-y-4">
          {reportSubmitted && (
            <ReportStatus 
              reportId="BCW-98172"
              animalType="Rinkhals Snake"
              location="Library Entrance"
              status="Alert Sent"
            />
          )}
          <EmergencyContacts />
          <Resources />
        </div>
      </div>
    </div>
  );
};

export default ChatWindow;