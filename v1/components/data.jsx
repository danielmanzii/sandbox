/* global React */
// Mock data for Sandbox Pitch & Putt — Miami area

const MOCK_USER = {
  // Skeleton — real values injected by useRealUserSync for logged-in users.
  id: null,
  handle: '',
  name: '',
  tier: 'league',
  foundingMember: false,
  sbx: 4.000,
  sbxDelta: 0,
  sbxTrend: [4.000],
  sbxReliability: 0,
  sbxMatchesToProvisional: 5,
  sbxPercentile: 50,
  sbxPeak: 4.000,
  sbxGlobalRank: 0,
  homeCourse: 'Melreese',
  bio: '',
  joined: '',
  eventsPlayed: 0,
  matchesW: 0, matchesL: 0, matchesH: 0, matchesTotal: 0,
  holesWonTotal: 0, holesLostTotal: 0, holesHalvedTotal: 0,
  seasonPoints: 0,
  guestPassesLeft: 0,
  streak: 0,
  partnerWith: null,
  ig: null,
  shotUsage: 0, shotUsageTrend: [0], shotUsageRank: '—',
  clutchUsage: 0, leadoffUsage: 0, cleanupUsage: 0,
  gir: 0, girTrend: [], putts: 0, proximity: 0,
  proximityByDist: [],
  parOrBetter: 0, bailoutRate: 0, concedeRate: 0,
  holeWinByDist: [],
};

const MOCK_FRIENDS = [];

const MOCK_EVENTS = [];

const MOCK_LIVE = { currentHole: 0, yourMatch: null, matches: [] };

const MOCK_YOUR_CARD = null;

const MOCK_BADGES = [
  // ─── Match Play ───────────────────────────────────────────────────────
  { id: 'b_first',    name: 'First Blood',      sub: 'Win your very first match',           rarity: 'common',    color: 'var(--forest)',    icon: 'flag',   locked: true },
  { id: 'b_closer',   name: 'Closer',           sub: 'Win a match 5&4 or better',           rarity: 'uncommon',  color: 'var(--forest)',    icon: 'flag',   locked: true },
  { id: 'b_comeback', name: 'The Comeback',     sub: 'Win after being 2 down with 3 to play', rarity: 'uncommon', color: 'var(--forest)',   icon: 'bolt',   locked: true },
  { id: 'b_dormie',   name: 'Dormie Dealer',    sub: 'Clinch the match on hole 7 or earlier', rarity: 'legendary', color: 'var(--clay-deep)', icon: 'flag',  locked: true },
  { id: 'b_perfect',  name: 'Perfect Game',     sub: 'Win all 9 holes in a match',          rarity: 'legendary', color: 'var(--clay-deep)', icon: 'trophy', locked: true },
  { id: 'b_calm',     name: 'Dead Calm',        sub: 'Never trail at any point in a match', rarity: 'rare',      color: 'var(--clay)',      icon: 'bolt',   locked: true },
  { id: 'b_hawk',     name: 'Hole Hawk',        sub: 'Win 7 or more holes in a match',      rarity: 'rare',      color: 'var(--clay)',      icon: 'flag',   locked: true },
  // ─── Streaks ──────────────────────────────────────────────────────────
  { id: 'b_streak3',  name: 'Unbeaten · 3',     sub: '3 matches without a loss',            rarity: 'uncommon',  color: 'var(--clay)',      icon: 'fire',   locked: true },
  { id: 'b_streak5',  name: 'Unbeaten · 5',     sub: '5 matches without a loss',            rarity: 'rare',      color: 'var(--clay)',      icon: 'fire',   locked: true },
  { id: 'b_streak10', name: 'On Fire',          sub: '10 matches without a loss',           rarity: 'legendary', color: 'var(--clay-deep)', icon: 'fire',   locked: true },
  { id: 'b_hat',      name: 'Hat Trick',        sub: 'Win 3 consecutive weekly events',     rarity: 'rare',      color: 'var(--clay)',      icon: 'trophy', locked: true },
  // ─── Participation ────────────────────────────────────────────────────
  { id: 'b_founding', name: 'Founding Member',  sub: 'Week 1 believer',                     rarity: 'rare',      color: 'var(--clay-deep)', icon: 'trophy', locked: true },
  { id: 'b_show5',    name: 'Show Up',          sub: 'Attend 5 events',                     rarity: 'common',    color: 'var(--forest)',    icon: 'ball',   locked: true },
  { id: 'b_regular',  name: 'True Regular',     sub: 'Attend 10 events',                    rarity: 'uncommon',  color: 'var(--forest)',    icon: 'ball',   locked: true },
  { id: 'b_sunrise',  name: 'Sunrise Crew',     sub: 'Take a first-tee spot 3 times',       rarity: 'uncommon',  color: 'var(--forest)',    icon: 'bolt',   locked: true },
  { id: 'b_season',   name: 'Season Soldier',   sub: 'Attend every event in a full season', rarity: 'legendary', color: 'var(--clay-deep)', icon: 'trophy', locked: true },
  // ─── Rating / Achievement ─────────────────────────────────────────────
  { id: 'b_danger',   name: 'Rated Danger',     sub: 'Reach SBX 6.000 or higher',           rarity: 'rare',      color: 'var(--clay)',      icon: 'bolt',   locked: true },
  { id: 'b_top10',    name: 'Top 10',           sub: 'Reach top 10 on the season board',    rarity: 'rare',      color: 'var(--clay)',      icon: 'trophy', locked: true },
  // ─── Social / Partner ─────────────────────────────────────────────────
  { id: 'b_rideordie', name: 'Ride or Die',     sub: 'Play 5 matches with the same partner', rarity: 'uncommon', color: 'var(--clay)',      icon: 'fire',   locked: true },
  { id: 'b_major',    name: 'Major Mover',      sub: 'Reach the quarter-finals of a Major', rarity: 'rare',      color: 'var(--clay)',      icon: 'trophy', locked: true },
];

