import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from 'react';

type UploadStatus = 'idle' | 'selecting' | 'uploading' | 'success' | 'error';

type UploadedFileRecord = {
  id: string;
  file: File;
  progress: number;
  status: UploadStatus;
  error?: string;
  uploadedAt?: string;
};

type UploadRequest = {
  file: File;
  signal?: AbortSignal;
  onProgress?: (progress: number) => void;
};

type UploadResult = {
  id?: string;
  url?: string;
  uploadedAt?: string;
};

export interface FileUploadWidgetProps {
  label?: string;
  description?: string;
  accept?: string;
  multiple?: boolean;
  disabled?: boolean;
  maxFiles?: number;
  maxFileSizeBytes?: number;
  className?: string;
  buttonText?: string;
  dropzoneText?: string;
  value?: File[];
  onChange?: (files: File[]) => void;
  onUpload?: (request: UploadRequest) => Promise<UploadResult | void>;
  onUploaded?: (results: Array<UploadedFileRecord & { result?: UploadResult | void }>) => void;
  onError?: (message: string) => void;
}

const DEFAULT_MAX_FILES = 10;

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size >= 10 || unitIndex === 0 ? size.toFixed(0) : size.toFixed(1)} ${units[unitIndex]}`;
};

const formatAcceptText = (accept?: string): string | null => {
  if (!accept) return null;
  const parts = accept
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => {
      if (part.startsWith('.')) return part.toUpperCase();
      if (part.endsWith('/*')) return `${part.replace('/*', '').toUpperCase()} files`;
      return part;
    });
  return parts.length ? parts.join(', ') : null;
};

const createFileFingerprint = (file: File): string => `${file.name}-${file.size}-${file.lastModified}`;

const defaultUpload = async ({ onProgress, signal }: UploadRequest): Promise<UploadResult> => {
  for (let i = 1; i <= 10; i += 1) {
    if (signal?.aborted) {
      throw new DOMException('Upload aborted', 'AbortError');
    }
    await new Promise((resolve) => window.setTimeout(resolve, 80));
    onProgress?.(i * 10);
  }
  return { uploadedAt: new Date().toISOString() };
};

const FileUploadWidget: React.FC<FileUploadWidgetProps> = ({
  label = 'Upload files',
  description,
  accept,
  multiple = true,
  disabled = false,
  maxFiles = DEFAULT_MAX_FILES,
  maxFileSizeBytes,
  className,
  buttonText = 'Choose files',
  dropzoneText = 'Drag and drop files here, or click to browse',
  value,
  onChange,
  onUpload,
  onUploaded,
  onError,
}) => {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const abortControllersRef = useRef<Map<string, AbortController>>(new Map());

  const [isDragging, setIsDragging] = useState(false);
  const [records, setRecords] = useState<UploadedFileRecord[]>([]);

  const acceptText = useMemo(() => formatAcceptText(accept), [accept]);

  useEffect(() => {
    if (!value) return;
    setRecords((current) => {
      const byFingerprint = new Map(current.map((record) => [createFileFingerprint(record.file), record]));
      return value.map((file) => {
        const existing = byFingerprint.get(createFileFingerprint(file));
        return (
          existing ?? {
            id: `${createFileFingerprint(file)}-${Math.random().toString(36).slice(2, 9)}`,
            file,
            progress: 0,
            status: 'idle' as UploadStatus,
          }
        );
      });
    });
  }, [value]);

  useEffect(() => {
    return () => {
      abortControllersRef.current.forEach((controller) => controller.abort());
      abortControllersRef.current.clear();
    };
  }, []);

  const emitChange = useCallback(
    (nextRecords: UploadedFileRecord[]) => {
      onChange?.(nextRecords.map((record) => record.file));
    },
    [onChange],
  );

  const validateFiles = useCallback(
    (incomingFiles: File[]): { accepted: File[]; error?: string } => {
      const existingFingerprints = new Set(records.map((record) => createFileFingerprint(record.file)));
      const uniqueIncoming = incomingFiles.filter((file) => !existingFingerprints.has(createFileFingerprint(file)));

      if (records.length + uniqueIncoming.length > maxFiles) {
        return { accepted: [], error: `You can upload up to ${maxFiles} file${maxFiles === 1 ? '' : 's'}.` };
      }

      if (maxFileSizeBytes) {
        const oversized = uniqueIncoming.find((file) => file.size > maxFileSizeBytes);
        if (oversized) {
          return {
            accepted: [],
            error: `${oversized.name} exceeds the maximum file size of ${formatBytes(maxFileSizeBytes)}.`,
          };
        }
      }

      return { accepted: uniqueIncoming };
    },
    [maxFileSizeBytes, maxFiles, records],
  );

  const performUploads = useCallback(
    async (pendingRecords: UploadedFileRecord[]) => {
      const uploader = onUpload ?? defaultUpload;
      const results: Array<UploadedFileRecord & { result?: UploadResult | void }> = [];

      for (const record of pendingRecords) {
        const controller = new AbortController();
        abortControllersRef.current.set(record.id, controller);

        setRecords((current) =>
          current.map((item) =>
            item.id === record.id
              ? {
                  ...item,
                  status: 'uploading',
                  progress: 0,
                  error: undefined,
                }
              : item,
          ),
        );

        try {
          const result = await uploader({
            file: record.file,
            signal: controller.signal,
            onProgress: (progress) => {
              setRecords((current) =>
                current.map((item) =>
                  item.id === record.id
                    ? {
                        ...item,
                        progress,
                      }
                    : item,
                ),
              );
            },
          });

          const completedRecord: UploadedFileRecord = {
            ...record,
            progress: 100,
            status: 'success',
            uploadedAt: result?.uploadedAt ?? new Date().toISOString(),
          };

          results.push({ ...completedRecord, result });

          setRecords((current) =>
            current.map((item) => (item.id === record.id ? completedRecord : item)),
          );
        } catch (error) {
          const message =
            error instanceof Error
              ? error.message
              : typeof error === 'string'
                ? error
                : 'Upload failed.';

          setRecords((current) =>
            current.map((item) =>
              item.id === record.id
                ? {
                    ...item,
                    status: 'error',
                    error: message,
                  }
                : item,
            ),
          );

          onError?.(message);
        } finally {
          abortControllersRef.current.delete(record.id);
        }
      }

      if (results.length) {
        onUploaded?.(results);
      }
    },
    [onError, onUpload, onUploaded],
  );

  const addFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || disabled) return;

      const files = Array.from(fileList);
      const { accepted, error } = validateFiles(files);

      if (error) {
        onError?.(error);
        return;
      }

      if (!accepted.length) return;

      const newRecords: UploadedFileRecord[] = accepted.map((file) => ({
        id: `${createFileFingerprint(file)}-${Math.random().toString(36).slice(2, 9)}`,
        file,
        progress: 0,
        status: 'idle',
      }));

      const nextRecords = [...records, ...newRecords];
      setRecords(nextRecords);
      emitChange(nextRecords);
      await performUploads(newRecords);
    },
    [disabled, emitChange, onError, performUploads, records, validateFiles],
  );

  const removeFile = useCallback(
    (id: string) => {
      const controller = abortControllersRef.current.get(id);
      controller?.abort();
      abortControllersRef.current.delete(id);

      setRecords((current) => {
        const next = current.filter((record) => record.id !== id);
        emitChange(next);
        return next;
      });
    },
    [emitChange],
  );

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    inputRef.current?.click();
  }, [disabled]);

  const onDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    async (event: React.DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      setIsDragging(false);
      await addFiles(event.dataTransfer.files);
    },
    [addFiles],
  );

  const rootClassName = [
    'file-upload-widget',
    isDragging ? 'file-upload-widget--dragging' : '',
    disabled ? 'file-upload-widget--disabled' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={rootClassName}>
      <div className="file-upload-widget__header">
        <label className="file-upload-widget__label" htmlFor={inputId}>
          {label}
        </label>
        {description ? <p className="file-upload-widget__description">{description}</p> : null}
        {acceptText || maxFileSizeBytes ? (
          <p className="file-upload-widget__meta">
            {acceptText ? `Accepted: ${acceptText}` : null}
            {acceptText && maxFileSizeBytes ? ' · ' : null}
            {maxFileSizeBytes ? `Max size: ${formatBytes(maxFileSizeBytes)}` : null}
          </p>
        ) : null}
      </div>

      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        onChange={(event) => {
          void addFiles(event.target.files);
          event.target.value = '';
        }}
        style={{ display: 'none' }}
      />

      <div
        className="file-upload-widget__dropzone"
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        onClick={openFileDialog}
        onKeyDown={(event) => {
          if (disabled) return;
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFileDialog();
          }
        }}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
      >
        <p className="file-upload-widget__dropzone-text">{dropzoneText}</p>
        <button
          type="button"
          className="file-upload-widget__button"
          onClick={(event) => {
            event.stopPropagation();
            openFileDialog();
          }}
          disabled={disabled}
        >
          {buttonText}
        </button>
      </div>

      {records.length ? (
        <ul className="file-upload-widget__list" aria-live="polite">
          {records.map((record) => (
            <li key={record.id} className="file-upload-widget__item">
              <div className="file-upload-widget__file-info">
                <div>
                  <p className="file-upload-widget__file-name">{record.file.name}</p>
                  <p className="file-upload-widget__file-size">{formatBytes(record.file.size)}</p>
                </div>
                <button
                  type="button"
                  className="file-upload-widget__remove"
                  onClick={() => removeFile(record.id)}
                  aria-label={`Remove ${record.file.name}`}
                  disabled={disabled}
                >
                  Remove
                </button>
              </div>

              <div className="file-upload-widget__status-row">
                <span className={`file-upload-widget__status file-upload-widget__status--${record.status}`}>
                  {record.status === 'idle' && 'Queued'}
                  {record.status === 'uploading' && `Uploading ${record.progress}%`}
                  {record.status === 'success' && 'Uploaded'}
                  {record.status === 'error' && 'Failed'}
                  {record.status === 'selecting' && 'Selecting'}
                </span>
                {(record.status === 'uploading' || record.status === 'success') && (
                  <progress
                    className="file-upload-widget__progress"
                    max={100}
                    value={record.progress}
                    aria-label={`${record.file.name} upload progress`}
                  />
                )}
              </div>

              {record.error ? <p className="file-upload-widget__error">{record.error}</p> : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
};

export default FileUploadWidget;
