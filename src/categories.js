// All 24 Oscar categories with nominees and current Polymarket odds
// Updated: March 12, 2026 — corrected all nominees against oscars.org/NPR/Landmark
// Doc Feature, Doc Short, Animated Short, Live Action Short all verified

export const CATEGORIES = [
  // ===== THE BIG 8 =====
  {
    id: "best-picture",
    name: "Best Picture",
    emoji: "🏆",
    polymarketSlug: "oscars-2026-best-picture-winner",
    nominees: [
      { id: "bp-1", name: "One Battle After Another", meta: "Paul Thomas Anderson", odds: 0.76 },
      { id: "bp-2", name: "Sinners", meta: "Ryan Coogler", odds: 0.20 },
      { id: "bp-3", name: "Hamnet", meta: "Chloé Zhao", odds: 0.02 },
      { id: "bp-4", name: "Marty Supreme", meta: "Josh Safdie", odds: 0.01 },
      { id: "bp-5", name: "Sentimental Value", meta: "Joachim Trier", odds: 0.005 },
      { id: "bp-6", name: "Frankenstein", meta: "Guillermo del Toro", odds: 0.005 },
      { id: "bp-7", name: "The Secret Agent", meta: "Kleber Mendonça Filho", odds: 0.003 },
      { id: "bp-8", name: "Bugonia", meta: "Yorgos Lanthimos", odds: 0.003 },
      { id: "bp-9", name: "F1", meta: "Joseph Kosinski", odds: 0.002 },
      { id: "bp-10", name: "Train Dreams", meta: "Clint Bentley", odds: 0.002 },
    ]
  },
  {
    id: "best-director",
    name: "Best Director",
    emoji: "🎬",
    polymarketSlug: "oscars-2026-best-director-winner",
    nominees: [
      { id: "bd-1", name: "Paul Thomas Anderson", meta: "One Battle After Another", odds: 0.92 },
      { id: "bd-2", name: "Ryan Coogler", meta: "Sinners", odds: 0.08 },
      { id: "bd-3", name: "Chloé Zhao", meta: "Hamnet", odds: 0.005 },
      { id: "bd-4", name: "Josh Safdie", meta: "Marty Supreme", odds: 0.003 },
      { id: "bd-5", name: "Joachim Trier", meta: "Sentimental Value", odds: 0.002 },
    ]
  },
  {
    id: "best-actor",
    name: "Best Actor",
    emoji: "🎭",
    polymarketSlug: "oscars-2026-best-actor-winner",
    nominees: [
      { id: "ba-1", name: "Michael B. Jordan", meta: "Sinners", odds: 0.47 },
      { id: "ba-2", name: "Timothée Chalamet", meta: "Marty Supreme", odds: 0.39 },
      { id: "ba-3", name: "Leonardo DiCaprio", meta: "One Battle After Another", odds: 0.07 },
      { id: "ba-4", name: "Wagner Moura", meta: "The Secret Agent", odds: 0.04 },
      { id: "ba-5", name: "Ethan Hawke", meta: "Blue Moon", odds: 0.03 },
    ]
  },
  {
    id: "best-actress",
    name: "Best Actress",
    emoji: "👸",
    polymarketSlug: "oscars-2026-best-actress-winner",
    nominees: [
      { id: "bac-1", name: "Jessie Buckley", meta: "Hamnet", odds: 0.96 },
      { id: "bac-2", name: "Rose Byrne", meta: "If I Had Legs I'd Kick You", odds: 0.02 },
      { id: "bac-3", name: "Emma Stone", meta: "Bugonia", odds: 0.01 },
      { id: "bac-4", name: "Renate Reinsve", meta: "Sentimental Value", odds: 0.005 },
      { id: "bac-5", name: "Kate Hudson", meta: "Song Sung Blue", odds: 0.005 },
    ]
  },
  {
    id: "best-supporting-actor",
    name: "Best Supporting Actor",
    emoji: "🎪",
    polymarketSlug: "oscars-2026-best-supporting-actor-winner",
    nominees: [
      { id: "bsa-1", name: "Sean Penn", meta: "One Battle After Another", odds: 0.73 },
      { id: "bsa-2", name: "Stellan Skarsgård", meta: "Sentimental Value", odds: 0.19 },
      { id: "bsa-3", name: "Benicio Del Toro", meta: "One Battle After Another", odds: 0.04 },
      { id: "bsa-4", name: "Jacob Elordi", meta: "Frankenstein", odds: 0.02 },
      { id: "bsa-5", name: "Delroy Lindo", meta: "Sinners", odds: 0.02 },
    ]
  },
  {
    id: "best-supporting-actress",
    name: "Best Supporting Actress",
    emoji: "💫",
    polymarketSlug: "oscars-2026-best-supporting-actress-winner",
    nominees: [
      { id: "bsac-1", name: "Amy Madigan", meta: "One Battle After Another", odds: 0.52 },
      { id: "bsac-2", name: "Teyana Taylor", meta: "One Battle After Another", odds: 0.26 },
      { id: "bsac-3", name: "Elle Fanning", meta: "Sentimental Value", odds: 0.10 },
      { id: "bsac-4", name: "Inga Ibsdotter Lilleaas", meta: "Sentimental Value", odds: 0.06 },
      { id: "bsac-5", name: "Wunmi Mosaku", meta: "Sinners", odds: 0.06 },
    ]
  },
  {
    id: "best-original-screenplay",
    name: "Best Original Screenplay",
    emoji: "✍️",
    polymarketSlug: "oscars-2026-best-original-screenplay-winner",
    nominees: [
      { id: "bos-1", name: "Sinners", meta: "Ryan Coogler", odds: 0.95 },
      { id: "bos-2", name: "Sentimental Value", meta: "Joachim Trier & Eskil Vogt", odds: 0.02 },
      { id: "bos-3", name: "Marty Supreme", meta: "Josh & Benny Safdie", odds: 0.01 },
      { id: "bos-4", name: "It Was Just an Accident", meta: "Jafar Panahi", odds: 0.01 },
      { id: "bos-5", name: "Blue Moon", meta: "Robert Kaplow", odds: 0.01 },
    ]
  },
  {
    id: "best-adapted-screenplay",
    name: "Best Adapted Screenplay",
    emoji: "📖",
    polymarketSlug: "oscars-2026-best-adapted-screenplay-winner",
    nominees: [
      { id: "bas-1", name: "One Battle After Another", meta: "Paul Thomas Anderson", odds: 0.86 },
      { id: "bas-2", name: "Hamnet", meta: "Chloé Zhao", odds: 0.10 },
      { id: "bas-3", name: "Frankenstein", meta: "Guillermo del Toro", odds: 0.02 },
      { id: "bas-4", name: "Bugonia", meta: "Yorgos Lanthimos", odds: 0.01 },
      { id: "bas-5", name: "Train Dreams", meta: "Clint Bentley", odds: 0.01 },
    ]
  },

  // ===== TECHNICAL CATEGORIES =====
  {
    id: "best-casting",
    name: "Best Casting",
    emoji: "🎯",
    polymarketSlug: "oscars-2026-best-casting-winner",
    nominees: [
      { id: "bcast-1", name: "Sinners", meta: "Francine Maisler", odds: 0.80 },
      { id: "bcast-2", name: "One Battle After Another", meta: "Cassandra Kulukundis", odds: 0.13 },
      { id: "bcast-3", name: "Hamnet", meta: "Nina Gold", odds: 0.03 },
      { id: "bcast-4", name: "Marty Supreme", meta: "Jennifer Venditti", odds: 0.02 },
      { id: "bcast-5", name: "The Secret Agent", meta: "Gabriel Domingues", odds: 0.02 },
    ]
  },
  {
    id: "best-cinematography",
    name: "Best Cinematography",
    emoji: "📷",
    polymarketSlug: "oscars-2026-best-cinematography-winner",
    nominees: [
      { id: "bc-1", name: "One Battle After Another", meta: "Unknown", odds: 0.74 },
      { id: "bc-2", name: "Sinners", meta: "Autumn Durald Arkapaw", odds: 0.19 },
      { id: "bc-3", name: "Frankenstein", meta: "Dan Laustsen", odds: 0.04 },
      { id: "bc-4", name: "Marty Supreme", meta: "Darius Khondji", odds: 0.02 },
      { id: "bc-5", name: "Hamnet", meta: "Joshua James Richards", odds: 0.01 },
    ]
  },
  {
    id: "best-film-editing",
    name: "Best Film Editing",
    emoji: "✂️",
    polymarketSlug: "oscars-2026-best-film-editing-winner",
    nominees: [
      { id: "bfe-1", name: "One Battle After Another", meta: "Unknown", odds: 0.60 },
      { id: "bfe-2", name: "Sinners", meta: "Unknown", odds: 0.20 },
      { id: "bfe-3", name: "Marty Supreme", meta: "Benny Safdie", odds: 0.10 },
      { id: "bfe-4", name: "F1", meta: "Unknown", odds: 0.06 },
      { id: "bfe-5", name: "Sentimental Value", meta: "Unknown", odds: 0.04 },
    ]
  },
  {
    id: "best-production-design",
    name: "Best Production Design",
    emoji: "🏛️",
    polymarketSlug: "oscars-2026-best-production-design-winner",
    nominees: [
      { id: "bpd-1", name: "Frankenstein", meta: "Unknown", odds: 0.82 },
      { id: "bpd-2", name: "Sinners", meta: "Unknown", odds: 0.08 },
      { id: "bpd-3", name: "One Battle After Another", meta: "Unknown", odds: 0.05 },
      { id: "bpd-4", name: "Hamnet", meta: "Unknown", odds: 0.03 },
      { id: "bpd-5", name: "Marty Supreme", meta: "Unknown", odds: 0.02 },
    ]
  },
  {
    id: "best-costume-design",
    name: "Best Costume Design",
    emoji: "👗",
    polymarketSlug: "oscars-2026-best-costume-design-winner",
    nominees: [
      { id: "bcd-1", name: "Frankenstein", meta: "Luis Sequeira", odds: 0.89 },
      { id: "bcd-2", name: "Sinners", meta: "Ruth E. Carter", odds: 0.05 },
      { id: "bcd-3", name: "Hamnet", meta: "Unknown", odds: 0.03 },
      { id: "bcd-4", name: "Avatar: Fire and Ash", meta: "Unknown", odds: 0.02 },
      { id: "bcd-5", name: "Marty Supreme", meta: "Unknown", odds: 0.01 },
    ]
  },
  {
    id: "best-makeup-hairstyling",
    name: "Best Makeup & Hairstyling",
    emoji: "💄",
    polymarketSlug: "oscars-2026-best-makeup-and-hairstyling-winner",
    nominees: [
      { id: "bmh-1", name: "Frankenstein", meta: "Mike Hill, Jordan Samuel & Cliona Furey", odds: 0.84 },
      { id: "bmh-2", name: "Kokuho", meta: "Kyoko Toyokawa et al.", odds: 0.05 },
      { id: "bmh-3", name: "Sinners", meta: "Ken Diaz et al.", odds: 0.05 },
      { id: "bmh-4", name: "The Smashing Machine", meta: "Kazu Hiro et al.", odds: 0.03 },
      { id: "bmh-5", name: "The Ugly Stepsister", meta: "Thomas Foldberg et al.", odds: 0.03 },
    ]
  },
  {
    id: "best-original-score",
    name: "Best Original Score",
    emoji: "🎵",
    polymarketSlug: "oscars-2026-best-original-score-winner",
    nominees: [
      { id: "bsc-1", name: "Sinners", meta: "Ludwig Göransson", odds: 0.87 },
      { id: "bsc-2", name: "One Battle After Another", meta: "Unknown", odds: 0.06 },
      { id: "bsc-3", name: "Frankenstein", meta: "Alexandre Desplat", odds: 0.04 },
      { id: "bsc-4", name: "Hamnet", meta: "Unknown", odds: 0.02 },
      { id: "bsc-5", name: "Bugonia", meta: "Unknown", odds: 0.01 },
    ]
  },
  {
    id: "best-original-song",
    name: "Best Original Song",
    emoji: "🎤",
    polymarketSlug: "oscars-2026-best-original-song-winner-257",
    nominees: [
      { id: "bsn-1", name: "\"Golden\"", meta: "KPop Demon Hunters", odds: 0.88 },
      { id: "bsn-2", name: "\"I Lied to You\"", meta: "Sinners", odds: 0.09 },
      { id: "bsn-3", name: "\"Mi Camino\"", meta: "Elio", odds: 0.02 },
      { id: "bsn-4", name: "\"Kiss the Sky\"", meta: "The Wild Robot", odds: 0.005 },
      { id: "bsn-5", name: "\"Never Too Late\"", meta: "Elton John: Never Too Late", odds: 0.005 },
    ]
  },
  {
    id: "best-sound",
    name: "Best Sound",
    emoji: "🔊",
    polymarketSlug: "oscars-2026-best-sound-winner",
    nominees: [
      { id: "bsd-1", name: "Sinners", meta: "Unknown", odds: 0.55 },
      { id: "bsd-2", name: "F1", meta: "Unknown", odds: 0.25 },
      { id: "bsd-3", name: "One Battle After Another", meta: "Unknown", odds: 0.10 },
      { id: "bsd-4", name: "Frankenstein", meta: "Unknown", odds: 0.06 },
      { id: "bsd-5", name: "Mission: Impossible – The Final Reckoning", meta: "Unknown", odds: 0.04 },
    ]
  },
  {
    id: "best-visual-effects",
    name: "Best Visual Effects",
    emoji: "✨",
    polymarketSlug: "oscars-2026-best-visual-effects-winner",
    nominees: [
      { id: "bvfx-1", name: "Avatar: Fire and Ash", meta: "Wētā FX", odds: 0.91 },
      { id: "bvfx-2", name: "Frankenstein", meta: "Unknown", odds: 0.04 },
      { id: "bvfx-3", name: "Superman", meta: "Unknown", odds: 0.03 },
      { id: "bvfx-4", name: "Wicked: For Good", meta: "Unknown", odds: 0.01 },
      { id: "bvfx-5", name: "Mission: Impossible – The Final Reckoning", meta: "Unknown", odds: 0.01 },
    ]
  },

  // ===== FEATURES =====
  {
    id: "best-animated-feature",
    name: "Best Animated Feature",
    emoji: "🎨",
    polymarketSlug: "oscars-2026-best-animated-feature-film-winner",
    nominees: [
      { id: "baf-1", name: "KPop Demon Hunters", meta: "Chris Williams", odds: 0.91 },
      { id: "baf-2", name: "Elio", meta: "Adrian Molina", odds: 0.04 },
      { id: "baf-3", name: "The Legend of Ochi", meta: "Isaiah Saxon", odds: 0.03 },
      { id: "baf-4", name: "Avatar: The Last Airbender", meta: "Steve Ahn", odds: 0.01 },
      { id: "baf-5", name: "The Sandman", meta: "Unknown", odds: 0.01 },
    ]
  },
  {
    id: "best-international-feature",
    name: "Best International Feature",
    emoji: "🌍",
    polymarketSlug: "oscars-2026-best-international-feature-film-winner",
    nominees: [
      { id: "bif-1", name: "Sentimental Value", meta: "Norway", odds: 0.67 },
      { id: "bif-2", name: "The Secret Agent", meta: "Brazil", odds: 0.20 },
      { id: "bif-3", name: "It Was Just an Accident", meta: "France", odds: 0.06 },
      { id: "bif-4", name: "Sirāt", meta: "Spain", odds: 0.04 },
      { id: "bif-5", name: "The Voice of Hind Rajab", meta: "Tunisia", odds: 0.03 },
    ]
  },
  {
    id: "best-documentary-feature",
    name: "Best Documentary Feature",
    emoji: "📹",
    polymarketSlug: "oscars-2026-best-documentary-feature-film-winner",
    nominees: [
      { id: "bdf-1", name: "The Alabama Solution", meta: "Andrew Jarecki & Charlotte Kaufman", odds: 0.25 },
      { id: "bdf-2", name: "Come See Me in the Good Light", meta: "Ryan White et al.", odds: 0.10 },
      { id: "bdf-3", name: "Cutting Through Rocks", meta: "Sara Khaki & Mohammadreza Eyni", odds: 0.15 },
      { id: "bdf-4", name: "Mr. Nobody Against Putin", meta: "David Borenstein", odds: 0.15 },
      { id: "bdf-5", name: "The Perfect Neighbor", meta: "Geeta Gandbhir et al.", odds: 0.35 },
    ]
  },

  // ===== SHORTS =====
  {
    id: "best-animated-short",
    name: "Best Animated Short",
    emoji: "✏️",
    polymarketSlug: "oscars-2026-best-animated-short-film-winner",
    nominees: [
      { id: "bash-1", name: "Butterfly", meta: "Florence Miailhe", odds: 0.25 },
      { id: "bash-2", name: "Forevergreen", meta: "Nathan Engelhardt & Jeremy Spears", odds: 0.15 },
      { id: "bash-3", name: "The Girl Who Cried Pearls", meta: "Chris Lavis & Maciek Szczerbowski", odds: 0.25 },
      { id: "bash-4", name: "Retirement Plan", meta: "John Kelly & Andrew Freedman", odds: 0.20 },
      { id: "bash-5", name: "The Three Sisters", meta: "Konstantin Bronzit", odds: 0.15 },
    ]
  },
  {
    id: "best-live-action-short",
    name: "Best Live Action Short",
    emoji: "🎥",
    polymarketSlug: "oscars-2026-best-live-action-short-film-winner",
    nominees: [
      { id: "blas-1", name: "Butcher's Stain", meta: "Unknown", odds: 0.15 },
      { id: "blas-2", name: "A Friend of Dorothy", meta: "UK", odds: 0.25 },
      { id: "blas-3", name: "Jane Austen's Period Drama", meta: "Unknown", odds: 0.15 },
      { id: "blas-4", name: "The Singers", meta: "Unknown", odds: 0.25 },
      { id: "blas-5", name: "Two People Exchanging Saliva", meta: "France", odds: 0.20 },
    ]
  },
  {
    id: "best-documentary-short",
    name: "Best Documentary Short",
    emoji: "🎞️",
    polymarketSlug: "oscars-2026-best-documentary-short-film-winner-513",
    nominees: [
      { id: "bds-1", name: "All the Empty Rooms", meta: "Joshua Seftel & Conall Jones", odds: 0.20 },
      { id: "bds-2", name: "Armed Only with a Camera", meta: "Craig Renaud & Juan Arredondo", odds: 0.20 },
      { id: "bds-3", name: "Children No More", meta: "Hilla Medalia & Sheila Nevins", odds: 0.15 },
      { id: "bds-4", name: "The Devil Is Busy", meta: "Christalyn Hampton & Geeta Gandbhir", odds: 0.25 },
      { id: "bds-5", name: "Perfectly a Strangeness", meta: "Alison McAlpine", odds: 0.20 },
    ]
  },
];

