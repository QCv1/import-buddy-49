import { createFileRoute } from "@tanstack/react-router";
import { seedProducts } from "@/lib/seedImport.functions";

// Tymczasowy endpoint jednorazowego importu produktów.
export const Route = createFileRoute("/api/public/seed-import")({
  server: {
    handlers: {
      POST: async () => {
        const result = await seedProducts();
        return new Response(JSON.stringify(result), {
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
