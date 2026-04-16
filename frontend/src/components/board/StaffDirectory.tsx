import React, { useMemo, useState } from 'react';

type StaffMember = {
  id: string;
  name: string;
  role: string;
  department: string;
  email: string;
  phone?: string;
  location?: string;
  status?: 'active' | 'away' | 'offline';
  avatarUrl?: string;
};

type StaffDirectoryProps = {
  staff?: StaffMember[];
  title?: string;
  className?: string;
  onSelectMember?: (member: StaffMember) => void;
};

const DEFAULT_STAFF: StaffMember[] = [
  {
    id: '1',
    name: 'Ava Thompson',
    role: 'Principal',
    department: 'Administration',
    email: 'ava.thompson@school.edu',
    phone: '(555) 102-1001',
    location: 'Main Office',
    status: 'active',
  },
  {
    id: '2',
    name: 'Marcus Lee',
    role: 'Vice Principal',
    department: 'Administration',
    email: 'marcus.lee@school.edu',
    phone: '(555) 102-1002',
    location: 'Building A',
    status: 'away',
  },
  {
    id: '3',
    name: 'Sofia Ramirez',
    role: 'Counselor',
    department: 'Student Support',
    email: 'sofia.ramirez@school.edu',
    phone: '(555) 102-1014',
    location: 'Student Services',
    status: 'active',
  },
  {
    id: '4',
    name: 'Ethan Brooks',
    role: 'Math Teacher',
    department: 'Academics',
    email: 'ethan.brooks@school.edu',
    phone: '(555) 102-1108',
    location: 'Room 214',
    status: 'offline',
  },
  {
    id: '5',
    name: 'Priya Nair',
    role: 'Science Teacher',
    department: 'Academics',
    email: 'priya.nair@school.edu',
    phone: '(555) 102-1112',
    location: 'Lab 3',
    status: 'active',
  },
  {
    id: '6',
    name: 'Daniel Kim',
    role: 'IT Coordinator',
    department: 'Operations',
    email: 'daniel.kim@school.edu',
    phone: '(555) 102-1206',
    location: 'Tech Office',
    status: 'away',
  },
];

const statusLabelMap: Record<NonNullable<StaffMember['status']>, string> = {
  active: 'Active',
  away: 'Away',
  offline: 'Offline',
};

const statusColorMap: Record<NonNullable<StaffMember['status']>, string> = {
  active: '#16a34a',
  away: '#d97706',
  offline: '#6b7280',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function normalize(value: string): string {
  return value.trim().toLowerCase();
}

export default function StaffDirectory({
  staff = DEFAULT_STAFF,
  title = 'Staff Directory',
  className,
  onSelectMember,
}: StaffDirectoryProps) {
  const [query, setQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');

  const departments = useMemo(() => {
    const values = Array.from(new Set(staff.map((member) => member.department))).sort((a, b) =>
      a.localeCompare(b),
    );
    return ['all', ...values];
  }, [staff]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = normalize(query);

    return staff.filter((member) => {
      const matchesDepartment =
        departmentFilter === 'all' || member.department === departmentFilter;

      if (!matchesDepartment) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        member.name,
        member.role,
        member.department,
        member.email,
        member.phone ?? '',
        member.location ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [departmentFilter, query, staff]);

  return (
    <section
      className={className}
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: 16,
        padding: 20,
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
      }}
      aria-label={title}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 20,
        }}
      >
        <div>
          <h2
            style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 700,
              color: '#111827',
            }}
          >
            {title}
          </h2>
          <p
            style={{
              margin: '6px 0 0',
              color: '#6b7280',
              fontSize: 14,
            }}
          >
            Browse faculty and staff contact information.
          </p>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 12,
            flexWrap: 'wrap',
            alignItems: 'center',
          }}
        >
          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Search</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search staff"
              aria-label="Search staff"
              style={{
                minWidth: 220,
                height: 38,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                padding: '0 12px',
                fontSize: 14,
                outline: 'none',
              }}
            />
          </label>

          <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <span style={{ fontSize: 12, color: '#6b7280', fontWeight: 600 }}>Department</span>
            <select
              value={departmentFilter}
              onChange={(event) => setDepartmentFilter(event.target.value)}
              aria-label="Filter by department"
              style={{
                minWidth: 180,
                height: 38,
                borderRadius: 10,
                border: '1px solid #d1d5db',
                padding: '0 12px',
                fontSize: 14,
                background: '#fff',
              }}
            >
              {departments.map((department) => (
                <option key={department} value={department}>
                  {department === 'all' ? 'All departments' : department}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 16,
        }}
      >
        {filteredStaff.map((member) => {
          const status = member.status ?? 'offline';

          return (
            <button
              key={member.id}
              type="button"
              onClick={() => onSelectMember?.(member)}
              style={{
                textAlign: 'left',
                border: '1px solid #e5e7eb',
                borderRadius: 14,
                background: '#f9fafb',
                padding: 16,
                cursor: onSelectMember ? 'pointer' : 'default',
                display: 'flex',
                gap: 14,
                alignItems: 'flex-start',
              }}
            >
              <div
                aria-hidden="true"
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 700,
                  fontSize: 16,
                  flexShrink: 0,
                  overflow: 'hidden',
                }}
              >
                {member.avatarUrl ? (
                  <img
                    src={member.avatarUrl}
                    alt=""
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  getInitials(member.name)
                )}
              </div>

              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: 12,
                    marginBottom: 6,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        color: '#111827',
                        fontSize: 15,
                        lineHeight: 1.3,
                      }}
                    >
                      {member.name}
                    </div>
                    <div style={{ color: '#374151', fontSize: 14, marginTop: 2 }}>{member.role}</div>
                  </div>

                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 8px',
                      borderRadius: 999,
                      background: '#fff',
                      border: '1px solid #e5e7eb',
                      color: '#374151',
                      fontSize: 12,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: statusColorMap[status],
                      }}
                    />
                    {statusLabelMap[status]}
                  </span>
                </div>

                <div
                  style={{
                    display: 'grid',
                    gap: 6,
                    color: '#6b7280',
                    fontSize: 13,
                    lineHeight: 1.5,
                  }}
                >
                  <div>
                    <strong style={{ color: '#374151' }}>Department:</strong> {member.department}
                  </div>
                  <div>
                    <strong style={{ color: '#374151' }}>Email:</strong> {member.email}
                  </div>
                  {member.phone ? (
                    <div>
                      <strong style={{ color: '#374151' }}>Phone:</strong> {member.phone}
                    </div>
                  ) : null}
                  {member.location ? (
                    <div>
                      <strong style={{ color: '#374151' }}>Location:</strong> {member.location}
                    </div>
                  ) : null}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {filteredStaff.length === 0 ? (
        <div
          style={{
            marginTop: 16,
            border: '1px dashed #d1d5db',
            borderRadius: 12,
            padding: 24,
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 14,
          }}
        >
          No staff members match your current filters.
        </div>
      ) : null}
    </section>
  );
}
