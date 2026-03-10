import { render, screen } from '@testing-library/react';
import App from './App';

test('renders LifeTrack OS header', () => {
  render(<App />);
  const linkElement = screen.getByText(/LifeTrack OS/i);
  expect(linkElement).toBeInTheDocument();
});
