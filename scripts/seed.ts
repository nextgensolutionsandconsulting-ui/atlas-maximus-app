import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // =======================================
  // 🚨 CREATE NEW ADMIN ACCOUNT
  // =======================================
  const adminPassword = await bcrypt.hash('NextGen2025!', 10)

  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@nextgen.com' },
    update: {},
    create: {
      email: 'admin@nextgen.com',
      password: adminPassword,
      fullName: 'NextGen Admin',
      name: 'NextGen Admin',
      agileRole: 'AGILE_COACH',
      isAdmin: true,
      subscriptionStatus: 'ACTIVE',
      ttsEnabled: true,
      ttsVoice: 'male-professional',
      preferredMode: 'GUIDED_QUESTIONS'
    }
  })

  console.log('👤 Admin Created:')
  console.log('   Email: admin@nextgen.com')
  console.log('   Password: NextGen2025!')

  // =======================================
  // SAMPLE USERS
  // =======================================
  const sampleUsers = [
    {
      email: 'sarah.smith@example.com',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Sarah Smith',
      name: 'Sarah Smith',
      agileRole: 'SCRUM_MASTER' as const,
      subscriptionStatus: 'ACTIVE' as const
    },
    {
      email: 'mike.johnson@example.com', 
      password: await bcrypt.hash('password123', 10),
      fullName: 'Mike Johnson',
      name: 'Mike Johnson',
      agileRole: 'PRODUCT_OWNER' as const,
      subscriptionStatus: 'TRIALING' as const
    },
    {
      email: 'lisa.chen@example.com',
      password: await bcrypt.hash('password123', 10),
      fullName: 'Lisa Chen',
      name: 'Lisa Chen',
      agileRole: 'DEVELOPER' as const,
      subscriptionStatus: 'INACTIVE' as const
    }
  ]

  for (const userData of sampleUsers) {
    await prisma.user.upsert({
      where: { email: userData.email },
      update: {},
      create: userData
    })
  }

  // =======================================
  // KNOWLEDGE BASE ITEMS
  // =======================================
  const knowledgeBaseItems = [
    {
      title: 'Scrum Framework Overview',
      content: 'Scrum is a framework for developing, delivering, and sustaining complex products. It consists of Scrum Teams and their associated roles, events, artifacts, and rules.',
      category: 'Scrum',
      tags: ['scrum', 'framework', 'basics'],
      source: 'Scrum Guide',
      isPublic: true
    },
    {
      title: 'Sprint Planning Best Practices',
      content: 'Sprint Planning is a collaborative effort involving the Scrum Team that results in two key outcomes: a Sprint Goal and a Sprint Backlog.',
      category: 'Sprint Planning',
      tags: ['sprint', 'planning', 'best-practices'],
      source: 'Scrum Alliance',
      isPublic: true
    },
    {
      title: 'Daily Scrum Guidelines',
      content: 'The Daily Scrum is a 15-minute event for the Developers to synchronize activities and create a plan for the next 24 hours.',
      category: 'Daily Scrum',
      tags: ['daily-scrum', 'synchronization', 'planning'],
      source: 'Scrum Guide',
      isPublic: true
    },
    {
      title: 'Scaled Agile Framework (SAFe) Introduction',
      content: 'SAFe is a set of organization and workflow patterns intended to guide enterprises in scaling lean and agile practices.',
      category: 'SAFe',
      tags: ['safe', 'scaling', 'enterprise'],
      source: 'Scaled Agile Framework',
      isPublic: true
    },
    {
      title: 'Product Owner Responsibilities',
      content: 'The Product Owner is responsible for maximizing the value of the product resulting from the work of the Developers.',
      category: 'Product Management',
      tags: ['product-owner', 'responsibilities', 'value'],
      source: 'Scrum Guide',
      isPublic: true
    }
  ]

  for (const item of knowledgeBaseItems) {
    await prisma.knowledgeBase.upsert({
      where: { title: item.title },
      update: {},
      create: item
    })
  }

  // =======================================
  // SAMPLE CONVERSATION FOR ADMIN
  // =======================================
  const sampleConversation = await prisma.conversation.create({
    data: {
      userId: adminUser.id,
      title: 'Getting Started with Atlas Maximus',
      summary: 'Initial conversation about Agile coaching capabilities'
    }
  })

  const sampleMessages = [
    {
      conversationId: sampleConversation.id,
      content: 'Hello Atlas! I need help with sprint planning for my new team.',
      role: 'USER' as const
    },
    {
      conversationId: sampleConversation.id,
      content:
        `Hello! I’d be happy to help you with sprint planning. Let me ask you a few questions:\n
1. How experienced is your team with Scrum?\n
2. What’s your sprint length?\n
3. Do you have a well-defined product backlog?\n
Answering these helps me guide you more effectively.`,
      role: 'ASSISTANT' as const
    },
    {
      conversationId: sampleConversation.id,
      content: 'The team is fairly new to Scrum. We’re planning 2-week sprints.',
      role: 'USER' as const
    }
  ]

  for (const message of sampleMessages) {
    await prisma.message.create({ data: message })
  }

  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
