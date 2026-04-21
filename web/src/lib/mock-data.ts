// Mock data for Sandbox Pitch & Putt — Miami area.
// Ported from the root prototype's components/data.jsx.
// This will be replaced by Postgres-backed queries in a later PR.

export type Tier = "stats" | "league" | "leaguePlus" | "walkup";
export type MatchResult = "W" | "L" | "H";
export type EventStatus = "open" | "member-only" | "sold-out" | "live" | "past";

export type User = {
  id: string;
  handle: string;
  name: string;
  tier: Tier;
  foundingMember: boolean;
  sbx: number;
  sbxDelta: number;
  sbxTrend: number[];
  sbxReliability: number;
  sbxMatchesToProvisional: number;
  sbxPercentile: number;
  sbxPeak: number;
  sbxGlobalRank: number;
  homeCourse: string;
  bio: string;
  joined: string;
  eventsPlayed: number;
  matchesW: number;
  matchesL: number;
  matchesH: number;
  matchesTotal: number;
  holesWonTotal: number;
  holesLostTotal: number;
  holesHalvedTotal: number;
  seasonPoints: number;
  guestPassesLeft: number;
  streak: number;
  partnerWith: string;
  ig: string;
};

export type Friend = {
  id: string;
  handle: string;
  name: string;
  sbx: number;
  rel: number;
  avatar: string;
  color: string;
};

export type Event = {
  id: string;
  type: "weekly" | "major" | "corporate";
  courseName: string;
  courseShort: string;
  date: string;
  dateFull: string;
  time: string;
  field: number;
  filled: number;
  priceMember: number;
  priceWalkup: number;
  status: EventStatus;
  weekNum: number | null;
  tagline: string;
  img: string;
  description: string;
  isMajor?: boolean;
};

export type Hole = {
  hole: number;
  par: number;
  dist?: number;
  distance?: number;
  a?: number | null;
  b?: number | null;
  you?: number | null;
  opp?: number | null;
  result?: MatchResult | null;
  current?: boolean;
  note?: string | null;
};

export type LiveBoardMatch = {
  id: string;
  teams: string;
  state: number;
  thru: number;
  status: string;
  leader: "A" | "B" | null;
  isYou?: boolean;
};

export type Activity = {
  id: string;
  kind: "match" | "streak" | "badge" | "join" | "h2h";
  user: string;
  detail: string;
  time: string;
  badge?: string;
};

export const MOCK_USER: User = {
  id: "u_you",
  handle: "@alex.miami",
  name: "Alex Rivera",
  tier: "league",
  foundingMember: true,
  sbx: 5.412,
  sbxDelta: +0.043,
  sbxTrend: [4.82, 4.905, 5.11, 5.188, 5.24, 5.369, 5.412],
  sbxReliability: 0.78,
  sbxMatchesToProvisional: 0,
  sbxPercentile: 62,
  sbxPeak: 5.412,
  sbxGlobalRank: 1842,
  homeCourse: "Melreese",
  bio: "Brickell. Short game over everything.",
  joined: "Feb 2026",
  eventsPlayed: 11,
  matchesW: 11,
  matchesL: 7,
  matchesH: 2,
  matchesTotal: 20,
  holesWonTotal: 38,
  holesLostTotal: 32,
  holesHalvedTotal: 29,
  seasonPoints: 6.5,
  guestPassesLeft: 2,
  streak: 3,
  partnerWith: "jaybird",
  ig: "@alexrivera",
};

