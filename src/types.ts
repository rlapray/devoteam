import { z } from "zod";

/******************************************************************************
 * INPUT
 *****************************************************************************/

export type Metric = z.infer<typeof MetricSchema>;

const serviceState = z.enum(["online", "degraded", "offline"]);

// Same guards have been added : non negative numbers, error rate never > 1
export const MetricSchema = z.object({
  // Same as in the database
  timestamp: z
    .string()
    .regex(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/,
      "Expected format : YYYY-MM-DDTHH:MM:SSZ"
    ),

  cpu_usage: z.int().min(0),
  memory_usage: z.int().min(0),
  disk_usage: z.int().min(0),

  latency_ms: z.int().min(0),
  network_in_kbps: z.int().min(0),
  network_out_kbps: z.int().min(0),
  io_wait: z.int().min(0),

  thread_count: z.int().min(0),
  active_connections: z.int().min(0),
  uptime_seconds: z.int().min(0),

  error_rate: z.number().min(0).max(1),

  temperature_celsius: z.int(),
  power_consumption_watts: z.int().min(0),

  service_status: z.object({
    database: serviceState,
    api_gateway: serviceState,
    cache: serviceState,
  }),
});

/******************************************************************************
 * OUTPUT
 *****************************************************************************/

export interface Insight {
  average_latency_ms: number;
  error_rate: number;
  max_cpu_usage: number;
  max_memory_usage: number;
  uptime_seconds: number;
}

export interface Anomaly {
  description: string;
  metric: string;
  severity: Severity;
  threshold: number;
  value: number;
}

export interface Recommendation {
  action: string;
  benefit_estimate: string;
  id: string;
  parameters: Record<string, unknown>;
  target: string;
}

export type ServiceStatus = z.infer<typeof serviceState>;

export type ServiceStatusSummary = Record<ServiceStatus, string[]>;

type Severity = "low" | "medium" | "high";

export interface InfrastructureReport {
  anomalies: Anomaly[];
  insights: Insight;
  recommendations: Recommendation[];
  service_status_summary: ServiceStatusSummary;
  timestamp: string;
}
