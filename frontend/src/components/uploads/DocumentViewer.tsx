import React, { useMemo, useState } from 'react';

type SupportedDocumentType = 'image' | 'pdf' | 'text' | 'video' | 'audio' | 'unknown';

export interface DocumentViewerProps {
  src?: string | null;
  fileName?: string | null;
  mimeType?: string | null;
  className?: string;
  title?: string;
  height?: number | string;
}

const IMAGE_MIME_PREFIX = 'image/';
const VIDEO_MIME_PREFIX = 'video/';
const AUDIO_MIME_PREFIX = 'audio/';

const getExtension = (fileName?: string | null): string => {
  if (!fileName) return '';
  const parts = fileName.toLowerCase().split('.');
  return parts.length > 1 ? parts.pop() ?? '' : '';
};

const detectDocumentType = (mimeType?: string | null, fileName?: string | null): SupportedDocumentType => {
  const normalizedMime = (mimeType || '').toLowerCase();
  const extension = getExtension(fileName);

  if (normalizedMime.startsWith(IMAGE_MIME_PREFIX)) return 'image';
  if (normalizedMime === 'application/pdf') return 'pdf';
  if (normalizedMime.startsWith(VIDEO_MIME_PREFIX)) return 'video';
  if (normalizedMime.startsWith(AUDIO_MIME_PREFIX)) return 'audio';
  if (normalizedMime.startsWith('text/')) return 'text';

  if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) return 'image';
  if (extension === 'pdf') return 'pdf';
  if (['txt', 'md', 'json', 'csv', 'log'].includes(extension)) return 'text';
  if (['mp4', 'webm', 'ogg', 'mov'].includes(extension)) return 'video';
  if (['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(extension)) return 'audio';

  return 'unknown';
};

const containerStyle: React.CSSProperties = {
  width: '100%',
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  overflow: 'hidden',
  backgroundColor: '#ffffff',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  gap: 12,
  padding: '12px 16px',
  borderBottom: '1px solid #f3f4f6',
  backgroundColor: '#f9fafb',
};

const titleStyle: React.CSSProperties = {
  margin: 0,
  fontSize: 14,
  fontWeight: 600,
  color: '#111827',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const bodyBaseStyle: React.CSSProperties = {
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backgroundColor: '#ffffff',
};

const emptyStateStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: '#6b7280',
  fontSize: 14,
};

const actionLinkStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 500,
  color: '#2563eb',
  textDecoration: 'none',
};

const fallbackBlockStyle: React.CSSProperties = {
  padding: 24,
  textAlign: 'center',
  color: '#374151',
};

const mediaStyle: React.CSSProperties = {
  display: 'block',
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  backgroundColor: '#f9fafb',
};

const iframeStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  border: 'none',
};

const preStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  margin: 0,
  padding: 16,
  overflow: 'auto',
  fontSize: 13,
  lineHeight: 1.5,
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
  color: '#111827',
  backgroundColor: '#fcfcfd',
  boxSizing: 'border-box',
};

const normalizeHeight = (height?: number | string): string | number => {
  if (typeof height === 'number') return `${height}px`;
  return height || 480;
};

export const DocumentViewer: React.FC<DocumentViewerProps> = ({
  src,
  fileName,
  mimeType,
  className,
  title,
  height = 480,
}) => {
  const [textError, setTextError] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoadedFrom, setTextLoadedFrom] = useState<string | null>(null);

  const documentType = useMemo(() => detectDocumentType(mimeType, fileName), [mimeType, fileName]);
  const viewerTitle = title || fileName || 'Document preview';
  const resolvedHeight = normalizeHeight(height);

  React.useEffect(() => {
    let cancelled = false;

    if (!src || documentType !== 'text') {
      setTextError(null);
      setTextContent(null);
      setTextLoadedFrom(null);
      return;
    }

    if (textLoadedFrom === src && (textContent !== null || textError !== null)) {
      return;
    }

    setTextError(null);
    setTextContent(null);

    fetch(src)
      .then(async (response) => {
        if (!response.ok) {
          throw new Error(`Failed to load text document (${response.status})`);
        }
        return response.text();
      })
      .then((content) => {
        if (cancelled) return;
        setTextContent(content);
        setTextLoadedFrom(src);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setTextError(error instanceof Error ? error.message : 'Unable to load document');
        setTextLoadedFrom(src);
      });

    return () => {
      cancelled = true;
    };
  }, [src, documentType, textLoadedFrom, textContent, textError]);

  if (!src) {
    return (
      <div className={className} style={containerStyle}>
        <div style={headerStyle}>
          <h3 style={titleStyle}>{viewerTitle}</h3>
        </div>
        <div style={emptyStateStyle}>No document selected.</div>
      </div>
    );
  }

  const bodyStyle: React.CSSProperties = {
    ...bodyBaseStyle,
    height: resolvedHeight,
  };

  const renderContent = () => {
    switch (documentType) {
      case 'image':
        return <img src={src} alt={fileName || 'Preview'} style={mediaStyle} />;
      case 'pdf':
        return <iframe title={viewerTitle} src={src} style={iframeStyle} />;
      case 'video':
        return <video src={src} controls style={mediaStyle} />;
      case 'audio':
        return (
          <div style={{ width: '100%', padding: 24, boxSizing: 'border-box' }}>
            <audio src={src} controls style={{ width: '100%' }} />
          </div>
        );
      case 'text':
        if (textError) {
          return (
            <div style={fallbackBlockStyle}>
              <p style={{ margin: '0 0 12px' }}>{textError}</p>
              <a href={src} target="_blank" rel="noreferrer" style={actionLinkStyle}>
                Open document
              </a>
            </div>
          );
        }

        if (textContent === null) {
          return <div style={emptyStateStyle}>Loading preview…</div>;
        }

        return <pre style={preStyle}>{textContent}</pre>;
      default:
        return (
          <div style={fallbackBlockStyle}>
            <p style={{ margin: '0 0 12px' }}>Preview is not available for this document type.</p>
            <a href={src} target="_blank" rel="noreferrer" style={actionLinkStyle}>
              Open document
            </a>
          </div>
        );
    }
  };

  return (
    <div className={className} style={containerStyle}>
      <div style={headerStyle}>
        <h3 style={titleStyle} title={viewerTitle}>
          {viewerTitle}
        </h3>
        <a href={src} target="_blank" rel="noreferrer" style={actionLinkStyle}>
          Open
        </a>
      </div>
      <div style={bodyStyle}>{renderContent()}</div>
    </div>
  );
};

export default DocumentViewer;
