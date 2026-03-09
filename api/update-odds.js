// Fetches live odds from Polymarket for all 24 Oscar categories
// Strategy: query /events?slug= for each category, then scan all child markets
// and match nominees by substring search against question text.
// Scoped per-category to prevent cross-category ID collisions.

import { createClient } from '@supabase/supabase-js';

// Map of event slugs -> nominee keyword maps
// Keywords are lowercase substrings to match against market.question
// Values are our nominee_ids from categories.js
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
      'chlo': 'bd-3',         // Chloé Zhao - accent may vary in slug
      'josh safdie': 'bd-4',
      'joachim trier': 'bd-5',
    },
  },
  {
    slug: 'oscars-2026-best-actor-winner',
    nominees: {
      'timothe': 'ba-1',       // Timothée - accent stripped in slugs
      'michael b': 'ba-2',
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
      'stellan skarsг': 'bsa-2',   // catch skarsgård / skarsgrd variants
      'skarsg': 'bsa-2',
      'delroy lindo': 'bsa-3',
      'benicio del toro': 'bsa-4',
      'jacob elordi': 'bsa-5',
    },
  },
  {
    slug: 'oscars-2026-best-supporting-actress-winner',
    nominees: {
      'teyana taylor': 'bsac-1',
      'amy madigan': 'bsac-2',
      'wunmi mosaku': 'bsac-3',
      'elle fanning': 'bsac-4',
      'inga': 'bsac-5',
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
      'zootopia': 'baf-2',
      'elio': 'baf-3',
      'am': 'baf-4',           // little amélie / amlie
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
      'hind rajab': 'bif-5',
    },
  },
  {
    slug: 'oscars-2026-best-documentary-feature-film-winner',
    nominees: {
      'alabama solution': 'bdf-1',
      'come see me': 'bdf-2',
      'cutting through rocks': 'bdf-3',
      'mr. nobody': 'bdf-4',
      'nobody against putin': 'bdf-4',
      'perfect neighbor': 'bdf-5',
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
      'smashing machine': 'bmh-4',
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
    // Note: this event slug has a numeric suffix -257 on Polymarket
    slug: 'oscars-2026-best-original-song-winner-257',
    nominees: {
      'golden': 'bsn-1',
      'i lied to you': 'bsn-2',
      'train dreams': 'bsn-3',
      'dear me': 'bsn-4',
      'sweet dreams': 'bsn-5',
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
      'avatar': 'bvfx-1',
      'f1': 'bvfx-2',
      'jurassic world': 'bvfx-3',
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
  {
    slug: 'oscars-2026-best-live-action-short-film-winner',
    nominees: {
      "butcher": 'blas-1',
      "friend of dorothy": 'blas-2',
      "jane austen": 'blas-3',
      "singers": 'blas-4',
      "two people": 'blas-5',
    },
  },
  {
    slug: 'oscars-2026-best-documentary-short-film-winner-513',
    nominees: {
      'empty rooms': 'bds-1',
      'armed only': 'bds-2',
      'children no more': 'bds-3',
      'devil is busy': 'bds-4',
      'strangeness': 'bds-5',
    },
  },
  {
    slug: 'oscars-2026-best-animated-short-film-winner',
    nominees: {
      'butterfly': 'bas2-1',
      'forevergreen': 'bas2-2',
      'cried pearls': 'bas2-3',
      'retirement plan': 'bas2-4',
      'three sisters': 'bas2-5',
    },
  },
];

// Parse outcomePrices safely - Polymarket returns it as a JSON-encoded string
function parsePrices(market) {
  try {
    const outcomes = JSON.parse(market.outcomes || '[]');
    const prices = JSON.parse(market.outcomePrices || '[]');
    const yesIdx = outcomes.findIndex(o => String(o).toLowerCase() === 'yes');
    if (yesIdx !== -1 && prices[yesIdx] !== undefined) {
      return parseFloat(prices[yesIdx]);
    }
  } catch {}
  // Fallback to bestBid
  if (market.bestBid !== undefined) return parseFloat(market.bestBid);
  return null;
}

export default async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_ANON_KEY
  );

  const updates = [];
  const errors = [];
  const log = [];

  for (const category of CATEGORIES) {
    try {
      const url = `https://gamma-api.polymarket.com/events?slug=${category.slug}`;
      const response = await fetch(url);
      if (!response.ok) {
        errors.push(`HTTP ${response.status} for ${category.slug}`);
        continue;
      }

      const events = await response.json();
      if (!events?.length) {
        errors.push(`No event found: ${category.slug}`);
        continue;
      }

      const markets = events[0].markets || [];
      log.push(`${category.slug}: ${markets.length} markets`);

      for (const market of markets) {
        const question = (market.question || '').toLowerCase();
        const prob = parsePrices(market);
        if (prob === null || prob <= 0 || prob > 1) continue;

        // Match against this category's nominees only (scoped)
        for (const [keyword, nomineeId] of Object.entries(category.nominees)) {
          if (question.includes(keyword.toLowerCase())) {
            updates.push({ nominee_id: nomineeId, odds: prob });
            break;
          }
        }
      }
    } catch (err) {
      errors.push(`${category.slug}: ${err.message}`);
    }
  }

  // Upsert to Supabase
  let saved = 0;
  for (const update of updates) {
    const { error } = await supabase
      .from('odds')
      .upsert(update, { onConflict: 'nominee_id' });
    if (!error) saved++;
    else errors.push(`Supabase upsert failed for ${update.nominee_id}: ${error.message}`);
  }

  return res.status(200).json({
    success: true,
    message: `Saved ${saved} / ${updates.length} odds`,
    categories_fetched: log,
    errors: errors.length ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
