import { useState, useEffect } from 'react';
import ChatWindow from './components/ChatWindow';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Get user info from URL params (passed from Power Apps)
    const params = new URLSearchParams(window.location.search);
    const userId = params.get('userId') || 'student@belgiumcampus.ac.za';
    const userName = params.get('userName') || 'Student';

    setUser({
      id: userId,
      name: userName
    });
  }, []);

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading BCWildWatch...</p>
        </div>
      </div>
    );
  }

  return <ChatWindow userId={user.id} userName={user.name} />;
}

export default App;