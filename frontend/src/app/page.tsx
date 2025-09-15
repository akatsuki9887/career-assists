'use client';
import { Sparkles, BarChart3, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';

export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl px-2 xs:px-3 sm:px-6 md:px-8 py-3 xs:py-5 sm:py-8 md:py-12 text-center overflow-hidden"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 xs:gap-3 sm:gap-5 py-8 xs:py-10 sm:py-14 md:py-20 bg-gradient-to-br from-surface-2 to-surface text-text rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 overflow-hidden">
        <div className="p-2 xs:p-3 sm:p-5 md:p-8">
          <h1 className="text-2xl xxs:text-2.5xl xs:text-3xl sm:text-4xl md:text-5xl font-bold mb-2 xs:mb-3 sm:mb-4 text-accent line-clamp-2">Your AI Career Mentor 🚀</h1>
          <p className="text-[9px] xs:text-[10px] sm:text-sm md:text-xl leading-tight sm:leading-relaxed mb-3 xs:mb-4 sm:mb-5 max-w-mobile text-muted line-clamp-2">Unlock your potential: Analyze skills, match jobs, and get tailored learning plans from your resume.</p>
          <Button className="btn bg-accent text-white shadow-md hover:bg-accent/90 hover:shadow-sm transition-all duration-200 rounded-lg px-3 xs:px-4 py-1 xs:py-1.5 text-[9px] xs:text-xs sm:text-sm btn-hover" asChild>
            <a href="/upload" aria-label="Upload Resume Now">Upload Resume Now</a>
          </Button>
        </div>
        <div className="p-2 xs:p-3 sm:p-5 md:p-8">
          <Image src="/no-data.svg" alt="Career Development Illustration" width={250} height={250} className="mx-auto max-w-full" />
        </div>
      </div>
      <AnimatePresence>
        <motion.div className="grid grid-cols-1 md:grid-cols-3 gap-2 xs:gap-3 sm:gap-5 mt-5 xs:mt-6 sm:mt-10 md:mt-16">
          {[
            { title: 'Resume Parsing', desc: 'AI extracts and validates skills from your PDF with high accuracy.', icon: Sparkles },
            { title: 'Job Matching', desc: 'Find perfect roles with vector similarity and skill overlap scoring.', icon: BarChart3 },
            { title: 'Learning Plans', desc: 'Personalized roadmaps with resources, projects, and timelines to level up.', icon: BookOpen },
          ].map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.3 }}
            >
              <Card className="card p-2 xs:p-3 sm:p-5 overflow-hidden">
                <feature.icon className="h-6 xs:h-7 sm:h-9 mb-2 xs:mb-3 text-accent mx-auto" />
                <h2 className="text-base xs:text-lg sm:text-xl font-semibold mb-1 xs:mb-2 text-text line-clamp-2">{feature.title}</h2>
                <p className="text-[9px] xs:text-[10px] sm:text-sm leading-tight sm:leading-relaxed text-muted line-clamp-2">{feature.desc}</p>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}