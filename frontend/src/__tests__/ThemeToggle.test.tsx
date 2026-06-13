import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ThemeToggle from '../components/ThemeToggle';
import { useThemeStore } from '../store/useThemeStore';

describe('ThemeToggle Component', () => {
  it('should render the toggle button', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('toggles theme on click', () => {
    render(<ThemeToggle />);
    const button = screen.getByRole('button');
    const initialTheme = useThemeStore.getState().theme;
    
    fireEvent.click(button);
    
    const nextTheme = useThemeStore.getState().theme;
    expect(nextTheme).not.toBe(initialTheme);
  });
});
