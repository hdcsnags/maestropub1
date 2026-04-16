import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';

type ArchiveStatus = 'completed' | 'cancelled' | 'missed';

type ArchiveMeeting = {
  id: string;
  title: string;
  host: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
  attendees: number;
  location: string;
  status: ArchiveStatus;
  summary: string;
  tags: string[];
};

const ARCHIVE_MEETINGS: ArchiveMeeting[] = [
  {
    id: 'mtg-001',
    title: 'Q1 Product Retrospective',
    host: 'Ava Patel',
    date: '2026-01-12',
    startTime: '10:00 AM',
    endTime: '11:15 AM',
    durationMinutes: 75,
    attendees: 14,
    location: 'Room Atlas / Zoom',
    status: 'completed',
    summary: 'Reviewed feature delivery, support volume, and roadmap adjustments for Q2.',
    tags: ['retrospective', 'product', 'quarterly'],
  },
  {
    id: 'mtg-002',
    title: 'Customer Advisory Board Prep',
    host: 'Marcus Lee',
    date: '2026-01-18',
    startTime: '02:00 PM',
    endTime: '02:45 PM',
    durationMinutes: 45,
    attendees: 8,
    location: 'Huddle 3',
    status: 'completed',
    summary: 'Aligned agenda topics, presenters, and success metrics for the upcoming CAB session.',
    tags: ['customer', 'planning'],
  },
  {
    id: 'mtg-003',
    title: 'Design Critique: Mobile Navigation',
    host: 'Noah Kim',
    date: '2026-02-02',
    startTime: '09:30 AM',
    endTime: '10:30 AM',
    durationMinutes: 60,
    attendees: 11,
    location: 'Figma Live',
    status: 'completed',
    summary: 'Collected feedback on tab hierarchy, icon clarity, and first-time-user discoverability.',
    tags: ['design', 'mobile', 'ux'],
  },
  {
    id: 'mtg-004',
    title: 'Engineering Incident Review',
    host: 'Priya Shah',
    date: '2026-02-09',
    startTime: '04:00 PM',
    endTime: '05:00 PM',
    durationMinutes: 60,
    attendees: 17,
    location: 'Ops War Room',
    status: 'completed',
    summary: 'Documented root causes, timeline gaps, and action items after the API degradation incident.',
    tags: ['engineering', 'incident', 'postmortem'],
  },
  {
    id: 'mtg-005',
    title: 'Partnership Sync with Northstar Health',
    host: 'Elena García',
    date: '2026-02-14',
    startTime: '01:00 PM',
    endTime: '01:30 PM',
    durationMinutes: 30,
    attendees: 6,
    location: 'Google Meet',
    status: 'cancelled',
    summary: 'Meeting postponed due to scheduling conflicts on the partner side.',
    tags: ['partnership', 'external'],
  },
  {
    id: 'mtg-006',
    title: 'Weekly Revenue Forecast Review',
    host: 'Daniel Brooks',
    date: '2026-02-20',
    startTime: '08:30 AM',
    endTime: '09:00 AM',
    durationMinutes: 30,
    attendees: 9,
    location: 'Finance Standup Space',
    status: 'missed',
    summary: 'Forecast package was shared async after key participants were pulled into board prep.',
    tags: ['finance', 'forecast'],
  },
  {
    id: 'mtg-007',
    title: 'Security Controls Audit Readout',
    host: 'Fatima Hassan',
    date: '2026-03-03',
    startTime: '11:00 AM',
    endTime: '12:00 PM',
    durationMinutes: 60,
    attendees: 13,
    location: 'Room Cedar',
    status: 'completed',
    summary: 'Reviewed audit exceptions, remediation deadlines, and ownership assignments.',
    tags: ['security', 'audit', 'compliance'],
  },
  {
    id: 'mtg-008',
    title: 'Go-to-Market Launch Debrief',
    host: 'Sophie Nguyen',
    date: '2026-03-11',
    startTime: '03:00 PM',
    endTime: '04:15 PM',
    durationMinutes: 75,
    attendees: 19,
    location: 'Town Hall A',
    status: 'completed',
    summary: 'Assessed campaign performance, sales enablement readiness, and launch-day friction points.',
    tags: ['marketing', 'launch', 'sales'],
  },
];

const statusOptions: Array<{ value: ArchiveStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' },
  { value: 'missed', label: 'Missed' },
];

const formatArchiveDate = (value: string) => {
  const date = new Date(`${value}T00:00:00`);
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
};

