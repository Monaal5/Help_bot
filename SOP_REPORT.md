# Standard Operating Procedure (SOP) Report
## AI Chatbot Platform - Talk Link Chatbots Hub

**Document Version:** 1.0  
**Date:** December 2024  
**Project:** AI Chatbot Platform with Knowledge Base Management  
**Technology Stack:** React, TypeScript, Vite, Supabase, Clerk, OpenRouter AI

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [System Architecture Overview](#system-architecture-overview)
3. [Technology Stack Analysis](#technology-stack-analysis)
4. [Database Schema & Design](#database-schema--design)
5. [Core Functionality](#core-functionality)
6. [Development Setup & Instructions](#development-setup--instructions)
7. [Code Management & Best Practices](#code-management--best-practices)
8. [API Integration & Services](#api-integration--services)
9. [Security Implementation](#security-implementation)
10. [Deployment Procedures](#deployment-procedures)
11. [Testing Strategy](#testing-strategy)
12. [Monitoring & Analytics](#monitoring--analytics)
13. [Troubleshooting Guide](#troubleshooting-guide)
14. [Maintenance Procedures](#maintenance-procedures)
15. [Future Enhancements](#future-enhancements)

---

## Executive Summary

The **Talk Link Chatbots Hub** is a comprehensive AI-powered chatbot platform that enables users to create, manage, and interact with custom AI assistants. The platform features a sophisticated knowledge base management system, document processing capabilities, and real-time chat functionality.

### Key Features:
- **Multi-tenant chatbot creation** with custom system prompts
- **Document processing** (PDF, DOCX) with AI-powered content extraction
- **Knowledge base management** with vector embeddings and semantic search
- **Real-time chat interface** with typewriter effects
- **User authentication** via Clerk
- **Analytics tracking** for usage monitoring
- **Responsive design** with modern UI components

### Business Value:
- Enables businesses to create custom AI assistants
- Reduces customer support workload through automated responses
- Provides scalable knowledge management solution
- Offers comprehensive analytics for performance optimization

---

## System Architecture Overview

### High-Level Architecture
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (React/TS)    │◄──►│   (Supabase)    │◄──►│   Services      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Clerk Auth    │    │   PostgreSQL    │    │   OpenRouter    │
│   (Identity)    │    │   (Database)    │    │   (AI Models)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Component Architecture
- **Frontend**: React 18 with TypeScript, Vite build system
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **State Management**: React Query for server state, React hooks for local state
- **Authentication**: Clerk for user management
- **Database**: Supabase (PostgreSQL) with vector extensions
- **AI Services**: OpenRouter API for LLM integration
- **File Storage**: Supabase Storage for document uploads
- **Edge Functions**: Supabase Edge Functions for PDF processing

---

## Technology Stack Analysis

### Frontend Technologies
```json
{
  "Core": {
    "React": "^18.3.1",
    "TypeScript": "^5.5.3",
    "Vite": "^5.4.1"
  },
  "UI/UX": {
    "shadcn/ui": "Latest",
    "Tailwind CSS": "^3.4.11",
    "Radix UI": "Multiple components",
    "Lucide React": "^0.462.0"
  },
  "State Management": {
    "React Query": "^5.56.2",
    "React Hook Form": "^7.53.0"
  },
  "Routing": {
    "React Router DOM": "^6.26.2"
  }
}
```

### Backend Technologies
```json
{
  "Database": {
    "Supabase": "^2.50.0",
    "PostgreSQL": "With vector extensions",
    "Row Level Security": "Enabled"
  },
  "Authentication": {
    "Clerk": "^5.32.0"
  },
  "AI Services": {
    "OpenRouter": "DeepSeek R1 model",
    "Vector Embeddings": "1536 dimensions"
  },
  "File Processing": {
    "PDF-lib": "^1.17.1",
    "Mammoth": "^1.9.1",
    "Docx": "^9.5.1"
  }
}
```

### Development Tools
```json
{
  "Build Tools": {
    "Vite": "Development server and build",
    "SWC": "Fast compilation"
  },
  "Code Quality": {
    "ESLint": "^9.9.0",
    "TypeScript": "Type checking",
    "Prettier": "Code formatting"
  },
  "Testing": {
    "Framework": "To be implemented",
    "Coverage": "To be implemented"
  }
}
```

---

## Database Schema & Design

### Core Tables

#### 1. Chatbots Table
```sql
CREATE TABLE public.chatbots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    system_prompt TEXT,
    clerk_user_id VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    settings JSONB DEFAULT '{}'::jsonb
);
```

#### 2. Documents Table
```sql
CREATE TABLE public.documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    title VARCHAR(500) NOT NULL,
    content TEXT,
    file_name VARCHAR(255),
    file_type VARCHAR(100),
    file_size BIGINT,
    file_url TEXT,
    status document_status DEFAULT 'processing',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 3. Knowledge Entries Table
```sql
CREATE TABLE public.knowledge_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    keywords TEXT[],
    source_document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### 4. Chat Sessions Table
```sql
CREATE TABLE public.chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    chatbot_id UUID REFERENCES public.chatbots(id) ON DELETE CASCADE,
    user_name VARCHAR(255),
    user_email VARCHAR(255),
    session_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);
```

#### 5. Messages Table
```sql
CREATE TABLE public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
    role message_role NOT NULL,
    content TEXT NOT NULL,
    response_source response_source,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Key Design Principles
- **Row Level Security (RLS)**: All tables have RLS enabled for data isolation
- **Vector Embeddings**: Knowledge entries use pgvector for semantic search
- **Cascade Deletes**: Proper referential integrity with cascade deletes
- **JSONB Metadata**: Flexible metadata storage for extensibility
- **Timestamps**: Automatic created_at and updated_at tracking

---

## Core Functionality

### 1. Chatbot Creation Workflow
```typescript
// Process Flow:
1. User authentication via Clerk
2. Basic chatbot information input
3. Knowledge base setup (manual entries)
4. Document upload and processing
5. Vector embedding generation
6. Chatbot activation
```

### 2. Document Processing Pipeline
```typescript
// Supported Formats:
- PDF: Edge function processing with text extraction
- DOCX: Client-side processing with Mammoth.js
- Text: Direct content processing

// Processing Steps:
1. File upload to Supabase Storage
2. Content extraction based on file type
3. Text chunking for vector embeddings
4. Knowledge base entry creation
5. Vector embedding generation
```

### 3. Chat Interface Features
```typescript
// Real-time Features:
- Typewriter effect for responses
- Message history persistence
- Session management
- User information collection
- Response source tracking
```

### 4. Knowledge Base Management
```typescript
// Capabilities:
- Manual Q&A entry creation
- Document-based knowledge extraction
- Semantic search with vector embeddings
- Keyword-based categorization
- Duplicate detection
- Bulk import/export functionality
```

---

## Development Setup & Instructions

### Prerequisites
```bash
# Required Software
- Node.js 18+ 
- npm or yarn
- Git
- Supabase CLI (optional)
- PostgreSQL (for local development)
```

### Initial Setup
```bash
# 1. Clone Repository
git clone <repository-url>
cd talk-link-chatbots-hub

# 2. Install Dependencies
npm install

# 3. Environment Configuration
cp .env.example .env.local
# Configure environment variables

# 4. Database Setup
# Run Supabase migrations
supabase db push

# 5. Start Development Server
npm run dev
```

### Environment Variables
```bash
# Required Environment Variables
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_key
VITE_OPENROUTER_API_KEY=your_openrouter_key

# Optional Variables
VITE_APP_ENV=development
VITE_APP_VERSION=1.0.0
```

### Development Commands
```bash
# Development
npm run dev          # Start development server
npm run build        # Build for production
npm run build:dev    # Build for development
npm run preview      # Preview production build
npm run lint         # Run ESLint

# Database
supabase db push     # Push migrations
supabase db reset    # Reset database
supabase functions deploy # Deploy edge functions
```

---

## Code Management & Best Practices

### Project Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── AuthGuard.tsx   # Authentication wrapper
│   └── ErrorBoundary.tsx # Error handling
├── pages/              # Route components
├── services/           # Business logic and API calls
├── hooks/              # Custom React hooks
├── types/              # TypeScript type definitions
├── lib/                # Utility functions
├── integrations/       # Third-party integrations
└── data/               # Static data and samples
```

### Coding Standards

#### TypeScript Guidelines
```typescript
// 1. Strict Type Definitions
interface Chatbot {
  id: string;
  name: string;
  description?: string;
  // ... other properties
}

// 2. Error Handling
export class SupabaseServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'SupabaseServiceError';
  }
}

// 3. Async/Await Pattern
async function createChatbot(data: ChatbotData): Promise<Chatbot> {
  try {
    const result = await supabase.from('chatbots').insert(data);
    return result.data;
  } catch (error) {
    throw new SupabaseServiceError('Failed to create chatbot', 'DATABASE_ERROR', error);
  }
}
```

#### React Best Practices
```typescript
// 1. Custom Hooks for Logic
const useChatbot = (id: string) => {
  return useQuery({
    queryKey: ['chatbot', id],
    queryFn: () => supabaseChatbotService.getChatbotById(id),
    enabled: !!id,
  });
};

// 2. Error Boundaries
<ErrorBoundary>
  <Suspense fallback={<LoadingSpinner />}>
    <Component />
  </Suspense>
</ErrorBoundary>

// 3. Form Handling
const { register, handleSubmit, formState: { errors } } = useForm<FormData>();
```

### Code Quality Tools
```json
{
  "ESLint": {
    "extends": ["@eslint/js", "typescript-eslint"],
    "plugins": ["react-hooks", "react-refresh"]
  },
  "Prettier": {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true
  },
  "TypeScript": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true
  }
}
```

---

## API Integration & Services

### Supabase Integration
```typescript
// Client Configuration
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Service Layer Pattern
export class SupabaseChatbotService {
  async createChatbot(data: ChatbotData): Promise<Chatbot> {
    const { data: chatbot, error } = await supabase
      .from('chatbots')
      .insert([data])
      .select()
      .single();
    
    if (error) throw new SupabaseServiceError('Failed to create chatbot', 'DATABASE_ERROR', error);
    return chatbot;
  }
}
```

### OpenRouter AI Integration
```typescript
// AI Response Generation
export const generateOpenRouterResponse = async (
  messages: OpenRouterMessage[],
  apiKey?: string
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1-0528:free',
      messages,
      temperature: 0.7,
      max_tokens: 1000,
    }),
  });
  
  const data = await response.json();
  return data.choices[0].message.content;
};
```

### Clerk Authentication
```typescript
// Authentication Setup
import { ClerkProvider } from '@clerk/clerk-react';

const App = () => (
  <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
    <Router>
      <AuthGuard>
        <Routes />
      </AuthGuard>
    </Router>
  </ClerkProvider>
);

// Protected Routes
const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const { isSignedIn, isLoaded } = useUser();
  
  if (!isLoaded) return <LoadingSpinner />;
  if (!isSignedIn) return <Navigate to="/auth" />;
  
  return <>{children}</>;
};
```

---

## Security Implementation

### Authentication & Authorization
```typescript
// Row Level Security (RLS) Policies
CREATE POLICY "Users can view their own chatbots" ON public.chatbots
    FOR SELECT USING (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');

CREATE POLICY "Users can create their own chatbots" ON public.chatbots
    FOR INSERT WITH CHECK (clerk_user_id = current_setting('request.jwt.claims', true)::json->>'sub');
```

### Data Protection
```typescript
// Input Validation
const validateChatbotData = (data: Partial<Chatbot>): void => {
  if (data.name && (typeof data.name !== 'string' || data.name.trim().length === 0)) {
    throw new SupabaseServiceError(
      'Chatbot name must be a non-empty string',
      'VALIDATION_ERROR'
    );
  }
};

// SQL Injection Prevention
// Using Supabase client prevents SQL injection through parameterized queries
```

### API Security
```typescript
// Rate Limiting (To be implemented)
// CORS Configuration
// API Key Management
// Request Validation
```

---

## Deployment Procedures

### Production Build
```bash
# 1. Build Application
npm run build

# 2. Environment Configuration
# Set production environment variables
VITE_APP_ENV=production
VITE_SUPABASE_URL=production_url
VITE_CLERK_PUBLISHABLE_KEY=production_key

# 3. Database Migration
supabase db push --db-url production_url

# 4. Deploy Edge Functions
supabase functions deploy process-pdf
```

### Deployment Platforms

#### Vercel Deployment
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Deploy
vercel --prod

# 3. Environment Variables
# Configure in Vercel dashboard
```

#### Netlify Deployment
```bash
# 1. Build Command
npm run build

# 2. Publish Directory
dist/

# 3. Environment Variables
# Configure in Netlify dashboard
```

### CI/CD Pipeline
```yaml
# GitHub Actions Example
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: npm run lint
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
```

---

## Testing Strategy

### Testing Framework Setup
```bash
# Install Testing Dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom vitest jsdom

# Configure Vitest
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
  },
});
```

### Test Categories

#### Unit Tests
```typescript
// Service Layer Tests
describe('SupabaseChatbotService', () => {
  it('should create chatbot successfully', async () => {
    const service = new SupabaseChatbotService();
    const result = await service.createChatbot(mockData);
    expect(result).toBeDefined();
  });
});
```

#### Component Tests
```typescript
// React Component Tests
import { render, screen } from '@testing-library/react';
import { CreateChatbot } from './CreateChatbot';

test('renders create chatbot form', () => {
  render(<CreateChatbot />);
  expect(screen.getByText('Create New Chatbot')).toBeInTheDocument();
});
```

#### Integration Tests
```typescript
// API Integration Tests
describe('Chatbot API', () => {
  it('should handle complete chatbot creation flow', async () => {
    // Test complete workflow
  });
});
```

### Test Coverage Goals
- **Unit Tests**: 80% coverage
- **Component Tests**: 70% coverage
- **Integration Tests**: 60% coverage
- **E2E Tests**: Critical user flows

---

## Monitoring & Analytics

### Application Monitoring
```typescript
// Error Tracking
import { ErrorBoundary } from '@/components/ErrorBoundary';

// Analytics Tracking
export const logAnalytics = async (data: AnalyticsData) => {
  await supabase.from('analytics').insert([{
    chatbot_id: data.chatbot_id,
    event_type: data.event_type,
    event_data: data.event_data,
  }]);
};
```

### Performance Monitoring
```typescript
// React Query DevTools
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Performance Metrics
- Page load times
- API response times
- User interaction metrics
- Error rates
```

### Database Monitoring
```sql
-- Query Performance
SELECT query, mean_time, calls 
FROM pg_stat_statements 
ORDER BY mean_time DESC;

-- Table Statistics
SELECT schemaname, tablename, n_tup_ins, n_tup_upd, n_tup_del
FROM pg_stat_user_tables;
```

---

## Troubleshooting Guide

### Common Issues

#### 1. Authentication Issues
```typescript
// Problem: Clerk authentication not working
// Solution: Check environment variables and Clerk configuration
console.log('Clerk Key:', import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
```

#### 2. Database Connection Issues
```typescript
// Problem: Supabase connection failing
// Solution: Verify URL and API keys
const { data, error } = await supabase.from('chatbots').select('*');
if (error) console.error('Database error:', error);
```

#### 3. File Upload Issues
```typescript
// Problem: Document upload failing
// Solution: Check storage bucket configuration
const { data, error } = await supabase.storage
  .from('documents')
  .upload('test.txt', file);
```

#### 4. AI Response Issues
```typescript
// Problem: OpenRouter API errors
// Solution: Check API key and rate limits
try {
  const response = await generateOpenRouterResponse(messages);
} catch (error) {
  console.error('AI API error:', error);
}
```

### Debug Procedures
```bash
# 1. Check Environment Variables
echo $VITE_SUPABASE_URL
echo $VITE_CLERK_PUBLISHABLE_KEY

# 2. Database Connection Test
supabase db ping

# 3. Edge Function Logs
supabase functions logs process-pdf

# 4. Browser Console
# Check for JavaScript errors and network requests
```

---

## Maintenance Procedures

### Regular Maintenance Tasks

#### Daily
- Monitor error logs and alerts
- Check system performance metrics
- Review user feedback and issues

#### Weekly
- Database performance optimization
- Security updates and patches
- Backup verification

#### Monthly
- Code dependency updates
- Performance analysis and optimization
- User analytics review

### Database Maintenance
```sql
-- Regular Maintenance Queries
-- Clean up old sessions
DELETE FROM chat_sessions 
WHERE created_at < NOW() - INTERVAL '30 days' 
AND is_active = false;

-- Optimize vector indexes
REINDEX INDEX CONCURRENTLY idx_knowledge_entries_embedding;

-- Update table statistics
ANALYZE chatbots;
ANALYZE knowledge_entries;
ANALYZE chat_sessions;
```

### Code Maintenance
```bash
# Dependency Updates
npm audit
npm update
npm outdated

# Code Quality
npm run lint
npm run type-check

# Performance Optimization
npm run build -- --analyze
```

---

## Future Enhancements

### Planned Features

#### 1. Advanced AI Capabilities
- Multi-modal AI support (image, audio)
- Custom model fine-tuning
- Advanced prompt engineering tools

#### 2. Enhanced Analytics
- Real-time dashboard
- Advanced reporting
- Predictive analytics

#### 3. Integration Capabilities
- Webhook support
- API rate limiting
- Third-party integrations (Slack, Discord, etc.)

#### 4. Performance Optimizations
- Caching strategies
- CDN integration
- Database query optimization

### Technical Roadmap

#### Phase 1 (Q1 2025)
- [ ] Implement comprehensive testing suite
- [ ] Add performance monitoring
- [ ] Enhance error handling

#### Phase 2 (Q2 2025)
- [ ] Multi-tenant architecture improvements
- [ ] Advanced analytics dashboard
- [ ] API rate limiting

#### Phase 3 (Q3 2025)
- [ ] Mobile application
- [ ] Advanced AI features
- [ ] Enterprise features

### Scalability Considerations
```typescript
// Horizontal Scaling
- Load balancer implementation
- Database read replicas
- CDN for static assets

// Vertical Scaling
- Database optimization
- Caching strategies
- Code splitting and lazy loading
```

---

## Conclusion

The **Talk Link Chatbots Hub** represents a sophisticated AI chatbot platform with robust architecture, comprehensive functionality, and strong security measures. The platform is well-positioned for scalability and future enhancements.

### Key Strengths:
- **Modern Technology Stack**: React 18, TypeScript, Supabase
- **Scalable Architecture**: Microservices-ready design
- **Security-First**: Row Level Security, authentication, validation
- **User-Friendly**: Intuitive UI with modern design patterns
- **Extensible**: Modular codebase with clear separation of concerns

### Recommendations:
1. **Implement comprehensive testing** to ensure code quality
2. **Add performance monitoring** for production optimization
3. **Enhance error handling** for better user experience
4. **Consider mobile application** for broader accessibility
5. **Implement advanced analytics** for business insights

This SOP provides a comprehensive guide for development, deployment, and maintenance of the AI Chatbot Platform, ensuring consistent quality and operational excellence.

---

**Document End** 