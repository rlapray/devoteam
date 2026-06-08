import type { Store } from "../store";
import type { ServiceStatus, ServiceStatusSummary } from "../types";

export class ServiceAggregator {
  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  run(): ServiceStatusSummary {
    const SQL_SERVICE_STATUS_SUMMARY = `
        SELECT svc_database, svc_api_gateway, svc_cache
        FROM metrics
        ORDER BY timestamp DESC
        LIMIT 1;
        `;
    const qry = this.store.query(SQL_SERVICE_STATUS_SUMMARY);
    const record = qry.get() as {
      svc_database: ServiceStatus;
      svc_api_gateway: ServiceStatus;
      svc_cache: ServiceStatus;
    };

    const summary: ServiceStatusSummary = {
      online: [],
      degraded: [],
      offline: [],
    };
    if (record) {
      summary[record.svc_database].push("database");
      summary[record.svc_api_gateway].push("api_gateway");
      summary[record.svc_cache].push("cache");
    }
    return summary;
  }
}
