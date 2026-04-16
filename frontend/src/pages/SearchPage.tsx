import { FormEvent, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';

type SearchItemType = 'course' | 'lesson' | 'article';

type SearchItem = {
  id: string;
  title: string;
  description: string;
  type: SearchItemType;
  href: string;
  tags: string[];
};

const SEARCH_ITEMS: SearchItem[] = [
  {
    id: 'course-react-fundamentals',
    title: 'React Fundamentals',
    description: 'Learn components, props, state, effects, and routing with practical examples.',
    type: 'course',
    href: '/courses/react-fundamentals',
    tags: ['react', 'frontend', 'javascript'],
  },
  {
    id: 'course-typescript-basics',
    title: 'TypeScript Basics',
    description: 'Build confidence with static typing, interfaces, utility types, and generics.',
    type: 'course',
    href: '/courses/typescript-basics',
    tags: ['typescript', 'javascript', 'frontend'],
  },
  {
    id: 'lesson-state-management',
    title: 'State Management Patterns',
    description: 'Compare local state, context, reducers, and scalable state management approaches.',
    type: 'lesson',
    href: '/lessons/state-management-patterns',
    tags: ['react', 'state', 'architecture'],
  },
  {
    id: 'lesson-accessibility',
    title: 'Accessibility Essentials',
    description: 'Create usable interfaces with semantic HTML, keyboard support, and ARIA best practices.',
    type: 'lesson',
    href: '/lessons/accessibility-essentials',
    tags: ['a11y', 'html', 'frontend'],
  },
  {
    id: 'article-design-systems',
    title: 'Why Design Systems Matter',
    description: 'Explore consistency, scalability, and collaboration benefits of shared UI foundations.',
    type: 'article',
    href: '/articles/why-design-systems-matter',
    tags: ['design systems', 'ui', 'product'],
  },
  {
    id: 'article-api-integration',
    title: 'Frontend API Integration Tips',
    description: 'Handle loading states, errors, retries, and data transformation with confidence.',
    type: 'article',
    href: '/articles/frontend-api-integration-tips',
    tags: ['api', 'data', 'frontend'],
  },
];

function normalizeQuery(value: string): string {
  return value.trim().toLowerCase();
}

function matchesQuery(item: SearchItem, query: string): boolean {
  if (!query) return true;

  const haystack = [item.title, item.description, item.type, ...item.tags]
    .join(' ')
    .toLowerCase();

  return haystack.includes(query);
}

function formatTypeLabel(type: SearchItemType): string {
  switch (type) {
    case 'course':
      return 'Course';
    case 'lesson':
      return 'Lesson';
    case 'article':
      return 'Article';
    default:
      return type;
  }
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') ?? '';
  const [inputValue, setInputValue] = useState(initialQuery);

  const normalizedQuery = normalizeQuery(initialQuery);

  const results = useMemo(
    () => SEARCH_ITEMS.filter((item) => matchesQuery(item, normalizedQuery)),
    [normalizedQuery],
  );

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = inputValue.trim();

    if (!nextQuery) {
      setSearchParams({});
      return;
    }

    setSearchParams({ q: nextQuery });
  };

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-medium uppercase tracking-wide text-blue-600">Search</p>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Find courses, lessons, and articles</h1>
        <p className="max-w-2xl text-base text-slate-600">
          Search learning content by title, topic, or keyword. Try terms like{' '}
          <span className="font-medium text-slate-800">React</span>,{' '}
          <span className="font-medium text-slate-800">TypeScript</span>, or{' '}
          <span className="font-medium text-slate-800">accessibility</span>.
        </p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row">
        <label htmlFor="search-query" className="sr-only">
          Search query
        </label>
        <input
          id="search-query"
          type="search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder="Search for content"
          className="min-w-0 flex-1 rounded-xl border border-slate-300 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
        />
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-300 focus:ring-offset-2"
        >
          Search
        </button>
      </form>

      <section className="flex flex-col gap-4" aria-live="polite">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Results</h2>
          <p className="text-sm text-slate-500">
            {results.length} result{results.length === 1 ? '' : 's'}
            {normalizedQuery ? ` for “${initialQuery.trim()}”` : ''}
          </p>
        </div>

        {results.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
            <h3 className="text-lg font-semibold text-slate-900">No results found</h3>
            <p className="mt-2 text-sm text-slate-600">
              Try a different keyword, check the spelling, or search for a broader topic.
            </p>
          </div>
        ) : (
          <ul className="grid gap-4">
            {results.map((item) => (
              <li key={item.id}>
                <Link
                  to={item.href}
                  className="block rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-300 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-300"
                >
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-blue-700">
                      {formatTypeLabel(item.type)}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span
                          key={`${item.id}-${tag}`}
                          className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                  <h3 className="mt-4 text-xl font-semibold text-slate-900">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
