import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

type RegisterFormValues = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

type FieldErrors = Partial<Record<keyof RegisterFormValues, string>> & {
  form?: string;
};

type RegisterResponse = {
  message?: string;
  token?: string;
  user?: unknown;
};

const INITIAL_VALUES: RegisterFormValues = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function getApiBaseUrl(): string {
  const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env;
  return env?.VITE_API_URL?.replace(/\/$/, '') || '';
}

function validate(values: RegisterFormValues): FieldErrors {
  const errors: FieldErrors = {};

  if (!values.name.trim()) {
    errors.name = 'Name is required.';
  } else if (values.name.trim().length < 2) {
    errors.name = 'Name must be at least 2 characters.';
  }

  if (!values.email.trim()) {
    errors.email = 'Email is required.';
  } else if (!EMAIL_REGEX.test(values.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  }

  if (!values.password) {
    errors.password = 'Password is required.';
  } else if (values.password.length < 8) {
    errors.password = 'Password must be at least 8 characters.';
  }

  if (!values.confirmPassword) {
    errors.confirmPassword = 'Please confirm your password.';
  } else if (values.password !== values.confirmPassword) {
    errors.confirmPassword = 'Passwords do not match.';
  }

  return errors;
}

async function registerRequest(values: RegisterFormValues): Promise<RegisterResponse> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      password: values.password,
    }),
  });

  let data: RegisterResponse | { message?: string } = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    throw new Error(data.message || 'Unable to create your account. Please try again.');
  }

  return data;
}

export default function RegisterForm(): JSX.Element {
  const navigate = useNavigate();
  const [values, setValues] = useState<RegisterFormValues>(INITIAL_VALUES);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const passwordStrength = useMemo(() => {
    const password = values.password;
    let score = 0;

    if (password.length >= 8) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/\d/.test(password)) score += 1;
    if (/[^A-Za-z0-9]/.test(password)) score += 1;

    if (score <= 2) return { label: 'Weak', color: 'bg-red-500', width: 'w-1/3' };
    if (score === 3 || score === 4) return { label: 'Medium', color: 'bg-amber-500', width: 'w-2/3' };
    return { label: 'Strong', color: 'bg-emerald-500', width: 'w-full' };
  }, [values.password]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined, form: undefined }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const nextErrors = validate(values);
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const result = await registerRequest(values);

      if (result.token) {
        localStorage.setItem('token', result.token);
      }

      navigate('/login', {
        replace: true,
        state: {
          message: result.message || 'Account created successfully. Please sign in.',
          registeredEmail: values.email.trim().toLowerCase(),
        },
      });
    } catch (error) {
      setErrors({
        form: error instanceof Error ? error.message : 'Unable to create your account. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-gray-900 dark:text-white">Create your account</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          Join now to get started with your workspace.
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit} noValidate>
        {errors.form ? (
          <div
            className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-300"
            role="alert"
          >
            {errors.form}
          </div>
        ) : null}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={values.name}
            onChange={handleChange}
            className={`block w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-white ${
              errors.name
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
                : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-400 dark:focus:ring-gray-800'
            }`}
            placeholder="Jane Doe"
            aria-invalid={Boolean(errors.name)}
            aria-describedby={errors.name ? 'name-error' : undefined}
          />
          {errors.name ? (
            <p id="name-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.name}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={values.email}
            onChange={handleChange}
            className={`block w-full rounded-lg border px-4 py-3 text-sm outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-white ${
              errors.email
                ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
                : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-400 dark:focus:ring-gray-800'
            }`}
            placeholder="you@example.com"
            aria-invalid={Boolean(errors.email)}
            aria-describedby={errors.email ? 'email-error' : undefined}
          />
          {errors.email ? (
            <p id="email-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.password}
              onChange={handleChange}
              className={`block w-full rounded-lg border px-4 py-3 pr-16 text-sm outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-white ${
                errors.password
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
                  : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-400 dark:focus:ring-gray-800'
              }`}
              placeholder="Create a secure password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? 'password-error' : 'password-help'}
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 my-auto h-fit text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div className={`h-full ${passwordStrength.width} ${passwordStrength.color} transition-all`} />
            </div>
            <span className="text-xs font-medium text-gray-600 dark:text-gray-400">{passwordStrength.label}</span>
          </div>
          {errors.password ? (
            <p id="password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.password}
            </p>
          ) : (
            <p id="password-help" className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Use at least 8 characters with a mix of letters, numbers, and symbols.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Confirm password
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={handleChange}
              className={`block w-full rounded-lg border px-4 py-3 pr-16 text-sm outline-none transition focus:ring-2 dark:bg-gray-950 dark:text-white ${
                errors.confirmPassword
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-200 dark:border-red-700 dark:focus:ring-red-900'
                  : 'border-gray-300 focus:border-gray-900 focus:ring-gray-200 dark:border-gray-700 dark:focus:border-gray-400 dark:focus:ring-gray-800'
              }`}
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={errors.confirmPassword ? 'confirm-password-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              className="absolute inset-y-0 right-3 my-auto h-fit text-sm font-medium text-gray-500 transition hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
            >
              {showConfirmPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          {errors.confirmPassword ? (
            <p id="confirm-password-error" className="mt-2 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex w-full items-center justify-center rounded-lg bg-gray-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
        Already have an account?{' '}
        <Link
          to="/login"
          className="font-medium text-gray-900 underline-offset-4 hover:underline dark:text-white"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
