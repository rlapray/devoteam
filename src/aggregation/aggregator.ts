import type { Store } from "../store";
import type { Anomaly, Insight, ServiceStatusSummary } from "../types";
import { AnomalyAggregator } from "./anomaly";
import { InsightAggregator } from "./insight";
import { ServiceAggregator } from "./service";

export class Aggregator {
  private readonly store: Store;
  private readonly insight: InsightAggregator;
  private readonly service: ServiceAggregator;
  private readonly anomaly: AnomalyAggregator;

  constructor(store: Store) {
    this.store = store;
    this.insight = new InsightAggregator(this.store);
    this.service = new ServiceAggregator(this.store);
    this.anomaly = new AnomalyAggregator(this.store);
  }

  insights(): Insight {
    return this.insight.run();
  }

  serviceStatusSummary(): ServiceStatusSummary {
    return this.service.run();
  }

  anomalies(): Anomaly[] {
    return this.anomaly.run();
  }
}
