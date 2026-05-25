import { DashboardLayout } from '@/components/layout/DashboardLayout'

// ─── Types ───────────────────────────────────────────────────────────────────

interface StatCard {
  value: string | number;
  label: string;
  trend: string;
  trendPositive: boolean;
  icon: React.ReactNode;
  accent: string;
}

interface Lead {
  id: string;
  initials: string;
  name: string;
  location: string;
  amount: string;
  score: "High" | "Medium" | "Low";
  color: string;
}

interface SourceBar {
  source: string;
  percentage: number;
  color: string;
}

interface ScoreBreakdown {
  label: "High" | "Medium" | "Low";
  percentage: number;
  color: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const statCards: StatCard[] = [
  {
    value: 248,
    label: "Total leads",
    trend: "+12 this week",
    trendPositive: true,
    accent: "#e8f0fe",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#4f7df3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
        <circle cx="9" cy="7" r="4"/>
        <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
        <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
      </svg>
    ),
  },
  {
    value: 34,
    label: "Qualified leads",
    trend: "+5 this week",
    trendPositive: true,
    accent: "#fef9e7",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#f5a623" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
      </svg>
    ),
  },
  {
    value: 12,
    label: "New today",
    trend: "+3 vs yesterday",
    trendPositive: true,
    accent: "#eaf7fb",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#2dc8e0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
      </svg>
    ),
  },
  {
    value: "87%",
    label: "AI match rate",
    trend: "+2% this month",
    trendPositive: true,
    accent: "#edfaf3",
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#27ae60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
        <polyline points="16 7 22 7 22 13"/>
      </svg>
    ),
  },
];

const sourceBars: SourceBar[] = [
  { source: "Facebook", percentage: 68, color: "#4f7df3" },
  { source: "Instagram", percentage: 32, color: "#f5a623" },
];

const scoreBreakdown: ScoreBreakdown[] = [
  { label: "High", percentage: 14, color: "#27ae60" },
  { label: "Medium", percentage: 36, color: "#f5a623" },
  { label: "Low", percentage: 50, color: "#e74c3c" },
];

const recentLeads: Lead[] = [
  { id: "1", initials: "DK", name: "Dilanka K.", location: "Colombo 7", amount: "$150k", score: "High", color: "#4f7df3" },
  { id: "2", initials: "NP", name: "Nadia P.", location: "Nugegoda", amount: "$120k", score: "Medium", color: "#27ae60" },
  { id: "3", initials: "RS", name: "Roshan S.", location: "Mt. Lavinia", amount: "$90k", score: "Low", color: "#e74c3c" },
  { id: "4", initials: "KM", name: "Kumari M.", location: "Colombo 3", amount: "$180k", score: "High", color: "#f5a623" },
  { id: "5", initials: "AP", name: "Ashan P.", location: "Battaramulla", amount: "$110k", score: "Medium", color: "#9b59b6" },
];

// ─── Score Badge ──────────────────────────────────────────────────────────────

