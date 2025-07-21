import React from 'react';
import { Theme } from '../constants/theme';

const ThemeToggleButton = ({ theme, toggleTheme }) => (
  <button
    onClick={toggleTheme}
    className="absolute top-4 right-4 p-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 shadow-md"
    title="테마 변경"
  >
    {theme === Theme.LIGHT && '☀️'}
    {theme === Theme.DARK && '🌙'}
    {theme === Theme.SYSTEM && '💻'}
  </button>
);

export default ThemeToggleButton;
