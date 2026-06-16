import { PrismaClient, Role } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Seeding Role Quotas...')

  const quotas = [
    {
      role: Role.superadmin,
      dailyRequests: 1000,
      dailyTokens: 500000,
      monthlyBudget: 100.00,
      allowedFeatures: JSON.stringify(['rewrite', 'expand', 'headline', 'seo', 'grammar', 'readability', 'fact-check', 'caption', 'image_gen', 'summarize', 'translate']),
      modelRestriction: null
    },
    {
      role: Role.wapimred,
      dailyRequests: 500,
      dailyTokens: 200000,
      monthlyBudget: 50.00,
      allowedFeatures: JSON.stringify(['rewrite', 'expand', 'headline', 'seo', 'grammar', 'readability', 'fact-check', 'caption', 'image_gen', 'summarize', 'translate']),
      modelRestriction: null
    },
    {
      role: Role.reporter,
      dailyRequests: 100,
      dailyTokens: 50000,
      monthlyBudget: 50.00,
      allowedFeatures: JSON.stringify(['rewrite', 'expand', 'headline', 'seo', 'grammar', 'readability', 'fact-check', 'caption', 'summarize', 'translate']),
      modelRestriction: null
    },
    {
      role: Role.kontributor,
      dailyRequests: 30,
      dailyTokens: 15000,
      monthlyBudget: 15.00,
      allowedFeatures: JSON.stringify(['rewrite', 'expand', 'grammar', 'readability', 'caption']),
      modelRestriction: null
    },
    {
      role: Role.reader,
      dailyRequests: 10,
      dailyTokens: 5000,
      monthlyBudget: 2.00,
      allowedFeatures: JSON.stringify(['readability']),
      modelRestriction: 'gpt-3.5-turbo'
    },
    {
      role: Role.advertiser,
      dailyRequests: 10,
      dailyTokens: 5000,
      monthlyBudget: 2.00,
      allowedFeatures: JSON.stringify([]),
      modelRestriction: null
    }
  ]

  for (const q of quotas) {
    await prisma.roleQuota.upsert({
      where: { role: q.role },
      update: {
        dailyRequests: q.dailyRequests,
        dailyTokens: q.dailyTokens,
        monthlyBudget: q.monthlyBudget,
        allowedFeatures: q.allowedFeatures,
        modelRestriction: q.modelRestriction
      },
      create: q
    })
    console.log(`✅ Quota for ${q.role} seeded/updated.`)
  }

  console.log('✨ Seeding completed.')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
