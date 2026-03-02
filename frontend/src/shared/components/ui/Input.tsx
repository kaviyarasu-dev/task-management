import { forwardRef, type InputHTMLAttributes, useId } from 'react';
import { cn } from '@/shared/lib/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId ?? generatedId;
    const errorId = `${id}-error`;
    const helperId = `${id}-helper`;
    const hasError = Boolean(error);

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className="mb-1.5 block text-sm font-medium text-foreground"
          >
            {label}
            {props.required && <span className="ml-1 text-destructive">*</span>}
          </label>
        )}
        <input
          ref={ref}
          id={id}
          className={cn(
            'flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm transition-colors',
            'placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
            'disabled:cursor-not-allowed disabled:opacity-50',
            hasError
              ? 'border-destructive focus:ring-destructive/50'
              : 'border-border',
            className
          )}
          aria-invalid={hasError}
          aria-describedby={
            hasError ? errorId : helperText ? helperId : undefined
          }
          {...props}
        />
        {error && (
          <p id={errorId} className="mt-1.5 text-sm text-destructive" role="alert">
            {error}
          </p>
        )}
        {helperText && !error && (
          <p id={helperId} className="mt-1.5 text-sm text-muted-foreground">
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export type { InputProps };
