import React from 'react';

const DashboardPage: React.FC = () => {
  return (
    <main className="min-h-screen bg-slate-50 px-6 py-10 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <header className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-sky-600">Session 74</p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Dashboard</h1>
            <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
              Welcome back. Here is a high-level view of your workspace activity, status, and recent updates.
            </p>
          </div>
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2"
          >
            Refresh data
          </button>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Active projects', value: '12', change: '+2 this week' },
            { label: 'Open tasks', value: '38', change: '7 due today' },
            { label: 'Team members', value: '24', change: '3 online now' },
            { label: 'Completion rate', value: '89%', change: '+5% vs last month' },
          ].map((item) => (
            <article
              key={item.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
            >
              <p className="text-sm font-medium text-slate-500">{item.label}</p>
              <p className="mt-3 text-3xl font-bold text-slate-900">{item.value}</p>
              <p className="mt-2 text-sm text-emerald-600">{item.change}</p>
            </article>
          ))}
        </section>

        <section className="mt-8 grid gap-6 lg:grid-cols-3">
          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Recent activity</h2>
                <p className="mt-1 text-sm text-slate-500">Latest updates across your projects and team.</p>
              </div>
              <a href="#" className="text-sm font-medium text-sky-600 hover:text-sky-700">
                View all
              </a>
            </div>

            <div className="mt-6 space-y-4">
              {[
                {
                  title: 'Design system updated',
                  detail: 'New button variants and spacing tokens were published to the shared library.',
                  time: '2 hours ago',
                },
                {
                  title: 'Sprint planning completed',
                  detail: 'The product and engineering teams aligned on priorities for the next cycle.',
                  time: 'Yesterday',
                },
                {
                  title: 'Analytics report generated',
                  detail: 'Weekly performance metrics are now available for stakeholder review.',
                  time: '2 days ago',
                },
              ].map((item) => (
                <div key={item.title} className="flex gap-4 rounded-lg border border-slate-100 p-4">
                  <div className="mt-1 h-3 w-3 flex-shrink-0 rounded-full bg-sky-500" />
                  <div className="min-w-0">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-medium text-slate-900">{item.title}</h3>
                      <span className="text-xs text-slate-400">{item.time}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{item.detail}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Upcoming milestones</h2>
            <p className="mt-1 text-sm text-slate-500">Key dates to keep on your radar.</p>

            <ul className="mt-6 space-y-4">
              {[
                { name: 'Release candidate', date: 'Apr 20', status: 'On track' },
                { name: 'Client review', date: 'Apr 24', status: 'Pending' },
                { name: 'Quarterly retrospective', date: 'Apr 30', status: 'Scheduled' },
              ].map((milestone) => (
                <li
                  key={milestone.name}
                  className="rounded-lg border border-slate-100 px-4 py-3"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{milestone.name}</p>
                      <p className="text-sm text-slate-500">{milestone.date}</p>
                    </div>
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
                      {milestone.status}
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
};

export default DashboardPage;
