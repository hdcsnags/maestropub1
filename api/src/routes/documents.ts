import { Router, type Request, type Response } from 'express';

const router = Router();

type DocumentRecord = {
  id: string;
  title: string;
  type: string;
  status: 'active' | 'archived' | 'draft';
  createdAt: string;
  updatedAt: string;
};

const documents: DocumentRecord[] = [
  {
    id: 'doc_1',
    title: 'Project Charter',
    type: 'pdf',
    status: 'active',
    createdAt: new Date('2024-01-10T09:00:00.000Z').toISOString(),
    updatedAt: new Date('2024-01-10T09:00:00.000Z').toISOString(),
  },
  {
    id: 'doc_2',
    title: 'Requirements Spec',
    type: 'docx',
    status: 'draft',
    createdAt: new Date('2024-02-14T14:30:00.000Z').toISOString(),
    updatedAt: new Date('2024-02-15T08:15:00.000Z').toISOString(),
  },
];

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ data: documents });
});

router.get('/:id', (req: Request, res: Response) => {
  const document = documents.find((item) => item.id === req.params.id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  return res.status(200).json({ data: document });
});

router.post('/', (req: Request, res: Response) => {
  const { title, type, status } = req.body as Partial<DocumentRecord>;

  if (!title || !type) {
    return res.status(400).json({ error: 'title and type are required' });
  }

  const now = new Date().toISOString();
  const document: DocumentRecord = {
    id: `doc_${Date.now()}`,
    title,
    type,
    status: status === 'archived' || status === 'draft' || status === 'active' ? status : 'draft',
    createdAt: now,
    updatedAt: now,
  };

  documents.push(document);

  return res.status(201).json({ data: document });
});

router.put('/:id', (req: Request, res: Response) => {
  const document = documents.find((item) => item.id === req.params.id);

  if (!document) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const { title, type, status } = req.body as Partial<DocumentRecord>;

  if (typeof title === 'string' && title.trim()) {
    document.title = title;
  }

  if (typeof type === 'string' && type.trim()) {
    document.type = type;
  }

  if (status === 'active' || status === 'archived' || status === 'draft') {
    document.status = status;
  }

  document.updatedAt = new Date().toISOString();

  return res.status(200).json({ data: document });
});

router.delete('/:id', (req: Request, res: Response) => {
  const index = documents.findIndex((item) => item.id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ error: 'Document not found' });
  }

  const [removed] = documents.splice(index, 1);

  return res.status(200).json({ data: removed });
});

export default router;
