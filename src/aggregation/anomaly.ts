import type { Store } from "../store";
import type { Anomaly } from "../types";

export class AnomalyAggregator {
  private readonly store: Store;

  constructor(store: Store) {
    this.store = store;
  }

  run(): Anomaly[] {
    return [
      ...this.cpu(),
      ...this.memory(),
      ...this.latency(),
      ...this.disk(),
      ...this.errorRate(),
      ...this.temperature(),
      ...this.ioWait(),
    ];
  }

  private cpu(): Anomaly[] {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
        SELECT 'cpu_usage' AS metric,
                cpu_usage AS value,
                CASE WHEN cpu_usage >= $high THEN $high
                    WHEN cpu_usage >= $medium THEN $medium
                    ELSE $low END AS threshold,
                CASE WHEN cpu_usage >= $high THEN 'high'
                    WHEN cpu_usage >= $medium THEN 'medium'
                    ELSE 'low' END AS severity,
                'CPU usage too high' AS description
        FROM metrics
        WHERE cpu_usage >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private memory(): Anomaly[] {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'memory_usage' AS metric,
             memory_usage AS value,
             CASE WHEN memory_usage >= $high THEN $high
                  WHEN memory_usage >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN memory_usage >= $high THEN 'high'
                  WHEN memory_usage >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Memory usage too high' AS description
      FROM metrics
      WHERE memory_usage >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private latency(): Anomaly[] {
    const low = 200;
    const medium = 300;
    const high = 400;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'latency_ms' AS metric,
             latency_ms AS value,
             CASE WHEN latency_ms >= $high THEN $high
                  WHEN latency_ms >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN latency_ms >= $high THEN 'high'
                  WHEN latency_ms >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Latency too high' AS description
      FROM metrics
      WHERE latency_ms >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private disk(): Anomaly[] {
    const low = 75;
    const medium = 85;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'disk_usage' AS metric,
             disk_usage AS value,
             CASE WHEN disk_usage >= $high THEN $high
                  WHEN disk_usage >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN disk_usage >= $high THEN 'high'
                  WHEN disk_usage >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Disk usage too high' AS description
      FROM metrics
      WHERE disk_usage >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private errorRate(): Anomaly[] {
    const low = 0.05;
    const medium = 0.1;
    const high = 0.2;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'error_rate' AS metric,
             error_rate AS value,
             CASE WHEN error_rate >= $high THEN $high
                  WHEN error_rate >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN error_rate >= $high THEN 'high'
                  WHEN error_rate >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Error rate too high' AS description
      FROM metrics
      WHERE error_rate >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private temperature(): Anomaly[] {
    const low = 70;
    const medium = 80;
    const high = 90;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'temperature_celsius' AS metric,
             temperature_celsius AS value,
             CASE WHEN temperature_celsius >= $high THEN $high
                  WHEN temperature_celsius >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN temperature_celsius >= $high THEN 'high'
                  WHEN temperature_celsius >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'Server temperature too high' AS description
      FROM metrics
      WHERE temperature_celsius >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }

  private ioWait(): Anomaly[] {
    const low = 8;
    const medium = 15;
    const high = 25;
    // Result cast to Anomaly, always check SQL and Anomaly together
    const SQL = `
      SELECT 'io_wait' AS metric,
             io_wait AS value,
             CASE WHEN io_wait >= $high THEN $high
                  WHEN io_wait >= $medium THEN $medium
                  ELSE $low END AS threshold,
             CASE WHEN io_wait >= $high THEN 'high'
                  WHEN io_wait >= $medium THEN 'medium'
                  ELSE 'low' END AS severity,
             'IO wait too high' AS description
      FROM metrics
      WHERE io_wait >= $low`;
    const qry = this.store.query(SQL);
    // Result cast to Anomaly, always check SQL and Anomaly together
    return qry.all({ $low: low, $medium: medium, $high: high }) as Anomaly[];
  }
}
