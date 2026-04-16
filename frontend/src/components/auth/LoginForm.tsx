import React, { FormEvent, useEffect, useMemo, useState } from 'react';

type LoginFormValues = {
  email: string;
  password: string;
  rememberMe: boolean;
};

type LoginFormProps = {
  onSubmit?: (values: LoginFormValues) => void | Promise<void>;
  isLoading?: boolean;
  error?: string | null;
  initialEmail?: string;
  submitLabel?: string;
  title?: string;
  subtitle?: string;
  forgotPasswordHref?: string;
  signUpHref?: string;
  className?: string;
};

type ValidationErrors = {
  email?: string;
  password?: string;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate(values: LoginFormValues): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_PATTERN.test(values.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 6) {
    errors.password = 'Password must be at least 6 characters.';
  }

  return errors;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export default function LoginForm({
  onSubmit,
  isLoading = false,
  error = null,
  initialEmail = '',
  submitLabel = 'Sign in',
  title = 'Welcome back',
  subtitle = 'Sign in to continue to your account.',
  forgotPasswordHref = '/forgot-password',
  signUpHref = '/signup',
  className,
}: LoginFormProps) {
  const [values, setValues] = useState<LoginFormValues>({
    email: initialEmail,
    password: '',
    rememberMe: true,
  });
  const [touched, setTouched] = useState<Record<keyof LoginFormValues, boolean>>({
    email: false,
    password: false,
    rememberMe: false,
  });
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setValues((current) => ({ ...current, email: initialEmail }));
  }, [initialEmail]);

  const errors = useMemo(() => validate(values), [values]);
  const hasErrors = Boolean(errors.email || errors.password);

  const showEmailError = touched.email && errors.email;
  const showPasswordError = touched.password && errors.password;
  const resolvedError = submitError || error;

  const handleChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, type, checked, value } = event.target;
    setValues((current) => ({
      ...current,
      [name]: type === 'checkbox' ? checked : value,
    }));

    if (submitError) {
      setSubmitError(null);
    }
  };

  const handleBlur = (event: React.FocusEvent<HTMLInputElement>) => {
    const { name } = event.target;
    setTouched((current) => ({
      ...current,
      [name]: true,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    setTouched({
      email: true,
      password: true,
      rememberMe: true,
    });
    setSubmitError(null);

    const nextErrors = validate(values);
    if (nextErrors.email || nextErrors.password) {
      return;
    }

    try {
      await onSubmit?.({
        email: values.email.trim(),
        password: values.password,
        rememberMe: values.rememberMe,
      });
    } catch (caught) {
      if (caught instanceof Error) {
        setSubmitError(caught.message);
      } else {
        setSubmitError('Unable to sign in. Please try again.');
      }
    }
  };

  return (
    <div
      className={cx(
        'w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8',
        className
      )}
    >
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <p className="mt-2 text-sm text-slate-600">{subtitle}</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {resolvedError ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {resolvedError}
          </div>
        ) : null}

        <div>
          <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-700">
            Email
          </label>
          <input
            id="login-email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-invalid={Boolean(showEmailError)}
            aria-describedby={showEmailError ? 'login-email-error' : undefined}
            className={cx(
              'block w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
              'focus:ring-4',
              showEmailError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-100',
              isLoading && 'cursor-not-allowed opacity-70'
            )}
            placeholder="you@example.com"
          />
          {showEmailError ? (
            <p id="login-email-error" className="mt-2 text-sm text-red-600">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between gap-4">
            <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
              Password
            </label>
            <a
              href={forgotPasswordHref}
              className="text-sm font-medium text-slate-700 underline-offset-4 hover:text-slate-900 hover:underline"
            >
              Forgot password?
            </a>
          </div>
          <input
            id="login-password"
            name="password"
            type="password"
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            aria-invalid={Boolean(showPasswordError)}
            aria-describedby={showPasswordError ? 'login-password-error' : undefined}
            className={cx(
              'block w-full rounded-xl border bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400',
              'focus:ring-4',
              showPasswordError
                ? 'border-red-300 focus:border-red-500 focus:ring-red-100'
                : 'border-slate-300 focus:border-slate-900 focus:ring-slate-100',
              isLoading && 'cursor-not-allowed opacity-70'
            )}
            placeholder="Enter your password"
          />
          {showPasswordError ? (
            <p id="login-password-error" className="mt-2 text-sm text-red-600">
              {errors.password}
            </p>
          ) : null}
        </div>

        <label className="flex items-center gap-3 text-sm text-slate-600">
          <input
            name="rememberMe"
            type="checkbox"
            checked={values.rememberMe}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={isLoading}
            className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-200"
          />
          <span>Keep me signed in</span>
        </label>

        <button
          type="submit"
          disabled={isLoading || hasErrors}
          className={cx(
            'inline-flex w-full items-center justify-center rounded-xl px-4 py-3 text-sm font-semibold text-white transition',
            isLoading || hasErrors
              ? 'cursor-not-allowed bg-slate-400'
              : 'bg-slate-900 hover:bg-slate-800 focus:outline-none focus:ring-4 focus:ring-slate-200'
          )}
        >
          {isLoading ? 'Signing in...' : submitLabel}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-slate-600">
        Don&apos;t have an account?{' '}
        <a
          href={signUpHref}
          className="font-medium text-slate-900 underline-offset-4 hover:underline"
        >
          Create one
        </a>
      </p>
    </div>
  );
}