export const MOCK_FRIENDS: Friend[] = [
  { id: "u1", handle: "@jaybird", name: "Jay Soto", sbx: 5.891, rel: 0.92, avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=120&q=80&auto=format&fit=crop", color: "#1C492A" },
  { id: "u2", handle: "@maria.cg", name: "María Delgado", sbx: 4.23, rel: 0.71, avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&q=80&auto=format&fit=crop", color: "#B26A3B" },
  { id: "u3", handle: "@dukes", name: "Dukes Varela", sbx: 6.712, rel: 0.95, avatar: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?w=120&q=80&auto=format&fit=crop", color: "#3E8A57" },
  { id: "u4", handle: "@theo.m", name: "Theo Martín", sbx: 4.98, rel: 0.83, avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&q=80&auto=format&fit=crop", color: "#9A7B3F" },
  { id: "u5", handle: "@nats", name: "Natalie Cruz", sbx: 3.62, rel: 0.45, avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=120&q=80&auto=format&fit=crop", color: "#5A8C4A" },
  { id: "u6", handle: "@riv", name: "Riv Okafor", sbx: 5.54, rel: 0.8, avatar: "https://images.unsplash.com/photo-1527980965255-d3b416303d12?w=120&q=80&auto=format&fit=crop", color: "#7D4A2E" },
  { id: "u7", handle: "@camicu", name: "Cami Cu", sbx: 4.41, rel: 0.68, avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&q=80&auto=format&fit=crop", color: "#C57B48" },
  { id: "u8", handle: "@bigleo", name: "Leo Vega", sbx: 6.1, rel: 0.88, avatar: "https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=120&q=80&auto=format&fit=crop", color: "#2C6B43" },
];

export const MOCK_EVENTS: Event[] = [
  {
    id: "e_sat",
    type: "weekly",
    courseName: "Melreese International Links",
    courseShort: "Melreese",
    date: "Sat · Apr 25",
    dateFull: "Saturday, April 25, 2026",
    time: "7:30 AM",
    field: 56,
    filled: 43,
    priceMember: 28,
    priceWalkup: 85,
    status: "open",
    weekNum: 12,
    tagline: "The Home Game",
    img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80&auto=format&fit=crop",
    description: "Standard Saturday at the home course. Sunrise tee times. Cold brew and cortaditos on us.",
  },
  {
    id: "e_live",
    type: "weekly",
    courseName: "Melreese International Links",
    courseShort: "Melreese",
    date: "Right Now",
    dateFull: "Saturday, April 19, 2026 · LIVE",
    time: "Live · Hole 6",
    field: 48,
    filled: 48,
    priceMember: 28,
    priceWalkup: 85,
    status: "live",
    weekNum: 11,
    tagline: "Week 11 · Live",
    img: "https://images.unsplash.com/photo-1535132011086-b8818f016104?w=800&q=80&auto=format&fit=crop",
    description: "Live scoring. Follow your crew.",
  },
  {
    id: "e_maj",
    type: "major",
    courseName: "The Biltmore",
    courseShort: "Biltmore",
    date: "May 17",
    dateFull: "Saturday, May 17, 2026",
    time: "6:30 AM Shotgun",
    field: 80,
    filled: 34,
    priceMember: 95,
    priceWalkup: 175,
    status: "open",
    weekNum: null,
    tagline: "THE BILTMORE MAJOR",
    img: "https://images.unsplash.com/photo-1592919505780-303950717480?w=800&q=80&auto=format&fit=crop",
    description: "Season's first Major. Split-tee shotgun. Cold tower on 9.",
    isMajor: true,
  },
  {
    id: "e_wed",
    type: "weekly",
    courseName: "Normandy Shores",
    courseShort: "Normandy",
    date: "Wed · Apr 29",
    dateFull: "Wednesday, April 29, 2026",
    time: "6:00 PM · Twilight",
    field: 40,
    filled: 12,
    priceMember: 28,
    priceWalkup: 85,
    status: "member-only",
    weekNum: 12,
    tagline: "Miami Beach Twilight",
    img: "https://images.unsplash.com/photo-1600740288397-83469a3efd9b?w=800&q=80&auto=format&fit=crop",
    description: "Member-only twilight league. Cap at 40.",
  },
  {
    id: "e_may2",
    type: "weekly",
    courseName: "Palmetto Golf Course",
    courseShort: "Palmetto",
    date: "Sat · May 2",
    dateFull: "Saturday, May 2, 2026",
    time: "7:30 AM",
    field: 56,
    filled: 8,
    priceMember: 28,
    priceWalkup: 85,
    status: "open",
    weekNum: 13,
    tagline: "Kendall Run",
    img: "https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?w=800&q=80&auto=format&fit=crop",
    description: "Kendall heads get your reps in.",
  },
];

export const MOCK_LIVE = {
  eventId: "e_live",
  course: "Melreese",
  currentHole: 6,
  totalHoles: 9,
  yourMatch: {
    id: "m_you",
    teamA: { name: "Jay + Alex", isYou: true, avatars: ["@jaybird", "@alex.miami"] },
    teamB: { name: "Riv + Theo", isYou: false, avatars: ["@riv", "@theo.m"] },
    state: 2,
    thru: 5,
    remaining: 4,
    holes: [
      { hole: 1, par: 3, dist: 78, a: 2, b: 3, result: "W" as const },
      { hole: 2, par: 3, dist: 92, a: 3, b: 3, result: "H" as const },
      { hole: 3, par: 3, dist: 65, a: 3, b: 2, result: "L" as const },
      { hole: 4, par: 3, dist: 110, a: 3, b: 4, result: "W" as const },
      { hole: 5, par: 3, dist: 85, a: 2, b: 3, result: "W" as const },
      { hole: 6, par: 3, dist: 72, a: null, b: null, result: null, current: true },
      { hole: 7, par: 3, dist: 98 },
      { hole: 8, par: 3, dist: 58 },
      { hole: 9, par: 3, dist: 105 },
    ],
  },
  matches: [
    { id: "m1", teams: "Dukes + Leo vs Oscar + Tay", state: 5, thru: 6, status: "DORMIE", leader: "A" as const },
    { id: "m2", teams: "Mike + Sal vs Pato + Bren", state: 3, thru: 5, status: "3 UP", leader: "A" as const },
    { id: "m_you", teams: "Jay + Alex vs Riv + Theo", state: 2, thru: 5, status: "2 UP", leader: "A" as const, isYou: true },
    { id: "m3", teams: "María + Nats vs Cami + Bea", state: 1, thru: 6, status: "1 UP", leader: "A" as const },
    { id: "m4", teams: "Beto + Sam vs Ruth + Kai", state: 0, thru: 5, status: "AS", leader: null },
    { id: "m5", teams: "Zoe + Cris vs Tomás + Pau", state: 1, thru: 6, status: "1 UP", leader: "B" as const },
    { id: "m6", teams: "Nia + Kim vs Rafa + Joel", state: 2, thru: 4, status: "2 UP", leader: "B" as const },
  ] satisfies LiveBoardMatch[],
};

export const MOCK_ACTIVITY: Activity[] = [
  { id: "a1", kind: "match", user: "@dukes", detail: "closed out @oscar 5&4", time: "2h ago", badge: "🏆" },
  { id: "a2", kind: "streak", user: "@jaybird", detail: "is unbeaten in 6 matches", time: "4h ago", badge: "🔥" },
  { id: "a3", kind: "badge", user: "@maria.cg", detail: "earned Closer", time: "1d" },
  { id: "a4", kind: "join", user: "@bigleo", detail: "joined The Biltmore Major", time: "1d" },
  { id: "a5", kind: "h2h", user: "@riv", detail: "is now 3-0-1 vs @theo.m", time: "2d" },
];
