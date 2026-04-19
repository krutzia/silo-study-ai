# Silo – Smart Study Planner

Silo Study AI is an AI-powered study platform designed to help students organize, learn, and optimize their study workflow in a focused and distraction-free environment.

The platform combines authentication, structured study spaces (silos), and intelligent assistance to create a personalized learning experience. Users can sign up, manage their study sessions, and interact with AI-driven tools to enhance productivity.

--------------------------------------------------

#Features

AI-Powered Study System
- Organize study content into structured “Silos” (topics/subjects)
- AI-assisted learning experience (extensible for summaries, notes, etc.)
- Focused and minimal UI to reduce distractions

---  

#Authentication
- Secure authentication using Supabase Auth
- Google Sign-In integration (OAuth 2.0)
- Email/password login support
- Auto user session handling

---

#User Experience
- Clean onboarding and authentication flow
- Smooth redirects after login/signup
- Responsive UI for desktop and mobile
- Dashboard-based navigation

---

#Modern UI
- Built with React + Vite + TypeScript
- Styled using Tailwind CSS
- Minimal, modern SaaS-style design
- Fast performance and smooth transitions

--------------------------------------------------


#Tech Stack

Frontend
- React 18
- TypeScript
- Vite
- React Router
- Tailwind CSS

Backend / Infrastructure
- Supabase
- Supabase Auth
- Supabase Database
- Supabase OAuth (Google Sign-In)

--------------------------------------------------

#Getting Started

Prerequisites
- Node.js (LTS recommended)
- npm
- A Supabase project

Environment Variables

You will need:

VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY

--------------------------------------------------

1. Clone and Install

git clone <YOUR_GIT_URL>
cd silo-study-ai
npm install

--------------------------------------------------

2. Configure Environment

Create a .env file in the project root and add:

VITE_SUPABASE_URL=<your-supabase-url>
VITE_SUPABASE_ANON_KEY=<your-anon-key>

--------------------------------------------------

3. Configure Supabase

Make sure your Supabase project has:
- Authentication enabled
- Google OAuth provider configured
- Redirect URLs set correctly
- Database ready for user data

--------------------------------------------------

4. Run the App Locally

npm run dev

Open the local URL shown in the terminal (usually http://localhost:5173)

--------------------------------------------------

5. Build for Production

npm run build

--------------------------------------------------

Project Structure

src/
  main.tsx
  App.tsx
  pages/
    Auth.tsx
    Dashboard.tsx
    NotFound.tsx
  components/
    Navbar.tsx
    ui/
  contexts/
    AuthContext.tsx
  integrations/
    supabase/
      client.ts
  lib/
    utils.ts

public/
  favicon.png

.env

--------------------------------------------------

#Highlights

- Secure authentication with Supabase
- Google OAuth integration
- Clean SaaS-style UI
- Scalable architecture for AI features
- Deployment-ready with Vercel

--------------------------------------------------

#Live Demo

https://silo-study-ai.vercel.app

--------------------------------------------------

#Author

Kashish
B.Tech Computer Science
JSS Academy of Technical Education, Noida

--------------------------------------------------

#Future Scope

- AI Notes Generator
- Smart Study Planner
- Lecture Summarizer
- Progress Tracking Dashboard
- Personalized Recommendations
