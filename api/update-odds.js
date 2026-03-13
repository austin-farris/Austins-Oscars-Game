// Fetches live odds from Polymarket for all 24 Oscar categories
// Strategy: query /events?slug= for each category, then scan all child markets
// and match nominees by substring search against question text.
// Scoped per-category to prevent cross-category ID collisions.
//
// Updated: March 12, 2026 — nominee IDs matched to categories.js

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
      'chlo': 'bd-3',
      'josh safdie': 'bd-4',
      'joachim trier': 'bd-5',
    },
  },
  {
    slug: 'oscars-2026-best-actor-winner',
    nominees: {
      'michael b': 'ba-1',
      'jordan': 'ba-1',
      'timothe': 'ba-2',
      'chalamet': 'ba-2',
      'leonardo dicaprio': 'ba-3',
      'dicaprio': 'ba-3',
      'wagner moura': 'ba-4',
      'ethan hawke': 'ba-5',
    },
  },
  {
    slug: 'oscars-2026-best-actress-winner',
    nominees: {
      'jessie buckley': 'bac-1',
      'buckley': 'bac-1',
      'rose byrne': 'bac-2',
      'emma stone': 'bac-3',
      'renate reinsve': 'bac-4',
      'kate hudson': 'bac-5',
    },
  },
  {
    slug: 'oscars-2026-best-supporting-actor-winner',
    nominees: {
      'sean penn': 'bsa-1',
      'stellan': 'bsa-2',
      'skarsg': 'bsa-2',
      'benicio': 'bsa-3',
      'del toro': 'bsa-3',
      'jacob elordi': 'bsa-4',
      'delroy lindo': 'bsa-5',
    },
  },
  {
    slug: 'oscars-2026-best-supporting-actress-winner',
    nominees: {
      'amy madigan': 'bsac-1',
      'teyana taylor': 'bsac-2',
      'elle fanning': 'bsac-3',
      'inga': 'bsac-4',
      'lilleaas': 'bsac-4',
      'wunmi mosaku': 'bsac-5',
      'mosaku': 'bsac-5',
    },
  },
  {
    slug: 'oscars-2026-best-original-screenplay-winner',
    nominees: {
      'sinners': 'bos-1',
      'sentimental value': 'bos-2',
      'marty supreme': 'bos-3',
      'it was just an accident': 'bos-4',
      'accident': 'bos-4',
      'blue moon': 'bos-5',
    },
  },
  {
    slug: 'oscars-2026-best-adapted-screenplay-winner',
    nominees: {
      'one battle after another': 'bas-1',
      'hamnet': 'bas-2',
      'frankenstein': 'bas-3',
      'bugonia': 'bas-4',
      'train dreams': 'bas-5',
    },
  },
  // ===== TECHNICAL =====
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
    slug: 'oscars-2026-best-cinematography-winner',
    nominees: {
      'one battle after another': 'bc-1',
      'sinners': 'bc-2',
      'frankenstein': 'bc-3',
      'marty supreme': 'bc-4',
      'hamnet': 'bc-5',
    },
  },
  {
    slug: 'oscars-2026-best-film-editing-winner',
    nominees: {
      'one battle after another': 'bfe-1',
      'sinners': 'bfe-2',
      'marty supreme': 'bfe-3',
      'f1': 'bfe-4',
      'sentimental value': 'bfe-5',
    },
  },
  {
    slug: 'oscars-2026-best-production-design-winner',
    nominees: {
      'frankenstein': 'bpd-1',
      'sinners': 'bpd-2',
      'one battle after another': 'bpd-3',
      'hamnet': 'bpd-4',
      'marty supreme': 'bpd-5',
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
      'sinners': 'bmh-2',
      'ugly stepsister': 'bmh-3',
      'one battle after another': 'bmh-4',
      'kokuho': 'bmh-5',
    },
  },
  {
    slug: 'oscars-2026-best-original-score-winner',
    nominees: {
      'sinners': 'bsc-1',
      'one battle after another': 'bsc-2',
      'frankenstein': 'bsc-3',
      'hamnet': 'bsc-4',
      'bugonia': 'bsc-5',
    },
  },
  {
    // Note: this event slug has a numeric suffix -257 on Polymarket
    slug: 'oscars-2026-best-original-song-winner-257',
    nominees: {
      'golden': 'bsn-1',
      'i lied to you': 'bsn-2',
      'mi camino': 'bsn-3',
      'kiss the sky': 'bsn-4',
      'never too late': 'bsn-5',
    },
  },
  {
    slug: 'oscars-2026-best-sound-winner',
    nominees: {
      'sinners': 'bsd-1',
      'f1': 'bsd-2',
      'one battle after another': 'bsd-3',
      'frankenstein': 'bsd-4',
      'mission': 'bsd-5',
    },
  },
  {
    slug: 'oscars-2026-best-visual-effects-winner',
    nominees: {
      'avatar': 'bvfx-1',
      'frankenstein': 'bvfx-2',
      'superman': 'bvfx-3',
      'wicked': 'bvfx-4',
      'mission': 'bvfx-5',
    },
  },
  // ===== FEATURES =====
  {
    slug: 'oscars-2026-best-animated-feature-film-winner',
    nominees: {
      'kpop demon hunters': 'baf-1',
      'k-pop demon hunters': 'baf-1',
      'demon hunters': 'baf-1',
      'elio': 'baf-2',
      'legend of ochi': 'baf-3',
      'last airbender': 'baf-4',
      'sandman': 'baf-5',
    },
  },
  {
    slug: 'oscars-2026-best-international-feature-film-winner',
    nominees: {
      'sentimental value': 'bif-1',
      'the secret agent': 'bif-2',
      'ugly stepsister': 'bif-3',
      'kokuho': 'bif-4',
      'waves': 'bif-5',
    },
  },
  {
    slug: 'oscars-2026-best-documentary-feature-film-winner',
    nominees: {
      'searching for amani': 'bdf-1',
      'amani': 'bdf-1',
      'nobody against putin': 'bdf-2',
      'mr. nobody': 'bdf-2',
      'battle for laikipia': 'bdf-3',
      'laikipia': 'bdf-3',
      'eno': 'bdf-4',
      'soundtrack to a coup': 'bdf-5',
      'coup d\'etat': 'bdf-5',
    },
  },
  // ===== SHORTS =====
  {
    slug: 'oscars-2026-best-animated-short-film-winner',
    nominees: {
      'butterfly': 'bash-1',
      'cried pearls': 'bash-2',
      'girl who cried': 'bash-2',
      'shadow of the cypress': 'bash-3',
      'cypress': 'bash-3',
      'bear named wojtek': 'bash-4',
      'wojtek': 'bash-4',
      'yuck': 'bash-5',
    },
  },
  {
    slug: 'oscars-2026-best-live-action-short-film-winner',
    nominees: {
      'two people': 'blas-1',
      'exchanging saliva': 'blas-1',
      'friend of dorothy': 'blas-2',
      'dorothy': 'blas-2',
      'singers': 'blas-3',
      'anuja': 'blas-4',
      'not a robot': 'blas-5',
      'i\'m not a robot': 'blas-5',
    },
  },
  {
    slug: 'oscars-2026-best-documentary-short-film-winner-513',
    nominees: {
      'instruments': 'bds-1',
      'beating heart': 'bds-1',
      'only girl': 'bds-2',
      'orchestra': 'bds-2',
      'death by numbers': 'bds-3',
      'i am ready': 'bds-4',
      'warden': 'bds-4',
      'incident': 'bds-5',
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
  const matched = [];
  const unmatched = [];
  const errors = [];
  const log = [];

  for (const category of CATEGORIES) {
    try {
      // Fetch without active filter — some events may not have active=true
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
        let didMatch = false;
        for (const [keyword, nomineeId] of Object.entries(category.nominees)) {
          if (question.includes(keyword.toLowerCase())) {
            // Avoid duplicate updates — only keep highest prob for each nominee
            const existing = updates.find(u => u.nominee_id === nomineeId);
            if (!existing || prob > existing.odds) {
              if (existing) {
                updates.splice(updates.indexOf(existing), 1);
              }
              updates.push({ nominee_id: nomineeId, odds: prob });
              matched.push(`${nomineeId}: "${keyword}" in "${question}" = ${prob}`);
            }
            didMatch = true;
            break;
          }
        }
        if (!didMatch && prob > 0.005) {
          unmatched.push(`${category.slug}: "${question}" (${prob}) — no keyword match`);
        }
      }
    } catch (err) {
      errors.push(`${category.slug}: ${err.message}`);
    }
  }

  // Upsert to Supabase odds table
  let saved = 0;
  let upsertErrors = [];
  for (const update of updates) {
    const { error } = await supabase
      .from('odds')
      .upsert(update, { onConflict: 'nominee_id' });
    if (!error) {
      saved++;
    } else {
      upsertErrors.push(`${update.nominee_id}: ${error.message}`);
    }
  }

  return res.status(200).json({
    success: true,
    message: `Saved ${saved} / ${updates.length} odds across ${CATEGORIES.length} categories`,
    categories_fetched: log,
    matched_count: matched.length,
    unmatched: unmatched.length ? unmatched : undefined,
    upsert_errors: upsertErrors.length ? upsertErrors : undefined,
    fetch_errors: errors.length ? errors : undefined,
    timestamp: new Date().toISOString(),
  });
}
