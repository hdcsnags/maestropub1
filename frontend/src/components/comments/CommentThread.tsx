import React, { useCallback, useMemo, useState } from 'react';

type PrimitiveId = string | number;

export interface CommentAuthor {
  id?: PrimitiveId;
  name?: string;
  avatarUrl?: string;
}

export interface CommentItem {
  id: PrimitiveId;
  body: string;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  author?: CommentAuthor | null;
  parentId?: PrimitiveId | null;
  replies?: CommentItem[];
  isDeleted?: boolean;
}

export interface CommentThreadLabels {
  empty?: string;
  reply?: string;
  replyingTo?: string;
  cancel?: string;
  submit?: string;
  submitting?: string;
  showReplies?: (count: number) => string;
  hideReplies?: string;
  deleted?: string;
}

export interface CommentThreadProps {
  comments: CommentItem[];
  className?: string;
  currentUserId?: PrimitiveId;
  loading?: boolean;
  submitting?: boolean;
  maxDepth?: number;
  autoExpandReplies?: boolean;
  placeholder?: string;
  labels?: CommentThreadLabels;
  onSubmitReply?: (parentId: PrimitiveId, body: string) => void | Promise<void>;
}

type CommentNode = Omit<CommentItem, 'replies'> & {
  replies: CommentNode[];
};

const defaultLabels: Required<CommentThreadLabels> = {
  empty: 'No comments yet.',
  reply: 'Reply',
  replyingTo: 'Replying to',
  cancel: 'Cancel',
  submit: 'Post reply',
  submitting: 'Posting…',
  showReplies: (count: number) => `Show replies (${count})`,
  hideReplies: 'Hide replies',
  deleted: '[deleted]',
};

function cn(...values: Array<string | false | null | undefined>): string {
  return values.filter(Boolean).join(' ');
}

