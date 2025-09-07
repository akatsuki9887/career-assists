'use client';
import { Sparkles, BarChart3, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
export default function Home() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto px-4 py-12 md:py-16 text-center prose dark:prose-invert max-w-[1100px]"
    >
      <div className="grid md:grid-cols-2 gap-8 items-center py-20 md:py-28 bg-gradient-to-br from-surface-2 to-surface text-text rounded-2xl shadow-card overflow-hidden">
        <div className="p-6 md:p-8">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 font-heading">Your AI Career Mentor 🚀</h1>
          <p className="text-xl md:text-2xl mb-8 max-w-xl">Unlock your potential: Analyze skills, match jobs, and get tailored learning plans from your resume.</p>
          <Button className="bg-accent text-white shadow-sm hover:shadow-md transition-shadow rounded-lg px-6 py-3" asChild>
            <a href="/upload" aria-label="Upload Resume Now">Upload Resume Now</a>
          </Button>
        </div>
        <div className="p-6 md:p-8">
          <Image src="/no-data.svg" alt="Career Development Illustration" width={400} height={400} className="mx-auto animate-bounce-slow" />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-12 md:mt-16">
        {[
          { title: 'Resume Parsing', desc: 'AI extracts and validates skills from your PDF with high accuracy.', icon: Sparkles },
          { title: 'Job Matching', desc: 'Find perfect roles with vector similarity and skill overlap scoring.', icon: BarChart3 },
          { title: 'Learning Plans', desc: 'Personalized roadmaps with resources, projects, and timelines to level up.', icon: BookOpen },
        ].map((feature, index) => (
          <motion.div
            key={feature.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.2 }}
          >
            <Card className="p-6 md:p-8 bg-surface-2 border border-border rounded-2xl shadow-card hover:lift">
              <feature.icon className="h-10 w-10 mb-4 text-accent mx-auto" />
              <h2 className="text-xl font-semibold mb-2 text-text font-heading">{feature.title}</h2>
              <p className="text-sm text-muted">{feature.desc}</p>
            </Card>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}