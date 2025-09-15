'use client';
import { useEffect, useState, useMemo, useCallback, useTransition, Suspense } from 'react';
import debounce from 'lodash/debounce';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
import { GitHubIcon } from '@/components/GitHubIcon';
import React from 'react';
const LazyEvidenceTray = React.lazy(() => import('@/components/EvidenceTray').then(module => ({ default: module.EvidenceTray })));
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
    className="text-xs xs:text-sm sm:text-xl font-bold"
    style={{ fill: 'var(--text)' }}
    role="img"
    aria-label={`${labelText}: ${value} skills`}
  >
    {value}
    <tspan x="50%" dy={20} className="text-[10px] xs:text-xs sm:text-sm font-medium" style={{ fill: 'var(--muted)' }}>
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
  const [activeTab, setActiveTab] = useState('skills-gap');
  const [activeSubTab, setActiveSubTab] = useState('evidence');
  const [showAllSkills, setShowAllSkills] = useState(false);
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
    setLoading(true);
    try {
      const storedAnalysis = localStorage.getItem('analysis');
      const storedCompleted = localStorage.getItem('completedWeeks');

      if (storedCompleted) {
        const parsed = JSON.parse(storedCompleted);
        if (Array.isArray(parsed)) setCompletedWeeks(new Set(parsed));
      }
      if (storedAnalysis) {
        const parsed = JSON.parse(storedAnalysis);
        if (!parsed || typeof parsed !== 'object') throw new Error('Invalid analysis data');
        setResults(parsed as Results);
      } else {
        setError('No analysis data found. Please upload a resume first.');
      }
    } catch (e) {
      console.error(e);
      setError('Failed to load analysis or completion data.');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    try {
      const storedProfile = localStorage.getItem('githubProfile');
      if (storedProfile) {
        const parsed = JSON.parse(storedProfile);
        setGithubProfile(parsed);
        setGithubConnected(true);
      }
    } catch (e) {
      console.error('Failed to parse GitHub profile:', e);
    }
  }, []);
  const fetchRepos = useCallback(async (token: string) => {
    const res = await fetch('https://api.github.com/user/repos', {
      headers: { Authorization: `token ${token}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) throw new Error(`Failed to fetch repos: ${res.statusText}`);
    const data = await res.json();
    return data.map((repo: any) => ({
      name: repo.name,
      description: repo.description || 'No description',
      html_url: repo.html_url,
    }));
  }, []);
  const handleGithubIntegrate = useCallback(async () => {
    if (!githubToken || !['ghp_', 'github_pat_'].some(prefix => githubToken.startsWith(prefix))) {
      setError('Enter a valid GitHub token (starting with "ghp_" or "github_pat_")');
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
      if (!profileRes.ok) throw new Error(`Failed to fetch GitHub profile: ${profileRes.statusText}`);
      const profileData = await profileRes.json();
      setGithubProfile({ login: profileData.login, avatar_url: profileData.avatar_url });
      localStorage.setItem('githubProfile', JSON.stringify(profileData));
      const repos = await fetchRepos(githubToken);
      setGithubRepos(repos);
      const exchangeRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/auth/exchange-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ github_token: githubToken }),
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!exchangeRes.ok) {
        const errData = await exchangeRes.json().catch(() => ({}));
        throw new Error(`Token exchange failed: ${errData.detail || exchangeRes.statusText}`);
      }
      const { access_token } = await exchangeRes.json();
      const url = `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/github-integrate`;
      console.log('Calling URL:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({ token: githubToken }),
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) {
        let errorMsg = 'GitHub integration failed';
        try {
          const errData = await res.json();
          if (errData?.detail) {
            errorMsg += `: ${typeof errData.detail === 'string' ? errData.detail : JSON.stringify(errData.detail)}`;
          }
        } catch {
          const text = await res.text();
          if (text) errorMsg += `: ${text}`;
        }
        throw new Error(errorMsg);
      }
      const githubEvidence = await res.json();
      setResults(prev => {
        const existing = prev?.evidenceBySkill || {};
        for (const [skill, urls] of Object.entries(githubEvidence || {})) {
          if (Array.isArray(urls)) {
            existing[skill] = {
              resume: existing[skill]?.resume || [],
              jd: existing[skill]?.jd || [],
              github: urls,
              confidence: 0.8,
            };
          }
        }
        return prev
          ? { ...prev, evidenceBySkill: existing }
          : {
            ok: false,
            resume_chars: 0,
            raw_text: '',
            extractedSkills: [],
            missingSkills: [],
            matchedJobs: [],
            learningPlan: [],
            evidenceBySkill: existing,
          };
      });
      setGithubConnected(true);
      setGithubToken('');
      setToastOpen(true);
    } catch (err: any) {
      console.error('GitHub integration error:', err);
      setError(`GitHub integration failed: ${err.message}`);
      setToastOpen(true);
    } finally {
      setGithubLoading(false);
    }
  }, [githubToken, fetchRepos]);
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
  const skillData = useMemo(
    () => [
      { name: 'Matched', value: results?.extractedSkills?.length || 0 },
      { name: 'Missing', value: results?.missingSkills?.length || 0 },
    ],
    [results]
  );
  const displayedSkills = useMemo(
    () => (showAllSkills ? results?.extractedSkills || [] : (results?.extractedSkills || []).slice(0, 10)),
    [results, showAllSkills]
  );
  const COLORS = effectiveTheme === 'dark' ? ['#22c55e', '#ef4444'] : ['#15803d', '#b91c1c'];
  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-2 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-10 md:py-12 space-y-6 xs:space-y-8">
        <Skeleton className="h-10 xs:h-12 w-1/2 mx-auto rounded-xl" />
        <Skeleton className="h-40 xs:h-48 w-full rounded-xl" />
        <Skeleton className="h-28 xs:h-32 w-full rounded-xl" />
      </div>
    );
  }
  if (error && !results) {
    return (
      <Card className="mx-auto max-w-full xs:max-w-2xl p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
        <Image src="/no-data.svg" alt="No data" width={150} height={150} className="mx-auto mb-4" />
        <p className="text-danger text-center text-sm xs:text-base sm:text-lg">Error: {error}</p>
        <Button
          onClick={handleBackToUpload}
          variant="link"
          className="mt-4 block mx-auto text-accent rounded-xl hover:scale-105 transition-transform duration-150 text-xs xs:text-sm"
          aria-label="Upload a resume"
        >
          Upload a resume
        </Button>
      </Card>
    );
  }
  if (!results) {
    return (
      <Card className="mx-auto max-w-full xs:max-w-2xl p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
        <Image src="/no-data.svg" alt="No data" width={150} height={150} className="mx-auto mb-4" />
        <p className="text-muted text-center text-sm xs:text-base sm:text-lg">No results available. Please upload a resume.</p>
        <Button
          onClick={() => router.push('/upload')}
          variant="default"
          className="mt-4 block mx-auto bg-accent text-white rounded-xl hover:scale-105 transition-transform duration-150 text-xs xs:text-sm"
          aria-label="Go to Upload"
        >
          Go to Upload
        </Button>
      </Card>
    );
  }
  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      <TooltipProvider>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="mx-auto max-w-7xl px-2 xs:px-4 sm:px-6 md:px-8 py-6 xs:py-8 sm:py-10 md:py-12 flex flex-col gap-4 xs:gap-6 sm:gap-8"
        >
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-2xl xs:text-3xl sm:text-4xl font-bold text-accent text-center mb-4 xs:mb-6 sm:mb-8"
          >
            Career Assist - Results Report
          </motion.h1>
          <aside className="order-last md:order-first">
            <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
              <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 xs:mb-4 text-text">Resume Context</h2>
              <p className="text-xs xs:text-sm sm:text-base leading-relaxed text-muted mb-1 xs:mb-2">Characters: {results.resume_chars || 'N/A'}</p>
              <p className="text-xs xs:text-sm sm:text-base leading-relaxed text-muted mb-3 xs:mb-4">Extracted Skills: {results.extractedSkills.length}</p>
            </Card>
          </aside>
          <div className="flex-grow">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 xs:space-y-6 sm:space-y-8">
              <TabsList className="flex justify-center max-w-[90vw] xs:max-w-[600px] mx-auto rounded-xl bg-surface-2 p-1 xs:p-2 mb-3 xs:mb-4 sm:mb-6 gap-1 xs:gap-2 sm:gap-4" aria-label="Dashboard navigation">
                <TabsTrigger
                  value="skills-gap"
                  className="flex-1 text-center rounded-xl text-xs xs:text-sm sm:text-base font-medium px-2 xs:px-4 sm:px-6 py-1 xs:py-2 text-text hover:bg-accent/10 transition-colors data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  Skills Gap
                </TabsTrigger>
                <TabsTrigger
                  value="top-matches"
                  className="flex-1 text-center rounded-xl text-xs xs:text-sm sm:text-base font-medium px-2 xs:px-4 sm:px-6 py-1 xs:py-2 text-text hover:bg-accent/10 transition-colors data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  Top Matches
                </TabsTrigger>
                <TabsTrigger
                  value="learning-plan"
                  className="flex-1 text-center rounded-xl text-xs xs:text-sm sm:text-base font-medium px-2 xs:px-4 sm:px-6 py-1 xs:py-2 text-text hover:bg-accent/10 transition-colors data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  Learning Plan
                </TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <TabsContent value="skills-gap">
                    <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
                      <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-text">Skills Gap Analysis</h2>
                        <p className="text-xs xs:text-sm text-muted leading-relaxed">Based on your resume analysis</p>
                      </CardHeader>
                      <CardContent>
                        {results.extractedSkills.length > 0 ? (
                          <motion.div
                            className="bg-surface p-3 xs:p-4 sm:p-6 rounded-xl"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, staggerChildren: 0.05 }}
                          >
                            <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-1 xs:gap-2 sm:gap-4 overflow-y-auto max-h-[250px] xs:max-h-[300px] scrollbar-thin scrollbar-thumb-accent/50 scrollbar-track-surface-2">
                              {displayedSkills.map((skill, index) => (
                                <motion.div
                                  key={skill}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05, duration: 0.15 }}
                                  onClick={() => setSelectedSkill(skill)}
                                >
                                  <RadixTooltip>
                                    <TooltipTrigger>
                                      <Badge
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-accent/30 hover:scale-105 transition-transform duration-150 text-center py-1 xs:py-2 px-2 xs:px-3 sm:py-3 sm:px-5 rounded-xl bg-accent/10 text-accent text-xs xs:text-sm sm:text-base w-full truncate"
                                        aria-label={`View evidence for ${skill}`}
                                      >
                                        {skill}
                                      </Badge>
                                    </TooltipTrigger>
                                    <TooltipContent><p>Click to view evidence</p></TooltipContent>
                                  </RadixTooltip>
                                </motion.div>
                              ))}
                            </div>
                            {results.extractedSkills.length > 10 && (
                              <Button
                                onClick={() => setShowAllSkills(!showAllSkills)}
                                className="mt-3 xs:mt-4 w-full bg-accent text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-150 sticky bottom-0 text-xs xs:text-sm"
                                aria-label={showAllSkills ? 'Show fewer skills' : 'Show all skills'}
                              >
                                {showAllSkills ? 'Show Fewer' : `Show All (${results.extractedSkills.length})`}
                              </Button>
                            )}
                          </motion.div>
                        ) : (
                          <div className="text-center py-4 xs:py-6">
                            <Image src="/no-data.svg" alt="No skills" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                            <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No skills extracted from resume.</p>
                          </div>
                        )}
                        <hr className="my-4 xs:my-6 border-border" />
                        <h3 className="text-lg xs:text-xl sm:text-2xl font-semibold mb-3 xs:mb-4 text-text">Skill Coverage Overview</h3>
                        <ErrorBoundary
                          fallback={
                            <div className="text-center py-4 xs:py-6">
                              <Image src="/no-data.svg" alt="Chart error" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                              <p className="text-danger text-xs xs:text-sm sm:text-base leading-relaxed">Failed to render skill chart.</p>
                            </div>
                          }
                        >
                          <Suspense fallback={<Skeleton className="h-[250px] xs:h-[300px] w-full rounded-xl" />}>
                            {skillData[0].value > 0 || skillData[1].value > 0 ? (
                              <ResponsiveContainer width="100%" height={250} minHeight={200}>
                                <PieChart aria-label="Skill coverage pie chart">
                                  <Pie
                                    data={skillData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60} // Reduced for mobile
                                    innerRadius={40}
                                    label={false}
                                  >
                                    {skillData.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                  </Pie>
                                  <RechartsTooltip
                                    formatter={(value: number, name: string) => [`${value} skills`, name]}
                                    contentStyle={{ backgroundColor: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '12px' }}
                                  />
                                  <Legend wrapperStyle={{ color: 'var(--text)', paddingTop: '12px', fontSize: '12px' }} />
                                  <CustomizedLabel value={results.extractedSkills.length} labelText="Matched" />
                                </PieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="text-center py-4 xs:py-6">
                                <Image src="/no-data.svg" alt="No skill data" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                                <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No skill data available.</p>
                              </div>
                            )}
                          </Suspense>
                        </ErrorBoundary>
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="top-matches">
                    <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
                      <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-text">Top Job Matches</h2>
                        <p className="text-xs xs:text-sm text-muted leading-relaxed">Top matches based on your skills</p>
                      </CardHeader>
                      <CardContent>
                        {results.matchedJobs.length > 0 ? (
                          <motion.div
                            className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 gap-3 xs:gap-4 sm:gap-6"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, staggerChildren: 0.05 }}
                          >
                            {results.matchedJobs.map((job, index) => (
                              <motion.div
                                key={`${job.title}-${job.company}-${index}`}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05, duration: 0.15 }}
                              >
                                <Card className="p-3 xs:p-4 sm:p-6 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-150">
                                  <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-text mb-1 xs:mb-2 leading-relaxed truncate">{job.title} - {job.company}</h3>
                                  <RadixTooltip>
                                    <TooltipTrigger>
                                      <Progress
                                        value={Math.min(job.score * 100, 100)}
                                        className="mt-1 xs:mt-2 h-2 xs:h-3 sm:h-4 rounded-xl hover:shadow-md transition-shadow duration-150"
                                        aria-label={`Match score: ${(job.score * 100).toFixed(1)}%`}
                                      />
                                    </TooltipTrigger>
                                    <TooltipContent><p>Match Score: {(job.score * 100).toFixed(1)}%</p></TooltipContent>
                                  </RadixTooltip>
                                  <p className="mt-1 xs:mt-2 text-xs xs:text-sm sm:text-base leading-relaxed text-muted line-clamp-2 overflow-hidden">{job.description}</p>
                                  <p className="mt-1 xs:mt-2 text-xs xs:text-sm text-muted leading-relaxed truncate">Salary: {job.salaryRange || 'Unknown'}</p>
                                  <Accordion type="single" collapsible className="mt-3 xs:mt-4">
                                    <AccordionItem value="missing">
                                      <AccordionTrigger className="text-xs xs:text-sm sm:text-base font-medium">Missing Skills ({job.missing_skills.length})</AccordionTrigger>
                                      <AccordionContent>
                                        <div className="flex flex-wrap gap-1 xs:gap-2">
                                          {job.missing_skills.length > 0 ? (
                                            job.missing_skills.map(s => (
                                              <Badge key={s} variant="secondary" className="hover:scale-105 transition-transform duration-150 rounded-xl bg-accent/10 text-accent text-[10px] xs:text-xs sm:text-base">
                                                {s}
                                              </Badge>
                                            ))
                                          ) : (
                                            <Badge variant="secondary" className="rounded-xl bg-success text-white text-[10px] xs:text-xs sm:text-base">None ✅</Badge>
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
                          <div className="text-center py-4 xs:py-6">
                            <Image src="/no-data.svg" alt="No jobs" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                            <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No matching jobs found. Try updating your resume.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="learning-plan">
                    <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
                      <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-text">Learning Plan</h2>
                        <p className="text-xs xs:text-sm text-muted leading-relaxed">Personalized plan to bridge skill gaps</p>
                      </CardHeader>
                      <CardContent>
                        {results.learningPlan.length > 0 ? (
                          <div className="space-y-6 xs:space-y-8 relative before:absolute before:left-3 xs:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
                            <Progress
                              value={(completedWeeks.size / results.learningPlan.length) * 100}
                              className="mb-4 xs:mb-6 h-2 xs:h-3 sm:h-4 rounded-xl hover:shadow-md transition-shadow duration-150"
                              aria-label={`Learning progress: ${((completedWeeks.size / results.learningPlan.length) * 100).toFixed(1)}%`}
                            />
                            <AnimatePresence>
                              {results.learningPlan.map((step, index) => (
                                <motion.div
                                  key={step.week}
                                  initial={{ opacity: 0, x: -20 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  exit={{ opacity: 0, x: -20 }}
                                  transition={{ delay: index * 0.05, duration: 0.15 }}
                                  className="relative pl-8 xs:pl-10"
                                >
                                  <div
                                    className="absolute -left-3 xs:-left-4 top-1 xs:top-2 w-6 xs:w-8 h-6 xs:h-8 rounded-full bg-accent text-white flex items-center justify-center text-xs xs:text-sm font-bold z-10"
                                    aria-label={`Week ${step.week}`}
                                  >
                                    {step.week}
                                  </div>
                                  <Card className="p-3 xs:p-4 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-150">
                                    <Accordion type="single" collapsible>
                                      <AccordionItem value={`item-${step.week}`}>
                                        <AccordionTrigger
                                          className="text-base xs:text-lg sm:text-xl font-semibold text-text hover:no-underline text-left truncate"
                                          aria-label={`Week ${step.week}: ${step.topic}`}
                                        >
                                          {step.topic}
                                        </AccordionTrigger>
                                        <AccordionContent>
                                          <p className="text-xs xs:text-sm sm:text-base text-muted mb-1 xs:mb-2 leading-relaxed">Estimated Time: {step.time}</p>
                                          <h4 className="text-xs xs:text-sm sm:text-base font-semibold text-text mb-1 xs:mb-2">Resources:</h4>
                                          <ul className="list-disc pl-3 xs:pl-5 text-xs xs:text-sm sm:text-base leading-relaxed text-muted mb-3 xs:mb-4">
                                            {Array.isArray(step.resources) && step.resources.length > 0 ? (
                                              step.resources.map((res, i) => (
                                                <li key={i} className="truncate">
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
                                          <h4 className="text-xs xs:text-sm sm:text-base font-semibold text-text mb-1 xs:mb-2">Project:</h4>
                                          <p className="text-xs xs:text-sm sm:text-base leading-relaxed text-muted truncate">
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
                                      className="flex flex-wrap items-center mt-3 xs:mt-4 bg-surface p-1 xs:p-2 rounded-xl gap-1 xs:gap-2"
                                      initial={{ opacity: 0 }}
                                      animate={{ opacity: 1 }}
                                      transition={{ duration: 0.15 }}
                                    >
                                      <Checkbox
                                        checked={completedWeeks.has(step.week)}
                                        onCheckedChange={() => toggleComplete(step.week)}
                                        id={`complete-${step.week}`}
                                        className="h-4 w-4 xs:h-5 xs:w-5 sm:h-6 sm:w-6"
                                        aria-label={`Mark week ${step.week} as complete`}
                                      />
                                      <label
                                        htmlFor={`complete-${step.week}`}
                                        className="ml-1 xs:ml-2 text-xs xs:text-sm sm:text-base text-muted flex flex-wrap items-center gap-1 xs:gap-2"
                                      >
                                        Mark Complete
                                        <Badge
                                          variant="secondary"
                                          className={`rounded-xl text-[10px] xs:text-xs sm:text-sm ${completedWeeks.has(step.week) ? 'bg-success text-white' : 'bg-red-400 text-black'}`}
                                        >
                                          {completedWeeks.has(step.week) ? 'Completed' : 'Pending'}
                                        </Badge>
                                      </label>
                                    </motion.div>
                                  </Card>
                                </motion.div>
                              ))}
                            </AnimatePresence>
                          </div>
                        ) : (
                          <div className="text-center py-4 xs:py-6">
                            <Image src="/no-data.svg" alt="No learning plan" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                            <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No learning plan available.</p>
                          </div>
                        )}
                        <Button
                          onClick={() => router.push('/upload')}
                          className="mt-4 xs:mt-6 w-full bg-accent text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-150 text-xs xs:text-sm"
                          aria-label="Back to Upload"
                        >
                          Back to Upload
                        </Button>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
            <Tabs value={activeSubTab} onValueChange={setActiveSubTab} className="space-y-4 xs:space-y-6 sm:space-y-8 mt-4 xs:mt-6 sm:mt-8">
              <TabsList className="flex justify-center max-w-[90vw] xs:max-w-[400px] mx-auto rounded-xl bg-surface-2 p-1 xs:p-2 mb-3 xs:mb-4 sm:mb-6 gap-1 xs:gap-2 sm:gap-4" aria-label="GitHub sub-tabs">
                <TabsTrigger
                  value="evidence"
                  className="flex-1 text-center rounded-xl text-xs xs:text-sm sm:text-base font-medium px-2 xs:px-4 sm:px-6 py-1 xs:py-2 text-text hover:bg-accent/10 transition-colors data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  Evidence
                </TabsTrigger>
                <TabsTrigger
                  value="repos"
                  className="flex-1 text-center rounded-xl text-xs xs:text-sm sm:text-base font-medium px-2 xs:px-4 sm:px-6 py-1 xs:py-2 text-text hover:bg-accent/10 transition-colors data-[state=active]:bg-accent data-[state=active]:text-white"
                >
                  Repos
                </TabsTrigger>
              </TabsList>
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeSubTab}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.15 }}
                >
                  <TabsContent value="evidence">
                    <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
                      <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-text flex items-center gap-1 xs:gap-2">
                          <GitHubIcon /> GitHub Integration & Evidence
                        </h2>
                        <p className="text-xs xs:text-sm text-muted leading-relaxed">Connect and validate skills from your GitHub repositories</p>
                      </CardHeader>
                      <CardContent>
                        {githubConnected && githubProfile ? (
                          <div className="space-y-4 xs:space-y-6">
                            <div className="flex flex-col gap-3 p-3 xs:p-4 rounded-xl bg-surface-2 border border-border overflow-hidden">
                              {/* Line 1 → Avatar + Username + Badge */}
                              <div className="flex items-center gap-2 xs:gap-4">
                                <Avatar className="h-7 w-7 xs:h-9 xs:w-9 sm:h-11 sm:w-11">
                                  <AvatarImage src={githubProfile.avatar_url} alt={`${githubProfile.login}'s avatar`} />
                                  <AvatarFallback>{githubProfile.login[0]}</AvatarFallback>
                                </Avatar>
                                <div className="font-medium text-text flex items-center gap-1 text-xs xs:text-sm sm:text-base leading-relaxed truncate">
                                  @{githubProfile.login}
                                  <Badge
                                    variant="secondary"
                                    className="bg-success text-white rounded-xl text-[9px] xs:text-[10px] scale-[0.85] origin-left"
                                  >
                                    Verified ✓
                                  </Badge>
                                </div>
                              </div>

                              {/* Line 2 → Centered Sync Again */}
                              <Button
                                onClick={handleSyncAgain}
                                variant="link"
                                className="text-accent hover:underline text-xs xs:text-sm sm:text-base leading-relaxed block mx-auto"
                                aria-label="Sync GitHub again"
                              >
                                Sync Again
                              </Button>
                            </div>

                            {Object.entries(results.evidenceBySkill).some(([_, e]) => e.github?.length) ? (
                              <motion.div
                                className="space-y-4 xs:space-y-6"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ duration: 0.5, staggerChildren: 0.05 }}
                              >
                                {Object.entries(results.evidenceBySkill)
                                  .filter(([_, e]) => e.github?.length)
                                  .map(([skill, evidence], index) => (
                                    <motion.div
                                      key={skill}
                                      initial={{ opacity: 0, y: 20 }}
                                      animate={{ opacity: 1, y: 0 }}
                                      transition={{ delay: index * 0.05, duration: 0.15 }}
                                    >
                                      <Card className="p-3 xs:p-4 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-150">
                                        <CardHeader className="flex flex-wrap items-center justify-between pb-3 xs:pb-4 gap-2">
                                          <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-text truncate">{skill}</h3>
                                          <Progress
                                            value={Math.min(evidence.confidence * 100, 100)}
                                            className="w-16 xs:w-20 sm:w-24 h-2 xs:h-3 sm:h-4 rounded-xl hover:shadow-md transition-shadow duration-150"
                                            aria-label={`Confidence: ${(evidence.confidence * 100).toFixed(1)}%`}
                                          />
                                        </CardHeader>
                                        <CardContent>
                                          <ul className="space-y-1 xs:space-y-2 text-xs xs:text-sm sm:text-base leading-relaxed text-muted">
                                            {evidence.github && Array.isArray(evidence.github) && evidence.github.length > 0 ? (
                                              evidence.github.map((url, i) => (
                                                typeof url === 'string' && url ? (
                                                  <li key={i} className="flex items-center gap-1 xs:gap-2">
                                                    <FileCode className="w-3 h-3 xs:w-4 xs:h-4 text-muted" />
                                                    <a
                                                      href={url}
                                                      target="_blank"
                                                      rel="noopener noreferrer"
                                                      className="text-accent hover:underline truncate max-w-[150px] xs:max-w-[200px] sm:max-w-[350px] text-ellipsis"
                                                    >
                                                      {url.split('/').slice(-3).join('/')}
                                                    </a>
                                                  </li>
                                                ) : (
                                                  <li key={i} className="text-muted italic">Invalid GitHub URL</li>
                                                )
                                              ))
                                            ) : (
                                              <li className="text-muted italic">No GitHub evidence available</li>
                                            )}
                                          </ul>
                                        </CardContent>
                                      </Card>
                                    </motion.div>
                                  ))}
                              </motion.div>
                            ) : (
                              <div className="text-center py-4 xs:py-6">
                                <Image src="/no-data.svg" alt="No GitHub evidence" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                                <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No GitHub skill evidence detected.</p>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                            <Input
                              type="password"
                              value={githubToken}
                              onChange={(e) => debouncedSetGithubToken(e.target.value.trim())}
                              placeholder="Enter GitHub Personal Access Token"
                              className="w-full bg-surface-2 border border-border rounded-xl text-text placeholder-muted p-1 xs:p-2 text-xs xs:text-sm sm:text-base"
                              aria-label="GitHub Personal Access Token"
                            />
                            <Button
                              onClick={handleGithubIntegrate}
                              disabled={githubLoading || isPending}
                              className="w-full bg-accent text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-150 text-xs xs:text-sm sm:text-base"
                              aria-label="Integrate GitHub"
                            >
                              {githubLoading ? 'Integrating...' : 'Connect GitHub'}
                            </Button>
                            {githubLoading && <Skeleton className="h-3 xs:h-4 w-full mt-1 xs:mt-2 rounded-xl" />}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                  <TabsContent value="repos">
                    <Card className="p-4 xs:p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-150">
                      <CardHeader className="pb-3 xs:pb-4 sm:pb-6">
                        <h2 className="text-lg xs:text-xl sm:text-2xl font-semibold text-text">GitHub Repositories</h2>
                        <p className="text-xs xs:text-sm text-muted leading-relaxed">Explore your public GitHub repositories</p>
                      </CardHeader>
                      <CardContent>
                        {githubConnected && githubProfile ? (
                          githubRepos.length > 0 ? (
                            <motion.div
                              className="space-y-4 xs:space-y-6"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              transition={{ duration: 0.5, staggerChildren: 0.05 }}
                            >
                              {githubRepos.map((repo, index) => (
                                <motion.div
                                  key={repo.name}
                                  initial={{ opacity: 0, y: 20 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05, duration: 0.15 }}
                                >
                                  <Card className="p-3 xs:p-4 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl hover:-translate-y-1 transition duration-150">
                                    <CardHeader>
                                      <h3 className="text-base xs:text-lg sm:text-xl font-semibold text-text truncate">{repo.name}</h3>
                                    </CardHeader>
                                    <CardContent>
                                      <p className="text-xs xs:text-sm sm:text-base leading-relaxed text-muted mb-1 xs:mb-2 line-clamp-2">{repo.description}</p>
                                      <a
                                        href={repo.html_url}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="text-accent hover:underline text-xs xs:text-sm sm:text-base leading-relaxed"
                                      >
                                        View Repository
                                      </a>
                                    </CardContent>
                                  </Card>
                                </motion.div>
                              ))}
                            </motion.div>
                          ) : (
                            <div className="text-center py-4 xs:py-6">
                              <Image src="/no-data.svg" alt="No repositories" width={120} height={120} className="mx-auto mb-3 xs:mb-4" />
                              <p className="text-muted text-xs xs:text-sm sm:text-base leading-relaxed">No repositories found. Try syncing again.</p>
                            </div>
                          )
                        ) : (
                          <div className="space-y-3 xs:space-y-4 sm:space-y-6">
                            <Input
                              type="password"
                              value={githubToken}
                              onChange={(e) => debouncedSetGithubToken(e.target.value.trim())}
                              placeholder="Enter GitHub Personal Access Token"
                              className="w-full bg-surface-2 border border-border rounded-xl text-text placeholder-muted p-1 xs:p-2 text-xs xs:text-sm sm:text-base"
                              aria-label="GitHub Personal Access Token"
                            />
                            <Button
                              onClick={handleGithubIntegrate}
                              disabled={githubLoading || isPending}
                              className="w-full bg-accent text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-150 text-xs xs:text-sm sm:text-base"
                              aria-label="Integrate GitHub"
                            >
                              {githubLoading ? 'Integrating...' : 'Connect GitHub'}
                            </Button>
                            {githubLoading && <Skeleton className="h-3 xs:h-4 w-full mt-1 xs:mt-2 rounded-xl" />}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>
                </motion.div>
              </AnimatePresence>
            </Tabs>
            {selectedSkill && results.evidenceBySkill[selectedSkill] && (
              <Suspense fallback={<Skeleton className="fixed inset-0 bg-black/50 rounded-xl" />}>
                <LazyEvidenceTray
                  skill={selectedSkill}
                  evidence={results.evidenceBySkill[selectedSkill]}
                  onClose={() => setSelectedSkill(null)}
                />
              </Suspense>
            )}
          </div>
        </motion.div>
      </TooltipProvider>
      <Toast
        open={toastOpen}
        onOpenChange={setToastOpen}
        className={`p-3 xs:p-4 rounded-xl shadow-card border ${error ? 'bg-danger/10 border-danger/50' : 'bg-success/10 border-success/50'}`}
        style={{ zIndex: 60 }}
      >
        {error ? <AlertTriangle className="h-5 w-5 xs:h-6 xs:w-6 text-danger" /> : <CheckCircle className="h-5 w-5 xs:h-6 xs:w-6 text-success" />}
        <div>
          <ToastTitle className={`font-semibold text-base xs:text-lg ${error ? 'text-danger' : 'text-success'}`}>
            {error ? 'GitHub Integration Failed' : 'GitHub Connected'}
          </ToastTitle>
          <ToastDescription className={`text-xs xs:text-sm ${error ? 'text-danger/80' : 'text-success/80'}`}>
            {error || 'Successfully connected to GitHub! Your skills have been validated.'}
          </ToastDescription>
        </div>
        <ToastClose className="ml-auto text-accent hover:text-accent/80 font-medium text-xs xs:text-sm" aria-label="Close notification">
          Close
        </ToastClose>
      </Toast>
      <ToastViewport className="fixed bottom-4 right-4 w-[90vw] max-w-[350px] xs:max-w-[400px] z-60" />
    </ToastProvider>
  );
}