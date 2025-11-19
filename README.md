
# Atlas Maximus - AI-Powered Agile Learning Avatar

Atlas Maximus is an intelligent, AI-powered chatbot designed to transform how teams learn and apply Agile methodologies. Built with Next.js, TypeScript, and cutting-edge AI technology, it analyzes uploaded Agile documents, provides role-specific insights, and supports natural language queries to enhance your Agile journey.

## 🚀 Features

### Core Capabilities
- **AI-Powered Chat Interface**: Natural language conversations with voice input/output support
- **Document Analysis**: Upload and analyze Agile training documents, presentations, and guides
- **Role-Specific Insights**: Tailored guidance for Product Owners, Scrum Masters, and Development Teams
- **Evidence Tracker**: Track and manage Agile ceremony evidence and artifacts
- **Risk Analysis**: Identify and assess project risks with AI-powered recommendations
- **Meeting Copilot**: Real-time meeting assistance and note-taking

### Advanced Features
- **Jira Integration**: Connect with Jira to analyze tickets, epics, and sprint data
- **Coaching Companion**: Personalized Agile coaching based on team maturity
- **Report Generation**: Auto-generate PI Planning, Risk Assessment, and User Story documentation
- **Analytics Dashboard**: Track team performance, velocity, and Agile adoption metrics
- **Collaboration Workspaces**: Team spaces for shared knowledge and insights
- **Template Library**: Pre-built templates for User Stories, Retrospectives, and more

### Subscription & Monetization
- **Stripe Integration**: Secure payment processing
- **Tiered Plans**: Free tier with premium subscription options
- **User Authentication**: NextAuth.js with secure session management

## 🛠️ Technology Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **AI/ML**: Abacus.AI APIs for natural language processing
- **Text-to-Speech**: ElevenLabs/Browser TTS
- **Cloud Storage**: AWS S3
- **Styling**: Tailwind CSS + shadcn/ui components
- **State Management**: Zustand, Jotai

## 📋 Prerequisites

- Node.js 18+ and Yarn
- PostgreSQL database
- AWS account (for S3 storage)
- Stripe account (for payments)
- Abacus.AI API key (for LLM features)

## 🚦 Getting Started

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/atlas-maximus.git
cd atlas-maximus
```

### 2. Install Dependencies
```bash
yarn install
```

### 3. Environment Setup
Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/atlas_maximus"

# NextAuth
NEXTAUTH_SECRET="your-nextauth-secret"
NEXTAUTH_URL="http://localhost:3000"

# AWS S3
AWS_BUCKET_NAME="your-bucket-name"
AWS_FOLDER_PREFIX="atlas-maximus/"

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Abacus.AI (LLM APIs)
ABACUSAI_API_KEY="your-api-key"

# OpenAI (optional, for additional AI features)
OPENAI_API_KEY="sk-..."

# Jira Integration (optional)
JIRA_BASE_URL="https://your-domain.atlassian.net"
JIRA_EMAIL="your-email@domain.com"
JIRA_API_TOKEN="your-jira-token"
```

### 4. Database Setup
```bash
# Generate Prisma Client
yarn prisma generate

# Run migrations
yarn prisma migrate deploy

# Seed the database (optional)
yarn prisma db seed
```

### 5. Run Development Server
```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📦 Project Structure

```
atlas-maximus/
├── app/                          # Next.js App Router
│   ├── _components/             # Landing page components
│   ├── api/                     # API routes
│   │   ├── auth/               # Authentication endpoints
│   │   ├── chat/               # Chat/AI endpoints
│   │   ├── documents/          # Document processing
│   │   ├── jira/               # Jira integration
│   │   ├── stripe/             # Payment processing
│   │   └── ...
│   ├── auth/                    # Auth pages (login/signup)
│   ├── dashboard/              # Main application
│   │   └── _components/        # Dashboard components
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                  # Reusable components
│   ├── ui/                     # shadcn/ui components
│   └── providers.tsx           # Context providers
├── lib/                         # Utility libraries
│   ├── analytics-engine.ts     # Analytics logic
│   ├── auth.ts                 # Auth configuration
│   ├── coaching-analyzer.ts    # Coaching logic
│   ├── conversation-memory.ts  # Chat memory
│   ├── db.ts                   # Database client
│   ├── document-processor.ts   # Document analysis
│   ├── jira-parser.ts          # Jira data parsing
│   ├── meeting-copilot.ts      # Meeting assistance
│   ├── risk-analyzer.ts        # Risk assessment
│   ├── workflows.ts            # Workflow automation
│   └── generators/             # Report generators
├── prisma/
│   └── schema.prisma           # Database schema
├── public/                      # Static assets
├── middleware.ts               # Next.js middleware
├── next.config.js              # Next.js configuration
└── package.json                # Dependencies

```

## 🔧 Configuration

### Database Schema
The app uses Prisma ORM. Key models include:
- **User**: User accounts and profiles
- **Document**: Uploaded Agile documents
- **Message**: Chat conversation history
- **Evidence**: Agile ceremony artifacts
- **Risk**: Identified project risks
- **Meeting**: Meeting notes and transcripts
- **Workspace**: Team collaboration spaces

### API Routes
- `/api/auth/*` - Authentication (NextAuth.js)
- `/api/chat` - AI chat completions
- `/api/documents/*` - Document upload/analysis
- `/api/jira/*` - Jira integration
- `/api/evidence/*` - Evidence tracking
- `/api/reports/*` - Report generation
- `/api/stripe/*` - Payment processing

## 🎨 UI Components

Built with [shadcn/ui](https://ui.shadcn.com/) and Tailwind CSS:
- Modern, accessible component library
- Dark mode support
- Responsive design
- Custom Atlas Maximus branding

## 🧪 Testing

```bash
# Run tests (when implemented)
yarn test

# Type checking
yarn tsc --noEmit

# Linting
yarn lint
```

## 🚀 Deployment

### Vercel (Recommended)
1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Manual Deployment
```bash
# Build for production
yarn build

# Start production server
yarn start
```

## 📝 Key Features Documentation

### Document Processing
Upload PowerPoint, PDF, or Word documents. The system:
1. Extracts text content
2. Analyzes Agile concepts
3. Stores in vector database
4. Makes searchable via chat

### Evidence Tracker
Track Agile ceremonies:
- Sprint Planning
- Daily Standups
- Sprint Reviews
- Retrospectives
- PI Planning events

### Risk Analysis
AI-powered risk assessment:
- Identifies project risks
- Calculates impact and probability
- Suggests mitigation strategies
- Tracks risk over time

### Jira Integration
Connect your Jira workspace:
- Import epics and stories
- Analyze ticket quality (INVEST criteria)
- Track sprint progress
- Generate insights

### Report Generation
Auto-generate professional documents:
- PI Planning deliverables
- Risk assessment reports
- User story documentation
- Sprint retrospectives

## 🔐 Security

- Environment variables for sensitive data
- NextAuth.js for secure authentication
- CSRF protection
- Secure cookie handling
- SQL injection prevention (Prisma)
- Content Security Policy headers

## 🤝 Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is proprietary software. All rights reserved.

## 👥 Team

Built with ❤️ by the Atlas Maximus team

## 📧 Support

For support, email support@atlasmaximus.com or open an issue in GitHub.

## 🗺️ Roadmap

- [ ] Mobile app (React Native)
- [ ] Slack/Teams integration
- [ ] Advanced analytics dashboards
- [ ] Multi-language support
- [ ] Custom training on organization docs
- [ ] API for third-party integrations

---

**Note**: This is a production-ready application. Ensure all environment variables are properly configured before deployment.
