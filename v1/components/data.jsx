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

const MOCK_BADGES = [];

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