const statusStyles: Record<ArchiveStatus, { label: string; bg: string; color: string; border: string }> = {
  completed: {
    label: 'Completed',
    bg: '#ecfdf3',
    color: '#027a48',
    border: '#abefc6',
  },
  cancelled: {
    label: 'Cancelled',
    bg: '#fef3f2',
    color: '#b42318',
    border: '#fecdca',
  },
  missed: {
    label: 'Missed',
    bg: '#fff6ed',
    color: '#c4320a',
    border: '#f9dbaf',
  },
};

const pageStyle: React.CSSProperties = {
  minHeight: '100%',
  background: '#f8fafc',
  padding: '32px 24px 48px',
  color: '#0f172a',
};

const shellStyle: React.CSSProperties = {
  maxWidth: 1180,
  margin: '0 auto',
};

const heroStyle: React.CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  alignItems: 'flex-start',
  justifyContent: 'space-between',
  gap: 20,
  marginBottom: 24,
};

const cardStyle: React.CSSProperties = {
  background: '#ffffff',
  border: '1px solid #e2e8f0',
  borderRadius: 16,
  boxShadow: '0 1px 2px rgba(15, 23, 42, 0.04)',
};

const MeetingArchivePage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ArchiveStatus | 'all'>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'duration'>('newest');
  const [visibleCount, setVisibleCount] = useState(6);

  useEffect(() => {
    document.title = 'Meeting Archive';
  }, []);

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    ARCHIVE_MEETINGS.forEach((meeting) => {
      meeting.tags.forEach((tag) => tags.add(tag));
    });
    return ['all', ...Array.from(tags).sort((a, b) => a.localeCompare(b))];
  }, []);

  const filteredMeetings = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    const next = ARCHIVE_MEETINGS.filter((meeting) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        [meeting.title, meeting.host, meeting.location, meeting.summary, ...meeting.tags]
          .join(' ')
          .toLowerCase()
          .includes(normalizedQuery);

      const matchesStatus = statusFilter === 'all' || meeting.status === statusFilter;
      const matchesTag = selectedTag === 'all' || meeting.tags.includes(selectedTag);

      return matchesQuery && matchesStatus && matchesTag;
    });

    next.sort((a, b) => {
      if (sortBy === 'duration') {
        return b.durationMinutes - a.durationMinutes;
      }

      const aTime = new Date(`${a.date}T00:00:00`).getTime();
      const bTime = new Date(`${b.date}T00:00:00`).getTime();
      return sortBy === 'newest' ? bTime - aTime : aTime - bTime;
    });

    return next;
  }, [query, selectedTag, sortBy, statusFilter]);

  useEffect(() => {
    setVisibleCount(6);
  }, [query, statusFilter, selectedTag, sortBy]);

  const visibleMeetings = filteredMeetings.slice(0, visibleCount);
  const completedCount = ARCHIVE_MEETINGS.filter((meeting) => meeting.status === 'completed').length;
  const cancelledCount = ARCHIVE_MEETINGS.filter((meeting) => meeting.status === 'cancelled').length;
  const totalHours = Math.round(
    ARCHIVE_MEETINGS.filter((meeting) => meeting.status === 'completed').reduce((sum, meeting) => sum + meeting.durationMinutes, 0) / 60,
  );

  return (
    <div style={pageStyle}>
      <div style={shellStyle}>
        <section style={heroStyle}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#475467', marginBottom: 8 }}>Meetings</div>
            <h1 style={{ margin: 0, fontSize: 34, lineHeight: 1.1, letterSpacing: '-0.02em' }}>Meeting Archive</h1>
            <p style={{ margin: '12px 0 0', maxWidth: 760, color: '#475467', fontSize: 16, lineHeight: 1.6 }}>
              Browse historical meetings, review outcomes, and quickly find recordings, summaries, and operational context from past sessions.
            </p>
          </div>

          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link
              to="/meetings"
              style={{
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #cbd5e1',
                color: '#0f172a',
                background: '#ffffff',
                fontWeight: 600,
              }}
            >
              Back to meetings
            </Link>
            <Link
              to="/meetings/new"
              style={{
                textDecoration: 'none',
                padding: '10px 16px',
                borderRadius: 10,
                border: '1px solid #0f172a',
                color: '#ffffff',
                background: '#0f172a',
                fontWeight: 600,
              }}
            >
              Schedule meeting
            </Link>
          </div>
        </section>

        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 24,
          }}
        >
          {[
            { label: 'Archived meetings', value: ARCHIVE_MEETINGS.length, hint: 'Historical sessions retained' },
            { label: 'Completed', value: completedCount, hint: 'Meetings successfully held' },
            { label: 'Cancelled', value: cancelledCount, hint: 'Sessions not carried out' },
            { label: 'Hours reviewed', value: totalHours, hint: 'Completed meeting time captured' },
          ].map((item) => (
            <div key={item.label} style={{ ...cardStyle, padding: 20 }}>
              <div style={{ color: '#475467', fontSize: 14, marginBottom: 10 }}>{item.label}</div>
              <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 6 }}>{item.value}</div>
              <div style={{ color: '#64748b', fontSize: 13 }}>{item.hint}</div>
            </div>
          ))}
        </section>

        <section style={{ ...cardStyle, padding: 20, marginBottom: 20 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 14,
              alignItems: 'end',
            }}
          >
            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#344054' }}>Search archive</span>
              <input
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search by title, host, summary, or tag"
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: 14,
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#344054' }}>Status</span>
              <select
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as ArchiveStatus | 'all')}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: 14,
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#344054' }}>Tag</span>
              <select
                value={selectedTag}
                onChange={(event) => setSelectedTag(event.target.value)}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: 14,
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                {availableTags.map((tag) => (
                  <option key={tag} value={tag}>
                    {tag === 'all' ? 'All tags' : tag}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#344054' }}>Sort by</span>
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as 'newest' | 'oldest' | 'duration')}
                style={{
                  height: 42,
                  borderRadius: 10,
                  border: '1px solid #cbd5e1',
                  padding: '0 12px',
                  fontSize: 14,
                  color: '#0f172a',
                  background: '#ffffff',
                }}
              >
                <option value="newest">Newest first</option>
                <option value="oldest">Oldest first</option>
                <option value="duration">Longest duration</option>
              </select>
            </label>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <div style={{ color: '#475467', fontSize: 14 }}>
              Showing <strong style={{ color: '#0f172a' }}>{visibleMeetings.length}</strong> of{' '}
              <strong style={{ color: '#0f172a' }}>{filteredMeetings.length}</strong> matching meetings
            </div>

            <button
              type="button"
              onClick={() => {
                setQuery('');
                setStatusFilter('all');
                setSelectedTag('all');
                setSortBy('newest');
              }}
              style={{
                border: 'none',
                background: 'transparent',
                color: '#0f62fe',
                cursor: 'pointer',
                fontWeight: 700,
                padding: 0,
              }}
            >
              Reset filters
            </button>
          </div>
        </section>

        <section style={{ display: 'grid', gap: 16 }}>
          {visibleMeetings.length === 0 ? (
            <div style={{ ...cardStyle, padding: 32, textAlign: 'center' }}>
              <h2 style={{ margin: '0 0 8px', fontSize: 22 }}>No archived meetings found</h2>
              <p style={{ margin: 0, color: '#475467', lineHeight: 1.6 }}>
                Try adjusting your search terms or filters to explore more meeting history.
              </p>
            </div>
          ) : (
            visibleMeetings.map((meeting) => {
              const status = statusStyles[meeting.status];

              return (
                <article key={meeting.id} style={{ ...cardStyle, padding: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 260 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
                        <h2 style={{ margin: 0, fontSize: 22, lineHeight: 1.2 }}>{meeting.title}</h2>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '4px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 800,
                            background: status.bg,
                            color: status.color,
                            border: `1px solid ${status.border}`,
                          }}
                        >
                          {status.label}
                        </span>
                      </div>

                      <div style={{ color: '#475467', fontSize: 14, marginBottom: 12 }}>
                        Hosted by <strong style={{ color: '#0f172a' }}>{meeting.host}</strong>
                      </div>

                      <p style={{ margin: '0 0 16px', color: '#334155', lineHeight: 1.6 }}>{meeting.summary}</p>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {meeting.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: '#344054',
                              background: '#f8fafc',
                              border: '1px solid #e2e8f0',
                              borderRadius: 999,
                              padding: '5px 10px',
                            }}
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div
                      style={{
                        minWidth: 260,
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, minmax(110px, 1fr))',
                        gap: 12,
                      }}
                    >
                      {[
                        { label: 'Date', value: formatArchiveDate(meeting.date) },
                        { label: 'Time', value: `${meeting.startTime} – ${meeting.endTime}` },
                        { label: 'Duration', value: `${meeting.durationMinutes} min` },
                        { label: 'Attendees', value: `${meeting.attendees}` },
                        { label: 'Location', value: meeting.location },
                        { label: 'Archive ID', value: meeting.id },
                      ].map((item) => (
                        <div
                          key={item.label}
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            borderRadius: 12,
                            padding: 12,
                          }}
                        >
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 6 }}>{item.label}</div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a', lineHeight: 1.4 }}>{item.value}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </section>

        {visibleCount < filteredMeetings.length && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <button
              type="button"
              onClick={() => setVisibleCount((count) => count + 6)}
              style={{
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                color: '#0f172a',
                borderRadius: 10,
                padding: '12px 18px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              Load more
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MeetingArchivePage;
