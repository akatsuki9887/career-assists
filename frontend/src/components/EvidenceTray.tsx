'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { motion } from 'framer-motion';
type EvidenceTrayProps = {
  skill: string;
  evidence: { resume: string[]; jd: string[]; github?: string[]; confidence: number };
  onClose: () => void;
};
function CircularProgress({ value }: { value: number }) {
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger>
          <svg className="w-14 h-14" viewBox="0 0 52 52">
            <circle
              className="text-gray-200 dark:text-gray-600"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="26"
              cy="26"
            />
            <motion.circle
              className="text-primary"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="26"
              cy="26"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              strokeDasharray={circumference}
            />
            <text
              x="26"
              y="26"
              textAnchor="middle"
              dy=".3em"
              className="text-base font-medium text-gray-700 dark:text-gray-300"
            >
              {Math.round(value)}%
            </text>
          </svg>
        </TooltipTrigger>
        <TooltipContent>
          <p>Confidence Score</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
export function EvidenceTray({ skill, evidence, onClose }: EvidenceTrayProps) {
  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm transition-opacity duration-300" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-md md:max-w-lg max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <Dialog.Title className="text-xl md:text-2xl font-bold text-primary">Evidence for {skill}</Dialog.Title>
              <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close">
                <X className="h-5 w-5" />
              </Button>
            </div>
            <Tabs defaultValue="resume" className="space-y-4">
              <TabsList className="flex space-x-2 md:space-x-4 border-b pb-2">
                <TabsTrigger value="resume" className="font-medium text-sm md:text-base">Resume</TabsTrigger>
                <TabsTrigger value="jd" className="font-medium text-sm md:text-base">Job Description</TabsTrigger>
                <TabsTrigger value="github" className="font-medium text-sm md:text-base">GitHub</TabsTrigger>
              </TabsList>
              <TabsContent value="resume">
                <div className="flex gap-2 mb-4">
                  {evidence.resume.length > 0 && <Badge variant="secondary">Resume</Badge>}
                  {evidence.jd.length > 0 && <Badge variant="secondary">JD</Badge>}
                  {(evidence.github?.length ?? 0) > 0 && <Badge variant="secondary">GitHub</Badge>}
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.resume.length > 0 ? evidence.resume.map((item, i) => (
                    <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                      <span><span className="bg-accent-yellow dark:bg-yellow-800 px-1 rounded">{skill}</span> in: {item}</span>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(item)}>Copy</Button>
                    </li>
                  )) : <span className="text-center text-gray-500 dark:text-gray-500 italic">No resume evidence available.</span>}
                </ul>
              </TabsContent>
              <TabsContent value="jd">
                <div className="flex gap-2 mb-4">
                  {evidence.resume.length > 0 && <Badge variant="secondary">Resume</Badge>}
                  {evidence.jd.length > 0 && <Badge variant="secondary">JD</Badge>}
                  {(evidence.github?.length ?? 0) > 0 && <Badge variant="secondary">GitHub</Badge>}
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.jd.length > 0 ? evidence.jd.map((item, i) => (
                    <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                      <span><span className="bg-accent-yellow dark:bg-yellow-800 px-1 rounded">{skill}</span> in: {item}</span>
                      <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(item)}>Copy</Button>
                    </li>
                  )) : <span className="text-center text-gray-500 dark:text-gray-500 italic">No job description evidence available.</span>}
                </ul>
              </TabsContent>
              <TabsContent value="github">
                <div className="flex gap-2 mb-4">
                  {evidence.resume.length > 0 && <Badge variant="secondary">Resume</Badge>}
                  {evidence.jd.length > 0 && <Badge variant="secondary">JD</Badge>}
                  {(evidence.github?.length ?? 0) > 0 && <Badge variant="secondary">GitHub</Badge>}
                </div>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  {evidence.github && evidence.github.length > 0 ? (
                    evidence.github.map((item, i) => (
                      <li key={i} className="p-2 bg-gray-100 dark:bg-gray-700 rounded-md flex justify-between items-center">
                        <span><span className="bg-accent-yellow dark:bg-yellow-800 px-1 rounded">{skill}</span> in:{' '}
                          <a href={item} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline hover:text-primary/80 transition-colors">
                            {item}
                          </a>
                        </span>
                        <Button variant="ghost" size="sm" onClick={() => navigator.clipboard.writeText(item)}>Copy</Button>
                      </li>
                    ))
                  ) : (
                    <span className="text-center text-gray-500 dark:text-gray-500 italic">No GitHub evidence available</span>
                  )}
                </ul>
              </TabsContent>
            </Tabs>
            <div className="mt-6 flex items-center justify-center gap-3">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Confidence Score:</p>
              <CircularProgress value={evidence.confidence * 100} />
            </div>
          </Dialog.Content>
        </motion.div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}