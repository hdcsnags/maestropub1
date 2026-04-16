export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface FileValidationOptions {
  allowedMimeTypes?: string[];
  allowedExtensions?: string[];
  maxSizeBytes?: number;
  minSizeBytes?: number;
  requireFilename?: boolean;
}

export interface FileLikeInput {
  originalname?: string;
  filename?: string;
  mimetype?: string;
  size?: number;
}

const DEFAULT_OPTIONS: Required<FileValidationOptions> = {
  allowedMimeTypes: [],
  allowedExtensions: [],
  maxSizeBytes: Number.MAX_SAFE_INTEGER,
  minSizeBytes: 0,
  requireFilename: true,
};

function normalizeExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase();
  if (!trimmed) {
    return '';
  }

  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`;
}

function getFilename(file: FileLikeInput): string {
  return (file.originalname || file.filename || '').trim();
}

function getExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  if (lastDotIndex < 0 || lastDotIndex === filename.length - 1) {
    return '';
  }

  return filename.slice(lastDotIndex).toLowerCase();
}

export function validateFile(
  file: FileLikeInput | null | undefined,
  options: FileValidationOptions = {},
): ValidationResult {
  const config = {
    ...DEFAULT_OPTIONS,
    ...options,
    allowedMimeTypes: (options.allowedMimeTypes || DEFAULT_OPTIONS.allowedMimeTypes).map((type) =>
      type.trim().toLowerCase(),
    ),
    allowedExtensions: (options.allowedExtensions || DEFAULT_OPTIONS.allowedExtensions).map(normalizeExtension),
  };

  const errors: string[] = [];

  if (!file) {
    return {
      valid: false,
      errors: ['No file provided'],
    };
  }

  const filename = getFilename(file);
  const mimetype = (file.mimetype || '').trim().toLowerCase();
  const size = typeof file.size === 'number' ? file.size : NaN;

  if (config.requireFilename && !filename) {
    errors.push('File name is required');
  }

  if (config.allowedExtensions.length > 0) {
    const extension = getExtension(filename);
    if (!extension || !config.allowedExtensions.includes(extension)) {
      errors.push(`Invalid file extension${config.allowedExtensions.length ? `. Allowed: ${config.allowedExtensions.join(', ')}` : ''}`);
    }
  }

  if (config.allowedMimeTypes.length > 0) {
    if (!mimetype || !config.allowedMimeTypes.includes(mimetype)) {
      errors.push(`Invalid file type${config.allowedMimeTypes.length ? `. Allowed: ${config.allowedMimeTypes.join(', ')}` : ''}`);
    }
  }

  if (!Number.isFinite(size)) {
    errors.push('File size is invalid');
  } else {
    if (size < config.minSizeBytes) {
      errors.push(`File size must be at least ${config.minSizeBytes} bytes`);
    }

    if (size > config.maxSizeBytes) {
      errors.push(`File size must not exceed ${config.maxSizeBytes} bytes`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function assertValidFile(
  file: FileLikeInput | null | undefined,
  options: FileValidationOptions = {},
): void {
  const result = validateFile(file, options);

  if (!result.valid) {
    throw new Error(result.errors.join('; '));
  }
}
