# IntelyRecruit

IntelyRecruit is a React 19 + Vite + TypeScript recruitment platform powered by Supabase and Gemini AI.

## Database and Backend Architecture

The application has been migrated from Firebase + Express to a serverless architecture using:
1. **Supabase Postgres**: Database with Row Level Security (RLS) policies.
2. **Supabase Auth**: Email/password authentication system.
3. **Supabase Edge Functions**: Deno functions acting as server-side API handlers to securely contact the Gemini API.

---

## Setup Steps

### 1. Setup Supabase Project
1. Create a new project on [Supabase](https://supabase.com/).
2. Run the initialization database migration script located in the artifacts directory (`schema.sql`) in your Supabase project's SQL Editor to set up all tables, triggers, RLS policies, realtime publications, and seed the default admin account.

### 2. Configure Edge Functions & Secrets
1. Set up the Supabase CLI:
   `npm install -g supabase`
2. Log in and link your project:
   `supabase login`
   `supabase link --project-ref <your-project-ref>`
3. Set your Gemini API key as a Supabase secret:
   `supabase secrets set GEMINI_API_KEY=your_gemini_api_key_here`
4. Deploy the edge functions:
   `supabase functions deploy`

### 3. Local Environment Configuration
1. Create a `.env.local` file from `.env.example`:
   ```bash
   VITE_SUPABASE_URL="https://your-project.supabase.co"
   VITE_SUPABASE_ANON_KEY="your-anon-key-here"
   ```

### 4. Run the Client Application
1. Install dependencies:
   `npm install`
2. Start the local Vite development server:
   `npm run dev`
