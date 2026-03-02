import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useKeyboardNavigation } from '@/shared/hooks/useKeyboardNavigation';

function TestComponent({
  itemCount = 3,
  onSelect,
  onEscape,
  loop = true,
  orientation = 'vertical' as const,
}: {
  itemCount?: number;
  onSelect?: (index: number) => void;
  onEscape?: () => void;
  loop?: boolean;
  orientation?: 'vertical' | 'horizontal' | 'both';
}) {
  const { activeIndex, handleKeyDown } = useKeyboardNavigation({
    itemCount,
    onSelect,
    onEscape,
    loop,
    orientation,
  });

  return (
    <div onKeyDown={handleKeyDown} tabIndex={0} data-testid="container">
      {Array.from({ length: itemCount }, (_, i) => (
        <div key={i} data-testid={`item-${i}`} data-active={activeIndex === i}>
          Item {i}
        </div>
      ))}
    </div>
  );
}

describe('useKeyboardNavigation', () => {
  describe('vertical navigation', () => {
    it('moves down with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');

      expect(screen.getByTestId('item-1')).toHaveAttribute('data-active', 'true');
    });

    it('moves up with ArrowUp', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowUp}');

      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });

    it('loops from last to first with ArrowDown', async () => {
      const user = userEvent.setup();
      render(<TestComponent itemCount={3} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');

      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });

    it('loops from first to last with ArrowUp', async () => {
      const user = userEvent.setup();
      render(<TestComponent itemCount={3} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowUp}');

      expect(screen.getByTestId('item-2')).toHaveAttribute('data-active', 'true');
    });

    it('does not loop when loop is false', async () => {
      const user = userEvent.setup();
      render(<TestComponent loop={false} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowUp}');

      // Should stay at 0
      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('horizontal navigation', () => {
    it('moves right with ArrowRight', async () => {
      const user = userEvent.setup();
      render(<TestComponent orientation="horizontal" />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowRight}');

      expect(screen.getByTestId('item-1')).toHaveAttribute('data-active', 'true');
    });

    it('moves left with ArrowLeft', async () => {
      const user = userEvent.setup();
      render(<TestComponent orientation="horizontal" />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowRight}');
      await user.keyboard('{ArrowLeft}');

      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });

    it('does not respond to ArrowUp/Down in horizontal mode', async () => {
      const user = userEvent.setup();
      render(<TestComponent orientation="horizontal" />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');

      // Should stay at 0
      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('both orientation', () => {
    it('responds to all arrow keys', async () => {
      const user = userEvent.setup();
      render(<TestComponent orientation="both" />);

      const container = screen.getByTestId('container');
      container.focus();

      await user.keyboard('{ArrowDown}');
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-active', 'true');

      await user.keyboard('{ArrowRight}');
      expect(screen.getByTestId('item-2')).toHaveAttribute('data-active', 'true');

      await user.keyboard('{ArrowUp}');
      expect(screen.getByTestId('item-1')).toHaveAttribute('data-active', 'true');

      await user.keyboard('{ArrowLeft}');
      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('home and end', () => {
    it('goes to first item with Home', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Home}');

      expect(screen.getByTestId('item-0')).toHaveAttribute('data-active', 'true');
    });

    it('goes to last item with End', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{End}');

      expect(screen.getByTestId('item-2')).toHaveAttribute('data-active', 'true');
    });
  });

  describe('selection', () => {
    it('calls onSelect with Enter', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(<TestComponent onSelect={handleSelect} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{ArrowDown}');
      await user.keyboard('{Enter}');

      expect(handleSelect).toHaveBeenCalledWith(1);
    });

    it('calls onSelect with Space', async () => {
      const user = userEvent.setup();
      const handleSelect = vi.fn();
      render(<TestComponent onSelect={handleSelect} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard(' ');

      expect(handleSelect).toHaveBeenCalledWith(0);
    });
  });

  describe('escape', () => {
    it('calls onEscape when Escape is pressed', async () => {
      const user = userEvent.setup();
      const handleEscape = vi.fn();
      render(<TestComponent onEscape={handleEscape} />);

      const container = screen.getByTestId('container');
      container.focus();
      await user.keyboard('{Escape}');

      expect(handleEscape).toHaveBeenCalledTimes(1);
    });
  });
});
