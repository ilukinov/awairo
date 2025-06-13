import { useEffect, useState } from 'react';
import { Dashboard, initializeWidgets } from './lib/widgets';
import { Settings } from './modules/Settings';
import { History } from './modules/History';

function App() {
  const [currentPage, setCurrentPage] = useState('main');

  useEffect(() => {
    // Initialize the widget system
    initializeWidgets();
    
    const searchParams = new URLSearchParams(window.location.search);
    const page = searchParams.get('page');
    if (page) {
      setCurrentPage(page);
    }
  }, []);

  switch (currentPage) {
    case 'settings':
      return <Settings />;
    case 'history':
      return <History />;
    default:
      return <Dashboard />;
  }
}

export default App; 