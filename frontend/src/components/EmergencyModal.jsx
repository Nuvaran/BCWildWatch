import { X, Phone, AlertCircle, Flame, Heart, Shield } from 'lucide-react';

const EmergencyModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const emergencyContacts = [
    {
      icon: Shield,
      label: 'Local Police',
      number: '10111',
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: Heart,
      label: 'Ambulance',
      number: '10177',
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: Flame,
      label: 'Fire Department',
      number: '10222',
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: AlertCircle,
      label: 'Animal Control',
      number: '+27987654321',
      displayNumber: '+27 987 654 321',
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Phone,
      label: 'Campus Health Centre',
      number: '+27555000111',
      displayNumber: '+27 555 000 111',
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  const handleCall = (number, label) => {
    // In a real app, this would initiate a call
    if (window.confirm(`Call ${label} at ${number}?`)) {
      window.location.href = `tel:${number}`;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity duration-300"
        onClick={onClose}
      ></div>

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden pointer-events-auto transform transition-all duration-300 scale-100"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-red-500 to-purple-600 px-6 py-5 text-white relative">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white bg-opacity-20 hover:bg-opacity-30 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
              <div>
                <h2 className="text-xl font-bold">Emergency Contacts</h2>
                <p className="text-sm text-white text-opacity-90">Available 24/7</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            <p className="text-sm text-gray-600 mb-4">
              Tap a number to call directly. Keep this list handy for emergencies.
            </p>

            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => {
                const Icon = contact.icon;
                return (
                  <button
                    key={index}
                    onClick={() => handleCall(contact.number, contact.label)}
                    className="w-full bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl p-4 flex items-center justify-between transition-all duration-200 group"
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 ${contact.bgColor} rounded-full flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <Icon className={`w-6 h-6 ${contact.color}`} />
                      </div>
                      <div className="text-left">
                        <div className="font-semibold text-gray-800">{contact.label}</div>
                        <div className="text-sm text-gray-600 font-mono">
                          {contact.displayNumber || contact.number}
                        </div>
                      </div>
                    </div>
                    <Phone className={`w-5 h-5 ${contact.color} group-hover:scale-110 transition-transform`} />
                  </button>
                );
              })}
            </div>

            {/* Footer Note */}
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <div className="flex items-start space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-yellow-800">
                  <strong>Important:</strong> For life-threatening emergencies, always call <strong>10111</strong> (Police) or <strong>10177</strong> (Ambulance) first.
                </p>
              </div>
            </div>
          </div>

          {/* Close Button */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <button
              onClick={onClose}
              className="w-full bg-primary-500 hover:bg-gray-900 text-white font-semibold py-3 rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default EmergencyModal;