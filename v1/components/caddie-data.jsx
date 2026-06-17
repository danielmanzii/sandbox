/* global window */
// "Whose ball?" caddie (Phase D6) — TourCast/AWS-style suggestion.
//
// Compares two candidate ball positions on the green and recommends which
// to play, with a par-or-better make probability for each. Ships on
// calibrated PRIORS so it works day one; blends toward our own data as
// matches accumulate (see blendLearned).

// P(par-or-better | green zone) for pitch-and-putt — calibrated priors.
const ZONE_MAKE_PROB = {
  'Pin high': 0.74,
  'Short':    0.58, 'Long':    0.52, 'Left':    0.55, 'Right':    0.55,
  'Short L':  0.47, 'Short R': 0.47, 'Long L':  0.41, 'Long R':   0.41,
};
const SANDBOX_AVG = 0.55; // network baseline, for the "vs avg" line

function zoneProb(zone) {
  if (!zone) return null;
  return ZONE_MAKE_PROB[zone] != null ? ZONE_MAKE_PROB[zone] : SANDBOX_AVG;
}

// Recommend between two players' ball positions.
// players = [{id, name}], zones = { [playerId]: zoneLabel }
// Returns null until both zones are set, else a suggestion object.
function suggestBall(players, zones) {
  if (!players || players.length !== 2) return null;
  const [a, b] = players;
  const za = zones[a.id], zb = zones[b.id];
  if (!za || !zb) return null;
  const pa = zoneProb(za), pb = zoneProb(zb);
  let pick;
  if (Math.abs(pa - pb) < 0.02) pick = 'tie';
  else pick = pa > pb ? a.id : b.id;
  const best = pick === 'tie' ? null : (pick === a.id ? a : b);
  const bestP = Math.max(pa, pb);
  return {
    pick, best,
    pa, pb,
    line: pick === 'tie'
      ? `Coin flip — both balls par about ${Math.round(bestP * 100)}% of the time.`
      : `Take ${best.name}'s ball — ${Math.round(bestP * 100)}% par-or-better from ${zones[best.id]}, vs ${Math.round(Math.min(pa, pb) * 100)}% from the other. (Sandbox avg ${Math.round(SANDBOX_AVG * 100)}%.)`,
  };
}

Object.assign(window, { ZONE_MAKE_PROB, zoneProb, suggestBall });
