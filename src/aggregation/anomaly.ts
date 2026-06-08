import type { Store } from "../store";
import type { Anomaly } from "../types";

export class AnomalyAggregator {
  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  run(): Anomaly[] {
    return [
      this.cpu(),
      this.memory(),
      this.latency(),
      this.disk(),
      this.errorRate(),
      this.temperature(),
      this.ioWait(),
    ].filter((ano) => ano !== null);
  }

  private cpu(): Anomaly | null {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
        SELECT
          'cpu_usage' AS metric,
          MAX(cpu_usage) AS value,
          CASE WHEN MAX(cpu_usage) >= $high   THEN $high
              WHEN MAX(cpu_usage) >= $medium THEN $medium
              ELSE $low END AS threshold,
          CASE WHEN MAX(cpu_usage) >= $high   THEN 'high'
              WHEN MAX(cpu_usage) >= $medium THEN 'medium'
              ELSE 'low' END AS severity,
          'CPU usage too high' AS description
        FROM metrics
        WHERE cpu_usage >= $low
        HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private memory(): Anomaly | null {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'memory_usage' AS metric,
             MAX(memory_usage) AS value,
             CASE WHEN MAX(memory_usage) >= $high   THEN $high
                  WHEN MAX(memory_usage) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(memory_usage) >= $high   THEN 'high'
                  WHEN MAX(memory_usage) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Memory usage too high' AS description
      FROM metrics
      WHERE memory_usage >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private latency(): Anomaly | null {
    const low = 200;
    const medium = 300;
    const high = 400;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'latency_ms' AS metric,
             MAX(latency_ms) AS value,
             CASE WHEN MAX(latency_ms) >= $high   THEN $high
                  WHEN MAX(latency_ms) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(latency_ms) >= $high   THEN 'high'
                  WHEN MAX(latency_ms) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Latency too high' AS description
      FROM metrics
      WHERE latency_ms >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private disk(): Anomaly | null {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'disk_usage' AS metric,
             MAX(disk_usage) AS value,
             CASE WHEN MAX(disk_usage) >= $high   THEN $high
                  WHEN MAX(disk_usage) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(disk_usage) >= $high   THEN 'high'
                  WHEN MAX(disk_usage) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Disk usage too high' AS description
      FROM metrics
      WHERE disk_usage >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private errorRate(): Anomaly | null {
    const low = 0.05;
    const medium = 0.1;
    const high = 0.2;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'error_rate' AS metric,
             MAX(error_rate) AS value,
             CASE WHEN MAX(error_rate) >= $high   THEN $high
                  WHEN MAX(error_rate) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(error_rate) >= $high   THEN 'high'
                  WHEN MAX(error_rate) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Error rate too high' AS description
      FROM metrics
      WHERE error_rate >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private temperature(): Anomaly | null {
    const low = 70;
    const medium = 80;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'temperature_celsius' AS metric,
             MAX(temperature_celsius) AS value,
             CASE WHEN MAX(temperature_celsius) >= $high   THEN $high
                  WHEN MAX(temperature_celsius) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(temperature_celsius) >= $high   THEN 'high'
                  WHEN MAX(temperature_celsius) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Server temperature too high' AS description
      FROM metrics
      WHERE temperature_celsius >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }

  private ioWait(): Anomaly | null {
    const low = 8;
    const medium = 15;
    const high = 25;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'io_wait' AS metric,
             MAX(io_wait) AS value,
             CASE WHEN MAX(io_wait) >= $high   THEN $high
                  WHEN MAX(io_wait) >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN MAX(io_wait) >= $high   THEN 'high'
                  WHEN MAX(io_wait) >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'IO wait too high' AS description
      FROM metrics
      WHERE io_wait >= $low
      HAVING COUNT(*) > 0`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.get({
      $low: low,
      $medium: medium,
      $high: high,
    }) as Anomaly | null;
  }
}
