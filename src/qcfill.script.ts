import { fetchAgentDetails, productSourceUrl } from "./lib/agentApi";

const URL_BASE = "https://zyowinfsktqtishifayw.supabase.co/rest/v1";
const KEY = "sb_publishable_9kYengEiToCSf6iOm5QRGw_XsesXUWz";

const res = await fetch(
  `${URL_BASE}/products?select=id,store_url,qc_url,agent_links,qc_images&limit=1000`,
  { headers: { apikey: KEY, Authorization: `Bearer ${KEY}` } },
);
const rows = (await res.json()) as any[];
const todo = rows.filter((r) => !(r.qc_images ?? []).length);
console.log("total", rows.length, "todo", todo.length);

const out: Record<string, string[]> = {};
let done = 0;
const queue = [...todo];
async function worker() {
  while (queue.length) {
    const r = queue.shift()!;
    const src = productSourceUrl(r);
    if (src) {
      const d = await fetchAgentDetails(src).catch(() => null);
      const imgs = (d?.qcImages ?? []).slice(0, 10);
      if (imgs.length) out[r.id] = imgs;
    }
    done++;
    if (done % 25 === 0) console.log(done, "/", todo.length, "found", Object.keys(out).length);
  }
}
await Promise.all(Array.from({ length: 8 }, worker));
console.log("FOUND", Object.keys(out).length);
await Bun.write("/tmp/qcfound.json", JSON.stringify(out));
