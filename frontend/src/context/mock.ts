import { Analysis } from './types';

export const dummyAnalysis: Analysis = {
  extractedSkills: ["Python", "SQL"],
  missingSkills: ["Docker", "Kubernetes"],
  matchedJobs: [
    { title: "Data Scientist", company: "Google", matchPercent: 85 },
    { title: "Backend Engineer", company: "Amazon", matchPercent: 70 },
  ],
  evidenceBySkill: {
    Python: {
      resume: ["Developed Python scripts..."],
      jd: ["Python, ML, Pandas, SQL"],
      confidence: 90
    },
    SQL: {
      resume: ["Wrote complex joins..."],
      jd: ["Python, ML, Pandas, SQL"],
      confidence: 85
    },
  },
  learningPlan: [
    {
      week: 1,
      topic: "Docker",
      resources: [{ title: "Docker for Beginners", url: "https://www.youtube.com/watch?v=pg19Z8LL06I" }],
      project: { title: "Dockerize your Todo app", url: "https://www.youtube.com/watch?v=pg19Z8LL06I" },
      time: "3 days"
    },
    {
      week: 2,
      topic: "Kubernetes",
      resources: [{ title: "Kubernetes Basics", url: "https://www.udemy.com/course/learn-kubernetes" }],
      project: { title: "Deploy app to K8s cluster", url: "https://www.udemy.com/course/learn-kubernetes" },
      time: "4 days"
    },
  ],
};