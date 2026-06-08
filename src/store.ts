import Database, { type Statement } from "bun:sqlite";
import type { Metric } from "./types";

export class Store {
  private readonly BATCH_SIZE = 100;

  // Keep in mind that as a REAL, error_rate may lack precision in certain scenarios
  private readonly SQL_INIT = `
  CREATE TABLE metrics (
    id                        INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp                 TEXT NOT NULL CHECK (timestamp GLOB '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]T[0-9][0-9]:[0-9][0-9]:[0-9][0-9]Z'),
    cpu_usage                 INTEGER NOT NULL,
    memory_usage              INTEGER NOT NULL,
    latency_ms                INTEGER NOT NULL,
    disk_usage                INTEGER NOT NULL,
    network_in_kbps           INTEGER NOT NULL,
    network_out_kbps          INTEGER NOT NULL,
    io_wait                   INTEGER NOT NULL,
    thread_count              INTEGER NOT NULL,
    active_connections        INTEGER NOT NULL,
    error_rate                REAL NOT NULL,
    uptime_seconds            INTEGER NOT NULL,
    temperature_celsius       INTEGER NOT NULL,
    power_consumption_watts   INTEGER NOT NULL,
    svc_database              TEXT NOT NULL CHECK (svc_database IN ('online','degraded','offline')),
    svc_api_gateway           TEXT NOT NULL CHECK (svc_api_gateway IN ('online','degraded','offline')),
    svc_cache                 TEXT NOT NULL CHECK (svc_cache IN ('online','degraded','offline'))
  );
  `;
  private readonly SQL_METRICS_INSERT = `
    INSERT INTO metrics (
      timestamp, cpu_usage, memory_usage, latency_ms, disk_usage,
      network_in_kbps, network_out_kbps, io_wait, thread_count,
      active_connections, error_rate, uptime_seconds,
      temperature_celsius, power_consumption_watts,
      svc_database, svc_api_gateway, svc_cache
    ) VALUES (
      $timestamp, $cpu_usage, $memory_usage, $latency_ms, $disk_usage,
      $network_in_kbps, $network_out_kbps, $io_wait, $thread_count,
      $active_connections, $error_rate, $uptime_seconds,
      $temperature_celsius, $power_consumption_watts,
      $svc_database, $svc_api_gateway, $svc_cache
    )
  `;

  private readonly db: Database;
  private readonly insertStatement: Statement;
  private buffer: Metric[];

  constructor(filename = ":memory:") {
    this.db = new Database(filename);
    this.init();
    this.insertStatement = this.db.prepare(this.SQL_METRICS_INSERT);
    this.buffer = [];
  }

  /**
   * Create the metrics table only if it doesn't exists
   */
  private init() {
    const exists = this.db
      .query(
        "SELECT name FROM sqlite_master WHERE type='table' AND name='metrics'"
      )
      .get();

    if (!exists) {
      this.db.run(this.SQL_INIT);
    }
  }

  insert(metric: Metric) {
    this.buffer.push(metric);
    if (this.buffer.length >= this.BATCH_SIZE) {
      this.flush();
    }
  }

  flush() {
    if (this.buffer.length > 0) {
      this.db.transaction(() => {
        for (const metric of this.buffer) {
          this.insertStatement.run({
            $timestamp: metric.timestamp,
            $cpu_usage: metric.cpu_usage,
            $memory_usage: metric.memory_usage,
            $latency_ms: metric.latency_ms,
            $disk_usage: metric.disk_usage,
            $network_in_kbps: metric.network_in_kbps,
            $network_out_kbps: metric.network_out_kbps,
            $io_wait: metric.io_wait,
            $thread_count: metric.thread_count,
            $active_connections: metric.active_connections,
            $error_rate: metric.error_rate,
            $uptime_seconds: metric.uptime_seconds,
            $temperature_celsius: metric.temperature_celsius,
            $power_consumption_watts: metric.power_consumption_watts,
            $svc_database: metric.service_status.database,
            $svc_api_gateway: metric.service_status.api_gateway,
            $svc_cache: metric.service_status.cache,
          });
        }
      })();
      this.buffer = [];
    }
  }

  close() {
    this.flush();
    this.db.close();
  }

  query(sql: string) {
    return this.db.query(sql);
  }
}
