'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import Image from 'next/image';
interface Resource {
  title: string;
  url: string;
}
interface Project {
  title: string;
  url: string;
}
interface LearningPlan {
  week: number;
  topic: string;
  resources: Resource[];
  project: Project;
  time: string;
}
interface CompletionState {
  completedWeeks: Set<number>;
  error: string | null;
}
export default function LearningPage() {
  const [learningPlan, setLearningPlan] = useState<LearningPlan[]>([]);
  const [state, setState] = useState<CompletionState>({
    completedWeeks: new Set<number>(),
    error: null,
  });
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  useEffect(() => {
    const storedAnalysis = localStorage.getItem('analysis');
    const storedCompleted = localStorage.getItem('completedWeeks');
    if (storedCompleted) {
      try {
        const parsed = JSON.parse(storedCompleted);
        if (Array.isArray(parsed)) {
          setState((prev) => ({ ...prev, completedWeeks: new Set(parsed) }));
        }
      } catch (e) {
        console.error('Failed to parse completed weeks:', e);
        setState((prev) => ({ ...prev, error: 'Failed to load completion data.' }));
      }
    }
    if (storedAnalysis) {
      try {
        const data = JSON.parse(storedAnalysis);
        if (!data || typeof data !== 'object') {
          throw new Error('Invalid analysis data');
        }
        setLearningPlan(data.learningPlan || []);
      } catch (e) {
        setState((prev) => ({ ...prev, error: 'Invalid analysis data. Please upload a resume again.' }));
      }
    } else {
      setState((prev) => ({ ...prev, error: 'No analysis data found. Please upload a resume first.' }));
    }
    setLoading(false);
  }, []);

  const toggleComplete = useCallback((week: number) => {
    setState((prev) => {
      const newCompleted = new Set(prev.completedWeeks);
      if (newCompleted.has(week)) {
        newCompleted.delete(week);
      } else {
        newCompleted.add(week);
      }
      try {
        localStorage.setItem('completedWeeks', JSON.stringify(Array.from(newCompleted)));
        return { completedWeeks: newCompleted, error: null };
      } catch (e) {
        console.error('Failed to save completion state:', e);
        return { ...prev, error: 'Failed to save completion state.' };
      }
    });
  }, []);
  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mx-auto max-w-6xl px-4 py-10 space-y-6"
      >
        <Card className="p-6 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200">
          <Image src="/no-data.svg" alt="Loading" width={150} height={150} className="mx-auto mb-4" />
          <p className="text-muted text-center text-base sm:text-lg leading-relaxed">Loading learning plan...</p>
        </Card>
      </motion.div>
    );
  }
  if (state.error) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <Card className="mx-auto max-w-full xs:max-w-2xl p-6 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200">
          <Image src="/no-data.svg" alt="No data" width={150} height={150} className="mx-auto mb-4" />
          <p className="text-danger text-center text-base sm:text-lg leading-relaxed">{state.error}</p>
          <Button
            variant="link"
            className="mt-4 block mx-auto text-accent rounded-xl hover:scale-105 transition-transform duration-200 text-sm"
            onClick={() => router.push('/upload')}
            aria-label="Upload a resume"
          >
            Upload a resume
          </Button>
        </Card>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl px-4 py-8 sm:py-12"
    >
      <Card className="p-6 sm:p-8 bg-surface-2 border border-border rounded-xl shadow-md">
        <CardHeader className="pb-6">
          <h1 className="text-xl xs:text-2xl sm:text-3xl font-bold mb-3 text-accent">
            Learning Path
          </h1>
          <p className="text-sm sm:text-base text-muted">
            Bridge your skill gaps with a tailored plan.
          </p>
        </CardHeader>
        <CardContent>
          {learningPlan.length > 0 ? (
            <div className="space-y-8 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
              <Progress
                value={(state.completedWeeks.size / learningPlan.length) * 100}
                className="mb-6 h-2 sm:h-3 rounded-xl hover:shadow-md transition-shadow duration-200"
                aria-label={`Learning progress: ${((state.completedWeeks.size / learningPlan.length) * 100).toFixed(1)}%`}
              />
              <AnimatePresence>
                {learningPlan.map((step, index) => (
                  <motion.div
                    key={step.week}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ delay: index * 0.1, duration: 0.2 }}
                    className="relative pl-10"
                  >
                    {/* Week number badge */}
                    <div
                      className="absolute -left-4 top-2 w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center text-sm font-bold z-10"
                      aria-label={`Week ${step.week}`}
                    >
                      {step.week}
                    </div>

                    {/* Week content */}
                    <Card className="p-4 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-lg transition duration-200">
                      <Accordion type="single" collapsible>
                        <AccordionItem value={`item-${step.week}`}>
                          <AccordionTrigger
                            className="text-lg sm:text-xl font-semibold text-text hover:no-underline text-left truncate"
                            aria-label={`Week ${step.week}: ${step.topic}`}
                          >
                            {step.topic}
                          </AccordionTrigger>
                          <AccordionContent>
                            <p className="text-sm text-muted mb-2">Estimated Time: {step.time}</p>

                            <h4 className="text-sm font-semibold text-text mb-2">Resources:</h4>
                            <ul className="list-disc pl-5 text-sm text-muted mb-3 space-y-1">
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

                            <h4 className="text-sm font-semibold text-text mb-2">Project:</h4>
                            <p className="text-sm text-muted">
                              {step.project?.title && step.project?.url ? (
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

                      {/* Mark complete row (updated) */}
                      <motion.div
                        className="mt-4 bg-surface p-2 rounded-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.2 }}
                      >
                        {/* Line 1: Checkbox + Mark Complete */}
                        <div className="flex items-center gap-2">
                          <Checkbox
                            checked={state.completedWeeks.has(step.week)}
                            onCheckedChange={() => toggleComplete(step.week)}
                            id={`complete-${step.week}`}
                            className="h-5 w-5"
                            aria-label={`Mark week ${step.week} as complete`}
                          />
                          <label
                            htmlFor={`complete-${step.week}`}
                            className="text-sm text-muted cursor-pointer"
                          >
                            Mark Complete
                          </label>
                        </div>

                        {/* Line 2: Status Badge */}
                        <div className="mt-2">
                          <Badge
                            variant="secondary"
                            className={`rounded-xl px-3 text-xs sm:text-sm ${
                              state.completedWeeks.has(step.week)
                                ? 'bg-success text-white'
                                : 'bg-red-400 text-black'
                            }`}
                          >
                            {state.completedWeeks.has(step.week) ? 'Completed' : 'Pending'}
                          </Badge>
                        </div>
                      </motion.div>
                    </Card>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <div className="text-center py-8">
              <Image src="/no-data.svg" alt="No learning plan" width={120} height={120} className="mx-auto mb-4" />
              <p className="text-muted text-base sm:text-lg leading-relaxed">No learning plan available.</p>
            </div>
          )}

          {/* Back button */}
          <Button
            onClick={() => router.push('/results')}
            className="mt-8 w-full bg-accent text-white rounded-xl shadow-md hover:shadow-xl hover:scale-105 transition duration-200 text-sm sm:text-base"
            aria-label="Back to Results"
          >
            Back to Results
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
