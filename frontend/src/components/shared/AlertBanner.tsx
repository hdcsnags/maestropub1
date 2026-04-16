import React from 'react';

type AlertVariant = 'info' | 'success' | 'warning' | 'error';

export interface AlertBannerProps {
  message: React.ReactNode;
  title?: React.ReactNode;
  variant?: AlertVariant;
  className?: string;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

const variantStyles: Record<AlertVariant, string> = {
  info: 'border-blue-200 bg-blue-50 text-blue-900',
  success: 'border-green-200 bg-green-50 text-green-900',
  warning: 'border-yellow-200 bg-yellow-50 text-yellow-900',
  error: 'border-red-200 bg-red-50 text-red-900',
};

const iconStyles: Record<AlertVariant, string> = {
  info: 'text-blue-500',
  success: 'text-green-500',
  warning: 'text-yellow-500',
  error: 'text-red-500',
};

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function DefaultIcon({ variant }: { variant: AlertVariant }) {
  const className = cn('h-5 w-5 flex-shrink-0', iconStyles[variant]);

  switch (variant) {
    case 'success':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'warning':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.765-1.36 2.72-1.36 3.486 0l6.518 11.591c.75 1.334-.213 2.99-1.742 2.99H3.48c-1.53 0-2.492-1.656-1.743-2.99L8.257 3.1zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-7a1 1 0 00-1 1v3a1 1 0 102 0V8a1 1 0 00-1-1z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'error':
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
          <path
            fillRule="evenodd"
            d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-10.293a1 1 0 00-1.414-1.414L10 8.586 7.707 6.293a1 1 0 00-1.414 1.414L8.586 10l-2.293 2.293a1 1 0 101.414 1.414L10 11.414l2.293 2.293a1 1 0 001.414-1.414L11.414 10l2.293-2.293z"
            clipRule="evenodd"
          />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={className}>
          <path
            fillRule="evenodd"
            d="M18 10A8 8 0 112 10a8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zm-2 3a1 1 0 000 2v3a1 1 0 102 0v-3a1 1 0 100-2H9z"
            clipRule="evenodd"
          />
        </svg>
      );
  }
}

export function AlertBanner({
  message,
  title,
  variant = 'info',
  className,
  icon,
  dismissible = false,
  onDismiss,
}: AlertBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        'w-full rounded-lg border px-4 py-3',
        variantStyles[variant],
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div className="pt-0.5">{icon ?? <DefaultIcon variant={variant} />}</div>

        <div className="min-w-0 flex-1">
          {title ? <div className="text-sm font-semibold leading-6">{title}</div> : null}
          <div className={cn('text-sm leading-6', title ? 'mt-1' : '')}>{message}</div>
        </div>

        {dismissible ? (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss alert"
            className="inline-flex rounded-md p-1 transition-opacity hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-current focus:ring-offset-2"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="h-5 w-5">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default AlertBanner;
