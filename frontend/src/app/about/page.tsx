'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import Image from 'next/image';
export default function AboutPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mx-auto max-w-6xl px-4 py-8 md:py-12"
    >
      <Card className="max-w-2xl mx-auto p-6 md:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200">
        <h1 className="text-4xl font-bold mb-4 text-accent">About Career Assist</h1>
        <p className="text-base leading-relaxed text-muted mb-6">
          Career Assist is an AI-powered platform designed to help students and professionals bridge skill gaps for better job opportunities. Upload your resume to get personalized skill analysis, job matches, and learning plans.
        </p>
        <a href="https://linkedin.com/in/yubraj-singh-58370025b/" className="text-accent hover:underline text-base leading-relaxed">
          Connect with the creator on LinkedIn
        </a>
      </Card>
    </motion.div>
  );
}