import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { useFocusTrap } from '@/shared/hooks/useFocusTrap';

function TestComponent({
  isActive = true,
  onEscape,
  autoFocus = true,
}: {
  isActive?: boolean;
  onEscape?: () => void;
  autoFocus?: boolean;
}) {
  const ref = useFocusTrap<HTMLDivElement>({
    isActive,
    onEscape,
    autoFocus,
    restoreFocus: false,
  });

  return (
    <div ref={ref} data-testid="trap-container">
      <button data-testid="first">First</button>
      <input data-testid="middle" />
      <button data-testid="last">Last</button>
    </div>
  );
}

describe('useFocusTrap', () => {
  describe('auto focus', () => {
    it('focuses first focusable element when active', () => {
      render(<TestComponent />);
      expect(screen.getByTestId('first')).toHaveFocus();
    });

    it('does not auto focus when autoFocus is false', () => {
      render(<TestComponent autoFocus={false} />);
      expect(screen.getByTestId('first')).not.toHaveFocus();
    });

    it('does not auto focus when not active', () => {
      render(<TestComponent isActive={false} />);
      expect(screen.getByTestId('first')).not.toHaveFocus();
    });
  });

  describe('tab trapping', () => {
    it('traps focus forward - last to first', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Tab through all elements
      await user.tab(); // middle
      await user.tab(); // last
      await user.tab(); // should wrap to first

      expect(screen.getByTestId('first')).toHaveFocus();
    });

    it('traps focus backward - first to last', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // First is focused, shift+tab should go to last
      await user.tab({ shift: true });

      expect(screen.getByTestId('last')).toHaveFocus();
    });
  });

  describe('escape handling', () => {
    it('calls onEscape when Escape is pressed', async () => {
      const user = userEvent.setup();
      const handleEscape = vi.fn();

      render(<TestComponent onEscape={handleEscape} />);
      await user.keyboard('{Escape}');

      expect(handleEscape).toHaveBeenCalledTimes(1);
    });

    it('does not call onEscape when not provided', async () => {
      const user = userEvent.setup();
      render(<TestComponent />);

      // Should not throw
      await user.keyboard('{Escape}');
    });
  });

  describe('inactive state', () => {
    it('does not trap focus when inactive', async () => {
      const user = userEvent.setup();

      render(
        <>
          <TestComponent isActive={false} />
          <button data-testid="outside">Outside</button>
        </>
      );

      // Focus first button manually
      screen.getByTestId('first').focus();
      expect(screen.getByTestId('first')).toHaveFocus();

      // Tab through all elements and out
      await user.tab();
      await user.tab();
      await user.tab();

      expect(screen.getByTestId('outside')).toHaveFocus();
    });
  });
});
