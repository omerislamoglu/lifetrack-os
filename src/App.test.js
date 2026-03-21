import { render, screen } from '@testing-library/react';
import App from './App';

test('renders LifeTrack OS header', async () => {
  render(<App />);
  const linkElement = await screen.findByText(/LifeTrack OS/i);
  expect(linkElement).toBeInTheDocument();
});
