import type { PersonaConfig } from "@/types";

export const DEFAULT_PERSONA_CONFIG: PersonaConfig = {
  interestAreas: [
    { topic: "cybersecurity", weight: 1.0 },
    { topic: "AI/ML", weight: 0.8 },
    { topic: "cloud infrastructure", weight: 0.7 },
    { topic: "enterprise technology", weight: 0.6 },
  ],
  depthLevel: "executive",
  companyWatchlist: ["CRWD", "PANW", "S", "FTNT", "ZS"],
  sourcePrioritization: {},
  briefingFormat: {
    maxItems: 15,
    includeActionItems: true,
    includeTrendAnalysis: true,
  },
  relevanceThreshold: 0.3,
};
