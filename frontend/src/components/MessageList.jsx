import { Bot, User, AlertTriangle } from 'lucide-react';

const MessageList = ({ messages, isTyping }) => {
  return (
    <div className="max-w-4xl mx-auto w-full">
      {messages.map((message) => (
        <div
          key={message.id}
          className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} mb-6 message-enter`}
        >
          <div className={`flex items-end space-x-3 max-w-[70%] md:max-w-[60%] ${message.type === 'user' ? 'flex-row-reverse space-x-reverse' : ''}`}>
            {/* Avatar */}
            {message.type === 'bot' ? (
              <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <Bot className="w-5 h-5 text-primary-600" />
              </div>
            ) : (
              <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
                <User className="w-5 h-5 text-gray-600" />
              </div>
            )}

            {/* Message Bubble */}
            <div className="flex flex-col flex-1 min-w-0">
              {message.type === 'bot' && (
                <span className="text-xs text-gray-500 mb-1.5 px-1">BCWildWatch Bot</span>
              )}
              
              <div
                className={`rounded-2xl px-5 py-3.5 ${
                  message.type === 'user'
                    ? 'bg-primary-500 text-white'
                    : 'bg-white text-gray-800 shadow-sm border border-gray-100'
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.text}</p>

                {/* Safety Tips Section */}
                {message.safetyTips && (
                  <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                    <div className="flex items-center space-x-2 mb-3">
                      <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0" />
                      <span className="text-sm font-bold text-yellow-800">
                        Safety Tips: {message.safetyTips.animal.charAt(0).toUpperCase() + message.safetyTips.animal.slice(1)}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {Array.isArray(message.safetyTips.tips) ? (
                        message.safetyTips.tips.map((tip, index) => (
                          <li key={index} className="text-sm text-gray-700 flex items-start">
                            <span className="mr-2 mt-0.5 font-bold text-yellow-700">{index + 1}.</span>
                            <span className="flex-1">{tip}</span>
                          </li>
                        ))
                      ) : (
                        <li className="text-sm text-gray-700">{message.safetyTips.tips}</li>
                      )}
                    </ul>
                  </div>
                )}
              </div>

              <span className="text-xs text-gray-400 mt-1.5 px-1">
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
        <div className="flex justify-start mb-6 message-enter max-w-4xl mx-auto w-full">
          <div className="flex items-end space-x-3">
            <div className="w-9 h-9 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 mb-1">
              <Bot className="w-5 h-5 text-primary-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs text-gray-500 mb-1.5 px-1">BCWildWatch Bot</span>
              <div className="bg-white shadow-sm border border-gray-100 rounded-2xl px-5 py-4">
                <div className="flex space-x-1.5">
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot"></div>
                  <div className="w-2.5 h-2.5 bg-gray-400 rounded-full typing-dot"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MessageList;