import type { Analysis } from './types';

export async function analyzeResume(file: File): Promise<Analysis> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch('http://localhost:8000/analyze', {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error('Analysis failed');
  }

  return await response.json();
}