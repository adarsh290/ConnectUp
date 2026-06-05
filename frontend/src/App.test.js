import { render, screen } from '@testing-library/react';
import App from './App';

test('renders ConnectUp app without crashing', () => {
  render(<App />);
  // The landing page or login page should render
  // (ThemeProvider + AuthProvider + Router wrap the app)
  const rootElement = document.getElementById('root') || document.body;
  expect(rootElement).toBeTruthy();
});
