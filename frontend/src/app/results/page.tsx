'use client';
import { useEffect, useState, useMemo, useCallback, useTransition, Suspense } from 'react';
import React from 'react';
import debounce from 'lodash/debounce';
import { GitHubIcon } from '@/components/GitHubIcon';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip as RadixTooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, AlertTriangle, FileCode } from 'lucide-react';
import Image from 'next/image';
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } from '@radix-ui/react-toast';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, Legend } from 'recharts';
import { Checkbox } from '@/components/ui/checkbox';

const LazyEvidenceTray = React.lazy(() =>
  import('@/components/EvidenceTray').then(module => ({ default: module.EvidenceTray }))
);

interface Resource {
  title: string;
  url: string;
}

interface Project {
  title: string;
  url: string;
}

interface Evidence {
  resume: string[];
  jd: string[];
  github?: string[];
  confidence: number;
}

interface LearningPlan {
  week: number;
  topic: string;
  resources: Resource[];
  project: Project;
  time: string;
}

interface Results {
  ok: boolean;
  resume_chars: number;
  raw_text: string;
  extractedSkills: string[];
  missingSkills: string[];
  matchedJobs: Array<{
    title: string;
    company: string;
    score: number;
    matched_skills: string[];
    missing_skills: string[];
    description: string;
    salaryRange?: string;
  }>;
  evidenceBySkill: { [key: string]: Evidence };
  learningPlan: LearningPlan[];
}

interface GithubProfile {
  login: string;
  avatar_url: string;
}

interface GithubRepo {
  name: string;
  description: string | null;
  html_url: string;
}

interface CustomizedLabelProps {
  value: number;
  labelText: string;
}

const CustomizedLabel = ({ value, labelText }: CustomizedLabelProps) => (
  <text
    x="50%"
    y="50%"
    dy={-10}
    textAnchor="middle"
    className="text-2xl font-bold"
    style={{ fill: 'var(--text)' }}
    role="img"
    aria-label={`${labelText}: ${value} skills`}
  >
    {value}
    <tspan x="50%" dy={20} className="text-sm font-medium" style={{ fill: 'var(--muted)' }}>
      {labelText}
    </tspan>
  </text>
);

const ErrorBoundary: React.FC<{ children: React.ReactNode; fallback: React.ReactNode }> = ({ children, fallback }) => {
  const [hasError, setHasError] = useState(false);
  useEffect(() => setHasError(false), [children]);
  if (hasError) return <>{fallback}</>;
  return <div onError={() => setHasError(true)}>{children}</div>;
};

