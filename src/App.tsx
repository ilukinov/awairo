import { useEffect, useState } from 'react';
import PomodoroTimer from './modules/PomodoroTimer';
import { Settings } from './modules/Settings';
import { History } from './modules/History';

function App() {
  const [currentPage, setCurrentPage] = useState('main');

  useEffect(() => {
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
      return <PomodoroTimer />;
  }
}

export default App; 