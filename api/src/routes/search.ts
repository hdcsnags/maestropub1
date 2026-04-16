import { Router, type Request, type Response } from 'express';

const router = Router();

type SearchResult = {
  id: string;
  title: string;
  type: 'article' | 'project' | 'user';
  snippet: string;
  url: string;
};

const MOCK_RESULTS: SearchResult[] = [
  {
    id: 'article-1',
    title: 'Getting Started with Session 74',
    type: 'article',
    snippet: 'Learn the foundations of the Session 74 platform and its core workflows.',
    url: '/articles/getting-started',
  },
  {
    id: 'project-1',
    title: 'Session 74 API',
    type: 'project',
    snippet: 'Backend service powering authentication, search, and orchestration features.',
    url: '/projects/session-74-api',
  },
  {
    id: 'user-1',
    title: 'Maestro Council',
    type: 'user',
    snippet: 'Collaborative multi-agent orchestration team for complex build tasks.',
    url: '/users/maestro-council',
  },
  {
    id: 'article-2',
    title: 'Advanced Search Patterns',
    type: 'article',
    snippet: 'Strategies for building responsive and relevant search experiences.',
    url: '/articles/advanced-search-patterns',
  },
];

const normalize = (value: string): string => value.trim().toLowerCase();

router.get('/', (req: Request, res: Response) => {
  const rawQuery = typeof req.query.q === 'string' ? req.query.q : '';
  const query = normalize(rawQuery);

  if (!query) {
    return res.status(400).json({
      error: 'Missing required query parameter: q',
    });
  }

  const limitParam = typeof req.query.limit === 'string' ? Number.parseInt(req.query.limit, 10) : 10;
  const limit = Number.isFinite(limitParam) && limitParam > 0 ? Math.min(limitParam, 50) : 10;

  const results = MOCK_RESULTS.filter((item) => {
    const haystack = normalize(`${item.title} ${item.snippet} ${item.type}`);
    return haystack.includes(query);
  }).slice(0, limit);

  return res.status(200).json({
    query: rawQuery,
    count: results.length,
    results,
  });
});

export default router;
