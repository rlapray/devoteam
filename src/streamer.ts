import { createReadStream } from "node:fs";
import chain from "stream-chain";
import streamArray from "stream-json/streamers/stream-array.js";
import type { Store } from "./store";
import { type Metric, MetricSchema } from "./types";

export async function stream(filename: string, store: Store) {
  let errorCounter = 0;
  for await (const metric of createGenerator(filename)) {
    //If a log entry is malformed, the entry is skipped loudly, but the transaction will go on.
    const chk = MetricSchema.safeParse(metric);
    if (!chk.success) {
      const reasons = chk.error.issues
        .map((i) => `${i.path.join(".")}: ${i.code}`)
        .join(", ");
      if (metric == null) {
        console.error(`Skipped an unexpected entry - ${reasons}`);
      } else {
        console.error(`Skipped ${metric.timestamp} - ${reasons}`);
      }
      errorCounter++;
      continue;
    }
    store.insert(chk.data);
  }
  store.flush();
  if (errorCounter > 0) {
    console.error(`Skipped ${errorCounter} metrics`);
  }
}

/**
 * This act as a JSON stream reader, to limit memory usage with large files.
 * Cast each element as a Metric
 * @param filename JSON file to read
 * @returns A stream of metrics
 */
async function* createGenerator(filename: string): AsyncGenerator<Metric> {
  if (!(await Bun.file(filename).exists())) {
    throw new Error(`File "${filename}" does not exists`);
  }
  try {
    const pipeline = chain([
      createReadStream(filename),
      streamArray.withParser(),
    ]);

    for await (const { value } of pipeline) {
      yield value as Metric;
    }
  } catch (err) {
    throw new Error(`File "${filename}" is malformed`, { cause: err });
  }
}
