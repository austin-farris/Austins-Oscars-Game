# 🏆 Austin's Oscars Ballot 2026 - Full Edition

A comprehensive Oscar predictions app with ALL 23 categories!

## Features
- Full ballot with all 23 Oscar categories
- Live odds from Polymarket
- Real-time leaderboard updates
- Pick distribution breakdown by category group
- Admin controls to announce winners live

## Admin Password
Default: `oscar2026` (change in `src/App.jsx` line 7)

## Setup

### 1. Supabase (Database)
- Create a project at supabase.com
- Go to SQL Editor
- Run `supabase-setup.sql`
- Copy your URL and anon key from Settings > API

### 2. GitHub
- Create a new repo
- Upload all files from this folder

### 3. Vercel
- Import your GitHub repo
- Add environment variables:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- Deploy!

## Categories Included

**The Big 8**
- Best Picture, Director, Actor, Actress
- Supporting Actor, Supporting Actress
- Original Screenplay, Adapted Screenplay

**Technical Awards**
- Cinematography, Film Editing, Production Design
- Costume Design, Makeup & Hairstyling
- Original Score, Original Song, Sound, Visual Effects

**Features**
- Animated Feature, International Feature, Documentary Feature

**Shorts**
- Animated Short, Live Action Short, Documentary Short

## Oscar Night Workflow
1. Share URL with friends before the ceremony
2. Everyone submits their full ballot
3. Click "Fetch Live Odds" to get latest Polymarket odds
4. During the show: Admin clicks winners as they're announced
5. Leaderboard updates in real-time!
