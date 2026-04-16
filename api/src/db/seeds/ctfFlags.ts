import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

type SeedFlag = {
  challengeSlug: string
  flag: string
  points?: number
}

const flags: SeedFlag[] = [
  {
    challengeSlug: 'welcome-to-session-74',
    flag: 'session74{welcome_to_the_arena}',
    points: 50,
  },
  {
    challengeSlug: 'env-leak',
    flag: 'session74{dotenv_belongs_on_the_server}',
    points: 100,
  },
  {
    challengeSlug: 'jwt-juggle',
    flag: 'session74{never_trust_alg_none}',
    points: 150,
  },
  {
    challengeSlug: 'sql-sleuth',
    flag: 'session74{parameterize_everything}',
    points: 200,
  },
  {
    challengeSlug: 'xss-echo',
    flag: 'session74{escape_before_you_render}',
    points: 125,
  },
  {
    challengeSlug: 'path-traversal',
    flag: 'session74{dotdotslash_is_not_a_strategy}',
    points: 175,
  },
  {
    challengeSlug: 'ssrf-lab',
    flag: 'session74{metadata_should_not_be_public}',
    points: 225,
  },
  {
    challengeSlug: 'pickle-problem',
    flag: 'session74{deserialize_with_care}',
    points: 250,
  },
]

async function seedCtfFlags() {
  for (const entry of flags) {
    const challenge = await prisma.challenge.findFirst({
      where: {
        OR: [
          { slug: entry.challengeSlug },
          { title: entry.challengeSlug },
        ],
      },
    })

    if (!challenge) {
      console.warn(
        `[seed:ctfFlags] Skipping flag for missing challenge: ${entry.challengeSlug}`,
      )
      continue
    }

    await prisma.ctfFlag.upsert({
      where: {
        challengeId: challenge.id,
      },
      update: {
        flag: entry.flag,
        points: entry.points ?? challenge.points ?? 0,
      },
      create: {
        challengeId: challenge.id,
        flag: entry.flag,
        points: entry.points ?? challenge.points ?? 0,
      },
    })
  }
}

seedCtfFlags()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (error) => {
    console.error('[seed:ctfFlags] Failed to seed CTF flags', error)
    await prisma.$disconnect()
    process.exit(1)
  })
