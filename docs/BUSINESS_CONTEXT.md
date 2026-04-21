# Sandbox Pitch & Putt — Business & Product Context

> **Purpose of this document:** This is the source-of-truth context file for anyone (human or AI) building software for Sandbox Pitch & Putt. Read this before writing a line of code. Every feature, copy decision, and data model should be consistent with what's described here.

---

## 1. Elevator pitch (what this business is)

**Sandbox Pitch & Putt** is a membership-based competitive golf league and event company operating on real golf courses. We rent underutilized tee-time slots at existing golf courses, lay down artificial turf tee mats at 50–120 yard distances from the actual holes, and run short, fast, fun 9-hole **2-man scramble** pitch-and-putt events. Events run in roughly **1 hour**. We package these events into a **weekly cadence** so that members can attend regularly.

We monetize through:
1. **Event ticket sales** (walk-up / single entry)
2. **Monthly memberships** (recurring revenue; the core business)
3. **A standalone stats subscription** (tracking, leaderboards, handicap — the data product)
4. **Corporate / private buyouts** (B2B team-building events)
5. **Sponsorships and content monetization** (as we grow the audience)

We capture content at every event to grow an audience, build a brand, and fuel sponsor revenue. The long-term vision is a national network of local competitive pitch-and-putt leagues with a data platform on top.

**Starting market:** Miami-Dade County, South Florida.

---

## 2. The product (the event itself)

### Format
- **9 holes** played on a real golf course
- **2-man scramble** (teams of 2; best-ball scramble rules — both players hit, pick best, hit again)
- Tee shots taken from **artificial turf tee mats placed 50–120 yards** from the hole (not from the actual tee box)
- Standard putting on the actual greens
- Designed for **~1 hour** of play per team

### Event pacing
- Groups sent out every **5–7 minutes** (4 people = 2 teams of 2 per group)
- **2-hour event window** from first tee off to last team finished
- **~40–60 players per event** standard; up to 80+ with split-tee/shotgun start
- Morning or twilight slots to avoid Miami afternoon heat/storms

### Event cadence
- **Weekly events** at a primary course (the "home course")
- Occasional "**Major**" events at higher-profile courses (4/year target)
- Corporate / private buyout events scheduled as booked

---

## 3. Business model & revenue streams

### Revenue streams
1. **Walk-up event tickets** — single-event entry, no commitment
2. **League Memberships** — monthly recurring; includes a set number of events + stats + perks
3. **League Plus Memberships** — premium tier; unlimited or enhanced access
4. **Stats Membership** — standalone subscription to data/leaderboard product; no event access
5. **Corporate / Private Event Buyouts** — customized private events for companies
6. **Major Event Tickets** — premium-priced special events at marquee venues
7. **Sponsorships** — brand activations at events; content sponsorships
8. **Merchandise** — member apparel, hats, accessories (secondary)
9. **Content monetization** — YouTube, social, eventually streaming (longer-term)

### Cost structure (per event)
- Course rental (flat fee for 2-hour window)
- Staff (3–4 on-site per event)
- Turf mats, signage, insurance
- Content capture (videographer)
- Prizes / giveaways
- F&B (typically stays with course, not Sandbox)

### Unit economics philosophy
- Event-level margin is secondary — events are the **acquisition mechanism**
- **Memberships are the business** — recurring revenue is the real asset
- **Stats subscription is the high-margin, low-cost growth lever**
- **Corporate events subsidize brand-building and content in Year 1**

---

## 4. Pricing framework (principles, not numbers)

> ⚠️ **No prices are hardcoded in this document.** The team is actively testing pricing. The following are **principles** that must hold regardless of the specific dollar amounts landed on.

### Core pricing principles

**Principle 1 — The inversion rule (critical):**
> A single walk-up ticket must cost **more** than the monthly League Membership. This creates a clear economic motivation to become a member. Even if someone only plans to attend one event per month, membership should be cheaper than walking up.

**Principle 2 — Effective per-event member cost is ~25–35% of walk-up:**
> If a member attends 4 events/month, their effective per-event cost should be roughly 1/3 of walk-up pricing. This is the "unmistakable deal" feel.

**Principle 3 — Stats-only tier is a light, friction-free subscription:**
> Stats Membership should be priced like a Netflix-class monthly sub — low enough that sign-up is not a decision, high enough to communicate value. Roughly 20–25% of the League Membership price.

