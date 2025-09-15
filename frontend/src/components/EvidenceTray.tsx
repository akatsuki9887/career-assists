'use client';
import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@radix-ui/react-tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
          <svg className="w-14 h-14 rounded-full" viewBox="0 0 52 52">
            <circle
              className="text-muted"
              strokeWidth="4"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="26"
              cy="26"
            />
            <motion.circle
              className="text-accent"
              strokeWidth="4"
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r={radius}
              cx="26"
              cy="26"
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              strokeDasharray={circumference}
            />
            <text
              x="26"
              y="26"
              textAnchor="middle"
              dy=".3em"
              className="text-sm sm:text-base font-medium text-text"
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
  const modalRef = useRef<HTMLDivElement>(null);

  // Handle backdrop click to close modal
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle swipe-to-dismiss threshold
  const handleDragEnd = (_: any, info: any) => {
    if (info.offset.y > 100) {
      onClose();
    }
  };

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
        onClick={handleBackdropClick}
      >
        <motion.div
          ref={modalRef}
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          drag="y"
          dragConstraints={{ top: 0, bottom: 100 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="w-full sm:w-[500px] max-w-[90vw] max-h-[80vh] bg-surface-2 rounded-xl shadow-2xl p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/50 scrollbar-track-surface-2"
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg sm:text-xl font-semibold text-accent">Evidence for {skill}</h2>
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl hover:scale-105 transition-transform"
              onClick={onClose}
              aria-label="Close evidence modal"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
          <Tabs defaultValue="resume" className="space-y-4">
            <TabsList className="flex justify-center space-x-2 sm:space-x-4 border-b pb-2 bg-surface-2 rounded-xl p-2">
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <TabsTrigger
                  value="resume"
                  className="font-medium text-sm sm:text-base px-3 sm:px-4 py-2 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white hover:bg-accent/10 transition-colors"
                >
                  Resume
                </TabsTrigger>
              </motion.div>
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <TabsTrigger
                  value="jd"
                  className="font-medium text-sm sm:text-base px-3 sm:px-4 py-2 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white hover:bg-accent/10 transition-colors"
                >
                  Job Description
                </TabsTrigger>
              </motion.div>
              <motion.div
                initial={{ x: 0 }}
                animate={{ x: 0 }}
                transition={{ duration: 0.2 }}
                className="relative"
              >
                <TabsTrigger
                  value="github"
                  className="font-medium text-sm sm:text-base px-3 sm:px-4 py-2 rounded-xl data-[state=active]:bg-accent data-[state=active]:text-white hover:bg-accent/10 transition-colors"
                >
                  GitHub
                </TabsTrigger>
              </motion.div>
            </TabsList>
            <TabsContent value="resume">
              <div className="flex flex-wrap gap-2 mb-4">
                {evidence.resume.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    Resume
                  </Badge>
                )}
                {evidence.jd.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    JD
                  </Badge>
                )}
                {(evidence.github?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    GitHub
                  </Badge>
                )}
              </div>
              <ul className="space-y-2 text-sm sm:text-base text-muted">
                {evidence.resume.length > 0 ? (
                  evidence.resume.map((item, i) => (
                    <li key={i} className="p-2 bg-surface rounded-xl flex justify-between items-center">
                      <span className="truncate max-w-[80%]">
                        <span className="bg-accent/20 text-accent px-1 rounded">{skill}</span> in: {item}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:scale-105 transition-transform"
                        onClick={() => navigator.clipboard.writeText(item)}
                        aria-label={`Copy resume evidence for ${skill}`}
                      >
                        Copy
                      </Button>
                    </li>
                  ))
                ) : (
                  <span className="text-center text-muted italic block">No resume evidence available.</span>
                )}
              </ul>
            </TabsContent>
            <TabsContent value="jd">
              <div className="flex flex-wrap gap-2 mb-4">
                {evidence.resume.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    Resume
                  </Badge>
                )}
                {evidence.jd.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    JD
                  </Badge>
                )}
                {(evidence.github?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    GitHub
                  </Badge>
                )}
              </div>
              <ul className="space-y-2 text-sm sm:text-base text-muted">
                {evidence.jd.length > 0 ? (
                  evidence.jd.map((item, i) => (
                    <li key={i} className="p-2 bg-surface rounded-xl flex justify-between items-center">
                      <span className="truncate max-w-[80%]">
                        <span className="bg-accent/20 text-accent px-1 rounded">{skill}</span> in: {item}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="rounded-xl hover:scale-105 transition-transform"
                        onClick={() => navigator.clipboard.writeText(item)}
                        aria-label={`Copy job description evidence for ${skill}`}
                      >
                        Copy
                      </Button>
                    </li>
                  ))
                ) : (
                  <span className="text-center text-muted italic block">No job description evidence available.</span>
                )}
              </ul>
            </TabsContent>
            <TabsContent value="github">
              <div className="flex flex-wrap gap-2 mb-4">
                {evidence.resume.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    Resume
                  </Badge>
                )}
                {evidence.jd.length > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    JD
                  </Badge>
                )}
                {(evidence.github?.length ?? 0) > 0 && (
                  <Badge variant="secondary" className="rounded-xl bg-accent/10 text-accent text-sm sm:text-base">
                    GitHub
                  </Badge>
                )}
              </div>
              <ul className="space-y-2 text-sm sm:text-base text-muted">
                {evidence.github && Array.isArray(evidence.github) && evidence.github.length > 0 ? (
                  evidence.github.map((item, i) => (
                    typeof item === 'string' && item ? (
                      <li key={i} className="p-2 bg-surface rounded-xl flex justify-between items-center">
                        <span className="truncate max-w-[80%]">
                          <span className="bg-accent/20 text-accent px-1 rounded">{skill}</span> in:{' '}
                          <a
                            href={item}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-accent hover:underline"
                          >
                            {item.split('/').slice(-3).join('/')}
                          </a>
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl hover:scale-105 transition-transform"
                          onClick={() => navigator.clipboard.writeText(item)}
                          aria-label={`Copy GitHub evidence for ${skill}`}
                        >
                          Copy
                        </Button>
                      </li>
                    ) : (
                      <li key={i} className="p-2 bg-surface rounded-xl text-muted italic">
                        Invalid GitHub URL
                      </li>
                    )
                  ))
                ) : (
                  <span className="text-center text-muted italic block">No GitHub evidence available</span>
                )}
              </ul>
            </TabsContent>
            <div className="mt-6 flex items-center justify-center gap-3">
              <p className="text-sm sm:text-base font-medium text-muted">Confidence Score:</p>
              <CircularProgress value={evidence.confidence * 100} />
            </div>
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}