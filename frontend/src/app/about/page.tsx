export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h1 className="text-2xl font-semibold mb-4 text-indigo-700">About Career Assist</h1>
        <p className="text-gray-600 mb-4">
          Career Assist is an AI-powered platform designed to help students and professionals bridge skill gaps for better job opportunities. Upload your resume to get personalized skill analysis, job matches, and learning plans.
        </p>
        <a href="https://linkedin.com/in/your-profile" className="text-indigo-600 hover:underline">
          Connect with the creator on LinkedIn
        </a>
      </div>
    </div>
  );
}