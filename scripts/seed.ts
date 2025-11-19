
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create admin test user
  const adminPassword = await bcrypt.hash('johndoe123', 10)
  const adminUser = await prisma.user.upsert({
    where: { email: 'john@doe.com' },
    update: {},
    create: {
      email: 'john@doe.com',
      password: adminPassword,
      fullName: 'John Doe Admin',
      name: 'John Doe Admin',
      agileRole: 'AGILE_COACH',
      isAdmin: true,
      subscriptionStatus: 'ACTIVE',
      ttsEnabled: true,
      ttsVoice: 'male-professional',
      preferredMode: 'GUIDED_QUESTIONS'
    }
  })

  // Create some sample users with different roles
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

  // Seed Knowledge Base with Agile content
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
      where: { 
        title: item.title 
      },
      update: {},
      create: item
    })
  }

  // Create a sample conversation for the admin user
  const sampleConversation = await prisma.conversation.create({
    data: {
      userId: adminUser.id,
      title: 'Getting Started with Atlas Maximus',
      summary: 'Initial conversation about Agile coaching capabilities'
    }
  })

  // Add sample messages to the conversation
  const sampleMessages = [
    {
      conversationId: sampleConversation.id,
      content: 'Hello Atlas! I need help with sprint planning for my new team.',
      role: 'USER' as const
    },
    {
      conversationId: sampleConversation.id,
      content: 'Hello! I\'d be happy to help you with sprint planning. Let me ask you a few questions to better understand your situation:\n\n1. How experienced is your team with Scrum practices?\n2. What\'s the typical length of your sprints?\n3. Do you have a well-defined product backlog?\n\nKnowing these details will help me provide more targeted guidance for your sprint planning process.',
      role: 'ASSISTANT' as const
    },
    {
      conversationId: sampleConversation.id,
      content: 'The team is fairly new to Scrum - about half have some experience. We\'re planning 2-week sprints and our product backlog needs some refinement.',
      role: 'USER' as const
    }
  ]

  for (const message of sampleMessages) {
    await prisma.message.create({
      data: message
    })
  }

  console.log('✅ Database seeded successfully!')
  console.log('👤 Admin user created: john@doe.com / johndoe123')
  console.log('📚 Knowledge base populated with Agile content')
  console.log('💬 Sample conversation created')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
