'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs';

type EvidenceTrayProps = {
  skill: string;
  evidence: { resume: string[]; jd: string[]; github?: string[]; confidence?: number };
  onClose: () => void;
};

export function EvidenceTray({ skill, evidence, onClose }: EvidenceTrayProps) {
  return (
    <Dialog.Root open onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/50" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-lg p-6 max-w-lg max-h-[80vh] overflow-y-auto">
          <Dialog.Title className="text-xl font-semibold mb-4 text-indigo-600">Evidence for {skill}</Dialog.Title>
          <Tabs defaultValue="resume" className="space-y-4">
            <TabsList className="flex space-x-4 border-b pb-2">
              <TabsTrigger value="resume" className="font-medium hover:text-indigo-600">Resume</TabsTrigger>
              <TabsTrigger value="jd" className="font-medium hover:text-indigo-600">Job Description</TabsTrigger>
              <TabsTrigger value="github" className="font-medium hover:text-indigo-600">GitHub</TabsTrigger>
            </TabsList>
            <TabsContent value="resume">
              <ul className="list-disc ml-4 text-gray-600">
                {evidence.resume.map((item, i) => (
                  <li key={i} className="truncate">
                    <span className="bg-yellow-200">{skill}</span> in: {item}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="jd">
              <ul className="list-disc ml-4 text-gray-600">
                {evidence.jd.map((item, i) => (
                  <li key={i} className="truncate">
                    <span className="bg-yellow-200">{skill}</span> in: {item}
                  </li>
                ))}
              </ul>
            </TabsContent>
            <TabsContent value="github">
              <ul className="list-disc ml-4 text-gray-600">
                {evidence.github ? (
                  evidence.github.map((item, i) => (
                    <li key={i} className="truncate">
                      <span className="bg-yellow-200">{skill}</span> in: <a href={item} target="_blank" rel="noopener noreferrer" className="text-indigo-600">{item}</a>
                    </li>
                  ))
                ) : (
                  <p className="text-gray-500 italic">No GitHub evidence</p>
                )}
              </ul>
            </TabsContent>
          </Tabs>
          <p className="mt-4 text-sm text-gray-500">Confidence: {evidence.confidence || 82}%</p>
          <Dialog.Close className="mt-4 bg-indigo-600 text-white px-4 py-2 rounded-xl hover:bg-indigo-700 transition">Close</Dialog.Close>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}