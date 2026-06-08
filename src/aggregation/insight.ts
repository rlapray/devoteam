import type { Store } from "../store";
import type { Insight } from "../types";

export class InsightAggregator {
  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  run(): Insight {
    const SQL_INSIGHT = `
        SELECT
            COALESCE(AVG(latency_ms),0) AS average_latency_ms,
            COALESCE(MAX(cpu_usage),0) AS max_cpu_usage,
            COALESCE(MAX(memory_usage),0) AS max_memory_usage,
            COALESCE(AVG(error_rate),0) AS error_rate,
            COALESCE(MAX(uptime_seconds),0) AS uptime_seconds
        FROM metrics;
        `;
    const qry = this.store.query(SQL_INSIGHT);
    return qry.get() as Insight;
  }
}
