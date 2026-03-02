import { useState } from 'react';
import { Play, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useTestWebhook } from '../hooks/useWebhookMutations';
import { cn } from '@/shared/lib/utils';

interface WebhookTestButtonProps {
  webhookId: string;
  isDisabled?: boolean;
  className?: string;
}

type TestStatus = 'idle' | 'loading' | 'success' | 'error';

export function WebhookTestButton({
  webhookId,
  isDisabled = false,
  className,
}: WebhookTestButtonProps) {
  const [status, setStatus] = useState<TestStatus>('idle');
  const [result, setResult] = useState<{ statusCode?: number; error?: string } | null>(null);
  const testWebhook = useTestWebhook();

  const handleTest = async () => {
    setStatus('loading');
    setResult(null);

    try {
      const response = await testWebhook.mutateAsync(webhookId);
      if (response.data?.success) {
        setStatus('success');
        setResult({ statusCode: response.data.statusCode });
      } else {
        setStatus('error');
        setResult({ error: response.data?.error ?? 'Test failed' });
      }
    } catch (error) {
      setStatus('error');
      setResult({ error: error instanceof Error ? error.message : 'Test failed' });
    }

    // Reset status after 3 seconds
    setTimeout(() => {
      setStatus('idle');
      setResult(null);
    }, 3000);
  };

  const getButtonContent = () => {
    switch (status) {
      case 'loading':
        return (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Testing...</span>
          </>
        );
      case 'success':
        return (
          <>
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span>Success ({result?.statusCode})</span>
          </>
        );
      case 'error':
        return (
          <>
            <XCircle className="h-4 w-4 text-destructive" />
            <span>Failed</span>
          </>
        );
      default:
        return (
          <>
            <Play className="h-4 w-4" />
            <span>Test</span>
          </>
        );
    }
  };

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={handleTest}
        disabled={isDisabled || status === 'loading'}
        className={cn(
          'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium',
          'border border-border hover:bg-muted',
          'disabled:cursor-not-allowed disabled:opacity-50',
          status === 'success' && 'border-green-500/50 bg-green-500/10',
          status === 'error' && 'border-destructive/50 bg-destructive/10',
          className
        )}
      >
        {getButtonContent()}
      </button>

      {status === 'error' && result?.error && (
        <span className="text-xs text-destructive">{result.error}</span>
      )}
    </div>
  );
}
