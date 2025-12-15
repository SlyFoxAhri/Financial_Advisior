import React, { useEffect, useState } from 'react';


//Dark mode toggle
const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(
    localStorage.getItem('theme') === 'dark'
  );

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="fixed bottom-4 right-4 p-3 bg-gray-800 text-gray-100 dark:bg-gray-200 dark:text-gray-900 rounded-full shadow-lg hover:bg-gray-700 dark:hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
    >
      {isDarkMode ? ' Dark Mode' : ' Light Mode'}
    </button>
  );
};

export default DarkModeToggle;