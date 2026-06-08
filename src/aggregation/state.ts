import type { Store } from "../store";

export interface State {
  end_ts: string;
  start_ts: string;
  state: string;
}

export class StateAggregator {
  private readonly SQL_STATE_DATABASE = `
    WITH ordered AS (
        SELECT timestamp,
                svc_database AS state,
                LAG(svc_database) OVER (ORDER BY timestamp) AS prev
        FROM metrics
    ),
    changes AS (
        SELECT timestamp, state
        FROM ordered
        WHERE prev IS NULL OR state <> prev   -- on ne garde que les débuts de palier
    )
    SELECT
        state,
        timestamp AS start_ts,
        LEAD(timestamp) OVER (ORDER BY timestamp) AS end_ts,
        (julianday(LEAD(timestamp) OVER (ORDER BY timestamp))
            - julianday(timestamp)) * 86400 AS duration_seconds
    FROM changes
    ORDER BY timestamp;`;

  private readonly SQL_STATE_API_GATEWAY = `
    WITH ordered AS (
        SELECT timestamp,
                svc_api_gateway AS state,
                LAG(svc_api_gateway) OVER (ORDER BY timestamp) AS prev
        FROM metrics
    ),
    changes AS (
        SELECT timestamp, state
        FROM ordered
        WHERE prev IS NULL OR state <> prev   -- on ne garde que les débuts de palier
    )
    SELECT
        state,
        timestamp AS start_ts,
        LEAD(timestamp) OVER (ORDER BY timestamp) AS end_ts,
        (julianday(LEAD(timestamp) OVER (ORDER BY timestamp))
            - julianday(timestamp)) * 86400 AS duration_seconds
    FROM changes
    ORDER BY timestamp;`;

  private readonly SQL_STATE_CACHE = `
    WITH ordered AS (
        SELECT timestamp,
                svc_cache AS state,
                LAG(svc_cache) OVER (ORDER BY timestamp) AS prev
        FROM metrics
    ),
    changes AS (
        SELECT timestamp, state
        FROM ordered
        WHERE prev IS NULL OR state <> prev   -- on ne garde que les débuts de palier
    )
    SELECT
        state,
        timestamp AS start_ts,
        LEAD(timestamp) OVER (ORDER BY timestamp) AS end_ts,
        (julianday(LEAD(timestamp) OVER (ORDER BY timestamp))
            - julianday(timestamp)) * 86400 AS duration_seconds
    FROM changes
    ORDER BY timestamp;`;

  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  statesDatabase(): State[] {
    const qry = this.store.query(this.SQL_STATE_DATABASE);
    return qry.all() as State[];
  }

  statesApiGateway(): State[] {
    const qry = this.store.query(this.SQL_STATE_API_GATEWAY);
    return qry.get() as State[];
  }

  statesCache(): State[] {
    const qry = this.store.query(this.SQL_STATE_CACHE);
    return qry.get() as State[];
  }
}
