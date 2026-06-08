import { tool } from "ai";
import z from "zod";
import type { Store } from "../store";

export function createSqlTool(store: Store) {
  return tool({
    description: `Donne ici ta requête SQL SELECT en lecture seule sur la table metrics
          (cpu_usage, memory_usage, latency_ms, disk_usage, io_wait, error_rate
          temperature_celsius, thread_count, active_connections, network_in_kbps, 
          network_out_kbps, power_consumption_watts, uptime_seconds, timestamp,
          svc_database, svc_api_gateway, svc_cache). 
          Exemple : SELECT MAX(memory usage) FROM metrics
          C'ets une base sqlite3.`,
    inputSchema: z.object({ sql: z.string() }),
    execute: ({ sql }) => {
      const clean = sql.trim().toLowerCase();
      if (!(clean.startsWith("select") || clean.startsWith("with"))) {
        return {
          error: "Seules les requêtes SELECT/WITH sont autorisées.",
        };
      }
      try {
        return { rows: store.query(sql).all() };
      } catch (e) {
        return { error: String(e) };
      }
    },
  });
}
