import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './ThemeToggle.css';

const ThemeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <button className="theme-toggle" onClick={toggleDarkMode} aria-label="Toggle dark mode">
      {darkMode ? '☀️' : '🌙'}
    </button>
  );
};

export default ThemeToggle;

