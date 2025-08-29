export type Job = { title: string; company: string; matchPercent: number };
export type Evidence = { resume: string[]; jd: string[]; github?: string[]; confidence?: number };

export type Analysis = {
  extractedSkills: string[];
  missingSkills: string[];
  matchedJobs: Job[];
  evidenceBySkill: Record<string, Evidence>;
  learningPlan: Array<{
    week: number;
    topic: string;
    resources: { title: string; url: string }[];
    project?: { title: string; url: string };
    time?: string;
  }>;
};