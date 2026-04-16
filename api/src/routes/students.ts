import { Router, Request, Response } from 'express';

const router = Router();

type Student = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gradeLevel: number;
  enrolled: boolean;
  createdAt: string;
};

const students: Student[] = [
  {
    id: '1',
    firstName: 'Ava',
    lastName: 'Thompson',
    email: 'ava.thompson@example.com',
    gradeLevel: 10,
    enrolled: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: '2',
    firstName: 'Liam',
    lastName: 'Garcia',
    email: 'liam.garcia@example.com',
    gradeLevel: 11,
    enrolled: true,
    createdAt: new Date().toISOString(),
  },
];

const normalizeGradeLevel = (value: unknown): number | null => {
  if (typeof value === 'number' && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === 'string' && value.trim() !== '') {
    const parsed = Number(value);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }

  return null;
};

router.get('/', (_req: Request, res: Response) => {
  res.status(200).json({ data: students });
});

router.get('/:id', (req: Request, res: Response) => {
  const student = students.find((item) => item.id === req.params.id);

  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  return res.status(200).json({ data: student });
});

router.post('/', (req: Request, res: Response) => {
  const { firstName, lastName, email, gradeLevel, enrolled } = req.body ?? {};
  const normalizedGradeLevel = normalizeGradeLevel(gradeLevel);

  if (
    typeof firstName !== 'string' ||
    typeof lastName !== 'string' ||
    typeof email !== 'string' ||
    normalizedGradeLevel === null
  ) {
    return res.status(400).json({
      error: 'firstName, lastName, email, and gradeLevel are required',
    });
  }

  const student: Student = {
    id: String(students.length + 1),
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    gradeLevel: normalizedGradeLevel,
    enrolled: typeof enrolled === 'boolean' ? enrolled : true,
    createdAt: new Date().toISOString(),
  };

  students.push(student);

  return res.status(201).json({ data: student });
});

export default router;
