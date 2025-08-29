'use client';
import { createContext, useContext, useState, ReactNode } from 'react';
import type { Analysis } from './types';

// Define the context type
type AnalysisContextType = {
  analysis: Analysis | null;
  setAnalysis: (a: Analysis | null) => void;
};

// Initialize context with null
const Ctx = createContext<AnalysisContextType | null>(null);

// Provider component
export function AnalysisProvider({ children }: { children: ReactNode }) {
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  return <Ctx.Provider value={{ analysis, setAnalysis }}>{children}</Ctx.Provider>;
}

// Custom hook
export const useAnalysis = (): AnalysisContextType => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('useAnalysis must be used within AnalysisProvider');
  return ctx;
};