**Principle 4 — League Plus is ~1.6–1.8x the base League Membership:**
> Premium tier is for members who want unlimited events and upgraded perks.

**Principle 5 — Corporate buyouts are priced on replacement value:**
> A corporate event = (typical event contribution margin × 1.5–2.0) + direct event costs + any custom work (branding, catering, content).

**Principle 6 — Majors are priced above standard walk-ups:**
> Special events at premium venues justify 1.3–2.0x the standard walk-up. Members get a member-preferred rate.

### Tier summary (price-agnostic)

| Tier | What's included | Role in business |
|---|---|---|
| **Walk-up ticket** | Single-event entry, basic stats for that event only | Top-of-funnel, conversion driver |
| **Stats Membership** | Full stats history, handicap, leaderboards, head-to-head, streaks, badges | Light entry; data product; retention hook |
| **League Membership** | 4 events/month + all stats + priority registration + guest pass(es) + quarterly swag + member-only events + birthday event | Core recurring revenue |
| **League Plus** | Unlimited events + Plus-tier perks (more guest passes, Majors discount, directory, pro content) | Power user / avid tier |
| **Major event ticket** | Single Major entry at premium course | Premium event revenue |
| **Corporate buyout** | Private event, custom branding, content deliverable, flexible size | B2B cash cow |

---

## 5. Target market

### Geographic
- **Starting market: Miami-Dade County, FL**
- Initial "home course": target is a Miami-Dade municipal or accessible daily-fee course (e.g., Melreese / International Links, Country Club of Miami, Palmetto, Biltmore, Crandon Park, Normandy Shores, Miami Beach GC)
- "Major" venues (Year 1–2): Biltmore, Crandon, Trump Doral, PGA National, Boca Resort (up I-95)
- Expansion targets (Year 2+): Tampa, Orlando, Palm Beach, then other southern/growth markets

### Primary customer personas

**Persona A — "Alex in Brickell" (primary walk-up and core member)**
- 28–38 years old
- Works in finance / tech / VC / crypto / real estate / law
- Miami transplant or local
- Household income $150K+
- Plays golf 15–30 rounds/year; intermediate-level
- Lives in Brickell, Edgewater, Wynwood, Coral Gables, Coconut Grove
- Social, nightlife-oriented, content-active
- Skewed male but with growing mixed groups

**Persona B — "Maria in Coral Gables" (female segment, major growth opportunity)**
- 30–45 years old
- Professional (lawyer, marketing, hospitality, real estate)
- Bilingual (Spanish/English)
- Plays golf socially, not competitively
- Intimidated by traditional 18-hole / country-club golf
- Brings 3 girlfriends as a foursome

**Persona C — "The Corporate Buyer" (B2B target)**
- HR / Events / Culture lead at a Miami company
- Buys 2–4 team-building events/year
- Budget range: $25K–$75K per event
- Target companies: Citadel, Hard Rock, Akerman, BofA Miami, Lennar, Royal Caribbean, Carnival, Microsoft Miami, ICE, local fintech/crypto

### Demographic opportunities (underserved)
- **Women** (28% of on-course golfers nationally, growing +46% since 2019)
- **Hispanic/Latino** (45% of Miami-Dade population; largely underserved by traditional golf)
- **Young professionals** (18–34 = largest golfer age cohort nationally)
- **Off-course-only golfers** (Topgolf/sim users who want a real-course entry point)

---

## 6. Industry context (the data that validates the thesis)

> Source: NGF (National Golf Foundation) 2026 reports — all data reflects 2025 year-end.

### Macro industry
- **48.1M total U.S. golf participants** (on + off-course); highest ever, +41% vs 2019
- **29.1M on-course golfers**; 8th consecutive year of growth
- **37.9M off-course participants** (sims, Topgolf, mini-golf, range) — has exceeded on-course since 2022
- **549M rounds played in 2025** — 4th record in 5 years
- **$102B direct industry; $227B total economic output**

