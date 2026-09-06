import { withMyRef, convertLink, extractSourceLink } from "./lib/linkConverter";

const URL_ = process.env["SUPABASE_URL"]!;
const KEY = process.env["SUPABASE_SERVICE_ROLE_KEY"]!;
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };

async function rest(path: string, init?: RequestInit) {
  const res = await fetch(`${URL_}/rest/v1/${path}`, { ...init, headers: H });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text}`);
  return text ? JSON.parse(text) : null;
}

const AGENTS = ["usfans", "kakobuy", "litbuy"];

async function main() {
  const rows: any[] = await rest("products?select=id,agent_links,store_url,qc_url&limit=2000");
  let changed = 0;
  for (const p of rows) {
    const src = [p.store_url, ...Object.values(p.agent_links ?? {}), p.qc_url]
      .filter(Boolean)
      .map(String)
      .find((u) => extractSourceLink(u));
    const links: Record<string, string> = {};
    for (const [k, v] of Object.entries((p.agent_links ?? {}) as Record<string, string>)) {
      links[k] = withMyRef(String(v));
    }
    if (src) {
      for (const a of AGENTS) {
        const key = Object.keys(links).find((k) => k.toLowerCase().replace(/[^a-z]/g, "") === a);
        const conv = convertLink(src, a);
        if (conv && extractSourceLink(src)) links[key ?? a] = withMyRef(conv);
      }
    }
    if (JSON.stringify(links) !== JSON.stringify(p.agent_links ?? {})) {
      await rest(`products?id=eq.${p.id}`, {
        method: "PATCH",
        body: JSON.stringify({ agent_links: links }),
      });
      changed++;
    }
  }

  const agents: any[] = await rest("agents?select=id,name,referral_url");
  let agentsChanged = 0;
  for (const a of agents) {
    const next = withMyRef(String(a.referral_url ?? ""));
    if (next && next !== a.referral_url) {
      await rest(`agents?id=eq.${a.id}`, {
        method: "PATCH",
        body: JSON.stringify({ referral_url: next }),
      });
      agentsChanged++;
    }
  }

  const rates: any[] = await rest("shipping_rates?select=id,signup_url");
  let ratesChanged = 0;
  for (const r of rates) {
    const next = withMyRef(String(r.signup_url ?? ""));
    if (next && next !== r.signup_url) {
      await rest(`shipping_rates?id=eq.${r.id}`, {
        method: "PATCH",
        body: JSON.stringify({ signup_url: next }),
      });
      ratesChanged++;
    }
  }

  console.log(JSON.stringify({ products: rows.length, changed, agentsChanged, ratesChanged }));
}

main();
