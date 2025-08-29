'use client';
import { useAnalysis } from '@/context/store';
import { dummyAnalysis } from '@/context/mock';
import { Check, X } from 'lucide-react';
import { useState } from 'react';
import { EvidenceTray } from '@/components/EvidenceTray';

export default function ResultsPage() {
  const { analysis } = useAnalysis();
  const data = analysis ?? dummyAnalysis;
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  const openTray = (skill: string) => setSelectedSkill(skill);
  const closeTray = () => setSelectedSkill(null);

  return (
    <div className="grid gap-6 md:grid-cols-3">
      {data ? (
        <>
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="font-semibold mb-3">Extracted Skills</h2>
              <ul className="space-y-2">
                {data.extractedSkills.map(s => (
                  <li key={s} className="flex items-center gap-2 cursor-pointer" onClick={() => openTray(s)}>
                    <Check className="h-4 w-4 text-emerald-600" />
                    {s} <span className="text-sm text-gray-500">({data.evidenceBySkill[s]?.confidence || 70}%)</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="font-semibold mb-3">Missing Skills</h2>
              <ul className="space-y-2">
                {data.missingSkills.map(s => (
                  <li key={s} className="flex items-center gap-2 cursor-pointer" onClick={() => openTray(s)}>
                    <X className="h-4 w-4 text-rose-600" />
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="space-y-4">
            {data.matchedJobs.map(j => (
              <div key={j.title} className="bg-white rounded-2xl shadow-lg p-4">
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold">{j.title}</h3>
                    <p className="text-sm text-gray-500">{j.company}</p>
                  </div>
                  <span>{j.matchPercent}% match</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-lg p-4">
              <h2 className="font-semibold mb-3">Learning Plan</h2>
              <ul className="space-y-2">
                {data.learningPlan.map(step => (
                  <li key={step.week}>
                    <span className="font-medium">Week {step.week}:</span> {step.topic}
                    <p className="text-sm text-gray-500">Time: {step.time}</p>
                    <p className="text-sm text-indigo-600">
                      Course: <a href={step.resources[0].url} target="_blank" rel="noopener noreferrer">{step.resources[0].title}</a>
                    </p>
                    <p className="text-sm text-indigo-600">
                      Project: <a href={step.project?.url} target="_blank" rel="noopener noreferrer">{step.project?.title}</a>
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      ) : (
        <div className="grid gap-6 md:grid-cols-3">
          {/* Loading placeholders */}
        </div>
      )}

      {selectedSkill && data.evidenceBySkill[selectedSkill] && (
        <EvidenceTray
          skill={selectedSkill}
          evidence={data.evidenceBySkill[selectedSkill]}
          onClose={closeTray}
        />
      )}
    </div>
  );
}