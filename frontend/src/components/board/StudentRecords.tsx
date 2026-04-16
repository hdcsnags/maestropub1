import React, { useMemo, useState } from 'react';

type StudentStatus = 'active' | 'at-risk' | 'inactive';

type StudentRecord = {
  id: string;
  name: string;
  grade: string;
  advisor: string;
  attendanceRate: number;
  gpa: number;
  lastUpdated: string;
  status: StudentStatus;
  notes: string;
};

type SortKey = 'name' | 'grade' | 'advisor' | 'attendanceRate' | 'gpa' | 'lastUpdated' | 'status';
type SortDirection = 'asc' | 'desc';

type StatusFilter = 'all' | StudentStatus;

type Props = {
  records?: StudentRecord[];
  title?: string;
  className?: string;
};

const defaultRecords: StudentRecord[] = [
  {
    id: 'SR-1001',
    name: 'Ava Thompson',
    grade: '10',
    advisor: 'Ms. Rivera',
    attendanceRate: 98,
    gpa: 3.9,
    lastUpdated: '2026-04-09',
    status: 'active',
    notes: 'Strong academic performance and consistent participation.',
  },
  {
    id: 'SR-1002',
    name: 'Liam Carter',
    grade: '11',
    advisor: 'Mr. Bennett',
    attendanceRate: 87,
    gpa: 2.8,
    lastUpdated: '2026-04-10',
    status: 'at-risk',
    notes: 'Needs support with attendance and assignment completion.',
  },
  {
    id: 'SR-1003',
    name: 'Sophia Nguyen',
    grade: '12',
    advisor: 'Dr. Patel',
    attendanceRate: 94,
    gpa: 3.6,
    lastUpdated: '2026-04-08',
    status: 'active',
    notes: 'On track for graduation; interested in STEM mentorship.',
  },
  {
    id: 'SR-1004',
    name: 'Noah Brooks',
    grade: '9',
    advisor: 'Ms. Rivera',
    attendanceRate: 72,
    gpa: 2.1,
    lastUpdated: '2026-04-11',
    status: 'at-risk',
    notes: 'Recent attendance decline; family outreach recommended.',
  },
  {
    id: 'SR-1005',
    name: 'Emma Davis',
    grade: '10',
    advisor: 'Mr. Bennett',
    attendanceRate: 65,
    gpa: 1.9,
    lastUpdated: '2026-04-07',
    status: 'inactive',
    notes: 'Transferred out pending records verification.',
  },
];

const statusLabelMap: Record<StudentStatus, string> = {
  active: 'Active',
  'at-risk': 'At Risk',
  inactive: 'Inactive',
};

const statusClassMap: Record<StudentStatus, string> = {
  active: 'bg-emerald-100 text-emerald-800 border border-emerald-200',
  'at-risk': 'bg-amber-100 text-amber-800 border border-amber-200',
  inactive: 'bg-slate-100 text-slate-700 border border-slate-200',
};

function compareValues(a: StudentRecord, b: StudentRecord, key: SortKey): number {
  if (key === 'attendanceRate' || key === 'gpa') {
    return a[key] - b[key];
  }

  if (key === 'lastUpdated') {
    return new Date(a.lastUpdated).getTime() - new Date(b.lastUpdated).getTime();
  }

  return String(a[key]).localeCompare(String(b[key]));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date);
}

