import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center px-6 py-16 text-center">
        <span className="mb-4 inline-flex items-center rounded-full border border-cyan-500/30 bg-cyan-500/10 px-4 py-1 text-sm font-medium text-cyan-300">
          Session 74
        </span>

        <h1 className="max-w-4xl text-4xl font-bold tracking-tight text-white sm:text-5xl md:text-6xl">
          Build faster with a clean, modern React experience.
        </h1>

        <p className="mt-6 max-w-2xl text-base leading-7 text-slate-300 sm:text-lg">
          This starter homepage gives your application a polished landing screen with clear navigation,
          responsive layout, and accessible calls to action.
        </p>

        <div className="mt-10 flex flex-col gap-4 sm:flex-row">
          <Link
            to="/dashboard"
            className="inline-flex items-center justify-center rounded-lg bg-cyan-500 px-6 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-300 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Go to Dashboard
          </Link>
          <Link
            to="/about"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-6 py-3 text-sm font-semibold text-slate-100 transition hover:border-slate-500 hover:bg-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-400 focus:ring-offset-2 focus:ring-offset-slate-950"
          >
            Learn More
          </Link>
        </div>

        <div className="mt-16 grid w-full max-w-5xl gap-6 text-left md:grid-cols-3">
          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
            <h2 className="text-lg font-semibold text-white">Responsive by default</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Designed to look great on mobile, tablet, and desktop with simple, maintainable layout
              primitives.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
            <h2 className="text-lg font-semibold text-white">Accessible interactions</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Clear contrast, keyboard focus states, and semantic structure provide a strong foundation
              for inclusive UI.
            </p>
          </article>

          <article className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg shadow-slate-950/30">
            <h2 className="text-lg font-semibold text-white">Easy to extend</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Use this page as a starting point for onboarding, marketing content, or your primary app
              landing experience.
            </p>
          </article>
        </div>
      </section>
    </main>
  );
}
