import { Phone, AlertCircle } from 'lucide-react';

const EmergencyContacts = () => {
  const handleEmergencyCall = (type) => {
    console.log(`Calling ${type}...`);
    alert(`Connecting to ${type}...`);
  };

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Emergency Contacts</h3>
      <div className="space-y-3">
        {/* Campus Security */}
        <button
          onClick={() => handleEmergencyCall('Campus Security')}
          className="w-full bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl px-4 py-4 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-red-100 group-hover:bg-red-200 rounded-full flex items-center justify-center transition-colors">
              <Phone className="w-6 h-6 text-red-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-red-800">Call Campus Security</div>
              <div className="text-xs text-red-600">Available 24/7</div>
            </div>
          </div>
          <svg 
            className="w-5 h-5 text-red-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Emergency Services */}
        <button
          onClick={() => handleEmergencyCall('Emergency Services')}
          className="w-full bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-xl px-4 py-4 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-purple-100 group-hover:bg-purple-200 rounded-full flex items-center justify-center transition-colors">
              <AlertCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-purple-800">Emergency Services</div>
              <div className="text-xs text-purple-600">For critical situations</div>
            </div>
          </div>
          <svg 
            className="w-5 h-5 text-purple-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default EmergencyContacts;