const scoreBadgeStyle = (score: Lead["score"]): React.CSSProperties => {
  const map = {
    High: { background: "#edfaf3", color: "#27ae60" },
    Medium: { background: "#fef9e7", color: "#d4890a" },
    Low: { background: "#fdecea", color: "#e74c3c" },
  };
  return {
    ...map[score],
    padding: "3px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: "0.02em",
  };
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <DashboardLayout activeNav="Dashboard">
      <div className="dashboard-content" style={{ padding: 32, paddingBottom: 48, minHeight: '100%', boxSizing: 'border-box' }}>
        {/* Greeting */}
          <div style={{ marginBottom: 28 }}>
            <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--color-text-heading)', margin: 0, letterSpacing: '-0.01em' }}>
              Good morning, Asanka 👋
            </h1>
            <p style={{ marginTop: 6, color: 'var(--color-text-secondary)', fontSize: 14 }}>
              Here's what's happening with your leads today.
            </p>
          </div>

          {/* Stat Cards */}
          <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, marginBottom: 28 }}>
            {statCards.map((card) => (
              <StatCardItem key={card.label} card={card} />
            ))}
          </div>

          {/* Bottom Two Columns */}
          <div className="dashboard-columns" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>

            {/* Leads by Source + Match Score */}
            <div style={{
              background: "var(--color-card-bg)",
              borderRadius: 16,
              padding: "24px 28px",
              boxShadow: "var(--shadow-sm)",
              display: "flex",
              flexDirection: "column",
              gap: 28,
            }}>
              {/* Leads by Source */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: 18 }}>Leads by source</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {sourceBars.map((bar) => (
                    <div key={bar.source}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <span>{bar.source}</span>
                        <span style={{ fontWeight: 600 }}>{bar.percentage}%</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${bar.percentage}%`,
                          background: bar.color,
                          borderRadius: 999,
                          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Match Score Breakdown */}
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: 18 }}>Match score breakdown</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {scoreBreakdown.map((row) => (
                    <div key={row.label}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6, fontSize: 13, color: 'var(--color-text-secondary)' }}>
                        <span>{row.label}</span>
                        <span style={{ fontWeight: 600 }}>{row.percentage}%</span>
                      </div>
                      <div style={{ height: 8, background: 'var(--color-bg-muted)', borderRadius: 999, overflow: "hidden" }}>
                        <div style={{
                          height: "100%",
                          width: `${row.percentage}%`,
                          background: row.color,
                          borderRadius: 999,
                          transition: "width 0.6s cubic-bezier(.4,0,.2,1)",
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Leads */}
            <div style={{
              background: "var(--color-card-bg)",
              borderRadius: 16,
              padding: "24px 28px",
              boxShadow: "var(--shadow-sm)",
            }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-heading)', marginBottom: 18 }}>Recent leads</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                {recentLeads.map((lead) => (
                  <div key={lead.id} style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{
                        width: 38,
                        height: 38,
                        borderRadius: "50%",
                        background: lead.color + "22",
                        color: lead.color,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: 700,
                        fontSize: 13,
                        flexShrink: 0,
                      }}>
                        {lead.initials}
                      </div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-text-heading)' }}>{lead.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>{lead.location} · {lead.amount}</div>
                      </div>
                    </div>
                    <span style={scoreBadgeStyle(lead.score)}>{lead.score}</span>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 22, textAlign: "right" }}>
                <a href="/leads" style={{
                  fontSize: 13,
                  fontWeight: 600,
                  color: 'var(--color-brand)',
                  textDecoration: "none",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}>
                  View all leads →
                </a>
              </div>
            </div>
          </div>
      </div>
    </DashboardLayout>
  )
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCardItem({ card }: { card: StatCard }) {
  return (
    <div style={{
      background: "var(--color-card-bg)",
      borderRadius: 16,
      padding: "22px 24px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--color-text-heading)', letterSpacing: "-0.02em", lineHeight: 1 }}>
            {card.value}
          </div>
          <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginTop: 4 }}>{card.label}</div>
        </div>
        <div style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: card.accent,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}>
          {card.icon}
        </div>
      </div>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 4,
        fontSize: 12,
        color: card.trendPositive ? "#27ae60" : "#e74c3c",
        fontWeight: 600,
      }}>
        <span>{card.trendPositive ? "↑" : "↓"}</span>
        <span>{card.trend}</span>
      </div>
    </div>
  );
}

// ─── Sidebar Icons ────────────────────────────────────────────────────────────

const iconProps = { width: 17, height: 17, viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: 2, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

const GridIcon = () => (
  <svg {...iconProps}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
);
const LeadsIcon = () => (
  <svg {...iconProps}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
);
const ChatIcon = () => (
  <svg {...iconProps}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
);
const DiscoverIcon = () => (
  <svg {...iconProps}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
);
const AnalyticsIcon = () => (
  <svg {...iconProps}><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
);
const SettingsIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
);
const SignOutIcon = () => (
  <svg {...iconProps}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
);
