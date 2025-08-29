import { Sparkles } from 'lucide-react';

export default function Home() {
  return (
    <div className="text-center">
      <div className="py-20 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-2xl">
        <h1 className="text-4xl font-bold mb-4">Upload Your Resume & Unlock Your Career Path</h1>
        <p className="text-xl mb-8">See missing skills, job matches, and learning plans instantly.</p>
        <a
          href="/upload"
          className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-semibold hover:bg-gray-100 transition"
        >
          Try Demo
        </a>
      </div>
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Sparkles className="h-8 w-8 mb-4 text-indigo-600" />
          <h2 className="font-semibold mb-2">Resume Parsing</h2>
          <p className="text-gray-600">Extract skills automatically.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Sparkles className="h-8 w-8 mb-4 text-indigo-600" />
          <h2 className="font-semibold mb-2">Evidence Tray</h2>
          <p className="text-gray-600">Verify skills with resume and job snippets.</p>
        </div>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <Sparkles className="h-8 w-8 mb-4 text-indigo-600" />
          <h2 className="font-semibold mb-2">GitHub Integration</h2>
          <p className="text-gray-600">Showcase verified projects.</p>
        </div>
      </div>
    </div>
  );
}