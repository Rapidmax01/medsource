import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Icons, formatNaira } from '../../components/shared/Icons';

describe('formatNaira', () => {
  it('formats a whole number correctly', () => {
    const result = formatNaira(1500);
    // Should include the Naira sign and formatted number
    expect(result).toContain('\u20A6');
    expect(result).toContain('1,500');
  });

  it('formats zero', () => {
    const result = formatNaira(0);
    expect(result).toContain('\u20A6');
    expect(result).toContain('0');
  });

  it('formats large numbers with commas', () => {
    const result = formatNaira(1250000);
    expect(result).toContain('\u20A6');
    expect(result).toContain('1,250,000');
  });

  it('returns fallback for null', () => {
    const result = formatNaira(null);
    expect(result).toBe('\u20A60');
  });

  it('returns fallback for undefined', () => {
    const result = formatNaira(undefined);
    expect(result).toBe('\u20A60');
  });

  it('returns fallback for NaN', () => {
    const result = formatNaira(NaN);
    expect(result).toBe('\u20A60');
  });
});

describe('Icon components', () => {
  it('renders Home icon as an SVG', () => {
    const { container } = render(<Icons.Home />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Search icon as an SVG', () => {
    const { container } = render(<Icons.Search />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Cart icon as an SVG', () => {
    const { container } = render(<Icons.Cart />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders User icon as an SVG', () => {
    const { container } = render(<Icons.User />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Phone icon as an SVG', () => {
    const { container } = render(<Icons.Phone />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Shield icon as an SVG', () => {
    const { container } = render(<Icons.Shield />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Pill icon as an SVG', () => {
    const { container } = render(<Icons.Pill />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Blood icon as an SVG', () => {
    const { container } = render(<Icons.Blood />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Trash icon as an SVG', () => {
    const { container } = render(<Icons.Trash />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Plus icon as an SVG', () => {
    const { container } = render(<Icons.Plus />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Minus icon as an SVG', () => {
    const { container } = render(<Icons.Minus />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders Check icon as an SVG', () => {
    const { container } = render(<Icons.Check />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
