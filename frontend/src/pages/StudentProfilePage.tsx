import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'

type StudentStatus = 'Active' | 'At Risk' | 'Inactive'

type CourseEnrollment = {
  id: string
  courseCode: string
  courseName: string
  instructor: string
  progress: number
  grade: string
}

type AttendanceRecord = {
  id: string
  month: string
  rate: number
  absences: number
}

type StudentProfile = {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
  cohort: string
  major: string
  year: string
  advisor: string
  status: StudentStatus
  gpa: number
  creditsEarned: number
  creditsRequired: number
  bio: string
  goals: string[]
  enrollments: CourseEnrollment[]
  attendance: AttendanceRecord[]
}

const mockStudents: StudentProfile[] = [
  {
    id: 's-1001',
    fullName: 'Maya Johnson',
    email: 'maya.johnson@session74.edu',
    cohort: 'Session 74 · Cohort A',
    major: 'Computer Science',
    year: 'Junior',
    advisor: 'Dr. Elena Park',
    status: 'Active',
    gpa: 3.84,
    creditsEarned: 78,
    creditsRequired: 120,
    bio: 'Maya is focused on frontend engineering and human-centered product design. She enjoys collaborating on student-led projects and mentoring first-year peers.',
    goals: [
      'Complete capstone project in accessible web applications',
      'Secure a summer internship in product engineering',
      'Maintain GPA above 3.8 through graduation',
    ],
    enrollments: [
      {
        id: 'c-1',
        courseCode: 'CS 341',
        courseName: 'Human-Computer Interaction',
        instructor: 'Prof. Amir Khan',
        progress: 92,
        grade: 'A',
      },
      {
        id: 'c-2',
        courseCode: 'CS 356',
        courseName: 'Frontend Architecture',
        instructor: 'Prof. Lina Gomez',
        progress: 88,
        grade: 'A-',
      },
      {
        id: 'c-3',
        courseCode: 'STAT 210',
        courseName: 'Applied Statistics',
        instructor: 'Prof. Nadia Chen',
        progress: 81,
        grade: 'B+',
      },
    ],
    attendance: [
      { id: 'a-1', month: 'January', rate: 97, absences: 1 },
      { id: 'a-2', month: 'February', rate: 95, absences: 1 },
      { id: 'a-3', month: 'March', rate: 98, absences: 0 },
      { id: 'a-4', month: 'April', rate: 96, absences: 1 },
    ],
  },
  {
    id: 's-1002',
    fullName: 'Daniel Brooks',
    email: 'daniel.brooks@session74.edu',
    cohort: 'Session 74 · Cohort B',
    major: 'Information Systems',
    year: 'Sophomore',
    advisor: 'Dr. Priya Raman',
    status: 'At Risk',
    gpa: 2.67,
    creditsEarned: 39,
    creditsRequired: 120,
    bio: 'Daniel is interested in analytics and operations. He is currently working to improve consistency in coursework and attendance while exploring data-focused career paths.',
    goals: [
      'Raise cumulative GPA above 3.0 by next term',
      'Improve attendance to 95% or higher',
      'Meet with advisor bi-weekly for academic planning',
    ],
    enrollments: [
      {
        id: 'c-4',
        courseCode: 'IS 220',
        courseName: 'Systems Analysis',
        instructor: 'Prof. Teresa Miles',
        progress: 64,
        grade: 'C+',
      },
      {
        id: 'c-5',
        courseCode: 'BUS 201',
        courseName: 'Business Communication',
        instructor: 'Prof. James Holloway',
        progress: 73,
        grade: 'B-',
      },
      {
        id: 'c-6',
        courseCode: 'DS 230',
        courseName: 'Data Foundations',
        instructor: 'Prof. Reena Patel',
        progress: 68,
        grade: 'C',
      },
    ],
    attendance: [
      { id: 'a-5', month: 'January', rate: 89, absences: 3 },
      { id: 'a-6', month: 'February', rate: 85, absences: 4 },
      { id: 'a-7', month: 'March', rate: 87, absences: 3 },
      { id: 'a-8', month: 'April', rate: 90, absences: 2 },
    ],
  },
]

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
}

