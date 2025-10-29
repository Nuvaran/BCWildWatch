import { Home, User, AlertTriangle } from 'lucide-react';

const MessageList = ({ messages, isTyping }) => {
  return (
    <>
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} message-enter`}
        >
          <div className={`flex items-end space-x-2 max-w-[85%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            {message.type === 'bot' ? (
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <Home className="w-4 h-4 text-primary-600" />
              </div>
            ) : (
              <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            )}

            {/* Message Bubble */}
            <div className="flex flex-col">
              {message.type === 'bot' && (
                <span className="text-xs text-gray-500 mb-1 px-2">BCWildWatch Bot</span>
              )}
              
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-800 border border-gray-200'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>

                {/* Safety Tips Section */}
                {message.safetyTips && (
                  <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                    <div className="flex items-center space-x-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      <span className="text-sm font-bold text-yellow-800">
                        Safety Tips: {message.safetyTips.animal}
                      </span>
                    </div>
                    <ul className="space-y-1.5">
                      {message.safetyTips.tips.map((tip, index) => (
                        <li key={index} className="text-xs text-gray-700 flex items-start">
                          <span className="mr-2">•</span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <span className="text-xs text-gray-400 mt-1 px-2">
                {message.timestamp.toLocaleTimeString('en-US', { 
                  hour: 'numeric', 
                  minute: '2-digit',
                  hour12: true 
                })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {/* Typing Indicator */}
      {isTyping && (
        <div className="flex justify-start message-enter">
          <div className="flex items-end space-x-2 max-w-[85%]">
            <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
              <Home className="w-4 h-4 text-primary-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1 px-2">BCWildWatch Bot</span>
              <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default MessageList;