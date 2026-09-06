import { createServerFn } from "@tanstack/react-start";
// Jednorazowy import produktów z pliku CSV (seed bazy).
import csvText from "@/data/seed-products.csv?raw";
import { parseDelimited } from "@/lib/csvImport";

const toArray = (v: string) =>
  v
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export const seedProducts = createServerFn({ method: "POST" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const rows = parseDelimited(csvText);
  const header = (rows[0] ?? []).map((h) => h.trim());
  const idx = (name: string) => header.indexOf(name);
  const get = (r: string[], name: string) => (idx(name) >= 0 ? (r[idx(name)] ?? "").trim() : "");

  const records = rows.slice(1).map((r) => {
    let agentLinks: Record<string, string> = {};
    const raw = get(r, "agent_links");
    if (raw) {
      try {
        agentLinks = JSON.parse(raw);
      } catch {
        agentLinks = {};
      }
    }
    const images = toArray(get(r, "images"));
    const imageUrl = get(r, "image_url") || images[0] || null;
    return {
      id: get(r, "id") || undefined,
      title: get(r, "title"),
      category: get(r, "category") || "Akcesoria",
      price: Number(get(r, "price")) || 0,
      price_cny: Number(get(r, "price_cny")) || 0,
      image_url: imageUrl,
      images,
      qc_url: get(r, "qc_url") || null,
      store_url: get(r, "store_url"),
      store_name: get(r, "store_name"),
      quality: get(r, "quality") || "Best",
      batch: get(r, "batch"),
      sizes: toArray(get(r, "sizes")),
      tiktok_url: get(r, "tiktok_url") || null,
      views: Number(get(r, "views")) || 0,
      promoted: get(r, "promoted") === "true",
      for_women: get(r, "for_women") === "true",
      verified: get(r, "verified") === "true",
      show_on_home: get(r, "show_on_home") === "true",
      display_order: Number(get(r, "display_order")) || 0,
      agent_links: agentLinks,
    };
  });

  let inserted = 0;
  const errors: string[] = [];
  for (let i = 0; i < records.length; i += 100) {
    const chunk = records.slice(i, i + 100);
    const { error } = await supabaseAdmin.from("products").upsert(chunk as never, { onConflict: "id" });
    if (error) errors.push(error.message);
    else inserted += chunk.length;
  }

  // Uzupełnij kategorie na podstawie produktów.
  const cats = Array.from(new Set(records.map((r) => r.category).filter(Boolean)));
  for (const name of cats) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    await supabaseAdmin.from("categories").upsert({ name, slug, sort_order: 100 } as never, {
      onConflict: "slug",
    });
  }

  return { total: records.length, inserted, errors: errors.slice(0, 3) };
});
