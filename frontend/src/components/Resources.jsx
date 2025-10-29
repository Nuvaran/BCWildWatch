import { FileText, AlertTriangle } from 'lucide-react';

const Resources = () => {
  const handleResourceClick = (resource) => {
    console.log(`Opening ${resource}...`);
  };

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Resources</h3>
      <div className="space-y-3">
        {/* Safety Guidelines */}
        <button
          onClick={() => handleResourceClick('Safety Guidelines')}
          className="w-full bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-xl px-4 py-4 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-blue-100 group-hover:bg-blue-200 rounded-full flex items-center justify-center transition-colors">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-blue-800">View Safety Guidelines</div>
              <div className="text-xs text-blue-600">Animal handling protocols</div>
            </div>
          </div>
          <svg 
            className="w-5 h-5 text-blue-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>

        {/* Campus Alerts */}
        <button
          onClick={() => handleResourceClick('Campus Alerts')}
          className="w-full bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-xl px-4 py-4 flex items-center justify-between transition-colors group"
        >
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-teal-100 group-hover:bg-teal-200 rounded-full flex items-center justify-center transition-colors">
              <AlertTriangle className="w-6 h-6 text-teal-600" />
            </div>
            <div className="text-left">
              <div className="font-semibold text-teal-800">View All Campus Alerts</div>
              <div className="text-xs text-teal-600">Recent sightings & warnings</div>
            </div>
          </div>
          <svg 
            className="w-5 h-5 text-teal-600" 
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

export default Resources;