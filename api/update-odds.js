// Fetches live odds from Polymarket for ALL Oscar categories
// and updates Supabase

import { createClient } from '@supabase/supabase-js';

// Category slugs on Polymarket (they follow this pattern)
const POLYMARKET_SLUGS = [
  'oscars-2026-best-picture-winner',
  'oscars-2026-best-director-winner',
  'oscars-2026-best-actor-winner',
  'oscars-2026-best-actress-winner',
  'oscars-2026-best-supporting-actor-winner',
  'oscars-2026-best-supporting-actress-winner',
  'oscars-2026-best-original-screenplay-winner',
  'oscars-2026-best-adapted-screenplay-winner',
  'oscars-2026-best-animated-feature-film-winner',
  'oscars-2026-best-international-feature-film-winner',
  'oscars-2026-best-documentary-feature-winner',
  'oscars-2026-best-cinematography-winner',
  'oscars-2026-best-film-editing-winner',
  'oscars-2026-best-production-design-winner',
  'oscars-2026-best-costume-design-winner',
  'oscars-2026-best-makeup-and-hairstyling-winner',
  'oscars-2026-best-original-score-winner',
  'oscars-2026-best-original-song-winner',
  'oscars-2026-best-sound-winner',
  'oscars-2026-best-visual-effects-winner',
  'oscars-2026-best-animated-short-film-winner',
  'oscars-2026-best-live-action-short-film-winner',
  'oscars-2026-best-documentary-short-film-winner',
];

// Map category slug to our category ID
const SLUG_TO_CATEGORY = {
  'oscars-2026-best-picture-winner': 'best-picture',
  'oscars-2026-best-director-winner': 'best-director',
  'oscars-2026-best-actor-winner': 'best-actor',
  'oscars-2026-best-actress-winner': 'best-actress',
  'oscars-2026-best-supporting-actor-winner': 'best-supporting-actor',
  'oscars-2026-best-supporting-actress-winner': 'best-supporting-actress',
  'oscars-2026-best-original-screenplay-winner': 'best-original-screenplay',
  'oscars-2026-best-adapted-screenplay-winner': 'best-adapted-screenplay',
  'oscars-2026-best-animated-feature-film-winner': 'best-animated-feature',
  'oscars-2026-best-international-feature-film-winner': 'best-international-feature',
  'oscars-2026-best-documentary-feature-winner': 'best-documentary-feature',
  'oscars-2026-best-cinematography-winner': 'best-cinematography',
  'oscars-2026-best-film-editing-winner': 'best-film-editing',
  'oscars-2026-best-production-design-winner': 'best-production-design',
  'oscars-2026-best-costume-design-winner': 'best-costume-design',
  'oscars-2026-best-makeup-and-hairstyling-winner': 'best-makeup-hairstyling',
  'oscars-2026-best-original-score-winner': 'best-original-score',
  'oscars-2026-best-original-song-winner': 'best-original-song',
  'oscars-2026-best-sound-winner': 'best-sound',
  'oscars-2026-best-visual-effects-winner': 'best-visual-effects',
  'oscars-2026-best-animated-short-film-winner': 'best-animated-short',
  'oscars-2026-best-live-action-short-film-winner': 'best-live-action-short',
  'oscars-2026-best-documentary-short-film-winner': 'best-documentary-short',
};

