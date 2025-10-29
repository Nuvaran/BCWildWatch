const ReportStatus = ({ reportId, animalType, location, status }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'alert sent':
        return 'bg-yellow-100 text-yellow-800';
      case 'in progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      <h3 className="font-bold text-gray-800 mb-3 text-lg">Report Status</h3>
      <div className="bg-gray-50 rounded-xl p-4 space-y-3">
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Report ID:</span>
          <span className="font-semibold text-gray-800">{reportId}</span>
        </div>
        <div className="border-t border-gray-200"></div>
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Animal Type:</span>
          <span className="font-medium text-gray-800 text-right">{animalType}</span>
        </div>
        <div className="border-t border-gray-200"></div>
        <div className="flex justify-between items-start">
          <span className="text-sm text-gray-600">Location:</span>
          <span className="font-medium text-gray-800 text-right max-w-[60%]">{location}</span>
        </div>
        <div className="border-t border-gray-200"></div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-gray-600">Status:</span>
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(status)}`}>
            {status}
          </span>
        </div>
      </div>
    </div>
  );
};

export default ReportStatus;