### Why our thesis holds
- **72% of Core golfers say they'd play more team events if available** — direct validation
- **Par-3 / short-course supply down 20% since 2004** — underserved format
- **9-hole play is 31% of 18–34 year olds' golf** — young golfers want short format
- **2/3 of new beginners arrive from off-course experience** — funnel exists
- **Women lapse at 2x the rate of men** — comfort/competence gap our format addresses
- **70% of courses at or near capacity** — but off-peak slots exist (our window)
- **Public courses' financial health at 15-year high** — operators open to creative programming
- **76% of Core golfers use golf apps** (avg 3.5) — data product has demonstrated demand

### Why Miami specifically
- **FL #1 in courses (1,290); Miami metro has 520K golfers** (top 10 metro nationally)
- **Year-round golf season** (52-week cadence works; no winter hedge needed)
- **FL rounds +4.1% YoY in 2025** — growth market
- **FL avg green fee $58** (above national $47) — operators have pricing power; we bring off-peak revenue
- **Miami is culturally event-native** (nightlife, experiential, content-heavy, bilingual)
- **Affluent density** supports premium pricing
- **Caveat: FL is 47% private (2nd-highest)** — course access is harder; must target municipals and value daily-fee

---

## 7. Brand & positioning

### Brand name
**Sandbox Pitch & Putt** (working name / current direction)

### Tone / positioning
- **Premium but accessible** — not country-club stuffy, not frat-house cheap
- **Social-first, competitive-second** — golf is the vehicle for the experience
- **Content-native** — designed to be shared, photographed, clipped
- **Inclusive** — welcoming to women, newer golfers, diverse demographics
- **Miami-coded without being clichéd** — confidence, design, aesthetic matters

### Positioning statement (draft)
> *"A pitch and putt competition league for people who don't have time to play 18."*

### Reference brands (tonally aspirational)
- Equinox (premium, aspirational)
- Barry's / F45 (community, member-first)
- SoulCycle (experiential, cult-like)
- LIV Golf (social, modern)
- Soho House / The Battery (membership culture)
- Topgolf (casual golf entry point)
- Good Good Golf (content-first golf brand)

### What we are NOT
- A driving range
- A charity tournament organizer
- A private country club
- A golf lesson company
- A one-off event company
- A traditional 18-hole course

---

## 8. Webapp — what the software needs to do

This is the **primary build target**. The webapp is the customer-facing product and the operational backbone.

### User-facing functionality (consumer app)

**Auth & Account**
- Sign up / sign in (email + password; social OAuth later)
- User profile (name, handle, photo, home course, bio, Instagram)
- Notification preferences (email, push, SMS)

**Events Discovery & Registration**
- Browse upcoming events (weekly cadence + Majors)
- Event detail page (course, date/time, format, field size, member vs non-member pricing)
- Priority-registration window for members (pre-public opening)
- Register for event → pay → confirmation + calendar add
- Guest pass redemption (members bring +1 at discount/free)
- Waitlist when events sell out
- Member-only events (gated registration)

**Membership Management**
- Plans page (Stats / League / League Plus tiers)
- Sign up for membership (recurring billing via Stripe)
- Upgrade / downgrade between tiers
- Cancel / pause membership
- Billing history
- Guest pass balance tracking (for League members)
- Founding-member / grandfathered pricing support

**Stats Product (core feature — build this properly)**
- Round history (every event the user has played)
- **Sandbox Pitch-and-Putt Handicap™** (proprietary rating system based on event results)
- Personal stats dashboard (avg score, best round, scoring trends, by-distance performance if shot-level data added later)
- Leaderboards:
  - Per event
  - Per city / per month
  - All-time
  - By handicap bucket
- Head-to-head records vs friends/other members
- Streaks and badges (e.g., sub-40 rounds, event attendance streaks, partner win%)
- Shareable achievement cards ("I just shot my career low of 38" with an image export for social)
- Partner / 2-man team stats (combo win%, chemistry, all-time records together)

**Social / Community**
- Follow other members
- Member directory (League Plus feature; filterable by handicap, skill, availability)
- Find-a-partner feature (matchmaking for members who need a 2-man partner)
- Activity feed (events attended, badges earned by followed users)
- Comment / react on results

**Content Hub**
- Video episodes from past events
- Clip gallery
- Podcast (later)
- Written recap articles

**Merch / Add-ons**
- Member merch drops (quarterly)
- Single-event add-ons (highlight reel, photo package)

### Admin / Operational functionality

