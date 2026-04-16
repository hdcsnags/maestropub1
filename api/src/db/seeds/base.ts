import { PrismaClient } from '@prisma/client';

export type SeedContext = {
  prisma: PrismaClient;
};

export type SeedResult<T = unknown> = {
  name: string;
  data?: T;
};

export type SeedRunner<T = unknown> = (context: SeedContext) => Promise<SeedResult<T> | void>;

export interface SeedDefinition<T = unknown> {
  name: string;
  run: SeedRunner<T>;
}

export function defineSeed<T = unknown>(name: string, run: SeedRunner<T>): SeedDefinition<T> {
  return {
    name,
    run,
  };
}

export async function runSeed<T = unknown>(seed: SeedDefinition<T>, context: SeedContext): Promise<SeedResult<T>> {
  const result = await seed.run(context);

  return {
    name: seed.name,
    ...(result ?? {}),
  } as SeedResult<T>;
}

export async function runSeeds(
  seeds: SeedDefinition[],
  context: SeedContext,
): Promise<SeedResult[]> {
  const results: SeedResult[] = [];

  for (const seed of seeds) {
    results.push(await runSeed(seed, context));
  }

  return results;
}
