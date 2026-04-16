import React, { useMemo, useState } from 'react';

type JwtDebugPanelProps = {
  token?: string | null;
  className?: string;
};

type JwtPart = {
  raw: string;
  decoded: string;
  parsed: unknown;
  error?: string;
};

type JwtAnalysis = {
  header: JwtPart | null;
  payload: JwtPart | null;
  signature: string;
  isValidStructure: boolean;
  issuedAt?: string;
  expiresAt?: string;
  isExpired?: boolean;
  subject?: string;
  issuer?: string;
  audience?: string | string[];
};

function padBase64(input: string): string {
  const padding = input.length % 4;
  if (padding === 0) return input;
  return input + '='.repeat(4 - padding);
}

function decodeBase64Url(input: string): string {
  const normalized = padBase64(input.replace(/-/g, '+').replace(/_/g, '/'));
  const decoded = atob(normalized);
  try {
    const bytes = Uint8Array.from(decoded, (char) => char.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  } catch {
    return decoded;
  }
}

function parseJwtPart(raw: string): JwtPart {
  try {
    const decoded = decodeBase64Url(raw);
    try {
      return {
        raw,
        decoded,
        parsed: JSON.parse(decoded),
      };
    } catch {
      return {
        raw,
        decoded,
        parsed: decoded,
        error: 'Decoded content is not valid JSON.',
      };
    }
  } catch {
    return {
      raw,
      decoded: '',
      parsed: null,
      error: 'Unable to decode Base64URL content.',
    };
  }
}

function formatUnixTimestamp(value: unknown): string | undefined {
  if (typeof value !== 'number' || Number.isNaN(value)) return undefined;
  return new Date(value * 1000).toLocaleString();
}

function analyzeJwt(token?: string | null): JwtAnalysis {
  if (!token) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValidStructure: false,
    };
  }

  const parts = token.split('.');
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: '',
      isValidStructure: false,
    };
  }

  const [headerRaw, payloadRaw, signature] = parts;
  const header = parseJwtPart(headerRaw);
  const payload = parseJwtPart(payloadRaw);
  const payloadObject = typeof payload.parsed === 'object' && payload.parsed !== null ? (payload.parsed as Record<string, unknown>) : null;

  const exp = payloadObject?.exp;
  const iat = payloadObject?.iat;
  const isExpired = typeof exp === 'number' ? Date.now() >= exp * 1000 : undefined;

  return {
    header,
    payload,
    signature,
    isValidStructure: true,
    issuedAt: formatUnixTimestamp(iat),
    expiresAt: formatUnixTimestamp(exp),
    isExpired,
    subject: typeof payloadObject?.sub === 'string' ? payloadObject.sub : undefined,
    issuer: typeof payloadObject?.iss === 'string' ? payloadObject.iss : undefined,
    audience:
      typeof payloadObject?.aud === 'string' || Array.isArray(payloadObject?.aud)
        ? (payloadObject.aud as string | string[])
        : undefined,
  };
}

function prettyValue(value: unknown): string {
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

export default function JwtDebugPanel({ token, className }: JwtDebugPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const analysis = useMemo(() => analyzeJwt(token), [token]);

  if (!token) {
    return null;
  }

  return (
    <div
      className={className}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#ffffff',
        overflow: 'hidden',
      }}
    >
      <button
        type="button"
        onClick={() => setExpanded((value) => !value)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '12px 16px',
          background: '#f9fafb',
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          color: '#111827',
        }}
        aria-expanded={expanded}
      >
        <span>JWT Debug Panel</span>
        <span style={{ fontSize: 12, color: '#6b7280' }}>{expanded ? 'Hide' : 'Show'}</span>
      </button>

      {expanded && (
        <div style={{ padding: 16, display: 'grid', gap: 16 }}>
          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Summary</div>
            <div style={{ display: 'grid', gap: 8, fontSize: 13, color: '#111827' }}>
              <div>
                <strong>Structure:</strong>{' '}
                <span style={{ color: analysis.isValidStructure ? '#065f46' : '#b91c1c' }}>
                  {analysis.isValidStructure ? 'Valid' : 'Invalid'}
                </span>
              </div>
              {analysis.subject && (
                <div>
                  <strong>Subject:</strong> {analysis.subject}
                </div>
              )}
              {analysis.issuer && (
                <div>
                  <strong>Issuer:</strong> {analysis.issuer}
                </div>
              )}
              {analysis.audience && (
                <div>
                  <strong>Audience:</strong> {Array.isArray(analysis.audience) ? analysis.audience.join(', ') : analysis.audience}
                </div>
              )}
              {analysis.issuedAt && (
                <div>
                  <strong>Issued At:</strong> {analysis.issuedAt}
                </div>
              )}
              {analysis.expiresAt && (
                <div>
                  <strong>Expires At:</strong>{' '}
                  <span style={{ color: analysis.isExpired ? '#b91c1c' : '#065f46' }}>
                    {analysis.expiresAt}
                    {analysis.isExpired ? ' (expired)' : ''}
                  </span>
                </div>
              )}
            </div>
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Header</div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: '#111827',
                color: '#f9fafb',
                borderRadius: 8,
                fontSize: 12,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {analysis.header ? prettyValue(analysis.header.parsed) : 'Unavailable'}
            </pre>
            {analysis.header?.error && (
              <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 12 }}>{analysis.header.error}</div>
            )}
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Payload</div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: '#111827',
                color: '#f9fafb',
                borderRadius: 8,
                fontSize: 12,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
              }}
            >
              {analysis.payload ? prettyValue(analysis.payload.parsed) : 'Unavailable'}
            </pre>
            {analysis.payload?.error && (
              <div style={{ marginTop: 8, color: '#b91c1c', fontSize: 12 }}>{analysis.payload.error}</div>
            )}
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Signature</div>
            <pre
              style={{
                margin: 0,
                padding: 12,
                background: '#f3f4f6',
                color: '#111827',
                borderRadius: 8,
                fontSize: 12,
                overflowX: 'auto',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-all',
              }}
            >
              {analysis.signature || 'Unavailable'}
            </pre>
          </section>

          <section>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#374151', marginBottom: 8 }}>Raw Token</div>
            <textarea
              readOnly
              value={token}
              style={{
                width: '100%',
                minHeight: 88,
                padding: 12,
                borderRadius: 8,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                color: '#111827',
                fontSize: 12,
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </section>
        </div>
      )}
    </div>
  );
}