function formatTimestamp(value?: string | Date): string | null {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  try {
    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
}

function buildThread(comments: CommentItem[]): CommentNode[] {
  const map = new Map<string, CommentNode>();
  const roots: CommentNode[] = [];

  comments.forEach((comment) => {
    const key = String(comment.id);
    map.set(key, {
      ...comment,
      replies: Array.isArray(comment.replies) ? buildThread(comment.replies) : [],
    });
  });

  const alreadyNested = comments.some((comment) => Array.isArray(comment.replies) && comment.replies.length > 0);
  if (alreadyNested) {
    return comments.map((comment) => map.get(String(comment.id))!).filter(Boolean);
  }

  map.forEach((node) => {
    const parentKey = node.parentId == null ? null : String(node.parentId);
    if (parentKey && map.has(parentKey) && parentKey !== String(node.id)) {
      map.get(parentKey)!.replies.push(node);
    } else {
      roots.push(node);
    }
  });

  return roots;
}

function countReplies(node: CommentNode): number {
  return node.replies.reduce((total, reply) => total + 1 + countReplies(reply), 0);
}

function CommentComposer(props: {
  placeholder: string;
  submitLabel: string;
  submittingLabel: string;
  cancelLabel: string;
  submitting?: boolean;
  onCancel: () => void;
  onSubmit: (body: string) => void | Promise<void>;
}) {
  const { placeholder, submitLabel, submittingLabel, cancelLabel, submitting, onCancel, onSubmit } = props;
  const [body, setBody] = useState('');

  const handleSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault();
      const trimmed = body.trim();
      if (!trimmed || submitting) return;
      await onSubmit(trimmed);
      setBody('');
    },
    [body, onSubmit, submitting]
  );

  return (
    <form onSubmit={handleSubmit} className="mt-3 space-y-2">
      <textarea
        value={body}
        onChange={(event) => setBody(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full resize-y rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 dark:focus:border-blue-400 dark:focus:ring-blue-950"
      />
      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={submitting || body.trim().length === 0}
          className="inline-flex items-center rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-blue-500 dark:hover:bg-blue-400"
        >
          {submitting ? submittingLabel : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium text-slate-600 transition hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
        >
          {cancelLabel}
        </button>
      </div>
    </form>
  );
}

function CommentRow(props: {
  comment: CommentNode;
  depth: number;
  maxDepth: number;
  autoExpandReplies: boolean;
  labels: Required<CommentThreadLabels>;
  placeholder: string;
  submitting?: boolean;
  currentUserId?: PrimitiveId;
  activeReplyId: PrimitiveId | null;
  setActiveReplyId: (id: PrimitiveId | null) => void;
  onSubmitReply?: (parentId: PrimitiveId, body: string) => void | Promise<void>;
}) {
  const {
    comment,
    depth,
    maxDepth,
    autoExpandReplies,
    labels,
    placeholder,
    submitting,
    currentUserId,
    activeReplyId,
    setActiveReplyId,
    onSubmitReply,
  } = props;

  const replyCount = countReplies(comment);
  const canReply = depth < maxDepth && typeof onSubmitReply === 'function';
  const [expanded, setExpanded] = useState(autoExpandReplies || depth === 0);
  const isReplying = activeReplyId === comment.id;
  const timestamp = formatTimestamp(comment.updatedAt || comment.createdAt);
  const authorName = comment.author?.name?.trim() || 'Anonymous';
  const isCurrentUser = currentUserId != null && comment.author?.id != null && String(currentUserId) === String(comment.author.id);

  return (
    <li className={cn(depth > 0 && 'mt-4')}>
      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
            {comment.author?.avatarUrl ? (
              <img src={comment.author.avatarUrl} alt={authorName} className="h-full w-full object-cover" />
            ) : (
              authorName.slice(0, 2).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{authorName}</span>
              {isCurrentUser ? (
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  You
                </span>
              ) : null}
              {timestamp ? <span className="text-xs text-slate-500 dark:text-slate-400">{timestamp}</span> : null}
            </div>

            <div className="mt-2 whitespace-pre-wrap break-words text-sm leading-6 text-slate-700 dark:text-slate-300">
              {comment.isDeleted ? labels.deleted : comment.body}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {canReply && !comment.isDeleted ? (
                <button
                  type="button"
                  onClick={() => setActiveReplyId(isReplying ? null : comment.id)}
                  className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  {labels.reply}
                </button>
              ) : null}

              {comment.replies.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setExpanded((value) => !value)}
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-900 dark:text-slate-300 dark:hover:text-white"
                >
                  {expanded ? labels.hideReplies : labels.showReplies(replyCount)}
                </button>
              ) : null}
            </div>

            {isReplying && onSubmitReply ? (
              <div className="mt-3 rounded-md bg-slate-50 p-3 dark:bg-slate-950/60">
                <div className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  {labels.replyingTo} {authorName}
                </div>
                <CommentComposer
                  placeholder={placeholder}
                  submitLabel={labels.submit}
                  submittingLabel={labels.submitting}
                  cancelLabel={labels.cancel}
                  submitting={submitting}
                  onCancel={() => setActiveReplyId(null)}
                  onSubmit={async (body) => {
                    await onSubmitReply(comment.id, body);
                    setActiveReplyId(null);
                  }}
                />
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {comment.replies.length > 0 && expanded ? (
        <ul className="ml-4 mt-3 border-l border-slate-200 pl-4 dark:border-slate-800 sm:ml-6 sm:pl-6">
          {comment.replies.map((reply) => (
            <CommentRow
              key={String(reply.id)}
              comment={reply}
              depth={depth + 1}
              maxDepth={maxDepth}
              autoExpandReplies={autoExpandReplies}
              labels={labels}
              placeholder={placeholder}
              submitting={submitting}
              currentUserId={currentUserId}
              activeReplyId={activeReplyId}
              setActiveReplyId={setActiveReplyId}
              onSubmitReply={onSubmitReply}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

export default function CommentThread({
  comments,
  className,
  currentUserId,
  loading = false,
  submitting = false,
  maxDepth = 4,
  autoExpandReplies = true,
  placeholder = 'Write a reply…',
  labels: labelsProp,
  onSubmitReply,
}: CommentThreadProps) {
  const labels = { ...defaultLabels, ...labelsProp };
  const [activeReplyId, setActiveReplyId] = useState<PrimitiveId | null>(null);
  const thread = useMemo(() => buildThread(comments || []), [comments]);

  if (loading) {
    return (
      <div className={cn('space-y-3', className)} aria-busy="true" aria-live="polite">
        {[0, 1, 2].map((item) => (
          <div
            key={item}
            className="animate-pulse rounded-lg border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="flex items-start gap-3">
              <div className="h-9 w-9 rounded-full bg-slate-200 dark:bg-slate-800" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-40 rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-full rounded bg-slate-200 dark:bg-slate-800" />
                <div className="h-3 w-2/3 rounded bg-slate-200 dark:bg-slate-800" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!thread.length) {
    return (
      <div
        className={cn(
          'rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-400',
          className
        )}
      >
        {labels.empty}
      </div>
    );
  }

  return (
    <div className={className}>
      <ul className="space-y-4">
        {thread.map((comment) => (
          <CommentRow
            key={String(comment.id)}
            comment={comment}
            depth={0}
            maxDepth={maxDepth}
            autoExpandReplies={autoExpandReplies}
            labels={labels}
            placeholder={placeholder}
            submitting={submitting}
            currentUserId={currentUserId}
            activeReplyId={activeReplyId}
            setActiveReplyId={setActiveReplyId}
            onSubmitReply={onSubmitReply}
          />
        ))}
      </ul>
    </div>
  );
}
