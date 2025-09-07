export async function analyzeResume(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
  try {
    const response = await fetch(`${backendUrl}/api/analyze`, {
      method: 'POST',
      body: formData,
      signal: AbortSignal.timeout(30000),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Analysis failed');
    }
    return await response.json();
  } catch (error: any) {
    throw new Error(`Failed to analyze resume: ${error.message}`);
  }
}