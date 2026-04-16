const CONTROL_CHARS_REGEX = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;
const WHITESPACE_REGEX = /\s+/g;
const SAFE_KEY_REGEX = /^[A-Za-z0-9_.-]+$/;

export interface SanitizeStringOptions {
  trim?: boolean;
  collapseWhitespace?: boolean;
  removeControlChars?: boolean;
  maxLength?: number;
  emptyToNull?: boolean;
}

export interface SanitizeObjectOptions extends SanitizeStringOptions {
  stripUnknownKeys?: boolean;
  allowedKeys?: string[];
  deep?: boolean;
}

export function sanitizeString(
  value: unknown,
  options: SanitizeStringOptions = {},
): string | null {
  if (value === null || value === undefined) {
    return null;
  }

  let result = String(value);

  if (options.removeControlChars !== false) {
    result = result.replace(CONTROL_CHARS_REGEX, '');
  }

  if (options.collapseWhitespace) {
    result = result.replace(WHITESPACE_REGEX, ' ');
  }

  if (options.trim !== false) {
    result = result.trim();
  }

  if (typeof options.maxLength === 'number' && options.maxLength >= 0) {
    result = result.slice(0, options.maxLength);
  }

  if (options.emptyToNull !== false && result.length === 0) {
    return null;
  }

  return result;
}

export function sanitizeEmail(value: unknown): string | null {
  const email = sanitizeString(value, {
    trim: true,
    collapseWhitespace: true,
    removeControlChars: true,
    maxLength: 320,
    emptyToNull: true,
  });

  if (!email) {
    return null;
  }

  return email.toLowerCase();
}

export function sanitizeSlug(value: unknown, maxLength = 128): string | null {
  const input = sanitizeString(value, {
    trim: true,
    collapseWhitespace: true,
    removeControlChars: true,
    maxLength,
    emptyToNull: true,
  });

  if (!input) {
    return null;
  }

  const slug = input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);

  return slug.length > 0 ? slug : null;
}

export function sanitizeKey(value: unknown): string | null {
  const key = sanitizeString(value, {
    trim: true,
    collapseWhitespace: false,
    removeControlChars: true,
    maxLength: 128,
    emptyToNull: true,
  });

  if (!key) {
    return null;
  }

  return SAFE_KEY_REGEX.test(key) ? key : null;
}

export function sanitizeStringArray(
  value: unknown,
  options: SanitizeStringOptions = {},
): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => sanitizeString(item, options))
    .filter((item): item is string => Boolean(item));
}

export function sanitizeObject<T extends Record<string, unknown>>(
  value: unknown,
  options: SanitizeObjectOptions = {},
): Partial<T> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }

  const source = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  const allowed = options.allowedKeys ? new Set(options.allowedKeys) : null;

  for (const [rawKey, rawValue] of Object.entries(source)) {
    const key = sanitizeKey(rawKey);

    if (!key) {
      continue;
    }

    if (allowed && !allowed.has(key)) {
      if (options.stripUnknownKeys !== false) {
        continue;
      }
    }

    if (typeof rawValue === 'string') {
      const sanitized = sanitizeString(rawValue, options);
      if (sanitized !== null) {
        output[key] = sanitized;
      }
      continue;
    }

    if (Array.isArray(rawValue)) {
      output[key] = rawValue
        .map((item) => {
          if (typeof item === 'string') {
            return sanitizeString(item, options);
          }

          if (options.deep && item && typeof item === 'object' && !Array.isArray(item)) {
            return sanitizeObject(item as Record<string, unknown>, options);
          }

          return item;
        })
        .filter((item) => item !== null && item !== undefined);
      continue;
    }

    if (options.deep && rawValue && typeof rawValue === 'object') {
      output[key] = sanitizeObject(rawValue as Record<string, unknown>, options);
      continue;
    }

    output[key] = rawValue;
  }

  return output as Partial<T>;
}

export function stripHtml(value: unknown): string | null {
  const input = sanitizeString(value, {
    trim: true,
    collapseWhitespace: true,
    removeControlChars: true,
    emptyToNull: true,
  });

  if (!input) {
    return null;
  }

  const stripped = input.replace(/<[^>]*>/g, '');
  return sanitizeString(stripped, {
    trim: true,
    collapseWhitespace: true,
    removeControlChars: true,
    emptyToNull: true,
  });
}

export default {
  sanitizeString,
  sanitizeEmail,
  sanitizeSlug,
  sanitizeKey,
  sanitizeStringArray,
  sanitizeObject,
  stripHtml,
};
