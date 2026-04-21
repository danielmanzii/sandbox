"use client";

import { getCurrentUser } from "@/lib/auth";
import { MOCK_ACTIVITY, MOCK_EVENTS, MOCK_FRIENDS, MOCK_LIVE, type Event } from "@/lib/mock-data";
import { Wordmark } from "@/components/brand";
import { Button, Chip, Eyebrow, LiveDot } from "@/components/ui";
import * as Icon from "@/components/icons";

// Home screen — ported from root components/screens/home.jsx.
// Navigation is currently stubbed (logs to console). Wire up when event detail
// and live scorecard pages land — see docs/handoff/.

type GoTarget = { screen: string; eventId?: string };
const go = (target: GoTarget) => {
  // TODO: replace with useRouter().push('/events/' + id) once routes exist.
  // Keeping as a stub so the port stays framework-agnostic for now.
  if (typeof window !== "undefined") console.log("[nav stub]", target);
};

export default function HomePage() {
  const user = getCurrentUser();
  const tier = user.tier;
  const mascot = "full" as const;
  const liveMode = false;

  const nextEvent = liveMode
    ? MOCK_EVENTS.find((e) => e.status === "live")
    : MOCK_EVENTS.find((e) => e.status === "open" && !e.isMajor);
  const major = MOCK_EVENTS.find((e) => e.isMajor);
  const isMember = tier === "league" || tier === "leaguePlus";

  return (
    <div style={{ background: "var(--canvas)", minHeight: "100%", paddingBottom: 120, flex: 1 }}>
      {/* Brand bar */}
      <div
        style={{
          padding: "58px 20px 20px",
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          background: "var(--canvas)",
          color: "var(--ink)",
          position: "relative",
        }}
      >
        <div style={{ position: "relative" }}>
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--forest)",
              opacity: 0.55,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
            }}
          >
            MIAMI / WK 12
          </div>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 40,
              lineHeight: 0.92,
              marginTop: 8,
              letterSpacing: "-0.02em",
              color: "var(--forest)",
            }}
          >
            Hey, {user.name.split(" ")[0]}.
          </div>
          <div
            className="caption-serif"
            style={{ fontSize: 16, opacity: 0.65, marginTop: 4, color: "var(--forest)" }}
          >
            The birds are restless.
          </div>
        </div>
        <button
          aria-label="Notifications"
          style={{
            width: 42,
            height: 42,
            borderRadius: 999,
            background: "var(--paper)",
            border: "var(--hairline)",
            boxShadow: "var(--shadow-sm)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
            color: "var(--forest)",
            flexShrink: 0,
            marginTop: 4,
          }}
        >
          <svg width="16" height="18" viewBox="0 0 24 24" fill="none">
            <path d="M12 2a6 6 0 0 0-6 6v4l-2 3h16l-2-3V8a6 6 0 0 0-6-6z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
            <path d="M10 19a2 2 0 0 0 4 0" stroke="currentColor" strokeWidth="2" />
          </svg>
          <span
            style={{
              position: "absolute",
              top: 9,
              right: 10,
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--forest)",
              border: "1.5px solid var(--paper)",
            }}
          />
        </button>
      </div>

      {/* Next-up card */}
      {nextEvent && (
        <div style={{ padding: "16px 16px 0" }}>
          <NextUpCard event={nextEvent} isMember={isMember} mascot={mascot} />
        </div>
      )}

      {/* Quick stats strip */}
      <div
        className="scroll-hide"
        style={{ display: "flex", gap: 10, padding: "16px 16px 0", overflowX: "auto" }}
      >
        <QuickStat
          label="SBX"
          value={user.sbx.toFixed(3)}
          trend={`+${user.sbxDelta.toFixed(3)}`}
          sub={`top ${100 - user.sbxPercentile}%`}
          locked={!isMember && tier !== "stats"}
          featured
        />
        <QuickStat label="Record" value={`${user.matchesW}–${user.matchesL}–${user.matchesH}`} sub="season" />
        <QuickStat label="Unbeaten" value={String(user.streak)} sub="matches" icon={<Icon.Fire size={14} color="var(--forest)" />} />
        <QuickStat label="Passes" value={String(user.guestPassesLeft)} sub="this mo" />
      </div>

      {/* Major banner */}
      {major && (
        <div style={{ padding: "16px 16px 0" }}>
          <button
            onClick={() => go({ screen: "eventDetail", eventId: major.id })}
            style={{
              width: "100%",
              textAlign: "left",
              borderRadius: "var(--radius-card-lg)",
              overflow: "hidden",
              background: "linear-gradient(135deg, var(--forest-dark) 0%, var(--forest) 45%, var(--moss) 100%)",
              color: "var(--cream)",
              padding: 22,
              position: "relative",
              border: "none",
              display: "block",
              boxShadow: "var(--shadow-md)",
            }}
          >
            <div style={{ position: "absolute", right: -24, top: -24, opacity: 0.14 }}>
              <img src="/assets/mascot-full-cream.svg" alt="" style={{ width: 180, transform: "rotate(14deg)" }} />
            </div>
            <div className="grain" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />
            <div style={{ position: "relative" }}>
              <div
                style={{
                  display: "inline-block",
                  padding: "5px 10px",
                  borderRadius: 999,
                  background: "rgba(234,226,206,0.12)",
                  backdropFilter: "blur(10px)",
                  border: "1px solid rgba(234,226,206,0.22)",
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: "0.16em",
                  textTransform: "uppercase",
                }}
              >
                ⛳ Major
              </div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontSize: 34,
                  lineHeight: 0.9,
                  marginTop: 12,
                  letterSpacing: "-0.02em",
                }}
              >
                {major.courseShort.toUpperCase()}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontFamily: "var(--font-mono)",
                  opacity: 0.7,
                  marginTop: 8,
                  letterSpacing: "0.06em",
                }}
              >
                MAY 17 · SHOTGUN · {major.field} PLAYERS
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 18, gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      height: 4,
                      borderRadius: 999,
                      background: "rgba(234,226,206,0.14)",
                      position: "relative",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        width: `${(major.filled / major.field) * 100}%`,
                        height: "100%",
                        background: "var(--cream)",
                        borderRadius: 999,
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", opacity: 0.7, marginTop: 6, letterSpacing: "0.06em" }}>
                    {major.filled}/{major.field} REGISTERED
                  </div>
                </div>
                <div
                  style={{
                    padding: "9px 14px",
                    borderRadius: 999,
                    background: "var(--cream)",
                    color: "var(--forest)",
                    fontSize: 12,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    boxShadow: "0 6px 14px rgba(14,28,19,0.25)",
                  }}
                >
                  Register <Icon.ArrowRight size={14} />
                </div>
              </div>
            </div>
          </button>
        </div>
      )}

      {/* Activity feed */}
      <div style={{ padding: "28px 16px 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            padding: "0 4px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--forest)",
              opacity: 0.55,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            The Feed
          </div>
          <button
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--forest)",
              opacity: 0.7,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "var(--font-mono)",
            }}
          >
            See all →
          </button>
        </div>
        <div className="card" style={{ padding: "6px 4px" }}>
          {MOCK_ACTIVITY.map((a, i) => (
            <div
              key={a.id}
              style={{
                padding: "14px 14px",
                display: "flex",
                alignItems: "center",
                gap: 12,
                borderBottom: i < MOCK_ACTIVITY.length - 1 ? "1px solid rgba(14,28,19,0.05)" : "none",
              }}
            >
              <AvatarBy handle={a.user} size={36} />
              <div style={{ flex: 1, fontSize: 13, lineHeight: 1.4 }}>
                <span style={{ fontWeight: 700, color: "var(--forest)" }}>{a.user}</span>
                <span style={{ opacity: 0.7 }}> {a.detail}</span>
              </div>
              {a.badge && <span style={{ fontSize: 18 }}>{a.badge}</span>}
              <span
                style={{
                  fontSize: 10,
                  opacity: 0.5,
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                  fontFamily: "var(--font-mono)",
                }}
              >
                {a.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Upcoming events teaser */}
      <div style={{ padding: "28px 0 0" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 12,
            padding: "0 20px",
          }}
        >
          <div
            style={{
              fontSize: 11,
              fontFamily: "var(--font-mono)",
              color: "var(--forest)",
              opacity: 0.55,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
            }}
          >
            Up Next
          </div>
          <button
            onClick={() => go({ screen: "events" })}
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "var(--forest)",
              opacity: 0.7,
              textTransform: "uppercase",
              letterSpacing: "0.12em",
              fontFamily: "var(--font-mono)",
            }}
          >
            Browse all →
          </button>
        </div>
        <div
          className="scroll-hide"
          style={{ display: "flex", gap: 12, overflowX: "auto", padding: "0 16px 4px" }}
        >
          {MOCK_EVENTS.filter((e) => e.status !== "live")
            .slice(0, 3)
            .map((e) => (
              <MiniEventCard key={e.id} event={e} />
            ))}
        </div>
      </div>

      {/* Brand foot */}
      <div style={{ textAlign: "center", padding: "56px 16px 24px", opacity: 0.18 }}>
        <Wordmark variant="forest" size={120} style={{ margin: "0 auto" }} />
        <div
          style={{
            fontSize: 10,
            fontFamily: "var(--font-mono)",
            color: "var(--forest)",
            marginTop: 8,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
          }}
        >
          Pitch & Putt · Miami
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────

function NextUpCard({
  event,
  isMember,
  mascot,
}: {
  event: Event;
  isMember: boolean;
  mascot: "full" | "none";
}) {
  const live = event.status === "live";
  return (
    <button
      onClick={() => go({ screen: live ? "live" : "eventDetail", eventId: event.id })}
      className="card-hero"
      style={{
        width: "100%",
        textAlign: "left",
        background: "var(--forest)",
        color: "var(--cream)",
        padding: 0,
        border: "none",
        position: "relative",
        display: "block",
      }}
    >
      <div
        style={{
          height: 200,
          backgroundImage: `linear-gradient(180deg, rgba(14,28,19,0.05) 0%, rgba(14,28,19,0.3) 50%, rgba(14,28,19,0.9) 100%), url('${event.img}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 6 }}>
          {live ? (
            <Chip variant="clay" icon={<LiveDot />}>
              LIVE · HOLE {MOCK_LIVE.currentHole}
            </Chip>
          ) : (
            <div
              style={{
                padding: "6px 10px",
                borderRadius: 999,
                background: "rgba(255,255,255,0.14)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
                border: "1px solid rgba(255,255,255,0.2)",
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--cream)",
              }}
            >
              {event.tagline}
            </div>
          )}
        </div>
        {!live && (
          <div style={{ position: "absolute", top: 16, right: 16, textAlign: "right" }}>
            <div style={{ fontSize: 10, fontFamily: "var(--font-mono)", opacity: 0.7, letterSpacing: "0.08em" }}>
              TEE OFF
            </div>
            <div
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                lineHeight: 1,
                marginTop: 2,
                letterSpacing: "-0.02em",
              }}
            >
              {event.time}
            </div>
          </div>
        )}
        {mascot === "full" && (
          <img
            src="/assets/mascot-full-cream.svg"
            alt=""
            style={{
              position: "absolute",
              right: -14,
              bottom: -24,
              width: 110,
              opacity: 0.22,
              transform: "rotate(-6deg)",
            }}
          />
        )}
        <div style={{ position: "absolute", bottom: 18, left: 20, right: 20 }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 34,
              lineHeight: 0.92,
              letterSpacing: "-0.02em",
            }}
          >
            {event.courseShort}
          </div>
          <div
            style={{
              fontSize: 12,
              fontFamily: "var(--font-mono)",
              opacity: 0.8,
              marginTop: 6,
              letterSpacing: "0.04em",
            }}
          >
            {live ? "WK 11 · MELREESE" : (event.dateFull || "").toUpperCase()}
          </div>
        </div>
      </div>

      <div style={{ padding: "18px 20px 20px" }}>
        {live ? (
          <LiveInlinePreview />
        ) : (
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontSize: 11, fontFamily: "var(--font-mono)", opacity: 0.6, letterSpacing: "0.06em" }}>
                {event.filled}/{event.field} · FIELD
              </div>
              <div style={{ fontSize: 13, opacity: 0.85, marginTop: 4 }}>
                {isMember ? (
                  <>
                    <span style={{ fontWeight: 700 }}>Included</span>{" "}
                    <span style={{ opacity: 0.55, textDecoration: "line-through", marginLeft: 4 }}>
                      ${event.priceWalkup}
                    </span>
                  </>
                ) : (
                  <>
                    <span style={{ opacity: 0.6 }}>${event.priceWalkup} walk-up</span> ·{" "}
                    <span style={{ fontWeight: 700 }}>${event.priceMember}</span>{" "}
                    <span style={{ opacity: 0.6 }}>member</span>
                  </>
                )}
              </div>
            </div>
            <Button
              variant="primary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                go({ screen: "eventDetail", eventId: event.id });
              }}
            >
              {isMember ? "Grab spot" : "Register"}
              <Icon.ArrowRight size={14} />
            </Button>
          </div>
        )}
      </div>
    </button>
  );
}

function LiveInlinePreview() {
  const m = MOCK_LIVE.yourMatch;
  const state = m.state;
  const label = state > 0 ? `${state} UP` : state < 0 ? `${-state} DN` : "AS";
  const accent = state > 0 ? "var(--clay)" : state < 0 ? "#E7B8A7" : "var(--cream)";
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <Eyebrow color="var(--cream)" style={{ opacity: 0.5 }}>
            Your match
          </Eyebrow>
          <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginTop: 2 }}>
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 26,
                color: accent,
                letterSpacing: "-0.01em",
              }}
            >
              {label}
            </span>
            <span style={{ fontSize: 11, opacity: 0.65 }}>thru {m.thru}</span>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <Eyebrow color="var(--cream)" style={{ opacity: 0.5 }}>
            vs
          </Eyebrow>
          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>{m.teamB.name}</div>
        </div>
      </div>
      <Button variant="clay" size="sm" full style={{ marginTop: 12 }}>
        Open live scorecard <Icon.ArrowRight size={14} />
      </Button>
    </div>
  );
}

function QuickStat({
  label,
  value,
  sub,
  trend,
  icon,
  locked,
  featured,
}: {
  label: string;
  value: string;
  sub?: string;
  trend?: string;
  icon?: React.ReactNode;
  locked?: boolean;
  featured?: boolean;
}) {
  const bg = featured ? "var(--forest)" : "var(--paper)";
  const fg = featured ? "var(--cream)" : "var(--forest)";
  const trendColor = featured ? "#C9D8BE" : "var(--moss-light)";
  return (
    <div
      style={{
        background: bg,
        color: fg,
        border: featured ? "none" : "var(--hairline)",
        borderRadius: 18,
        padding: "14px 16px 16px",
        minWidth: 132,
        position: "relative",
        opacity: locked ? 0.65 : 1,
        boxShadow: featured ? "var(--shadow-md)" : "var(--shadow-sm)",
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontFamily: "var(--font-mono)",
          display: "flex",
          alignItems: "center",
          gap: 4,
          opacity: featured ? 0.7 : 0.55,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}
      >
        {label} {icon}
        {locked && <Icon.Lock size={11} color="currentColor" />}
      </div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 10 }}>
        <span className="display-num" style={{ fontSize: 28 }}>
          {locked ? "—.———" : value}
        </span>
        {trend && !locked && (
          <span style={{ fontSize: 10, color: trendColor, fontWeight: 800, fontFamily: "var(--font-mono)" }}>
            {trend}
          </span>
        )}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 10,
            opacity: 0.55,
            marginTop: 4,
            fontFamily: "var(--font-mono)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

function MiniEventCard({ event }: { event: Event }) {
  return (
    <button
      onClick={() => go({ screen: "eventDetail", eventId: event.id })}
      className="card"
      style={{
        minWidth: 190,
        maxWidth: 190,
        overflow: "hidden",
        textAlign: "left",
        padding: 0,
        flexShrink: 0,
        display: "block",
        borderRadius: 20,
      }}
    >
      <div
        style={{
          height: 104,
          backgroundImage: `linear-gradient(180deg, rgba(14,28,19,0) 40%, rgba(14,28,19,0.55) 100%), url('${event.img}')`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          position: "relative",
        }}
      >
        {event.isMajor && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "4px 8px",
              borderRadius: 999,
              background: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(10px)",
              border: "1px solid rgba(255,255,255,0.22)",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "var(--cream)",
            }}
          >
            ⛳ Major
          </div>
        )}
        {event.status === "member-only" && (
          <div
            style={{
              position: "absolute",
              top: 10,
              left: 10,
              padding: "4px 8px",
              borderRadius: 999,
              background: "rgba(14,28,19,0.65)",
              backdropFilter: "blur(10px)",
              fontSize: 9,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              color: "var(--cream)",
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            <Icon.Lock size={9} color="currentColor" /> Member
          </div>
        )}
        <div style={{ position: "absolute", bottom: 8, left: 12, right: 12, color: "var(--cream)" }}>
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontSize: 17,
              lineHeight: 1,
              letterSpacing: "-0.01em",
            }}
          >
            {event.courseShort}
          </div>
        </div>
      </div>
      <div style={{ padding: "10px 12px 14px" }}>
        <div
          style={{
            fontSize: 11,
            fontFamily: "var(--font-mono)",
            color: "var(--forest)",
            opacity: 0.7,
            letterSpacing: "0.04em",
          }}
        >
          {event.date.toUpperCase()} · {event.time}
        </div>
      </div>
    </button>
  );
}

function AvatarBy({ handle, size = 36 }: { handle: string; size?: number }) {
  const f = MOCK_FRIENDS.find((x) => x.handle === handle);
  if (!f) return <div style={{ width: size, height: size, borderRadius: 999, background: "var(--sand)" }} />;
  return (
    <img
      src={f.avatar}
      alt={f.name}
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        objectFit: "cover",
        border: "2px solid var(--cream)",
      }}
    />
  );
}
