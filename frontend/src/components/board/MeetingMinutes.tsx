import React from 'react';

type MinuteItem = {
  title: string;
  description: string;
  status?: 'completed' | 'in-progress' | 'pending';
  owner?: string;
};

type MeetingMinutesProps = {
  title?: string;
  dateLabel?: string;
  attendees?: string[];
  items?: MinuteItem[];
  className?: string;
};

const defaultItems: MinuteItem[] = [
  {
    title: 'Sprint progress review',
    description: 'Reviewed current sprint progress, blockers, and delivery confidence across active workstreams.',
    status: 'completed',
    owner: 'Engineering',
  },
  {
    title: 'Risk and dependency check',
    description: 'Discussed cross-team dependencies and identified follow-up actions for unresolved integration risks.',
    status: 'in-progress',
    owner: 'Program Management',
  },
  {
    title: 'Next meeting actions',
    description: 'Assigned owners to open action items and confirmed goals for the next board update.',
    status: 'pending',
    owner: 'Board Office',
  },
];

const badgeStyles: Record<NonNullable<MinuteItem['status']>, string> = {
  completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  'in-progress': 'bg-amber-100 text-amber-800 border-amber-200',
  pending: 'bg-slate-100 text-slate-700 border-slate-200',
};

const formatStatus = (status?: MinuteItem['status']) => {
  if (!status) return 'Open';
  if (status === 'in-progress') return 'In Progress';
  return status.charAt(0).toUpperCase() + status.slice(1);
};

export default function MeetingMinutes({
  title = 'Meeting Minutes',
  dateLabel,
  attendees = [],
  items = defaultItems,
  className = '',
}: MeetingMinutesProps) {
  return (
    <section
      className={`rounded-xl border border-slate-200 bg-white p-6 shadow-sm ${className}`.trim()}
      aria-label="Meeting minutes"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          {dateLabel ? <p className="mt-1 text-sm text-slate-500">{dateLabel}</p> : null}
        </div>
        {attendees.length > 0 ? (
          <div className="sm:text-right">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Attendees</p>
            <p className="mt-1 text-sm text-slate-700">{attendees.join(', ')}</p>
          </div>
        ) : null}
      </div>

      <div className="mt-6 space-y-4">
        {items.map((item, index) => {
          const statusClass = item.status ? badgeStyles[item.status] : badgeStyles.pending;

          return (
            <article
              key={`${item.title}-${index}`}
              className="rounded-lg border border-slate-200 bg-slate-50 p-4"
            >
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-semibold text-slate-700">
                      {index + 1}
                    </span>
                    <h3 className="text-sm font-semibold text-slate-900">{item.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                  {item.owner ? (
                    <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">
                      Owner: <span className="text-slate-700">{item.owner}</span>
                    </p>
                  ) : null}
                </div>
                <div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-medium ${statusClass}`}
                  >
                    {formatStatus(item.status)}
                  </span>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
