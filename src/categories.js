// 2026 Oscar nominees and categories
// Default odds are from Polymarket as of March 8, 2026 (updated by fetch button in Admin)

export const calculatePoints = (odds) => {
  // Points = 1 / probability. Picking a 10% shot = 10pts, picking a 90% shot = ~1.1pts
  if (!odds || odds <= 0) return 1;
  return Math.round((1 / odds) * 10) / 10;
};

export const CATEGORIES = [
  {
    id: 'best-picture',
    name: 'Best Picture',
    nominees: [
      { id: 'bp-1', name: 'One Battle After Another', odds: 0.74 },
      { id: 'bp-2', name: 'Sinners', odds: 0.22 },
      { id: 'bp-3', name: 'Hamnet', odds: 0.02 },
      { id: 'bp-4', name: 'Marty Supreme', odds: 0.01 },
      { id: 'bp-5', name: 'Sentimental Value', odds: 0.01 },
      { id: 'bp-6', name: 'Frankenstein', odds: 0.01 },
      { id: 'bp-7', name: 'The Secret Agent', odds: 0.01 },
      { id: 'bp-8', name: 'Bugonia', odds: 0.01 },
      { id: 'bp-9', name: 'F1', odds: 0.01 },
      { id: 'bp-10', name: 'Train Dreams', odds: 0.01 },
    ],
  },
  {
    id: 'best-director',
    name: 'Best Director',
    nominees: [
      { id: 'bd-1', name: 'Paul Thomas Anderson (One Battle After Another)', odds: 0.60 },
      { id: 'bd-2', name: 'Ryan Coogler (Sinners)', odds: 0.30 },
      { id: 'bd-3', name: 'Chloé Zhao (Hamnet)', odds: 0.05 },
      { id: 'bd-4', name: 'Josh Safdie (Marty Supreme)', odds: 0.03 },
      { id: 'bd-5', name: 'Joachim Trier (Sentimental Value)', odds: 0.02 },
    ],
  },
  {
    id: 'best-actor',
    name: 'Best Actor',
    nominees: [
      { id: 'ba-1', name: 'Michael B. Jordan (Sinners)', odds: 0.47 },
      { id: 'ba-2', name: 'Timothée Chalamet (Marty Supreme)', odds: 0.45 },
      { id: 'ba-3', name: 'Leonardo DiCaprio (One Battle After Another)', odds: 0.04 },
      { id: 'ba-4', name: 'Ethan Hawke (Blue Moon)', odds: 0.02 },
      { id: 'ba-5', name: 'Wagner Moura (The Secret Agent)', odds: 0.02 },
    ],
  },
  {
    id: 'best-actress',
    name: 'Best Actress',
    nominees: [
      { id: 'bac-1', name: 'Jessie Buckley (Hamnet)', odds: 0.96 },
      { id: 'bac-2', name: 'Rose Byrne (If I Had Legs I\'d Kick You)', odds: 0.03 },
      { id: 'bac-3', name: 'Renate Reinsve (Sentimental Value)', odds: 0.01 },
      { id: 'bac-4', name: 'Kate Hudson (Song Sung Blue)', odds: 0.01 },
      { id: 'bac-5', name: 'Emma Stone (Bugonia)', odds: 0.01 },
    ],
  },
  {
    id: 'best-supporting-actor',
    name: 'Best Supporting Actor',
    nominees: [
      { id: 'bsa-1', name: 'Sean Penn (One Battle After Another)', odds: 0.70 },
      { id: 'bsa-2', name: 'Stellan Skarsgård (Sentimental Value)', odds: 0.17 },
      { id: 'bsa-3', name: 'Delroy Lindo (Sinners)', odds: 0.07 },
      { id: 'bsa-4', name: 'Benicio Del Toro (One Battle After Another)', odds: 0.04 },
      { id: 'bsa-5', name: 'Jacob Elordi (Frankenstein)', odds: 0.02 },
    ],
  },
  {
    id: 'best-supporting-actress',
    name: 'Best Supporting Actress',
    nominees: [
      { id: 'bsac-1', name: 'Amy Madigan (Weapons)', odds: 0.45 },
      { id: 'bsac-2', name: 'Teyana Taylor (One Battle After Another)', odds: 0.31 },
      { id: 'bsac-3', name: 'Wunmi Mosaku (Sinners)', odds: 0.12 },
      { id: 'bsac-4', name: 'Elle Fanning (Sentimental Value)', odds: 0.07 },
      { id: 'bsac-5', name: 'Inga Ibsdotter Lilleaas (Sentimental Value)', odds: 0.05 },
    ],
  },
  {
    id: 'best-original-screenplay',
    name: 'Best Original Screenplay',
    nominees: [
      { id: 'bos-1', name: 'Sinners (Ryan Coogler)', odds: 0.40 },
      { id: 'bos-2', name: 'One Battle After Another (Paul Thomas Anderson)', odds: 0.35 },
      { id: 'bos-3', name: 'Marty Supreme (Ronald Bronstein & Josh Safdie)', odds: 0.12 },
      { id: 'bos-4', name: 'Sentimental Value (Eskil Vogt & Joachim Trier)', odds: 0.08 },
      { id: 'bos-5', name: 'It Was Just an Accident (Jafar Panahi)', odds: 0.05 },
    ],
  },
  {
    id: 'best-adapted-screenplay',
    name: 'Best Adapted Screenplay',
    nominees: [
      { id: 'bas-1', name: 'Hamnet', odds: 0.50 },
      { id: 'bas-2', name: 'Frankenstein', odds: 0.20 },
      { id: 'bas-3', name: 'Train Dreams', odds: 0.15 },
      { id: 'bas-4', name: 'The Secret Agent', odds: 0.10 },
      { id: 'bas-5', name: 'Bugonia', odds: 0.05 },
    ],
  },
  {
    id: 'best-animated-feature',
    name: 'Best Animated Feature',
    nominees: [
      { id: 'baf-1', name: 'KPop Demon Hunters', odds: 0.45 },
      { id: 'baf-2', name: 'Zootopia 2', odds: 0.30 },
      { id: 'baf-3', name: 'Elio', odds: 0.15 },
      { id: 'baf-4', name: 'Little Amélie or the Character of Rain', odds: 0.06 },
      { id: 'baf-5', name: 'Arco', odds: 0.04 },
    ],
  },
  {
    id: 'best-international-feature',
    name: 'Best International Feature Film',
    nominees: [
      { id: 'bif-1', name: 'Sentimental Value (Norway)', odds: 0.40 },
      { id: 'bif-2', name: 'The Secret Agent (Brazil)', odds: 0.25 },
      { id: 'bif-3', name: 'Ugly Stepsister (Norway)', odds: 0.15 },
      { id: 'bif-4', name: 'Hunt (South Korea)', odds: 0.12 },
      { id: 'bif-5', name: 'It Was Just an Accident (Iran)', odds: 0.08 },
    ],
  },
  {
    id: 'best-documentary-feature',
    name: 'Best Documentary Feature',
    nominees: [
      { id: 'bdf-1', name: 'Diane Warren: Relentless', odds: 0.30 },
      { id: 'bdf-2', name: 'Black Box Diaries', odds: 0.25 },
      { id: 'bdf-3', name: 'No Other Land', odds: 0.20 },
      { id: 'bdf-4', name: 'Porcelain War', odds: 0.15 },
      { id: 'bdf-5', name: 'Sugarcane', odds: 0.10 },
    ],
  },
  {
    id: 'best-cinematography',
    name: 'Best Cinematography',
    nominees: [
      { id: 'bc-1', name: 'Sinners', odds: 0.45 },
      { id: 'bc-2', name: 'One Battle After Another', odds: 0.30 },
      { id: 'bc-3', name: 'Hamnet', odds: 0.12 },
      { id: 'bc-4', name: 'Sentimental Value', odds: 0.08 },
      { id: 'bc-5', name: 'The Secret Agent', odds: 0.05 },
    ],
  },
  {
    id: 'best-film-editing',
    name: 'Best Film Editing',
    nominees: [
      { id: 'bfe-1', name: 'Sinners', odds: 0.40 },
      { id: 'bfe-2', name: 'One Battle After Another', odds: 0.35 },
      { id: 'bfe-3', name: 'Marty Supreme', odds: 0.12 },
      { id: 'bfe-4', name: 'Hamnet', odds: 0.08 },
      { id: 'bfe-5', name: 'F1', odds: 0.05 },
    ],
  },
  {
    id: 'best-production-design',
    name: 'Best Production Design',
    nominees: [
      { id: 'bpd-1', name: 'Frankenstein', odds: 0.40 },
      { id: 'bpd-2', name: 'One Battle After Another', odds: 0.25 },
      { id: 'bpd-3', name: 'Hamnet', odds: 0.20 },
      { id: 'bpd-4', name: 'Sinners', odds: 0.10 },
      { id: 'bpd-5', name: 'Bugonia', odds: 0.05 },
    ],
  },
  {
    id: 'best-costume-design',
    name: 'Best Costume Design',
    nominees: [
      { id: 'bcd-1', name: 'Hamnet', odds: 0.40 },
      { id: 'bcd-2', name: 'Frankenstein', odds: 0.30 },
      { id: 'bcd-3', name: 'One Battle After Another', odds: 0.15 },
      { id: 'bcd-4', name: 'Bugonia', odds: 0.10 },
      { id: 'bcd-5', name: 'Sinners', odds: 0.05 },
    ],
  },
  {
    id: 'best-makeup-hairstyling',
    name: 'Best Makeup and Hairstyling',
    nominees: [
      { id: 'bmh-1', name: 'Frankenstein', odds: 0.50 },
      { id: 'bmh-2', name: 'Sinners', odds: 0.25 },
      { id: 'bmh-3', name: 'Hamnet', odds: 0.15 },
      { id: 'bmh-4', name: 'One Battle After Another', odds: 0.07 },
      { id: 'bmh-5', name: 'Bugonia', odds: 0.03 },
    ],
  },
  {
    id: 'best-original-score',
    name: 'Best Original Score',
    nominees: [
      { id: 'bsc-1', name: 'Sinners (Ludwig Göransson)', odds: 0.45 },
      { id: 'bsc-2', name: 'One Battle After Another (Jonny Greenwood)', odds: 0.30 },
      { id: 'bsc-3', name: 'Hamnet (Max Richter)', odds: 0.12 },
      { id: 'bsc-4', name: 'Frankenstein (Alexandre Desplat)', odds: 0.08 },
      { id: 'bsc-5', name: 'Bugonia (Jerskin Fendrix)', odds: 0.05 },
    ],
  },
  {
    id: 'best-original-song',
    name: 'Best Original Song',
    nominees: [
      { id: 'bsn-1', name: '"I Lied to You" (Sinners)', odds: 0.55 },
      { id: 'bsn-2', name: '"Golden" (KPop Demon Hunters)', odds: 0.30 },
      { id: 'bsn-3', name: '"Train Dreams" (Train Dreams)', odds: 0.08 },
      { id: 'bsn-4', name: '"Dear Me" (Diane Warren: Relentless)', odds: 0.05 },
      { id: 'bsn-5', name: '"Sweet Dreams of Joy" (Viva Verdi!)', odds: 0.02 },
    ],
  },
  {
    id: 'best-sound',
    name: 'Best Sound',
    nominees: [
      { id: 'bsd-1', name: 'Sinners', odds: 0.45 },
      { id: 'bsd-2', name: 'F1', odds: 0.25 },
      { id: 'bsd-3', name: 'One Battle After Another', odds: 0.15 },
      { id: 'bsd-4', name: 'Frankenstein', odds: 0.10 },
      { id: 'bsd-5', name: 'Hamnet', odds: 0.05 },
    ],
  },
  {
    id: 'best-visual-effects',
    name: 'Best Visual Effects',
    nominees: [
      { id: 'bvfx-1', name: 'Frankenstein', odds: 0.40 },
      { id: 'bvfx-2', name: 'Sinners', odds: 0.25 },
      { id: 'bvfx-3', name: 'F1', odds: 0.20 },
      { id: 'bvfx-4', name: 'One Battle After Another', odds: 0.10 },
      { id: 'bvfx-5', name: 'Hamnet', odds: 0.05 },
    ],
  },
  {
    id: 'best-animated-short',
    name: 'Best Animated Short Film',
    nominees: [
      { id: 'bash-1', name: 'Beautiful Men', odds: 0.30 },
      { id: 'bash-2', name: 'Yuck!', odds: 0.25 },
      { id: 'bash-3', name: 'Butterfly', odds: 0.20 },
      { id: 'bash-4', name: 'Forevergreen', odds: 0.15 },
      { id: 'bash-5', name: 'The Girl Who Cried Pearls', odds: 0.10 },
    ],
  },
  {
    id: 'best-live-action-short',
    name: 'Best Live Action Short Film',
    nominees: [
      { id: 'blas-1', name: 'The Last Ranger', odds: 0.30 },
      { id: 'blas-2', name: 'A Lien', odds: 0.25 },
      { id: 'blas-3', name: 'Retirement Plan', odds: 0.20 },
      { id: 'blas-4', name: 'Anuja', odds: 0.15 },
      { id: 'blas-5', name: 'I\'m Not a Robot', odds: 0.10 },
    ],
  },
  {
    id: 'best-documentary-short',
    name: 'Best Documentary Short Film',
    nominees: [
      { id: 'bdsh-1', name: 'Death by Numbers', odds: 0.30 },
      { id: 'bdsh-2', name: 'I Am Ready, Warden', odds: 0.25 },
      { id: 'bdsh-3', name: 'Incident', odds: 0.20 },
      { id: 'bdsh-4', name: 'The Only Girl in the Orchestra', odds: 0.15 },
      { id: 'bdsh-5', name: 'Instruments of a Beating Heart', odds: 0.10 },
    ],
  },
];

export const CATEGORY_GROUPS = [
  {
    name: '🏆 Major Awards',
    categoryIds: ['best-picture', 'best-director', 'best-actor', 'best-actress', 'best-supporting-actor', 'best-supporting-actress'],
  },
  {
    name: '✍️ Writing',
    categoryIds: ['best-original-screenplay', 'best-adapted-screenplay'],
  },
  {
    name: '🎬 Craft Awards',
    categoryIds: ['best-cinematography', 'best-film-editing', 'best-production-design', 'best-costume-design', 'best-makeup-hairstyling', 'best-original-score', 'best-original-song', 'best-sound', 'best-visual-effects'],
  },
  {
    name: '🌍 Special Categories',
    categoryIds: ['best-animated-feature', 'best-international-feature', 'best-documentary-feature'],
  },
  {
    name: '🩳 Short Films',
    categoryIds: ['best-animated-short', 'best-live-action-short', 'best-documentary-short'],
  },
];
