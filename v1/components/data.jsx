/* global React */
// Mock data for Sandbox Pitch & Putt — Miami area

const MOCK_USER = {
  id: 'u_you',
  handle: '@alex.miami',
  name: 'Alex Rivera',
  tier: 'league', // stats | league | leaguePlus | walkup
  foundingMember: true,
  // Sandbox Rating — universal 2.000–8.000 skill rating. Higher = better.
  // Updates after every match. Portable across all Sandbox locations.
  sbx: 5.412,
  sbxDelta: +0.043, // change after most recent match
  sbxTrend: [4.820, 4.905, 5.110, 5.188, 5.240, 5.369, 5.412],
  sbxReliability: 0.78, // 0–1. <0.5 shows as provisional (dotted)
  sbxMatchesToProvisional: 0, // matches until reliable; 0 = already reliable
  sbxPercentile: 62, // where they rank in the Sandbox universe
  sbxPeak: 5.412,
  sbxGlobalRank: 1842, // rank among all rated Sandbox players
  homeCourse: 'Melreese',
  bio: "Brickell. Short game over everything.",
  joined: 'Feb 2026',
  eventsPlayed: 11,
  // Match-play record
  matchesW: 11,
  matchesL: 7,
  matchesH: 2,
  matchesTotal: 20, // lifetime rated matches
  holesWonTotal: 38,
  holesLostTotal: 32,
  holesHalvedTotal: 29,
  seasonPoints: 6.5, // 6 W + 1 H
  guestPassesLeft: 2,
  streak: 3, // consecutive weeks without a loss
  partnerWith: 'jaybird',
  ig: '@alexrivera',

  // ── Scramble-native stats (tracked per shot by ops/self-report) ──
  // Aggregates over last 20 rated matches
  shotUsage: 0.47,           // % of team shots that were YOURS (0.50 = even split with partner)
  shotUsageTrend: [0.38, 0.41, 0.43, 0.45, 0.44, 0.49, 0.47],
  shotUsageRank: 'top 30%',   // vs field — higher = you're pulling weight
  clutchUsage: 0.62,          // usage % when partner already missed (pressure shots)
  leadoffUsage: 0.44,         // usage % when you hit FIRST (no info)
  cleanupUsage: 0.51,         // usage % when you hit SECOND (see partner's ball)

  gir: 0.58,                  // Greens in Reg — par-3 course, "on in 1"
  girTrend: [0.48, 0.52, 0.55, 0.54, 0.57, 0.59, 0.58],
  putts: 1.72,                // team avg per hole (after GIR)
  proximity: 18.4,            // avg feet-to-pin on YOUR tee shots
  proximityByDist: [          // avg ft-to-pin, bucketed
    { bucket: '< 60 yd',  avg: 11.2, shots: 34 },
    { bucket: '60–90 yd', avg: 16.8, shots: 41 },
    { bucket: '90+ yd',   avg: 24.5, shots: 28 },
  ],

  parOrBetter: 0.71,          // team % of holes at par or better
  bailoutRate: 0.12,          // % where BOTH balls were unusable (partner saves OR concede)
  concedeRate: 0.08,          // holes conceded by your team

  // Per-distance hole win % (match play)
  holeWinByDist: [
    { bucket: '< 60 yd',  winPct: 0.61, played: 22 },
    { bucket: '60–90 yd', winPct: 0.54, played: 28 },
    { bucket: '90+ yd',   winPct: 0.45, played: 20 },
  ],
};