// Mapping of names/films to our nominee IDs (partial match)
// This is a simplified mapping - the full version would need to be more comprehensive
const NOMINEE_MAPPINGS = {
  // Best Picture
  'one battle after another': 'bp-1',
  'sinners': 'bp-2',
  'hamnet': 'bp-3',
  'marty supreme': 'bp-4',
  'sentimental value': 'bp-5',
  'frankenstein': 'bp-6',
  'the secret agent': 'bp-7',
  'bugonia': 'bp-8',
  'f1': 'bp-9',
  'train dreams': 'bp-10',
  
  // Best Director
  'paul thomas anderson': 'bd-1',
  'ryan coogler': 'bd-2',
  'chloé zhao': 'bd-3',
  'chloe zhao': 'bd-3',
  'josh safdie': 'bd-4',
  'joachim trier': 'bd-5',
  
  // Best Actor
  'timothée chalamet': 'ba-1',
  'timothee chalamet': 'ba-1',
  'leonardo dicaprio': 'ba-2',
  'michael b. jordan': 'ba-3',
  'michael b jordan': 'ba-3',
  'wagner moura': 'ba-4',
  'ethan hawke': 'ba-5',
  
  // Best Actress (actual nominees)
  'jessie buckley': 'bac-1',
  'rose byrne': 'bac-2',
  'renate reinsve': 'bac-3',
  'kate hudson': 'bac-4',
  'emma stone': 'bac-5',
  
  // Best Supporting Actor (actual nominees - note corrected order/IDs)
  'sean penn': 'bsa-1',
  'stellan skarsgård': 'bsa-2',
  'stellan skarsgard': 'bsa-2',
  'delroy lindo': 'bsa-3',
  'benicio del toro': 'bsa-4',
  'jacob elordi': 'bsa-5',
  
  // Best Supporting Actress (actual nominees - Cynthia Erivo & Ariana Grande NOT nominated)
  'amy madigan': 'bsac-1',
  'teyana taylor': 'bsac-2',
  'wunmi mosaku': 'bsac-3',
  'elle fanning': 'bsac-4',
  'inga ibsdotter lilleaas': 'bsac-5',
  'inga lilleaas': 'bsac-5',
  
  // Best Animated Feature (actual nominees)
  'kpop demon hunters': 'baf-1',
  'k-pop demon hunters': 'baf-1',
  'zootopia 2': 'baf-2',
  'zootopia': 'baf-2',
  'elio': 'baf-3',
  'little amélie': 'baf-4',
  'little amelie': 'baf-4',
  'arco': 'baf-5',
  
  // Best International
  'sentimental value': 'bif-1',
  'the secret agent': 'bif-2',
  'ugly stepsister': 'bif-3',
  'kokuho': 'bif-4',
  'waves': 'bif-5',
  
  // Best Visual Effects (actual nominees)
  'frankenstein': 'bvfx-1',
  'sinners': 'bvfx-2',
  'f1': 'bvfx-3',
  'one battle after another': 'bp-1', // also maps to best picture above
  'hamnet': 'bp-3', // also maps above
  
  // Best Original Song (actual nominees)
  'i lied to you': 'bsn-1',
  'golden': 'bsn-2',
  'train dreams': 'bsn-3',
  'dear me': 'bsn-4',
  'sweet dreams of joy': 'bsn-5',
};

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.VITE_SUPABASE_ANON_KEY
    );

    const updates = [];
    let totalUpdated = 0;

    // Fetch each category from Polymarket
    for (const slug of POLYMARKET_SLUGS) {
      try {
        const response = await fetch(
          `https://gamma-api.polymarket.com/events?slug=${slug}`
        );
        
        if (!response.ok) continue;
        
        const events = await response.json();
        if (!events || events.length === 0) continue;

        const event = events[0];
        const markets = event.markets || [];

        for (const market of markets) {
          const outcomes = JSON.parse(market.outcomes || '[]');
          const prices = JSON.parse(market.outcomePrices || '[]');
          
          const yesIndex = outcomes.findIndex(o => o.toLowerCase() === 'yes');
          if (yesIndex === -1) continue;
          
          const probability = parseFloat(prices[yesIndex]);
          if (isNaN(probability)) continue;

          // Try to match the market question to our nominees
          const question = (market.question || '').toLowerCase();
          
          for (const [searchTerm, nomineeId] of Object.entries(NOMINEE_MAPPINGS)) {
            if (question.includes(searchTerm)) {
              updates.push({ nominee_id: nomineeId, odds: probability });
              break;
            }
          }
        }
      } catch (err) {
        console.error(`Error fetching ${slug}:`, err);
      }
    }

    // Update Supabase
    for (const update of updates) {
      const { error } = await supabase
        .from('odds')
        .upsert(update, { onConflict: 'nominee_id' });
      
      if (!error) totalUpdated++;
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${totalUpdated} odds from Polymarket`,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
