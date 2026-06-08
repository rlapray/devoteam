import { openai } from "@ai-sdk/openai";
import { generateText, type LanguageModel, Output, stepCountIs } from "ai";
import type { Store } from "../store";
import {
  type Anomaly,
  type Insight,
  type Recommendation,
  recommendationSchema,
} from "../types";
import { createSqlTool } from "./tools";

export class RecommendationAgent {
  private readonly STEP_MAX = 25;
  private readonly MODEL_NAME = "gpt-5-nano";

  private readonly model: LanguageModel;
  private readonly store: Store;
  private readonly insight: Insight;
  private readonly anomalies: Anomaly[];

  constructor(store: Store, insight: Insight, anomalies: Anomaly[]) {
    this.model = openai(this.MODEL_NAME);
    this.store = store;
    this.insight = insight;
    this.anomalies = anomalies;
  }

  /**
   * The choice here is to maximize intelligence for the analysis and the stability for the JSON transformation part
   * The choice is intelligence over cost here.
   */
  async run(): Promise<Recommendation[]> {
    const analysis = await this.generateAnalysis();
    return this.transformIntoJson(analysis);
  }

  private async generateAnalysis(): Promise<string> {
    const { text: analysis } = await generateText({
      model: this.model,
      tools: {
        query_db: createSqlTool(this.store),
      },
      stopWhen: stepCountIs(this.STEP_MAX),
      system: `
        Tu es un ingénieur SRE senior. Des anomalies d'infrastructure ont déjà été détectées en amont. 
        Ta mission : en comprendre l'ampleur, la cause racine et les corrélations, puis formuler des recommandations d'optimisation concrètes et chiffrées.

        Méthode d'analyse :
        - Raisonne via les Four Golden Signals (Latency, Traffic, Errors, Saturation) et la méthode USE. Rattache chaque anomalie à un signal : 
          - cpu/memory/disk/io_wait/thread_count/active_connections → saturation
          - latency_ms/io_wait → latence
          - error_rate + services dégradés → erreurs ;
          - network_in/out → trafic.
        - Un système se dégrade AVANT 100% d'utilisation : une ressource proche du seuil critique justifie une action préventive, pas seulement curative.

        Exploite query_db pour QUANTIFIER avant de recommander :
        - Mesure l'ampleur (max, moyenne, percentiles approximés, durée) de chaque anomalie.
        - Distingue un pic ponctuel d'une saturation soutenue (regarde l'évolution dans le temps).
        - Cherche les corrélations entre métriques (ex. CPU élevé ↔ latence élevée, io_wait ↔ disk_usage, error_rate ↔ statut de service dégradé).
        - Identifie les fenêtres temporelles où les services sont dégradés/offline.
        - Pas plus de 15 appels à query_db.

        Règles pour les recommandations :
        - Une recommandation par cause racine ; regroupe les anomalies qui partagent une cause.
        - Chaque action doit être un geste opérationnel exécutable (scaler, rééquilibrer la charge, augmenter un pool de connexions, activer un cache, redémarrer, rollback…), jamais une simple observation ("surveiller", "investiguer").
        - Donne des paramètres CHIFFRÉS dérivés des données (valeurs cibles, nombre de répliques, seuils), le composant ciblé, et le bénéfice attendu quantifié quand c'est justifiable (sinon reste qualitatif, n'invente pas de chiffre).
        - Priorise par sévérité ; les services offline/degraded priment.

        Discipline anti-extrapolation (IMPORTANT) :
        - Les seuls composants existants sont ceux présents dans les données : "database", "api_gateway", "cache" (et la machine/infra globale). Le seul vocabulaire fiable est celui des métriques de la table metrics.
        - N'invente JAMAIS une technologie, un produit ou un éditeur précis (ex. Redis, Memcached, Nginx, PostgreSQL, Kubernetes...) : rien dans les données ne dit lesquels sont utilisés. Parle de "cache", "base de données", "passerelle API" de façon générique.
        - N'invente JAMAIS une clé ou un paramètre de configuration propriétaire (ex. maxmemory, worker_processes, innodb_buffer_pool_size...). Une telle clé suppose une techno que tu ne connais pas.
        - Les paramètres d'une recommandation s'expriment UNIQUEMENT en fonction de :
            (a) une métrique observée et sa valeur cible, (b) le composant ciblé,
            (c) une grandeur opérationnelle neutre (nombre de répliques, taille de pool, facteur d'échelle). Si tu ne peux pas chiffrer un paramètre à partir des données, ne l'inclus pas ; ne comble pas le vide par une supposition.

        Exemples de paramètres au bon niveau d'abstraction (chaque clé est dérivable d'une métrique ou d'un composant réel, aucune techno devinée) :
        - CPU saturé      → target "compute",     {"current_cpu_pct": 85, "target_cpu_pct": 70, "scale_factor": 1.5}
        - Mémoire haute   → target "compute",     {"current_mem_pct": 90, "target_mem_pct": 75}
        - Latence haute   → target "api_gateway", {"current_latency_ms": 250, "target_latency_ms": 150}
        - Connexions      → target "api_gateway", {"current_connections": 45, "connection_pool_target": 100}
        - Erreurs hautes  → target "api_gateway", {"current_error_rate": 0.02, "target_error_rate": 0.005}
        - IO/disque       → target "storage",     {"current_disk_pct": 65, "io_wait": 5, "add_capacity": true}
        - Cache dégradé   → target "cache",       {"action_intent": "restore_availability"}

        Ancrage strict : ne fonde tes conclusions QUE sur les insights, les anomalies fournies et les résultats de query_db. N'invente aucune métrique, aucun seuil ni aucun composant absent des données. S'il n'y a rien d'anormal, dis-le.

        Ne te préoccupe PAS du format de sortie : rédige une analyse claire et structurée en texte. La mise en forme est faite par une étape ultérieure.
        `,
      messages: [
        {
          role: "user",
          content: `Insights : 
            ${JSON.stringify(this.insight)}`,
        },
        {
          role: "user",
          content: `Anomalies : 
            ${JSON.stringify(this.anomalies)}`,
        },
      ],
    });
    return analysis;
  }

  private async transformIntoJson(analysis: string): Promise<Recommendation[]> {
    const { output } = await generateText({
      model: this.model,
      output: Output.object({ schema: recommendationSchema }),
      prompt: `Convertis cette analyse en recommandations structurées:
        
        ${analysis}`,
    });

    // Strict schema validation ensure OpenAI API respond a valid schema
    // Record<string, unknown> add propertyNames into the schema, so bypassing it
    return output.recommendations.map((r) => ({
      ...r,
      parameters: this.safeFreeParametersCast(r.parameters),
    }));
  }

  // See transformIntoJson. Free parameters returned by the LLM may be malformed
  // This is a guard
  private safeFreeParametersCast(parameters: string): Record<string, unknown> {
    try {
      return JSON.parse(parameters) as Record<string, unknown>;
    } catch (err) {
      console.error("Free parameters returned by LLM are malformed, skipping", {
        cause: err,
      });
      return {};
    }
  }
}
