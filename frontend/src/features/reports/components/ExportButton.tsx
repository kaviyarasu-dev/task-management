import { Download, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

interface ExportButtonProps {
  onClick: () => void;
  isExporting?: boolean;
  disabled?: boolean;
  className?: string;
}

export function ExportButton({
  onClick,
  isExporting,
  disabled,
  className,
}: ExportButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || isExporting}
      className={cn(
        'flex items-center gap-2 rounded-md border border-border bg-background px-4 py-2',
        'text-sm font-medium text-foreground',
        'hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50',
        'transition-colors',
        className
      )}
    >
      {isExporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      Export CSV
    </button>
  );
}
