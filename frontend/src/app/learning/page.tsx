'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
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
      <div className="mx-auto max-w-[1100px] px-4 py-8 md:py-12 space-y-8">
        <Card className="p-6 md:p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
          <Image src="/no-data.svg" alt="Loading" width={200} height={200} className="mx-auto mb-4" />
          <p className="text-muted text-center text-lg">Loading learning plan...</p>
        </Card>
      </div>
    );
  }

  if (state.error) {
    return (
      <Card className="mx-auto p-6 md:p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass max-w-2xl">
        <Image src="/no-data.svg" alt="No data" width={200} height={200} className="mx-auto mb-4" />
        <p className="text-danger text-center text-lg">{state.error}</p>
        <Button
          variant="link"
          className="mt-4 block mx-auto text-accent"
          onClick={() => router.push('/upload')}
          aria-label="Upload a resume"
        >
          Upload a resume
        </Button>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="mx-auto px-4 py-8 md:py-12 max-w-[1100px]"
    >
      <Card className="p-6 md:p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
        <h1 className="text-3xl font-bold mb-2 text-accent">Learning Path</h1>
        <p className="text-muted mb-4">Bridge your skill gaps with a tailored plan.</p>
        {learningPlan.length > 0 ? (
          <div className="space-y-8 relative before:absolute before:left-4 before:top-0 before:bottom-0 before:w-0.5 before:bg-border">
            <Progress
              value={(state.completedWeeks.size / learningPlan.length) * 100}
              className="mb-6 h-2"
              aria-label={`Learning progress: ${((state.completedWeeks.size / learningPlan.length) * 100).toFixed(1)}%`}
            />
            {learningPlan.map((step, index) => (
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
                  <div className="flex items-center mt-2">
                    <Checkbox
                      checked={state.completedWeeks.has(step.week)}
                      onCheckedChange={() => toggleComplete(step.week)}
                      id={`complete-${step.week}`}
                      aria-label={`Mark week ${step.week} as complete`}
                    />
                    <label htmlFor={`complete-${step.week}`} className="ml-2 text-sm text-muted">
                      Mark Complete
                    </label>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <Image src="/no-data.svg" alt="No learning plan" width={150} height={150} className="mx-auto mb-4" />
            <p className="text-muted text-lg">No learning plan available.</p>
          </div>
        )}
        <Button
          onClick={() => router.push('/results')}
          className="mt-6 w-full bg-accent text-white rounded-lg shadow-sm hover:shadow-md"
          aria-label="Back to Results"
        >
          Back to Results
        </Button>
      </Card>
    </motion.div>
  );
}