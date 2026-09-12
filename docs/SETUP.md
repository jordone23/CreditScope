# Setup

## Prerequisites

- Node.js 20 or later
- npm

## Install and run

```bash
npm install
npm run dev
```

Vite prints the local URL after it starts.

## Quality checks

```bash
npm run test
npm run lint
npm run build
npm run format:check
```

## Optional Supabase integration

The core calculator needs no backend. Authentication and saved analyses become available only when the following variables are present in a local `.env` file:

```dotenv
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

Start from the tracked template:

```bash
cp .env.example .env
```

`VITE_SUPABASE_ANON_KEY` is also supported for compatibility. Never commit a `.env` file or a secret key. The repository ignores local environment files.

When those variables are absent, the application hides the account and saved-analysis features while retaining the calculator.
