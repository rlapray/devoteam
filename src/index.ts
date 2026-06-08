import { Aggregator } from "./aggregation/aggregator";
import { RecommendationAgent } from "./recommendation/agent";
import { Store } from "./store";
import { stream } from "./streamer";
import type { InfrastructureReport } from "./types";

try {
  const filename = parseArguments();
  const store = new Store();
  await stream(filename, store);
  const agg = new Aggregator(store);
  const res = generateReportAggregationsOnly(agg);
  const agent = new RecommendationAgent(store, res.insights, res.anomalies);
  res.recommendations = await agent.run();

  store.close();
  const bytesWritten = await Bun.write(
    "output.json",
    JSON.stringify(res, null, 2)
  );
  console.log(`Report written to output.json (${bytesWritten} bytes written)`);
  process.exit(0);
} catch (err) {
  console.error("Unexpected error", { cause: err });
  process.exit(2);
}

function parseArguments(): string {
  let filename: string;

  if (process.argv.length === 2) {
    filename = "rapport.json";
  } else if (process.argv.length === 3) {
    filename = process.argv[2] || "";
  } else {
    throw new Error("usage: devoteam [FILENAME]");
  }
  return filename;
}

function generateReportAggregationsOnly(agg: Aggregator): InfrastructureReport {
  const res: InfrastructureReport = {
    timestamp: new Date().toISOString(),
    insights: agg.insights(),
    anomalies: agg.anomalies(),
    recommendations: [],
    service_status_summary: agg.serviceStatusSummary(),
  };
  return res;
}
