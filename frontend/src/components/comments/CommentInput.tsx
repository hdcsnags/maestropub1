import React, { FormEvent, KeyboardEvent, useCallback, useMemo, useState } from 'react';

type CommentInputProps = {
  onSubmit: (content: string) => Promise<void> | void;
  placeholder?: string;
  submitLabel?: string;
  disabled?: boolean;
  autoFocus?: boolean;
  minLength?: number;
  maxLength?: number;
  className?: string;
  rows?: number;
  compact?: boolean;
};

const DEFAULT_MIN_LENGTH = 1;
const DEFAULT_MAX_LENGTH = 1000;

function cn(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export default function CommentInput({
  onSubmit,
  placeholder = 'Write a comment…',
  submitLabel = 'Post',
  disabled = false,
  autoFocus = false,
  minLength = DEFAULT_MIN_LENGTH,
  maxLength = DEFAULT_MAX_LENGTH,
  className,
  rows = 3,
  compact = false,
}: CommentInputProps) {
  const [value, setValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmedValue = useMemo(() => value.trim(), [value]);
  const isEmpty = trimmedValue.length === 0;
  const isTooShort = trimmedValue.length > 0 && trimmedValue.length < minLength;
  const isTooLong = value.length > maxLength;
  const canSubmit = !disabled && !isSubmitting && !isEmpty && !isTooShort && !isTooLong;
  const remaining = maxLength - value.length;

  const validationMessage = useMemo(() => {
    if (error) return error;
    if (isTooShort) {
      return `Comment must be at least ${minLength} character${minLength === 1 ? '' : 's'}.`;
    }
    if (isTooLong) {
      return `Comment must be ${maxLength} characters or fewer.`;
    }
    return null;
  }, [error, isTooLong, isTooShort, maxLength, minLength]);

  const reset = useCallback(() => {
    setValue('');
    setError(null);
  }, []);

  const handleSubmit = useCallback(
    async (event?: FormEvent<HTMLFormElement>) => {
      event?.preventDefault();
      setError(null);

      const nextValue = value.trim();

      if (!nextValue) {
        setError('Comment cannot be empty.');
        return;
      }

      if (nextValue.length < minLength) {
        setError(`Comment must be at least ${minLength} character${minLength === 1 ? '' : 's'}.`);
        return;
      }

      if (value.length > maxLength) {
        setError(`Comment must be ${maxLength} characters or fewer.`);
        return;
      }

      try {
        setIsSubmitting(true);
        await onSubmit(nextValue);
        reset();
      } catch (submitError) {
        const message =
          submitError instanceof Error && submitError.message
            ? submitError.message
            : 'Unable to post comment. Please try again.';
        setError(message);
      } finally {
        setIsSubmitting(false);
      }
    },
    [maxLength, minLength, onSubmit, reset, value]
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
        event.preventDefault();
        if (canSubmit) {
          void handleSubmit();
        }
      }
    },
    [canSubmit, handleSubmit]
  );

  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'w-full rounded-xl border border-gray-200 bg-white p-3 shadow-sm',
        compact ? 'space-y-2' : 'space-y-3',
        disabled ? 'opacity-70' : '',
        className
      )}
    >
      <div className="space-y-2">
        <label className="sr-only" htmlFor="comment-input">
          Add a comment
        </label>
        <textarea
          id="comment-input"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            if (error) setError(null);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled || isSubmitting}
          autoFocus={autoFocus}
          rows={rows}
          maxLength={maxLength + 100}
          className={cn(
            'w-full resize-y rounded-lg border px-3 py-2 text-sm text-gray-900 outline-none transition',
            'placeholder:text-gray-400',
            validationMessage
              ? 'border-red-300 focus:border-red-500 focus:ring-2 focus:ring-red-100'
              : 'border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100',
            disabled || isSubmitting ? 'cursor-not-allowed bg-gray-50' : 'bg-white'
          )}
          aria-invalid={validationMessage ? 'true' : 'false'}
          aria-describedby="comment-input-help"
        />
      </div>

      <div className="flex items-center justify-between gap-3">
        <div id="comment-input-help" className="min-h-[1.25rem] text-xs">
          {validationMessage ? (
            <p className="text-red-600">{validationMessage}</p>
          ) : (
            <p className={cn('text-gray-500', remaining < 50 ? 'text-amber-600' : '')}>
              {remaining} character{Math.abs(remaining) === 1 ? '' : 's'} remaining
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={!canSubmit}
          className={cn(
            'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition',
            canSubmit
              ? 'bg-blue-600 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200'
              : 'cursor-not-allowed bg-gray-200 text-gray-500'
          )}
        >
          {isSubmitting ? 'Posting…' : submitLabel}
        </button>
      </div>
    </form>
  );
}
