// Builder Cards — zero-friction prototype server.
// Any GitHub username is the input:  http://localhost:8768/card/<username>
// Renders through Elements custom tools (registerElementsTool) from ./dist.
import http from "http";
import React from "react";
import { registerElementsTool, renderToHtml, renderToJson, Email, Page, Row, Column, Paragraph, Heading, Button } from "./dist/index.js";

const h = React.createElement;
const PORT = 8768;
const TOKEN = process.env.GITHUB_TOKEN;
const cache = new Map();

// ---- GitHub data -----------------------------------------------------------
async function gh(path) {
  const res = await fetch(`https://api.github.com${path}`, {
    headers: { "User-Agent": "builder-cards-proto", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
  });
  if (!res.ok) throw new Error(`GitHub ${res.status} for ${path}`);
  return res.json();
}

async function fetchProfile(login) {
  if (cache.has(login)) return cache.get(login);
  const [user, repos, events] = await Promise.all([
    gh(`/users/${login}`),
    gh(`/users/${login}/repos?per_page=100&sort=pushed`),
    gh(`/users/${login}/events/public?per_page=100`),
  ]);
  const data = { user, repos, events };
  cache.set(login, data);
  return data;
}

// ---- Stats -----------------------------------------------------------------
function computeStats({ user, repos, events }) {
  const n = (t) => events.filter((e) => e.type === t).length;
  const pushes = n("PushEvent");
  const commits = events.filter((e) => e.type === "PushEvent").reduce((a, e) => a + (e.payload?.commits?.length ?? 1), 0);
  const reviews = n("PullRequestReviewEvent") + n("PullRequestReviewCommentEvent") + n("IssueCommentEvent");
  const prs = n("PullRequestEvent");
  const issues = n("IssuesEvent");
  const ships = n("ReleaseEvent") * 2 + prs + n("CreateEvent");
  const stars = repos.reduce((a, r) => a + (r.stargazers_count || 0), 0);
  const activeDays = new Set(events.map((e) => e.created_at.slice(0, 10))).size;
  const langs = [...new Set(repos.map((r) => r.language).filter(Boolean))];

  const total = Math.max(commits + reviews + prs + issues, 1);
  const dist = {
    Commits: Math.round((commits / total) * 100),
    Review: Math.round((reviews / total) * 100),
    "Pull requests": Math.round((prs / total) * 100),
    Issues: Math.max(0, 100 - Math.round((commits / total) * 100) - Math.round((reviews / total) * 100) - Math.round((prs / total) * 100)),
  };

  const clamp = (x) => Math.max(40, Math.min(99, Math.round(x)));
  const stats = {
    Build: clamp(45 + commits * 1.4),
    Review: clamp(42 + reviews * 6),
    Ship: clamp(42 + ships * 8),
    Volume: clamp(35 + activeDays * 4 + Math.min(user.public_repos, 50)),
    Impact: clamp(38 + Math.min(stars, 800) / 11 + Math.min(user.followers, 900) / 16),
  };
  const OVR = Math.round(Object.values(stats).reduce((a, b) => a + b) / 5);
  const tier = OVR >= 86 ? "Legendary" : OVR >= 74 ? "Gold" : OVR >= 62 ? "Silver" : "Bronze";

  const zones = { def: reviews + issues + 1, mid: commits + 1, att: ships + 1 };
  const zt = zones.def + zones.mid + zones.att;
  const position = zones.att / zt > 0.42 ? "ST" : zones.def / zt > 0.42 ? "CB" : "CM";
  const tagline =
    position === "ST" ? "Poacher · ships early and often"
    : position === "CB" ? "Ball-playing defender · triage and reviews"
    : dist.Review >= 25 ? "Box-to-box playmaker · builds and reviews"
    : "Box-to-box engine · high work rate";

  const clubs = [...new Set(events.map((e) => e.repo?.name?.split("/")[0]).filter((o) => o && o !== user.login))].slice(0, 3);
  const biggest = Object.entries(events.reduce((m, e) => { const d = e.created_at.slice(0, 10); m[d] = (m[d] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1])[0];
  const summary = `${commits + reviews + prs + issues} public actions in the last ~90 days · biggest day ${biggest ? biggest[1] : 0} · ${dist.Review}% spent reviewing`;

  // Heat blobs: [x 0..1, y 0..1, weight 0..1] — def left, mid center, att right
  const blobs = [
    [0.22, 0.42, zones.def / zt], [0.30, 0.62, (zones.def / zt) * 0.6],
    [0.50, 0.48, zones.mid / zt], [0.44, 0.34, (zones.mid / zt) * 0.55], [0.58, 0.66, (zones.mid / zt) * 0.5],
    [0.74, 0.55, zones.att / zt], [0.86, 0.36, (zones.att / zt) * 0.7],
  ];
  return { stats, OVR, tier, position, tagline, dist, clubs, summary, blobs, langs };
}

// ---- Custom tools (Elements) ------------------------------------------------
const JET = `<radialGradient id="jet"><stop offset="0" stop-color="#c62b1f"/><stop offset=".22" stop-color="#e8622d" stop-opacity=".92"/><stop offset=".42" stop-color="#f5d327" stop-opacity=".8"/><stop offset=".62" stop-color="#59b34c" stop-opacity=".55"/><stop offset=".82" stop-color="#2f7fd8" stop-opacity=".4"/><stop offset="1" stop-color="#2f7fd8" stop-opacity="0"/></radialGradient>`;

const playerHeader = registerElementsTool({
  name: "player_header",
  label: "Player Header",
  icon: "fa-id-badge",
  options: { header: { title: "Header", options: {
    playerName: { label: "Name", defaultValue: "Builder", widget: "text" },
    handle: { label: "Handle", defaultValue: "", widget: "text" },
    avatarUrl: { label: "Avatar", defaultValue: "", widget: "image" },
    tagline: { label: "Tagline", defaultValue: "", widget: "text" },
    tierName: { label: "Tier", defaultValue: "Silver", widget: "text" },
    ovr: { label: "Overall", defaultValue: 60, widget: "counter" },
    position: { label: "Position", defaultValue: "CM", widget: "text" },
  }}},
  values: {},
  renderer: { exporters: {
    web: (v) => `<div style="display:flex;justify-content:space-between;align-items:flex-start;font-family:'Segoe UI',system-ui,sans-serif;color:#fff;">
  <div style="display:flex;gap:16px;align-items:center;">
    <img src="${v.avatarUrl}" alt="" width="76" height="76" style="border-radius:50%;border:3px solid #eba447;display:block;background:#1b2240;"/>
    <div>
      <div style="font-size:30px;font-weight:800;line-height:1.1;">${v.playerName}</div>
      <div style="color:#8e97b8;font-size:15px;padding:2px 0 8px;">@${v.handle}</div>
      <div style="display:inline-block;border:1px solid #333c5e;background:#161c33;border-radius:20px;padding:6px 14px;font-size:13.5px;color:#c9d1ea;">${v.tagline}</div>
    </div>
  </div>
  <div style="text-align:right;">
    <span style="background:#eba447;color:#1a1204;font-weight:800;border-radius:18px;padding:7px 22px;font-size:16px;">${v.tierName}</span>
    <div style="margin-top:10px;"><span style="border:1.5px solid #57d28a;color:#57d28a;font-weight:800;border-radius:8px;padding:3px 10px;font-size:14px;vertical-align:middle;">${v.position}</span>
    <span style="font-size:52px;font-weight:900;line-height:1;vertical-align:middle;padding-left:12px;">${v.ovr}</span></div>
    <div style="color:#8e97b8;font-size:14px;">overall</div>
  </div>
</div>`,
    email: (v) => `<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
  <td width="86" valign="top"><img src="${v.avatarUrl}" width="72" height="72" alt="" style="border-radius:50%;border:3px solid #eba447;background:#1b2240;"/></td>
  <td valign="top" style="font-family:Arial,sans-serif;color:#ffffff;">
    <div style="font-size:24px;font-weight:800;">${v.playerName}</div>
    <div style="color:#8e97b8;font-size:13px;padding:2px 0 6px;">@${v.handle}</div>
    <div style="font-size:12px;color:#c9d1ea;">${v.tagline}</div>
  </td>
  <td valign="top" align="right" style="font-family:Arial,sans-serif;">
    <div style="background-color:#eba447;color:#1a1204;font-weight:bold;border-radius:14px;padding:5px 16px;font-size:13px;display:inline-block;">${v.tierName}</div>
    <div style="color:#ffffff;font-size:38px;font-weight:800;">${v.ovr} <span style="font-size:13px;color:#57d28a;">${v.position}</span></div>
    <div style="color:#8e97b8;font-size:12px;">overall</div>
  </td></tr></table>`,
  }},
});

const pitchHeatmap = registerElementsTool({
  name: "pitch_heatmap",
  label: "Pitch Heat Map",
  icon: "fa-futbol",
  options: { map: { title: "Heat Map", options: {
    blobsJson: { label: "Blobs JSON", defaultValue: "[]", widget: "text" },
    distJson: { label: "Distribution JSON", defaultValue: "{}", widget: "text" },
    statsJson: { label: "Stats JSON", defaultValue: "{}", widget: "text" },
    summary: { label: "Summary", defaultValue: "", widget: "text" },
    clubs: { label: "Clubs", defaultValue: "", widget: "text" },
  }}},
  values: {},
  renderer: { exporters: {
    web: (v) => {
      const blobs = JSON.parse(v.blobsJson || "[]");
      const dist = JSON.parse(v.distJson || "{}");
      const stats = JSON.parse(v.statsJson || "{}");
      const W = 640, H = 300;
      const ellipses = blobs.map(([x, y, w]) =>
        `<ellipse cx="${(x * W).toFixed(0)}" cy="${(y * H).toFixed(0)}" rx="${(60 + w * 150).toFixed(0)}" ry="${(44 + w * 96).toFixed(0)}" fill="url(#jet)" opacity="${Math.min(0.55 + w, 1).toFixed(2)}"/>`).join("");
      const DIST_COLORS = { Commits: "#57b45f", Review: "#3f8fd8", "Pull requests": "#eba447", Issues: "#8e97b8" };
      const entries = Object.entries(dist).filter(([, p]) => p > 0);
      const bar = entries.map(([k, p]) => `<div style="width:${p}%;background:${DIST_COLORS[k]};color:#0e1322;font-weight:700;font-size:${p > 12 ? 14 : 1}px;text-align:center;line-height:26px;">${p > 12 ? p + "%" : ""}</div>`).join("");
      const legend = entries.map(([k, p]) => `<span style="padding-right:18px;white-space:nowrap;"><span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:${DIST_COLORS[k]};margin-right:6px;"></span>${k} ${p}%</span>`).join("");
      const best = Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0];
      const statCells = Object.entries(stats).map(([k, val]) =>
        `<div style="flex:1;text-align:center;"><div style="font-size:30px;font-weight:900;color:${k === best ? "#57d28a" : "#fff"};">${val}</div><div style="color:#8e97b8;font-size:14px;">${k}</div></div>`).join("");
      return `<div style="font-family:'Segoe UI',system-ui,sans-serif;color:#fff;">
<svg viewBox="0 0 ${W} ${H}" style="width:100%;border-radius:12px;display:block;" xmlns="http://www.w3.org/2000/svg">
  <defs>${JET}<filter id="soft"><feGaussianBlur stdDeviation="7"/></filter></defs>
  <rect width="${W}" height="${H}" fill="#2c8540"/>
  ${Array.from({ length: 8 }, (_, i) => i % 2 ? `<rect x="${i * W / 8}" width="${W / 8}" height="${H}" fill="#2f8f45"/>` : "").join("")}
  <g filter="url(#soft)">${ellipses}</g>
  <g stroke="#f2f5f7" stroke-opacity=".85" stroke-width="2" fill="none">
    <rect x="8" y="8" width="${W - 16}" height="${H - 16}"/><line x1="${W / 2}" y1="8" x2="${W / 2}" y2="${H - 8}"/>
    <circle cx="${W / 2}" cy="${H / 2}" r="38"/><circle cx="${W / 2}" cy="${H / 2}" r="2.5" fill="#f2f5f7"/>
    <rect x="8" y="${H / 2 - 62}" width="58" height="124"/><rect x="${W - 66}" y="${H / 2 - 62}" width="58" height="124"/>
    <rect x="8" y="${H / 2 - 28}" width="22" height="56"/><rect x="${W - 30}" y="${H / 2 - 28}" width="22" height="56"/>
  </g>
</svg>
<div style="display:flex;justify-content:space-between;color:#8e97b8;font-size:13.5px;padding:10px 2px 16px;">
  <span>Own half · review &amp; maintenance</span><span>Midfield · building</span><span>Final third · shipping</span>
</div>
<div style="display:flex;border-radius:8px;overflow:hidden;height:26px;">${bar}</div>
<div style="color:#c9d1ea;font-size:13.5px;padding:12px 2px 18px;">${legend}</div>
<div style="display:flex;border-top:1px solid #232b49;padding:18px 0 6px;">${statCells}</div>
<div style="text-align:center;color:#c9d1ea;font-size:14.5px;padding-top:12px;">${v.summary}</div>
${v.clubs ? `<div style="text-align:center;color:#8e97b8;font-size:13.5px;padding-top:6px;">Clubs · ${v.clubs}</div>` : ""}
</div>`;
    },
    email: (v) => {
      const blobs = JSON.parse(v.blobsJson || "[]");
      const dist = JSON.parse(v.distJson || "{}");
      const stats = JSON.parse(v.statsJson || "{}");
      // grid approximation of the blobs for bgcolor cells
      const COLSN = 16, ROWSN = 8;
      const grid = Array.from({ length: ROWSN }, (_, gy) => Array.from({ length: COLSN }, (_, gx) => {
        let t = 0;
        for (const [x, y, w] of blobs) {
          const d2 = ((gx + 0.5) / COLSN - x) ** 2 * 3.2 + ((gy + 0.5) / ROWSN - y) ** 2 * 1.6;
          t += w * Math.exp(-d2 * 14);
        }
        return Math.min(t, 1);
      }));
      const color = (t) => t > 0.7 ? "#d64533" : t > 0.45 ? "#ec8f3b" : t > 0.25 ? "#e8d24e" : t > 0.1 ? "#66a95c" : "#2c8540";
      const rows = grid.map((r) => `<tr>${r.map((t) => `<td width="6%" height="24" bgcolor="${color(t)}" style="font-size:1px;line-height:1px;">&nbsp;</td>`).join("")}</tr>`).join("");
      const DIST_COLORS = { Commits: "#57b45f", Review: "#3f8fd8", "Pull requests": "#eba447", Issues: "#8e97b8" };
      const barCells = Object.entries(dist).filter(([, p]) => p > 0).map(([k, p]) => `<td width="${p}%" bgcolor="${DIST_COLORS[k]}" style="font-family:Arial;font-size:${p > 12 ? 12 : 1}px;color:#0e1322;text-align:center;height:22px;font-weight:bold;">${p > 12 ? p + "%" : ""}</td>`).join("");
      const best = Object.entries(stats).sort((a, b) => b[1] - a[1])[0]?.[0];
      const statCells = Object.entries(stats).map(([k, val]) => `<td align="center" style="font-family:Arial;padding:12px 2px;"><div style="font-size:24px;font-weight:800;color:${k === best ? "#57d28a" : "#ffffff"};">${val}</div><div style="font-size:12px;color:#8e97b8;">${k}</div></td>`).join("");
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #f2f5f7;border-radius:8px;background-color:#2c8540;">${rows}</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-family:Arial;color:#8e97b8;font-size:12px;"><tr><td style="padding:8px 0 12px;">Own half · reviews</td><td align="center" style="padding:8px 0 12px;">Midfield · building</td><td align="right" style="padding:8px 0 12px;">Final third · shipping</td></tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${barCells}</tr></table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${statCells}</tr></table>
<div style="font-family:Arial;text-align:center;color:#c9d1ea;font-size:13px;padding-top:8px;">${v.summary}</div>
${v.clubs ? `<div style="font-family:Arial;text-align:center;color:#8e97b8;font-size:12px;padding-top:4px;">Clubs · ${v.clubs}</div>` : ""}`;
    },
  }},
});

// ---- Document ---------------------------------------------------------------
function cardDoc(Root, { user }, s) {
  return h(Root, { backgroundColor: "#070a14", contentWidth: "720px", previewText: `${user.login} — ${s.tier}, ${s.OVR} overall` },
    h(Row, { backgroundColor: "#0e1322", padding: "0px" }, h(Column, { padding: "0px" },
      h(playerHeader, {
        playerName: user.name || user.login, handle: user.login, avatarUrl: user.avatar_url,
        tagline: s.tagline, tierName: s.tier, ovr: s.OVR, position: s.position,
        containerPadding: "30px 34px 8px",
      }),
      h(pitchHeatmap, {
        blobsJson: JSON.stringify(s.blobs.map((b) => b.map((x) => +x.toFixed(3)))),
        distJson: JSON.stringify(s.dist), statsJson: JSON.stringify(s.stats),
        summary: s.summary, clubs: s.clubs.join(" · "),
        containerPadding: "16px 34px 10px",
      }),
      h(Paragraph, { color: "#59627f", fontSize: "12px", textAlign: "center", containerPadding: "14px 20px 26px",
        html: `Built with <strong style="color:#8e97b8">Unlayer Elements</strong> — the card and pitch are live custom tools. <a href="https://github.com/${user.login}" style="color:#eba447;">View on GitHub</a>` }))));
}

// ---- Server ------------------------------------------------------------------
const INPUT_PAGE = `<!doctype html><html><head><meta charset="utf-8"><title>Builder Cards</title></head>
<body style="margin:0;background:#070a14;color:#fff;font-family:'Segoe UI',system-ui,sans-serif;display:grid;place-items:center;height:100vh;">
<div style="text-align:center;max-width:460px;">
  <div style="color:#eba447;letter-spacing:6px;font-weight:700;font-size:13px;">BUILDER CARDS · SEASON 2026</div>
  <h1 style="font-size:34px;margin:14px 0 6px;">Your GitHub, as a player card</h1>
  <p style="color:#8e97b8;margin:0 0 26px;">One input. Zero friction. Card + season heat map.</p>
  <form onsubmit="location.href='/card/'+document.getElementById('u').value.trim();return false;">
    <input id="u" placeholder="github username" autofocus style="padding:14px 18px;border-radius:26px;border:1px solid #333c5e;background:#0e1322;color:#fff;font-size:16px;width:250px;outline:none;"/>
    <button style="padding:14px 26px;border-radius:26px;border:0;background:#eba447;color:#1a1204;font-weight:800;font-size:16px;cursor:pointer;margin-left:8px;">Kick off</button>
  </form>
  <p style="color:#59627f;font-size:13px;margin-top:22px;">try: <a href="/card/siddharthvaddem" style="color:#eba447;">siddharthvaddem</a> · <a href="/card/torvalds" style="color:#eba447;">torvalds</a></p>
</div></body></html>`;

http.createServer(async (req, res) => {
  try {
    const m = req.url.match(/^\/card\/([\w-]+)(\/(email|design\.json))?$/);
    if (req.url === "/" || req.url === "") {
      res.writeHead(200, { "Content-Type": "text/html" }).end(INPUT_PAGE);
    } else if (m) {
      const data = await fetchProfile(m[1]);
      const s = computeStats(data);
      if (m[3] === "design.json") {
        res.writeHead(200, { "Content-Type": "application/json" }).end(JSON.stringify(renderToJson(cardDoc(Email, data, s)), null, 2));
      } else {
        const Root = m[3] === "email" ? Email : Page;
        res.writeHead(200, { "Content-Type": "text/html" }).end(renderToHtml(cardDoc(Root, data, s), { title: `${m[1]} · Builder Card` }));
      }
    } else {
      res.writeHead(404).end("not found");
    }
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" }).end(String(err));
  }
}).listen(PORT, () => console.log(`builder cards on http://localhost:${PORT}`));
