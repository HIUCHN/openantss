# OpenAnts Networking App

A professional networking app built with Expo and Supabase.

## Setup

1. **Environment Variables**: Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

2. **Install Dependencies**:
```bash
npm install
```

3. **Start Development Server**:
```bash
npm run dev
```

## Supabase Setup

To get your Supabase credentials:

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to Settings > API
3. Copy the "Project URL" and "anon public" key
4. Add them to your `.env` file

## Important Notes

- The app requires valid Supabase credentials to function
- Make sure to replace the placeholder values in `.env` with your actual Supabase project credentials
- The `.env` file should not be committed to version control (it's already in .gitignore)