const MOCK_ROUND_HISTORY = [];

const MOCK_MEMBERSHIPS = [
  {
    id: 'stats',
    name: 'Stats',
    subtitle: 'Just the data',
    price: 15,
    period: 'mo',
    highlights: [
      'Sandbox Rating™ — your universal skill number',
      'Full match history + rating trend',
      'Head-to-head + partner records',
      'Badges & streaks',
      'Shareable result cards',
    ],
    notIncluded: ['No event registration. Walk-up rates apply.'],
    tone: 'cream',
  },
  {
    id: 'league',
    name: 'League',
    subtitle: 'The main ticket',
    price: 99,
    period: 'mo',
    highlights: [
      '4 events / month included',
      'All Stats features',
      'Priority registration (48h early)',
      '2 guest passes / month',
      'Member-only twilights',
      'Quarterly swag drop',
      'Birthday event on the house',
    ],
    notIncluded: null,
    tone: 'forest',
    featured: true,
    tag: 'MOST PICKED',
  },
  {
    id: 'plus',
    name: 'League Plus',
    subtitle: 'Unlimited reps',
    price: 175,
    period: 'mo',
    highlights: [
      'Unlimited events',
      '30% off Majors',
      '4 guest passes / month',
      'Member directory access',
      'Early access to content + drops',
      'Pro-content film room',
      'Partner matchmaking priority',
    ],
    notIncluded: null,
    tone: 'clay',
  },
];

const MOCK_ACTIVITY = [];

const MOCK_H2H = [];

window.MOCK = {
  USER: MOCK_USER,
  FRIENDS: MOCK_FRIENDS,
  EVENTS: MOCK_EVENTS,
  LIVE: MOCK_LIVE,
  YOUR_CARD: MOCK_YOUR_CARD,
  BADGES: MOCK_BADGES,
  HISTORY: MOCK_ROUND_HISTORY,
  MEMBERSHIPS: MOCK_MEMBERSHIPS,
  ACTIVITY: MOCK_ACTIVITY,
  H2H: MOCK_H2H,
};