function statusClasses(status: StudentStatus) {
  switch (status) {
    case 'Active':
      return 'bg-green-100 text-green-800 border border-green-200'
    case 'At Risk':
      return 'bg-amber-100 text-amber-800 border border-amber-200'
    case 'Inactive':
      return 'bg-slate-100 text-slate-700 border border-slate-200'
    default:
      return 'bg-slate-100 text-slate-700 border border-slate-200'
  }
}

function metricTone(value: number, thresholds: { good: number; warn: number }) {
  if (value >= thresholds.good) return 'text-green-600'
  if (value >= thresholds.warn) return 'text-amber-600'
  return 'text-red-600'
}

export default function StudentProfilePage() {
  const { studentId } = useParams<{ studentId: string }>()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'courses' | 'attendance'>('overview')

  const student = useMemo(() => {
    if (!studentId) return mockStudents[0]
    return mockStudents.find((entry) => entry.id === studentId) ?? mockStudents[0]
  }, [studentId])

  const creditCompletion = Math.round((student.creditsEarned / student.creditsRequired) * 100)
  const averageAttendance = Math.round(
    student.attendance.reduce((sum, record) => sum + record.rate, 0) / student.attendance.length,
  )
  const averageCourseProgress = Math.round(
    student.enrollments.reduce((sum, course) => sum + course.progress, 0) / student.enrollments.length,
  )

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-sm text-slate-500">
              <Link to="/students" className="font-medium hover:text-slate-700">
                Students
              </Link>
              <span>/</span>
              <span>{student.fullName}</span>
            </div>
            <h1 className="text-3xl font-bold tracking-tight">Student Profile</h1>
            <p className="mt-1 text-sm text-slate-600">
              Academic snapshot, course performance, and attendance history.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
            >
              Message Advisor
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-slate-800"
            >
              Export Summary
            </button>
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 px-6 py-8 text-white">
            <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                {student.avatarUrl ? (
                  <img
                    src={student.avatarUrl}
                    alt={student.fullName}
                    className="h-20 w-20 rounded-full border border-white/20 object-cover"
                  />
                ) : (
                  <div className="flex h-20 w-20 items-center justify-center rounded-full border border-white/20 bg-white/10 text-2xl font-bold">
                    {initialsFromName(student.fullName)}
                  </div>
                )}
                <div>
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <h2 className="text-2xl font-semibold">{student.fullName}</h2>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClasses(student.status)}`}>
                      {student.status}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm text-slate-200">
                    <p>{student.email}</p>
                    <p>
                      {student.major} · {student.year} · {student.cohort}
                    </p>
                    <p>Advisor: {student.advisor}</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-300">GPA</p>
                  <p className={`mt-1 text-2xl font-bold ${metricTone(student.gpa, { good: 3.5, warn: 3.0 })}`}>
                    {student.gpa.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Credits</p>
                  <p className="mt-1 text-2xl font-bold text-white">{student.creditsEarned}</p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Attendance</p>
                  <p className={`mt-1 text-2xl font-bold ${metricTone(averageAttendance, { good: 95, warn: 90 })}`}>
                    {averageAttendance}%
                  </p>
                </div>
                <div className="rounded-xl bg-white/10 px-4 py-3 backdrop-blur-sm">
                  <p className="text-xs uppercase tracking-wide text-slate-300">Course Progress</p>
                  <p className="mt-1 text-2xl font-bold text-white">{averageCourseProgress}%</p>
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 px-6 py-5">
            <div className="mb-4 flex flex-wrap gap-2">
              {[
                { id: 'overview', label: 'Overview' },
                { id: 'courses', label: 'Courses' },
                { id: 'attendance', label: 'Attendance' },
              ].map((tab) => {
                const active = selectedTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setSelectedTab(tab.id as 'overview' | 'courses' | 'attendance')}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-medium transition',
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
                    ].join(' ')}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>

            {selectedTab === 'overview' && (
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-5 lg:col-span-2">
                  <h3 className="text-lg font-semibold text-slate-900">About</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-700">{student.bio}</p>

                  <div className="mt-6">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Current Goals</h4>
                    <ul className="mt-3 space-y-3">
                      {student.goals.map((goal) => (
                        <li key={goal} className="flex items-start gap-3 text-sm text-slate-700">
                          <span className="mt-1 h-2.5 w-2.5 rounded-full bg-slate-900" />
                          <span>{goal}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Degree Progress</h3>
                      <span className="text-sm font-medium text-slate-600">{creditCompletion}%</span>
                    </div>
                    <div className="mt-4 h-3 overflow-hidden rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-slate-900"
                        style={{ width: `${Math.min(creditCompletion, 100)}%` }}
                      />
                    </div>
                    <p className="mt-3 text-sm text-slate-600">
                      {student.creditsEarned} of {student.creditsRequired} credits completed.
                    </p>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Quick Facts</h3>
                    <dl className="mt-4 space-y-3 text-sm">
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Major</dt>
                        <dd className="font-medium text-slate-900">{student.major}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Year</dt>
                        <dd className="font-medium text-slate-900">{student.year}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Advisor</dt>
                        <dd className="font-medium text-slate-900">{student.advisor}</dd>
                      </div>
                      <div className="flex items-center justify-between gap-4">
                        <dt className="text-slate-500">Cohort</dt>
                        <dd className="font-medium text-slate-900">{student.cohort}</dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}

            {selectedTab === 'courses' && (
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Course
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Instructor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Progress
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Grade
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {student.enrollments.map((course) => (
                        <tr key={course.id}>
                          <td className="px-4 py-4">
                            <div>
                              <p className="font-medium text-slate-900">{course.courseCode}</p>
                              <p className="text-sm text-slate-600">{course.courseName}</p>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-700">{course.instructor}</td>
                          <td className="px-4 py-4">
                            <div className="w-full max-w-xs">
                              <div className="mb-1 flex items-center justify-between text-sm">
                                <span className="text-slate-700">{course.progress}%</span>
                              </div>
                              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-slate-900"
                                  style={{ width: `${course.progress}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm font-medium text-slate-800">
                              {course.grade}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {selectedTab === 'attendance' && (
              <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-xl border border-slate-200 bg-white p-5">
                  <h3 className="text-lg font-semibold text-slate-900">Attendance History</h3>
                  <div className="mt-5 space-y-4">
                    {student.attendance.map((record) => (
                      <div key={record.id} className="rounded-lg border border-slate-200 p-4">
                        <div className="mb-2 flex items-center justify-between gap-4">
                          <div>
                            <p className="font-medium text-slate-900">{record.month}</p>
                            <p className="text-sm text-slate-500">{record.absences} absence(s)</p>
                          </div>
                          <p className={`text-lg font-semibold ${metricTone(record.rate, { good: 95, warn: 90 })}`}>
                            {record.rate}%
                          </p>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full ${
                              record.rate >= 95
                                ? 'bg-green-500'
                                : record.rate >= 90
                                  ? 'bg-amber-500'
                                  : 'bg-red-500'
                            }`}
                            style={{ width: `${record.rate}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="rounded-xl border border-slate-200 bg-slate-50 p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Attendance Summary</h3>
                    <div className="mt-4 grid grid-cols-2 gap-4">
                      <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Average</p>
                        <p className={`mt-1 text-2xl font-bold ${metricTone(averageAttendance, { good: 95, warn: 90 })}`}>
                          {averageAttendance}%
                        </p>
                      </div>
                      <div className="rounded-lg bg-white p-4 shadow-sm">
                        <p className="text-xs uppercase tracking-wide text-slate-500">Total Absences</p>
                        <p className="mt-1 text-2xl font-bold text-slate-900">
                          {student.attendance.reduce((sum, record) => sum + record.absences, 0)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-xl border border-slate-200 bg-white p-5">
                    <h3 className="text-lg font-semibold text-slate-900">Support Recommendations</h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-700">
                      <li className="rounded-lg bg-slate-50 p-3">Schedule a check-in with the academic advisor.</li>
                      <li className="rounded-lg bg-slate-50 p-3">Review attendance trends against assignment deadlines.</li>
                      <li className="rounded-lg bg-slate-50 p-3">Identify any barriers affecting on-time class participation.</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
