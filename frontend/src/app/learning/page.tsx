'use client';
import { useAnalysis } from '@/context/store';
import { dummyAnalysis } from '@/context/mock';

export default function LearningPage() {
  const { analysis } = useAnalysis();
  const data = analysis ?? dummyAnalysis;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-4">Learning Path</h1>
        <ul className="space-y-4">
          {data.learningPlan.map(step => (
            <li key={step.week} className="border-b pb-2">
              <span className="font-medium">Week {step.week}:</span> {step.topic}
              <ul className="ml-4 mt-2">
                {step.resources.map((res, i) => (
                  <li key={i} className="text-sm text-gray-600">
                    <a href={res.url} className="text-indigo-600 hover:underline">{res.title}</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}