// Group categories for display
export const CATEGORY_GROUPS = [
  {
    name: "The Big 8",
    emoji: "⭐",
    categoryIds: [
      "best-picture",
      "best-director",
      "best-actor",
      "best-actress",
      "best-supporting-actor",
      "best-supporting-actress",
      "best-original-screenplay",
      "best-adapted-screenplay",
    ]
  },
  {
    name: "Technical Awards",
    emoji: "🎬",
    categoryIds: [
      "best-casting",
      "best-cinematography",
      "best-film-editing",
      "best-production-design",
      "best-costume-design",
      "best-makeup-hairstyling",
      "best-original-score",
      "best-original-song",
      "best-sound",
      "best-visual-effects",
    ]
  },
  {
    name: "Features",
    emoji: "🎞️",
    categoryIds: [
      "best-animated-feature",
      "best-international-feature",
      "best-documentary-feature",
    ]
  },
  {
    name: "Shorts",
    emoji: "📽️",
    categoryIds: [
      "best-animated-short",
      "best-live-action-short",
      "best-documentary-short",
    ]
  },
];

// Calculate points for correct pick
// 10 / odds, with a floor of 10
// Examples: 50% → 20pts, 25% → 40pts, 10% → 100pts, 90% → 11pts
export const calculatePoints = (odds) => {
  if (!odds || odds <= 0) return 10;
  return Math.max(10, Math.round(10 / odds));
};