**Event Management**
- Create event (course, date, time, capacity, pricing, format, field size)
- Open/close registration windows
- Shotgun start assignment / tee group builder
- Scorecard entry / live leaderboard feed during event
- Post-event results publishing
- Handicap calculation rerun
- Content tagging (player photos, clips to individual users)

**Member Management**
- View all members, filter by tier, tenure, attendance
- Manually comp / credit a member (e.g., weather cancellation)
- Issue guest passes
- Grandfather / founder rate administration
- Churn dashboard

**Course Partner Management**
- Track course partners, weekly slot contracts, rental cost history
- Upcoming event venue assignments
- Revenue share calculations if applicable

**Financial / Ops**
- Payment reconciliation (Stripe integration)
- Revenue reporting by channel (walk-up, member, corporate, Major, sponsor)
- Refund / credit flow
- Corporate event custom-quote builder and invoice flow

**Sponsor Management** (later phase)
- Sponsor deals, activation schedule, event-level placement
- Content deliverables tracking

**Content Ops** (later phase)
- Video upload, tagging, distribution to member feeds
- Photo gallery management

### Core data entities (suggested)
- `User` (account holder)
- `Membership` (tier, status, start/end, price locked in, billing)
- `Course` (partner courses; name, address, holes, photos)
- `Event` (course, date, time, format, field size, status, pricing)
- `Registration` (user × event; walk-up or member; paid/free; guest or primary)
- `Team` (2-man team per event; scramble pairing)
- `Round` (per team per event; scores per hole)
- `Score` (per hole for a team/round)
- `Handicap` (user's rolling proprietary rating)
- `Badge` / `Streak` / `Achievement`
- `GuestPass` (member benefit, tracked balance)
- `CorporateEvent` (private buyout details, custom pricing)
- `Sponsor` / `SponsorActivation`
- `ContentAsset` (video, photo, clip) tagged to events and users

### Tech considerations
- **Payments:** Stripe (subscriptions for memberships + one-time for tickets)
- **Email:** Postmark / Resend for transactional; Klaviyo or similar for marketing
- **Auth:** standard (hosted auth like Clerk/Auth.js acceptable)
- **Media storage:** S3 or equivalent for content assets
- **Database:** Postgres
- **Mobile:** web-first responsive now; native mobile app later (stats product is most mobile-native feature eventually)

---

## 9. Key business rules (non-obvious logic)

These are rules the software must enforce that aren't intuitive:

1. **Walk-up ticket price must always be greater than the current monthly League Membership price.** If membership price changes, walk-up minimum must adjust. This should be a configurable ratio/multiplier in admin settings, not hardcoded.

2. **Priority registration window for members.** Events open to members X hours/days before public walk-ups. Configurable per event.

3. **Member attendance cap per event.** To protect walk-up revenue, cap % of event field that can be members (e.g., max 60%). This forces overflow members into Majors or future events.

4. **Guest pass rules.** League members get N guest passes/month (non-rollover); League Plus get more. Guest passes apply as entry fee for a non-member brought by a member.

5. **Grandfather pricing.** Early/founding members keep their original rate regardless of future price increases. Must be preserved in DB per subscription.

6. **Handicap calculation.** Rolling average of best N of last M scores (specifics TBD). Must be deterministic and recomputable. Show "provisional" status until user has played minimum event count.

7. **Scramble scoring logic.** For 2-man scramble: each hole gets ONE score for the team (best ball after scramble rules). Individual player "stats" are attributed to their team's score with some future logic around shot-level tracking.

8. **Weekly cadence.** There's an expectation that a "home course" event runs every week (same day, same time). Rescheduling for weather/hurricane must be handled with member credit logic.

9. **Majors are separate event-type.** They have different pricing, capacity, often non-members pay premium. Flag in event schema.

10. **Stats-only members CAN'T register for events without paying walk-up.** Enforce this. They're a different product.

11. **Corporate events are private.** Don't appear in public event listing; separate flow.

12. **Content rights.** By registering for an event, user grants Sandbox the right to use photos/video of them in marketing. Include in TOS.

---

## 10. Operational context

### Course partnership model
- Target: **weekly 2-hour slot lease** at one "home course" in Miami-Dade
- Operator benefit pitch: guaranteed recurring revenue on off-peak slot + new customer introductions + content exposure
- Course keeps 100% of F&B revenue (non-negotiable)
- Course retains email capture rights shared with Sandbox
- Force majeure clause for weather / hurricane
- Always have a **backup course** booked for redundancy

### Seasonality
- **Peak season:** Nov–Apr (snowbirds, tourism, best weather, corporate event season)
- **Shoulder:** May, Oct
- **Off-peak / challenging:** Jun–Sep (heat + hurricane season; morning-only events; potentially partner with indoor sim venue for summer league variant)

### Hurricane protocol
- 1+ week weather warnings trigger event postponement/cancellation
- Members receive credit (extra event value) for missed events
- Event cancellation insurance held

### Content capture workflow
- Videographer at every event
- Content tagged to individual users in app (member clips)
- 1 long-form episode per event (YouTube); 5–10 short-form clips (TikTok/Reels/Shorts)
- Character-driven season narrative over time (rivalries, underdogs, recurring personalities)

---

## 11. Sponsorship & partnerships

### Target sponsor categories
1. Premium spirits (tequila, mezcal, rum)
2. Fintech / crypto
3. Luxury real estate
4. Apparel (TravisMathew, G/FORE, Malbon, Eastside, Metalwood)
5. Hospitality groups (hotels, restaurant groups)
6. Golf equipment OEMs (Titleist, TaylorMade, Callaway, PING — Year 2+)

### Sponsor activation types
- Event naming / presenting
- On-site activation (booth, sampling, trial)
- Content series sponsorship
- Prize sponsor
- Member benefit (discount/offer)

### Partner category opportunities
- Topgolf / sim venues (cross-funnel; summer league variant)
- Apparel brands (member merch drops, co-branded kits)
- Miami hospitality (Majors after-parties, member benefits)
- Youth on Course (nonprofit halo + operator credibility)

---

## 12. Future direction (post-MVP roadmap)

Not immediate, but relevant for architecture decisions:

- **Multi-city expansion** (data model should be city-scoped from day one)
- **Native mobile app** (stats product is most natural here)
- **Shot-level tracking** (GPS or manual entry per shot — richer stats)
- **Partner matchmaking algorithm** (find 2-man teammates at similar skill)
- **Tournament/bracket structures** (season championships, regional playoffs)
- **Live leaderboard during events** (real-time scoring visible to spectators)
- **Live streaming** of Majors and Championships
- **Member directory with filters** (skill, availability, location)
- **Partner brand marketplace** (members-only discounts)
- **Indoor sim variant** for summer / winter / weather contingency
- **National league structure** once multi-city (inter-city competition, a la club sports leagues)

---

## 13. What Sandbox Pitch & Putt is NOT (to prevent scope drift)

- **Not a tee-time booking platform** (we don't sell rounds at courses generally)
- **Not a traditional golf handicap service** (we track our own format; not USGA/GHIN)
- **Not a golf instruction company** (we may layer in content but it's not the product)
- **Not a country club or standing membership club** (members don't get all-day course access)
- **Not a merchandise-first brand** (apparel/merch is a member benefit, not a core product)
- **Not an 18-hole tournament company** (our entire identity is short-format)

---

## 14. Glossary (for unambiguous code/copy)

- **Event** — A single scheduled 2-hour pitch-and-putt session at a course.
- **Major** — A higher-tier event at a premium venue with larger field and bigger prizes.
- **League Member** — A monthly-subscribing customer at the base tier.
- **League Plus Member** — A monthly-subscribing customer at the premium tier.
- **Stats Member** — A subscriber to only the stats/data product; no event access.
- **Walk-up** — A non-member buying a single event ticket.
- **Guest** — A non-member attending as a member's +1 using a guest pass.
- **Home Course** — The primary course where weekly events run.
- **Scramble** — Team format where both players hit, pick the best ball, and both play from that spot.
- **Pitch-and-Putt Handicap** — Sandbox's proprietary competitive rating system based on event results.
- **Founding Member** — Early sign-up with grandfathered pricing.
- **Season** — A defined programming cycle (e.g., 9 months + championship), subject to design.

---

## 15. Contact / ownership

- **Founder / Business Lead:** [Your name — fill in]
- **Operating base:** Miami-Dade County, FL
- **Company entity:** [TBD]
- **Website / domain:** [TBD]

---

**Last updated:** 2026-04-19
**Document owner:** Founder
**Intended readers:** Engineers, AI coding assistants, designers, business partners, early hires