const MOCK_FRIENDS = [
  { id: 'u1', handle: '@jaybird', name: 'Jay Soto', sbx: 5.891, rel: 0.92, avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop', color: '#1C492A' },
  { id: 'u2', handle: '@maria.cg', name: 'María Delgado', sbx: 4.230, rel: 0.71, avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&auto=format&fit=crop', color: '#B26A3B' },
  { id: 'u3', handle: '@dukes', name: 'Dukes Varela', sbx: 6.712, rel: 0.95, avatar: 'https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&q=80&auto=format&fit=crop', color: '#3E8A57' },
  { id: 'u4', handle: '@theo.m', name: 'Theo Martín', sbx: 4.980, rel: 0.83, avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop', color: '#9A7B3F' },
  { id: 'u5', handle: '@nats', name: 'Natalie Cruz', sbx: 3.620, rel: 0.45, avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80&auto=format&fit=crop', color: '#5A8C4A' },
  { id: 'u6', handle: '@riv', name: 'Riv Okafor', sbx: 5.540, rel: 0.80, avatar: 'https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&q=80&auto=format&fit=crop', color: '#7D4A2E' },
  { id: 'u7', handle: '@camicu', name: 'Cami Cu', sbx: 4.410, rel: 0.68, avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&auto=format&fit=crop', color: '#C57B48' },
  { id: 'u8', handle: '@bigleo', name: 'Leo Vega', sbx: 6.100, rel: 0.88, avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&q=80&auto=format&fit=crop', color: '#2C6B43' },
];

const MOCK_EVENTS = [
  {
    id: 'e_sat',
    type: 'weekly',
    courseName: 'Melreese International Links',
    courseShort: 'Melreese',
    date: 'Sat · Apr 25',
    dateFull: 'Saturday, April 25, 2026',
    time: '7:30 AM',
    field: 56,
    filled: 43,
    priceMember: 28,
    priceWalkup: 85,
    status: 'open', // open | member-only | sold-out | live | past
    weekNum: 12,
    tagline: 'The Home Game',
    img: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80&auto=format&fit=crop',
    description: 'Standard Saturday at the home course. Sunrise tee times. Cold brew and cortaditos on us.',
  },
  {
    id: 'e_live',
    type: 'weekly',
    courseName: 'Melreese International Links',
    courseShort: 'Melreese',
    date: 'Right Now',
    dateFull: 'Saturday, April 19, 2026 · LIVE',
    time: 'Live · Hole 6',
    field: 48,
    filled: 48,
    priceMember: 28,
    priceWalkup: 85,
    status: 'live',
    weekNum: 11,
    tagline: 'Week 11 · Live',
    img: 'https://images.unsplash.com/photo-1535132011086-b8818f016104?w=800&q=80&auto=format&fit=crop',
    description: 'Live scoring. Follow your crew.',
  },
  {
    id: 'e_maj',
    type: 'major',
    courseName: 'The Biltmore',
    courseShort: 'Biltmore',
    date: 'May 17',
    dateFull: 'Saturday, May 17, 2026',
    time: '6:30 AM Shotgun',
    field: 80,
    filled: 34,
    priceMember: 95,
    priceWalkup: 175,
    status: 'open',
    weekNum: null,
    tagline: 'THE BILTMORE MAJOR',
    img: 'https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80&auto=format&fit=crop',
    description: 'Season\'s first Major. Split-tee shotgun. Cold tower on 9.',
    isMajor: true,
  },
  {
    id: 'e_wed',
    type: 'weekly',
    courseName: 'Normandy Shores',
    courseShort: 'Normandy',
    date: 'Wed · Apr 29',
    dateFull: 'Wednesday, April 29, 2026',
    time: '6:00 PM · Twilight',
    field: 40,
    filled: 12,
    priceMember: 28,
    priceWalkup: 85,
    status: 'member-only',
    weekNum: 12,
    tagline: 'Miami Beach Twilight',
    img: 'https://images.unsplash.com/photo-1600740288397-83469a3efd9b?w=800&q=80&auto=format&fit=crop',
    description: 'Member-only twilight league. Cap at 40.',
  },
  {
    id: 'e_may2',
    type: 'weekly',
    courseName: 'Palmetto Golf Course',
    courseShort: 'Palmetto',
    date: 'Sat · May 2',
    dateFull: 'Saturday, May 2, 2026',
    time: '7:30 AM',
    field: 56,
    filled: 8,
    priceMember: 28,
    priceWalkup: 85,
    status: 'open',
    weekNum: 13,
    tagline: 'Kendall Run',
    img: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80&auto=format&fit=crop',
    description: 'Kendall heads get your reps in.',
  },
];

// Match play: state is a signed int = holes up (+) or down (–). 0 = AS (all square).
// thru = holes completed. Final status like "W 3&2" = won with 3 holes up & 2 to play.
const MOCK_LIVE = {
  eventId: 'e_live',
  course: 'Melreese',
  currentHole: 6,
  totalHoles: 9,
  // Your match: Jay+Alex vs Riv+Theo
  yourMatch: {
    id: 'm_you',
    teamA: { name: 'Jay + Alex', isYou: true, avatars: ['@jaybird', '@alex.miami'] },
    teamB: { name: 'Riv + Theo', isYou: false, avatars: ['@riv', '@theo.m'] },
    state: 2, // teamA is 2 UP
    thru: 5,
    remaining: 4,
    // per-hole results from teamA POV: 'W' won, 'L' lost, 'H' halved, null = not played
    holes: [
      { hole: 1, par: 3, dist: 78, a: 2, b: 3, result: 'W' },
      { hole: 2, par: 3, dist: 92, a: 3, b: 3, result: 'H' },
      { hole: 3, par: 3, dist: 65, a: 3, b: 2, result: 'L' },
      { hole: 4, par: 3, dist: 110, a: 3, b: 4, result: 'W' },
      { hole: 5, par: 3, dist: 85, a: 2, b: 3, result: 'W' },
      { hole: 6, par: 3, dist: 72, a: null, b: null, result: null, current: true },
      { hole: 7, par: 3, dist: 98 },
      { hole: 8, par: 3, dist: 58 },
      { hole: 9, par: 3, dist: 105 },
    ],
  },
  // Full board of all matches at this event
  matches: [
    { id: 'm1', teams: 'Dukes + Leo vs Oscar + Tay', state: 5, thru: 6, status: 'DORMIE', leader: 'A' },
    { id: 'm2', teams: 'Mike + Sal vs Pato + Bren', state: 3, thru: 5, status: '3 UP', leader: 'A' },
    { id: 'm_you', teams: 'Jay + Alex vs Riv + Theo', state: 2, thru: 5, status: '2 UP', leader: 'A', isYou: true },
    { id: 'm3', teams: 'María + Nats vs Cami + Bea', state: 1, thru: 6, status: '1 UP', leader: 'A' },
    { id: 'm4', teams: 'Beto + Sam vs Ruth + Kai', state: 0, thru: 5, status: 'AS', leader: null },
    { id: 'm5', teams: 'Zoe + Cris vs Tomás + Pau', state: 1, thru: 6, status: '1 UP', leader: 'B' },
    { id: 'm6', teams: 'Nia + Kim vs Rafa + Joel', state: 2, thru: 4, status: '2 UP', leader: 'B' },
  ],
};

// Your team's detailed card for the live match (same data as yourMatch, a view of it)
const MOCK_YOUR_CARD = {
  event: 'Week 11 · Melreese',
  partner: '@jaybird',
  teamName: 'Jay + Alex',
  opponent: 'Riv + Theo',
  opponentAvatars: ['@riv', '@theo.m'],
  state: 2, // 2 UP
  thru: 5,
  remaining: 4,
  holesWon: 3,
  holesLost: 1,
  holesHalved: 1,
  holes: [
    { hole: 1, par: 3, distance: 78, you: 2, opp: 3, result: 'W', note: 'Pin-high on mat 2' },
    { hole: 2, par: 3, distance: 92, you: 3, opp: 3, result: 'H', note: 'Jay stuck it to 4ft — matched' },
    { hole: 3, par: 3, distance: 65, you: 3, opp: 2, result: 'L', note: null },
    { hole: 4, par: 3, distance: 110, you: 3, opp: 4, result: 'W', note: 'Hosel rocket but they donked it' },
    { hole: 5, par: 3, distance: 85, you: 2, opp: 3, result: 'W', note: 'Easy money' },
    { hole: 6, par: 3, distance: 72, you: null, opp: null, result: null, current: true },
    { hole: 7, par: 3, distance: 98 },
    { hole: 8, par: 3, distance: 58 },
    { hole: 9, par: 3, distance: 105 },
  ],
};

const MOCK_BADGES = [
  { id: 'b1', name: 'Closer', sub: 'Win a match 5&4 or better', rarity: 'uncommon', color: 'var(--forest)', count: 2, icon: 'flag' },
  { id: 'b2', name: 'Undefeated · 3', sub: '3 matches without a loss', rarity: 'uncommon', color: 'var(--clay)', count: 1, icon: 'fire' },
  { id: 'b3', name: 'Comeback', sub: 'Win after being 2 down', rarity: 'uncommon', color: 'var(--forest)', count: 1, icon: 'bolt' },
  { id: 'b4', name: 'Founding Member', sub: 'Week 1 believer', rarity: 'rare', color: 'var(--clay-deep)', count: 1, icon: 'trophy' },
  { id: 'b5', name: 'Major Mover', sub: 'Quarter-finals at a Major', rarity: 'rare', color: 'var(--clay)', count: 0, icon: 'trophy', locked: true },
  { id: 'b6', name: 'Dormie Dealer', sub: 'Clinch on hole 7 or earlier', rarity: 'legendary', color: 'var(--clay-deep)', count: 0, icon: 'ball', locked: true },
];

// Match-play history. result: 'W' | 'L' | 'H'  margin: like "3&2" or "1UP"
const MOCK_ROUND_HISTORY = [
  { id: 'r11', week: 'W11', course: 'Melreese', opp: 'Riv + Theo', partner: '@jaybird', result: 'W', margin: '2 UP', thru: 5, live: true, holesWon: 3, holesLost: 1 },
  { id: 'r10', week: 'W10', course: 'Melreese', opp: 'Dukes + Leo', partner: '@jaybird', result: 'L', margin: '2&1', holesWon: 3, holesLost: 5 },
  { id: 'r09', week: 'W09', course: 'Normandy', opp: 'Cami + Bea', partner: '@dukes', result: 'W', margin: '3&2', holesWon: 5, holesLost: 2 },
  { id: 'r08', week: 'W08', course: 'Melreese', opp: 'María + Nats', partner: '@jaybird', result: 'W', margin: '5&4', holesWon: 6, holesLost: 1, best: true },
  { id: 'r07', week: 'W07', course: 'Melreese', opp: 'Mike + Sal', partner: '@riv', result: 'L', margin: '1 DN', holesWon: 3, holesLost: 4 },
  { id: 'r06', week: 'W06', course: 'Palmetto', opp: 'Oscar + Tay', partner: '@jaybird', result: 'H', margin: 'AS', holesWon: 3, holesLost: 3 },
  { id: 'r05', week: 'W05', course: 'Melreese', opp: 'Pato + Bren', partner: '@theo.m', result: 'W', margin: '1 UP', holesWon: 4, holesLost: 3 },
  { id: 'r04', week: 'W04', course: 'Melreese', opp: 'Nia + Kim', partner: '@jaybird', result: 'L', margin: '2&1', holesWon: 3, holesLost: 5 },
];

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

const MOCK_ACTIVITY = [
  { id: 'a1', kind: 'match', user: '@dukes', detail: 'closed out @oscar 5&4', time: '2h ago', badge: '🏆' },
  { id: 'a2', kind: 'streak', user: '@jaybird', detail: 'is unbeaten in 6 matches', time: '4h ago', badge: '🔥' },
  { id: 'a3', kind: 'badge', user: '@maria.cg', detail: 'earned Closer', time: '1d' },
  { id: 'a4', kind: 'join', user: '@bigleo', detail: 'joined The Biltmore Major', time: '1d' },
  { id: 'a5', kind: 'h2h', user: '@riv', detail: 'is now 3-0-1 vs @theo.m', time: '2d' },
];

// Head-to-head for match play:
// - Partner: matches played TOGETHER (W-L-H as a team)
// - Rival: matches played AGAINST (W-L-H head-to-head)
const MOCK_H2H = [
  { vs: '@jaybird', kind: 'Partner', wins: 5, losses: 3, halved: 1, chemistry: 88, lastMargin: '2 UP' },
  { vs: '@dukes', kind: 'Rival', wins: 1, losses: 3, halved: 0, chemistry: null, lastMargin: 'L 2&1' },
  { vs: '@riv', kind: 'Rival', wins: 3, losses: 0, halved: 1, chemistry: null, lastMargin: 'W 2 UP' },
  { vs: '@theo.m', kind: 'Rival', wins: 2, losses: 2, halved: 0, chemistry: null, lastMargin: 'L 1 DN' },
  { vs: '@maria.cg', kind: 'Partner', wins: 1, losses: 1, halved: 0, chemistry: 74, lastMargin: 'W 3&2' },
];

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
