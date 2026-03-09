// Fetches live odds from Polymarket for all Oscar categories
// and updates Supabase
// FIX: Scoped nominee matching per category to avoid cross-category ID collisions

import { createClient } from '@supabase/supabase-js';

// Each entry: { slug, nomineeMap }
// nomineeMap keys = lowercase search strings to match against the market question
// nomineeMap values = our nominee IDs from categories.js
const CATEGORIES = [
  {
    slug: 'oscars-2026-best-picture-winner',
    nominees: {
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
    },
  },
  {
    slug: 'oscars-2026-best-director-winner',
    nominees: {
      'paul thomas anderson': 'bd-1',
      'ryan coogler': 'bd-2',
      'chloé zhao': 'bd-3',
      'chloe zhao': 'bd-3',
      'josh safdie': 'bd-4',
      'joachim trier': 'bd-5',
    },
  },
  {
    slug: 'oscars-2026-best-actor-winner',
    nominees: {
      'timothée chalamet': 'ba-1',
      'timothee chalamet': 'ba-1',
      'chalamet': 'ba-1',
      'michael b. jordan': 'ba-2',
      'michael b jordan': 'ba-2',
      'leonardo dicaprio': 'ba-3',
      'ethan hawke': 'ba-4',
      'wagner moura': 'ba-5',
    },
  },
  {
    slug: 'oscars-2026-best-actress-winner',
    nominees: {
      'jessie buckley': 'bac-1',
      'rose byrne': 'bac-2',
      'renate reinsve': 'bac-3',
      'kate hudson': 'bac-4',
      'emma stone': 'bac-5',
    },
  },
  {
    slug: 'oscars-2026-best-supporting-actor-winner',
    nominees: {
      'sean penn': 'bsa-1',
      'stellan skarsgård': 'bsa-2',
      'stellan skarsgard': 'bsa-2',
      'delroy lindo': 'bsa-3',
      'benicio del toro': 'bsa-4',
      'jacob elordi': 'bsa-5',
    },
  },
  {
    slug: 'oscars-2026-best-supporting-actress-winner',
    nominees: {
      'amy madigan': 'bsac-1',
      'teyana taylor': 'bsac-2',
      'wunmi mosaku': 'bsac-3',
      'elle fanning': 'bsac-4',
      'inga ibsdotter lilleaas': 'bsac-5',
      'inga lilleaas': 'bsac-5',
    },
  },
  {
    slug: 'oscars-2026-best-original-screenplay-winner',
    nominees: {
      'sinners': 'bos-1',
      'marty supreme': 'bos-2',
      'sentimental value': 'bos-3',
      'it was just an accident': 'bos-4',
      'blue moon': 'bos-5',
    },
  },
  {
    slug: 'oscars-2026-best-adapted-screenplay-winner',
    nominees: {
      'one battle after another': 'bas-1',
      'hamnet': 'bas-2',
      'bugonia': 'bas-3',
      'frankenstein': 'bas-4',
      'train dreams': 'bas-5',
    },
  },
  {
    slug: 'oscars-2026-best-animated-feature-film-winner',
    nominees: {
      'kpop demon hunters': 'baf-1',
      'k-pop demon hunters': 'baf-1',
      'zootopia 2': 'baf-2',
      'zootopia': 'baf-2',
      'elio': 'baf-3',
      'little amélie': 'baf-4',
      'little amelie': 'baf-4',
      'arco': 'baf-5',
    },
  },
  {
    slug: 'oscars-2026-best-international-feature-film-winner',
    nominees: {
      'sentimental value': 'bif-1',
      'the secret agent': 'bif-2',
      'it was just an accident': 'bif-3',
      'sirat': 'bif-4',
      'the voice of hind rajab': 'bif-5',
      'hind rajab': 'bif-5',
    },
  },
  {
    slug: 'oscars-2026-best-documentary-feature-winner',
    nominees: {
      'the alabama solution': 'bdf-1',
      'come see me in the good light': 'bdf-2',
      'cutting through rocks': 'bdf-3',
      'mr. nobody against putin': 'bdf-4',
      'nobody against putin': 'bdf-4',
      'the perfect neighbor': 'bdf-5',
    },
  },
  {
    slug: 'oscars-2026-best-cinematography-winner',
    nominees: {
      'sinners': 'bc-1',
      'one battle after another': 'bc-2',
      'frankenstein': 'bc-3',
      'marty supreme': 'bc-4',
      'train dreams': 'bc-5',
    },
  },
  {
    slug: 'oscars-2026-best-film-editing-winner',
    nominees: {
      'one battle after another': 'bfe-1',
      'sinners': 'bfe-2',
      'marty supreme': 'bfe-3',
      'sentimental value': 'bfe-4',
      'f1': 'bfe-5',
    },
  },
  {
    slug: 'oscars-2026-best-production-design-winner',
    nominees: {
      'frankenstein': 'bpd-1',
      'hamnet': 'bpd-2',
      'one battle after another': 'bpd-3',
      'marty supreme': 'bpd-4',
      'sinners': 'bpd-5',
    },
  },
  {
    slug: 'oscars-2026-best-costume-design-winner',
    nominees: {
      'frankenstein': 'bcd-1',
      'sinners': 'bcd-2',
      'hamnet': 'bcd-3',
      'avatar: fire and ash': 'bcd-4',
      'avatar': 'bcd-4',
      'marty supreme': 'bcd-5',
    },
  },
  {
    slug: 'oscars-2026-best-makeup-and-hairstyling-winner',
    nominees: {
      'frankenstein': 'bmh-1',
      'kokuho': 'bmh-2',
      'sinners': 'bmh-3',
      'the smashing machine': 'bmh-4',
      'smashing machine': 'bmh-4',
      'the ugly stepsister': 'bmh-5',
      'ugly stepsister': 'bmh-5',
    },
  },
  {
    slug: 'oscars-2026-best-original-score-winner',
    nominees: {
      'sinners': 'bsc-1',
      'one battle after another': 'bsc-2',
      'hamnet': 'bsc-3',
      'frankenstein': 'bsc-4',
      'bugonia': 'bsc-5',
    },
  },
  {
    slug: 'oscars-2026-best-original-song-winner',
    nominees: {
      'golden': 'bsn-1',
      'kpop demon hunters': 'bsn-1',
      'i lied to you': 'bsn-2',
      'train dreams': 'bsn-3',
      'dear me': 'bsn-4',
      'sweet dreams of joy': 'bsn-5',
    },
  },
  {
    slug: 'oscars-2026-best-sound-winner',
    nominees: {
      'sinners': 'bsd-1',
      'one battle after another': 'bsd-2',
      'f1': 'bsd-3',
      'frankenstein': 'bsd-4',
      'sirat': 'bsd-5',
    },
  },
  {
    slug: 'oscars-2026-best-visual-effects-winner',
    nominees: {
      'avatar: fire and ash': 'bvfx-1',
      'avatar': 'bvfx-1',
      'f1': 'bvfx-2',
      'jurassic world rebirth': 'bvfx-3',
      'jurassic world': 'bvfx-3',
      'the lost bus': 'bvfx-4',
      'lost bus': 'bvfx-4',
      'sinners': 'bvfx-5',
    },
  },
  {
    slug: 'oscars-2026-best-casting-winner',
    nominees: {
      'sinners': 'bcast-1',
      'one battle after another': 'bcast-2',
      'hamnet': 'bcast-3',
      'marty supreme': 'bcast-4',
      'the secret agent': 'bcast-5',
    },
  },
];

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
    const errors = [];

    for (const category of CATEGORIES) {
      try {
        // No active=true filter - fetches regardless of market status
        const response = await fetch(
          `https://gamma-api.polymarket.com/events?slug=${category.slug}`
        );

        if (!response.ok) {
          errors.push(`HTTP ${response.status} for ${category.slug}`);
          continue;
        }

        const events = await response.json();
        if (!events || events.length === 0) {
          errors.push(`No events returned for ${category.slug}`);
          continue;
        }

        const event = events[0];
        const markets = event.markets || [];

        for (const market of markets) {
          // outcomePrices is a JSON-encoded string - must parse it
          let outcomes, prices;
          try {
            outcomes = JSON.parse(market.outcomes || '[]');
            prices = JSON.parse(market.outcomePrices || '[]');
          } catch {
            // Fall back to bestBid if outcomePrices is missing/malformed
            if (market.bestBid !== undefined) {
              prices = [market.bestBid, 1 - market.bestBid];
              outcomes = ['Yes', 'No'];
            } else {
              continue;
            }
          }

          const yesIndex = outcomes.findIndex(o =>
            typeof o === 'string' && o.toLowerCase() === 'yes'
          );
          if (yesIndex === -1 || !prices[yesIndex]) continue;

          const probability = parseFloat(prices[yesIndex]);
          if (isNaN(probability) || probability <= 0) continue;

          // Match nominee using THIS category's map only (scoped - fixes cross-category collisions)
          const question = (market.question || '').toLowerCase();
          for (const [searchTerm, nomineeId] of Object.entries(category.nominees)) {
            if (question.includes(searchTerm)) {
              updates.push({ nominee_id: nomineeId, odds: probability });
              break;
            }
          }
        }
      } catch (err) {
        errors.push(`Error fetching ${category.slug}: ${err.message}`);
      }
    }

    // Write to Supabase
    let totalUpdated = 0;
    for (const update of updates) {
      const { error } = await supabase
        .from('odds')
        .upsert(update, { onConflict: 'nominee_id' });
      if (!error) totalUpdated++;
    }

    return res.status(200).json({
      success: true,
      message: `Updated ${totalUpdated} of ${updates.length} odds from Polymarket`,
      timestamp: new Date().toISOString(),
      errors: errors.length > 0 ? errors : undefined,
    });

  } catch (error) {
    console.error('Error:', error);
    return res.status(500).json({ error: error.message });
  }
}