function StudentRecords({
  records = defaultRecords,
  title = 'Student Records',
  className = '',
}: Props) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('lastUpdated');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(records[0]?.id ?? null);

  const filteredAndSortedRecords = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    const filtered = records.filter((record) => {
      const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
      const matchesSearch =
        normalizedSearch.length === 0 ||
        [record.name, record.id, record.advisor, record.grade, record.notes]
          .join(' ')
          .toLowerCase()
          .includes(normalizedSearch);

      return matchesStatus && matchesSearch;
    });

    return [...filtered].sort((a, b) => {
      const result = compareValues(a, b, sortKey);
      return sortDirection === 'asc' ? result : -result;
    });
  }, [records, search, statusFilter, sortKey, sortDirection]);

  const selectedRecord =
    filteredAndSortedRecords.find((record) => record.id === selectedRecordId) ?? filteredAndSortedRecords[0] ?? null;

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }

    setSortKey(key);
    setSortDirection(key === 'name' || key === 'grade' || key === 'advisor' || key === 'status' ? 'asc' : 'desc');
  };

  const renderSortIndicator = (key: SortKey) => {
    if (sortKey !== key) return <span className="ml-1 text-slate-400">↕</span>;
    return <span className="ml-1 text-slate-700">{sortDirection === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-sm ${className}`.trim()}>
      <div className="flex flex-col gap-4 border-b border-slate-200 p-5 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
          <p className="mt-1 text-sm text-slate-600">
            Review academic standing, attendance, and advisor notes across the student board.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[480px]">
          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Search</span>
            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, ID, advisor, or notes"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            />
          </label>

          <label className="flex flex-col gap-1 text-sm text-slate-700">
            <span className="font-medium">Status</span>
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value as StatusFilter)}
              className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
            >
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="at-risk">At Risk</option>
              <option value="inactive">Inactive</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-0 lg:grid-cols-[minmax(0,2fr)_minmax(300px,1fr)]">
        <div className="overflow-x-auto border-b border-slate-200 lg:border-b-0 lg:border-r">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                {[
                  ['name', 'Student'],
                  ['grade', 'Grade'],
                  ['advisor', 'Advisor'],
                  ['attendanceRate', 'Attendance'],
                  ['gpa', 'GPA'],
                  ['lastUpdated', 'Updated'],
                  ['status', 'Status'],
                ].map(([key, label]) => (
                  <th
                    key={key}
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600"
                  >
                    <button
                      type="button"
                      onClick={() => handleSort(key as SortKey)}
                      className="inline-flex items-center transition hover:text-slate-900"
                    >
                      {label}
                      {renderSortIndicator(key as SortKey)}
                    </button>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {filteredAndSortedRecords.length > 0 ? (
                filteredAndSortedRecords.map((record) => {
                  const isSelected = selectedRecord?.id === record.id;

                  return (
                    <tr
                      key={record.id}
                      className={`cursor-pointer transition ${
                        isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedRecordId(record.id)}
                    >
                      <td className="px-4 py-3 align-top">
                        <div className="font-medium text-slate-900">{record.name}</div>
                        <div className="text-xs text-slate-500">{record.id}</div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{record.grade}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{record.advisor}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{record.attendanceRate}%</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{record.gpa.toFixed(1)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDate(record.lastUpdated)}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassMap[record.status]}`}
                        >
                          {statusLabelMap[record.status]}
                        </span>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-sm text-slate-500">
                    No student records match the current search and filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <aside className="p-5">
          {selectedRecord ? (
            <div className="space-y-5">
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-slate-900">{selectedRecord.name}</h3>
                    <p className="text-sm text-slate-500">Record ID: {selectedRecord.id}</p>
                  </div>
                  <span
                    className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${statusClassMap[selectedRecord.status]}`}
                  >
                    {statusLabelMap[selectedRecord.status]}
                  </span>
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-slate-500">Grade</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedRecord.grade}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-slate-500">Advisor</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedRecord.advisor}</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-slate-500">Attendance</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedRecord.attendanceRate}%</dd>
                </div>
                <div className="rounded-lg bg-slate-50 p-3">
                  <dt className="text-slate-500">GPA</dt>
                  <dd className="mt-1 font-semibold text-slate-900">{selectedRecord.gpa.toFixed(1)}</dd>
                </div>
              </dl>

              <div className="rounded-lg border border-slate-200 p-4">
                <h4 className="text-sm font-semibold text-slate-900">Advisor Notes</h4>
                <p className="mt-2 text-sm leading-6 text-slate-600">{selectedRecord.notes}</p>
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-sm text-slate-500">
                <span>Last updated</span>
                <span className="font-medium text-slate-700">{formatDate(selectedRecord.lastUpdated)}</span>
              </div>
            </div>
          ) : (
            <div className="flex h-full min-h-[220px] items-center justify-center rounded-lg border border-dashed border-slate-300 text-sm text-slate-500">
              Select a student record to view details.
            </div>
          )}
        </aside>
      </div>
    </section>
  );
}

export default StudentRecords;