export default function ResultsPage() {
  const [results, setResults] = useState<Results | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [githubToken, setGithubToken] = useState('');
  const [githubLoading, setGithubLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [githubProfile, setGithubProfile] = useState<GithubProfile | null>(null);
  const [githubRepos, setGithubRepos] = useState<GithubRepo[]>([]);
  const [toastOpen, setToastOpen] = useState(false);
  const [completedWeeks, setCompletedWeeks] = useState<Set<number>>(new Set());
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { theme, systemTheme } = useTheme();

  const effectiveTheme = theme === 'system' ? systemTheme : theme;

  const debouncedSetGithubToken = useMemo(() => debounce(setGithubToken, 300), []);

  useEffect(() => {
    const storedAnalysis = localStorage.getItem('analysis');
    const storedCompleted = localStorage.getItem('completedWeeks');
    if (storedCompleted) {
      try {
        const parsed = JSON.parse(storedCompleted);
        if (Array.isArray(parsed)) {
          setCompletedWeeks(new Set(parsed));
        }
      } catch (e) {
        console.error('Failed to parse completed weeks:', e);
        setError('Failed to load completion data.');
      }
    }
    if (storedAnalysis) {
      try {
        const parsed = JSON.parse(storedAnalysis);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid analysis data');
        setResults(parsed as Results);
      } catch (e) {
        setError('Invalid analysis data. Please upload a resume again.');
      }
    } else {
      setError('No analysis data found. Please upload a resume first.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const storedProfile = localStorage.getItem('githubProfile');
    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setGithubProfile(parsed);
        setGithubConnected(true);
      } catch (e) {
        console.error('Failed to parse GitHub profile:', e);
      }
    }
  }, []);

  const fetchRepos = useCallback(async (token: string) => {
    try {
      const res = await fetch('https://api.github.com/user/repos', {
        headers: { Authorization: `token ${token}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error('Failed to fetch repositories');
      const data = await res.json();
      return data.map((repo: any) => ({
        name: repo.name,
        description: repo.description || 'No description',
        html_url: repo.html_url,
      }));
    } catch (err: any) {
      throw new Error(`Failed to fetch repositories: ${err.message}`);
    }
  }, []);

  const handleGithubIntegrate = useCallback(async () => {
    if (!githubToken || !['ghp_', 'github_pat_'].some(prefix => githubToken.startsWith(prefix))) {
      setError('Please enter a valid GitHub token (starting with "ghp_" or "github_pat_")');
      setToastOpen(true);
      return;
    }
    setGithubLoading(true);
    setError(null);
    try {
      const profileRes = await fetch('https://api.github.com/user', {
        headers: { Authorization: `token ${githubToken}` },
        signal: AbortSignal.timeout(10000),
      });
      if (!profileRes.ok) throw new Error(await profileRes.text());
      const profileData = await profileRes.json();
      setGithubProfile({ login: profileData.login, avatar_url: profileData.avatar_url });
      localStorage.setItem('githubProfile', JSON.stringify(profileData));

      const repos = await fetchRepos(githubToken);
      setGithubRepos(repos);

      const res = await fetch('http://127.0.0.1:8000/api/github-integrate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: githubToken }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(await res.text());
      const githubEvidence = await res.json();
      const updatedEvidence = results ? { ...results.evidenceBySkill } : {};
      for (const [skill, urls] of Object.entries(githubEvidence)) {
        if (Array.isArray(urls)) {
          updatedEvidence[skill] = { resume: [], jd: [], github: urls, confidence: 0.8 };
        }
      }
      setResults(results ? { ...results, evidenceBySkill: updatedEvidence } : { ok: false, resume_chars: 0, raw_text: '', extractedSkills: [], missingSkills: [], matchedJobs: [], learningPlan: [], evidenceBySkill: updatedEvidence });
      setGithubConnected(true);
      setGithubToken('');
      setToastOpen(true);
    } catch (err: any) {
      setError(`GitHub integration failed: ${err.message}. Check your token and network.`);
      setToastOpen(true);
    } finally {
      setGithubLoading(false);
    }
  }, [githubToken, results, fetchRepos]);

  const handleBackToUpload = useCallback(() => {
    localStorage.removeItem('resumeFormData');
    localStorage.removeItem('analysis');
    localStorage.removeItem('githubProfile');
    startTransition(() => router.push('/upload'));
  }, [router]);

  const handleSyncAgain = useCallback(() => {
    localStorage.removeItem('githubProfile');
    setGithubConnected(false);
    setGithubProfile(null);
    setGithubToken('');
    setGithubRepos([]);
  }, []);

  const toggleComplete = useCallback((week: number) => {
    const newCompleted = new Set(completedWeeks);
    if (newCompleted.has(week)) {
      newCompleted.delete(week);
    } else {
      newCompleted.add(week);
    }
    setCompletedWeeks(newCompleted);
    localStorage.setItem('completedWeeks', JSON.stringify(Array.from(newCompleted)));
  }, [completedWeeks]);

  const skillData = useMemo(() => [
    { name: 'Matched', value: results?.extractedSkills?.length || 0 },
    { name: 'Missing', value: results?.missingSkills?.length || 0 },
  ], [results]);

  const jobData = useMemo(() => (results?.matchedJobs || []).map(job => ({
    title: `${job.title.slice(0, 20)}${job.title.length > 20 ? '...' : ''} - ${job.company.slice(0, 15)}${job.company.length > 15 ? '...' : ''}`,
    score: Math.min(job.score * 100, 100),
  })), [results]);

  const COLORS = effectiveTheme === 'dark' ? ['#22c55e', '#ef4444'] : ['#15803d', '#b91c1c'];

  if (loading) return (
    <div className="mx-auto max-w-7xl px-4 py-8 md:py-12 space-y-8">
      <Skeleton className="h-12 w-1/2 mx-auto rounded-2xl" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-32 w-full rounded-2xl" />
    </div>
  );

  if (error && !results) return (
    <Card className="mx-auto max-w-2xl p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
      <Image src="/no-data.svg" alt="No data" width={200} height={200} className="mx-auto mb-4" />
      <p className="text-danger text-center text-lg">{error}</p>
      <Button onClick={handleBackToUpload} variant="link" className="mt-4 block mx-auto text-accent" aria-label="Upload a resume">
        Upload a resume
      </Button>
    </Card>
  );

  if (!results) return (
    <Card className="mx-auto max-w-2xl p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
      <Image src="/no-data.svg" alt="No data" width={200} height={200} className="mx-auto mb-4" />
      <p className="text-muted text-center text-lg">No results available. Please upload a resume.</p>
      <Button onClick={() => router.push('/upload')} variant="default" className="mt-4 block mx-auto bg-accent text-white" aria-label="Go to Upload">
        Go to Upload
      </Button>
    </Card>
  );

  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl px-6 py-10"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-4xl font-bold text-accent text-center mb-10"
          >
            Career Assist - Results Report
          </motion.h1>
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_3fr] gap-8">
            <aside className="sticky top-20 h-fit">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Resume Context</h2>
                <p>Characters: {results.resume_chars || 'N/A'}</p>
                <p>Extracted Skills: {results.extractedSkills.length}</p>
                {!githubConnected ? (
                  <>
                    <Input
                      type="password"
                      value={githubToken}
                      onChange={(e) => debouncedSetGithubToken(e.target.value.trim())}
                      placeholder="GitHub Token"
                      className="mt-4"
                      aria-label="GitHub Personal Access Token"
                    />
                    <Button onClick={handleGithubIntegrate} className="mt-2 w-full" disabled={githubLoading || isPending}>
                      {githubLoading ? 'Connecting...' : 'Connect GitHub'}
                    </Button>
                  </>
                ) : (
                  <p className="mt-4">GitHub Connected: @{githubProfile?.login}</p>
                )}
              </Card>
            </aside>
            <div>
              <Tabs defaultValue="skills-gap" className="space-y-10">
                <TabsList className="grid w-full grid-cols-3 justify-center rounded-lg bg-surface-2 p-2 mb-6" aria-label="Dashboard navigation">
                  <TabsTrigger value="skills-gap" className="rounded-md text-base font-medium px-6 py-2 text-text hover:bg-accent/10 transition-colors">
                    Skills Gap
                  </TabsTrigger>
                  <TabsTrigger value="top-matches" className="rounded-md text-base font-medium px-6 py-2 text-text hover:bg-accent/10 transition-colors">
                    Top Matches
                  </TabsTrigger>
                  <TabsTrigger value="learning-plan" className="rounded-md text-base font-medium px-6 py-2 text-text hover:bg-accent/10 transition-colors">
                    Learning Plan
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="skills-gap">
                  <Card className="p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass mb-8">
                    <CardHeader className="pb-6">
                      <h2 className="text-2xl font-bold text-text">Skills Gap Analysis</h2>
                      <p className="text-sm text-muted">Based on your resume analysis</p>
                    </CardHeader>
                    <CardContent>
                      {results.extractedSkills.length > 0 ? (
                        <motion.div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                          {results.extractedSkills.map((skill) => (
                            <motion.div key={skill} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} onClick={() => setSelectedSkill(skill)}>
                              <RadixTooltip>
                                <TooltipTrigger>
                                  <Badge variant="secondary" className="cursor-pointer hover:scale-105 transition-transform duration-200 text-center py-2 px-4 rounded-full bg-accent/10 text-accent">
                                    {skill}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent><p>Click to view evidence</p></TooltipContent>
                              </RadixTooltip>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className="text-center py-6">
                          <Image src="/no-data.svg" alt="No skills" width={150} height={150} className="mx-auto mb-4" />
                          <p className="text-muted text-lg">No skills extracted from resume.</p>
                        </div>
                      )}
                      <hr className="my-6 border-border" />
                      <h3 className="text-xl font-semibold mb-4 text-text">Skill Coverage Overview</h3>
                      <ErrorBoundary fallback={
                        <div className="text-center py-6">
                          <Image src="/no-data.svg" alt="Chart error" width={150} height={150} className="mx-auto mb-4" />
                          <p className="text-danger text-lg">Failed to render skill chart.</p>
                        </div>
                      }>
                        <Suspense fallback={<Skeleton className="h-[300px] w-full" />}>
                          {skillData[0].value > 0 || skillData[1].value > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                              <PieChart aria-label="Skill coverage pie chart">
                                <Pie data={skillData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} innerRadius={60} label={false}>
                                  {skillData.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                                </Pie>
                                <RechartsTooltip formatter={(value: number, name: string) => [`${value} skills`, name]} contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)' }} />
                                <Legend wrapperStyle={{ color: 'var(--text)', paddingTop: '16px' }} />
                                <CustomizedLabel value={results.extractedSkills.length} labelText="Matched" />
                              </PieChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="text-center py-6">
                              <Image src="/no-data.svg" alt="No skill data" width={150} height={150} className="mx-auto mb-4" />
                              <p className="text-muted text-lg">No skill data available.</p>
                            </div>
                          )}
                        </Suspense>
                      </ErrorBoundary>
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="top-matches">
                  <Card className="p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass mb-8">
                    <CardHeader className="pb-6">
                      <h2 className="text-2xl font-bold text-text">Top Job Matches</h2>
                      <p className="text-sm text-muted">Top matches based on your skills</p>
                    </CardHeader>
                    <CardContent>
                      {results.matchedJobs.length > 0 ? (
                        <motion.div className="grid gap-6 md:grid-cols-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                          {results.matchedJobs.map((job, index) => (
                            <motion.div key={`${job.title}-${job.company}-${index}`} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                              <Card className="p-6 bg-surface-2 border border-border rounded-2xl shadow-card hover:shadow-lg transition-shadow">
                                <h3 className="text-lg font-bold text-text mb-2">{job.title} - {job.company}</h3>
                                <RadixTooltip>
                                  <TooltipTrigger>
                                    <Progress value={Math.min(job.score * 100, 100)} className="mt-2 h-3" aria-label={`Match score: ${(job.score * 100).toFixed(1)}%`} />
                                  </TooltipTrigger>
                                  <TooltipContent><p>Match Score: {(job.score * 100).toFixed(1)}%</p></TooltipContent>
                                </RadixTooltip>
                                <p className="mt-2 text-sm text-muted line-clamp-2 overflow-hidden">{job.description}</p>
                                <p className="mt-1 text-sm text-muted">Salary: {job.salaryRange || 'Unknown'}</p>
                                <Accordion type="single" collapsible className="mt-3">
                                  <AccordionItem value="missing">
                                    <AccordionTrigger>Missing Skills ({job.missing_skills.length})</AccordionTrigger>
                                    <AccordionContent>
                                      <div className="flex flex-wrap gap-2">
                                        {job.missing_skills.length > 0 ? (
                                          job.missing_skills.map(s => (
                                            <Badge key={s} variant="secondary" className="ml-1 hover:scale-105 transition-transform rounded-full bg-accent/10 text-accent">
                                              {s}
                                            </Badge>
                                          ))
                                        ) : (
                                          <Badge variant="secondary" className="rounded-full bg-success text-white">None ✅</Badge>
                                        )}
                                      </div>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                              </Card>
                            </motion.div>
                          ))}
                        </motion.div>
                      ) : (
                        <div className="text-center py-6">
                          <Image src="/no-data.svg" alt="No jobs" width={150} height={150} className="mx-auto mb-4" />
                          <p className="text-muted text-lg">No matching jobs found. Try updating your resume.</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="learning-plan">
                  <Card className="p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass mb-8">
                    <CardHeader className="pb-6">
                      <h2 className="text-2xl font-bold text-text">Learning Plan</h2>
                      <p className="text-sm text-muted">Personalized plan to bridge skill gaps</p>
                    </CardHeader>
                    <CardContent>
                      {results.learningPlan.length > 0 ? (
                        <div className="space-y-8 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                          <Progress
                            value={(completedWeeks.size / results.learningPlan.length) * 100}
                            className="mb-6 h-2"
                            aria-label={`Learning progress: ${((completedWeeks.size / results.learningPlan.length) * 100).toFixed(1)}%`}
                          />
                          {results.learningPlan.map((step, index) => (
                            <motion.div
                              key={step.week}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="relative pl-10"
                            >
                              <Card className="p-4 bg-surface-2 border border-border rounded-2xl shadow-card hover:lift">
                                <div className="absolute -left-4 top-2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold">
                                  {step.week}
                                </div>
                                <Accordion type="single" collapsible>
                                  <AccordionItem value={`item-${step.week}`}>
                                    <AccordionTrigger
                                      className="text-lg font-bold text-text hover:no-underline"
                                      aria-label={`Week ${step.week}: ${step.topic}`}
                                    >
                                      {step.topic}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                      <p className="text-sm text-muted mb-2">Estimated Time: {step.time}</p>
                                      <h4 className="text-sm font-semibold text-text mb-1">Resources:</h4>
                                      <ul className="list-disc pl-5 text-sm text-muted mb-3">
                                        {Array.isArray(step.resources) && step.resources.length > 0 ? (
                                          step.resources.map((res, i) => (
                                            <li key={i}>
                                              <a
                                                href={res.url || '#'}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="text-accent hover:underline"
                                              >
                                                {res.title || 'Untitled Resource'}
                                              </a>
                                            </li>
                                          ))
                                        ) : (
                                          <li className="text-muted">No resources available</li>
                                        )}
                                      </ul>
                                      <h4 className="text-sm font-semibold text-text mb-1">Project:</h4>
                                      <p className="text-sm text-muted">
                                        {step.project && typeof step.project === 'object' && step.project.title && step.project.url ? (
                                          <a
                                            href={step.project.url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-accent hover:underline"
                                          >
                                            {step.project.title}
                                          </a>
                                        ) : (
                                          <span>No project available</span>
                                        )}
                                      </p>
                                    </AccordionContent>
                                  </AccordionItem>
                                </Accordion>
                                <motion.div
                                  className="flex items-center mt-2"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: completedWeeks.has(step.week) ? 1 : 0 }}
                                  transition={{ duration: 0.2 }}
                                >
                                  <Checkbox
                                    checked={completedWeeks.has(step.week)}
                                    onCheckedChange={() => toggleComplete(step.week)}
                                    id={`complete-${step.week}`}
                                    aria-label={`Mark week ${step.week} as complete`}
                                  />
                                  <label htmlFor={`complete-${step.week}`} className="ml-2 text-sm text-muted">
                                    Mark Complete
                                  </label>
                                </motion.div>
                              </Card>
                            </motion.div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6">
                          <Image src="/no-data.svg" alt="No learning plan" width={150} height={150} className="mx-auto mb-4" />
                          <p className="text-muted text-lg">No learning plan available.</p>
                        </div>
                      )}
                      <Button
                        onClick={() => router.push('/upload')}
                        className="mt-6 w-full bg-accent text-white rounded-lg shadow-sm hover:shadow-md"
                        aria-label="Back to Upload"
                      >
                        Back to Upload
                      </Button>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
              <Tabs defaultValue="evidence" className="space-y-10 mt-8">
                <TabsList className="grid w-full grid-cols-2 justify-center rounded-lg bg-surface-2 p-2 mb-6" aria-label="GitHub sub-tabs">
                  <TabsTrigger value="evidence" className="rounded-md text-base font-medium px-6 py-2 text-text hover:bg-accent/10 transition-colors">
                    Evidence
                  </TabsTrigger>
                  <TabsTrigger value="repos" className="rounded-md text-base font-medium px-6 py-2 text-text hover:bg-accent/10 transition-colors">
                    Repos
                  </TabsTrigger>
                </TabsList>
                <TabsContent value="evidence">
                  <Card className="p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass mb-8">
                    <CardHeader className="pb-6">
                      <h2 className="text-2xl font-bold text-text flex items-center gap-2">
                        <GitHubIcon /> GitHub Integration & Evidence
                      </h2>
                      <p className="text-sm text-muted">Connect and validate skills from your GitHub repositories</p>
                    </CardHeader>
                    <CardContent>
                      {githubConnected && githubProfile ? (
                        <div className="space-y-6">
                          <div className="flex items-center gap-4 p-4 rounded-lg bg-surface-2 border border-border">
                            <Avatar className="h-12 w-12">
                              <AvatarImage src={githubProfile.avatar_url} alt={`${githubProfile.login}'s avatar`} />
                              <AvatarFallback>{githubProfile.login[0]}</AvatarFallback>
                            </Avatar>
                            <div className="font-medium text-text flex items-center gap-1">
                              @{githubProfile.login} <Badge variant="secondary" className="bg-success text-white">Verified ✓</Badge>
                            </div>
                            <Button onClick={handleSyncAgain} variant="link" className="ml-auto text-accent hover:underline" aria-label="Sync GitHub again">
                              Sync Again
                            </Button>
                          </div>
                          {Object.entries(results.evidenceBySkill).some(([_, e]) => e.github?.length) ? (
                            <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                              {Object.entries(results.evidenceBySkill).filter(([_, e]) => e.github?.length).map(([skill, evidence]) => (
                                <motion.div key={skill} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                  <Card className="p-4 bg-surface-2 border border-border rounded-2xl shadow-card hover:shadow-lg transition-shadow">
                                    <CardHeader className="flex items-center justify-between pb-4">
                                      <h3 className="text-lg font-semibold text-text">{skill}</h3>
                                      <Progress value={Math.min(evidence.confidence * 100, 100)} className="w-24 h-2" aria-label={`Confidence: ${(evidence.confidence * 100).toFixed(1)}%`} />
                                    </CardHeader>
                                    <CardContent>
                                      <ul className="space-y-2">
                                        {evidence.github!.map((url, i) => (
                                          <li key={i} className="flex items-center gap-2">
                                            <FileCode className="w-4 h-4 text-muted" />
                                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline truncate max-w-[250px] sm:max-w-[350px] text-ellipsis">
                                              {url.split('/').slice(-3).join('/')}
                                            </a>
                                          </li>
                                        ))}
                                      </ul>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </motion.div>
                          ) : (
                            <div className="text-center py-6">
                              <Image src="/no-data.svg" alt="No GitHub evidence" width={150} height={150} className="mx-auto mb-4" />
                              <p className="text-muted text-lg">No GitHub skill evidence detected.</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-6">
                          <Input
                            type="password"
                            value={githubToken}
                            onChange={(e) => debouncedSetGithubToken(e.target.value.trim())}
                            placeholder="Enter GitHub Personal Access Token"
                            className="w-full bg-surface-2 border border-border rounded-lg text-text placeholder-muted p-2"
                            aria-label="GitHub Personal Access Token"
                          />
                          <Button
                            onClick={handleGithubIntegrate}
                            disabled={githubLoading || isPending}
                            className="w-full bg-accent text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            aria-label="Integrate GitHub"
                          >
                            {githubLoading ? 'Integrating...' : 'Connect GitHub'}
                          </Button>
                          {githubLoading && <Skeleton className="h-4 w-full mt-2 rounded-2xl" />}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                <TabsContent value="repos">
                  <Card className="p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass mb-8">
                    <CardHeader className="pb-6">
                      <h2 className="text-2xl font-bold text-text">GitHub Repositories</h2>
                      <p className="text-sm text-muted">Explore your public GitHub repositories</p>
                    </CardHeader>
                    <CardContent>
                      {githubConnected && githubProfile ? (
                        githubRepos.length > 0 ? (
                          <motion.div className="space-y-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
                            {githubRepos.map((repo) => (
                              <motion.div key={repo.name} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                                <Card className="p-4 bg-surface-2 border border-border rounded-2xl shadow-card hover:shadow-lg transition-shadow">
                                  <CardHeader>
                                    <h3 className="text-lg font-semibold text-text">{repo.name}</h3>
                                  </CardHeader>
                                  <CardContent>
                                    <p className="text-sm text-muted mb-2">{repo.description}</p>
                                    <a href={repo.html_url} target="_blank" rel="noopener noreferrer" className="text-accent hover:underline">View Repository</a>
                                  </CardContent>
                                </Card>
                              </motion.div>
                            ))}
                          </motion.div>
                        ) : (
                          <div className="text-center py-6">
                            <Image src="/no-data.svg" alt="No repositories" width={150} height={150} className="mx-auto mb-4" />
                            <p className="text-muted text-lg">No repositories found. Try syncing again.</p>
                          </div>
                        )
                      ) : (
                        <div className="space-y-6">
                          <Input
                            type="password"
                            value={githubToken}
                            onChange={(e) => debouncedSetGithubToken(e.target.value.trim())}
                            placeholder="Enter GitHub Personal Access Token"
                            className="w-full bg-surface-2 border border-border rounded-lg text-text placeholder-muted p-2"
                            aria-label="GitHub Personal Access Token"
                          />
                          <Button
                            onClick={handleGithubIntegrate}
                            disabled={githubLoading || isPending}
                            className="w-full bg-accent text-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
                            aria-label="Integrate GitHub"
                          >
                            {githubLoading ? 'Integrating...' : 'Connect GitHub'}
                          </Button>
                          {githubLoading && <Skeleton className="h-4 w-full mt-2 rounded-2xl" />}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
          {selectedSkill && results.evidenceBySkill?.[selectedSkill] && (
            <Suspense fallback={<Skeleton className="fixed inset-0 bg-black/50" />}>
              <LazyEvidenceTray skill={selectedSkill} evidence={results.evidenceBySkill[selectedSkill]} onClose={() => setSelectedSkill(null)} />
            </Suspense>
          )}
        </motion.div>
        <Toast open={toastOpen} onOpenChange={setToastOpen} className={`p-4 rounded-2xl shadow-card border glass flex items-center gap-3 ${error ? 'bg-danger/10 border-danger/50' : 'bg-success/10 border-success/50'}`}>
          {error ? <AlertTriangle className="h-6 w-6 text-danger" /> : <CheckCircle className="h-6 w-6 text-success" />}
          <div>
            <ToastTitle className={`font-semibold text-lg ${error ? 'text-danger' : 'text-success'}`}>{error ? 'GitHub Integration Failed' : 'GitHub Connected'}</ToastTitle>
            <ToastDescription className={`text-sm ${error ? 'text-danger/80' : 'text-success/80'}`}>{error || 'Successfully connected to GitHub! Your skills have been validated.'}</ToastDescription>
          </div>
          <ToastClose className="ml-auto text-accent hover:text-accent/80 font-medium text-sm" aria-label="Close notification">Close</ToastClose>
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 w-[90vw] max-w-[400px] z-50" />
      </TooltipProvider>
    </ToastProvider>
  );
}