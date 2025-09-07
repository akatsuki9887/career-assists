'use client';
import { useState, useCallback, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastClose, ToastViewport } from '@radix-ui/react-toast';
import { FileUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';

export default function UploadPage() {
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const uploadWithRetry = async (formData: FormData, retries = 3): Promise<any> => {
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(`http://127.0.0.1:8000/api/analyze`, {
          method: 'POST',
          body: formData,
          signal: AbortSignal.timeout(60000),
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.detail || `Upload failed: ${res.status}`);
        }
        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };

  const onDrop = useCallback(async (files: File[]) => {
    if (!files[0]) {
      setError('Please select a valid PDF file.');
      setOpen(true);
      return;
    }

    const file = files[0];
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please upload a valid PDF file.');
      setOpen(true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB.');
      setOpen(true);
      return;
    }

    setSelectedFile(file.name);
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      await new Promise((resolve, reject) => {
        reader.onload = () => {
          localStorage.setItem('resumeFormData', reader.result as string);
          resolve(null);
        };
        reader.onerror = () => reject(new Error('Failed to read the file.'));
      });

      const formData = new FormData();
      formData.append('file', file);
      const data = await uploadWithRetry(formData);
      localStorage.setItem('analysis', JSON.stringify(data));
      setSuccess(true);
      setOpen(true);
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      startTransition(() => {
        setTimeout(() => router.push('/results'), 1500);
      });
    } catch (err: any) {
      setError(err.message || 'Failed to upload file. Please check your connection and try again.');
      setOpen(true);
      setLoading(false);
      console.error('Upload error:', err);
    }
  }, [router]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });

  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto px-4 py-10 md:py-12 max-w-[1100px]"
      >
        <Card className="max-w-2xl mx-auto p-8 bg-surface-2 border border-border rounded-2xl shadow-card glass">
          <h1 className="text-3xl font-bold mb-4 text-accent text-center">Upload Your Resume</h1>
          <p className="text-muted text-center mb-6">Drag & drop or click to upload a PDF (max 5MB).</p>
          <motion.div
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div
              className={`border-2 border-dashed rounded-2xl p-10 text-center bg-gradient-to-br from-surface-2 to-surface hover:border-accent transition-colors ${
                isDragActive ? 'border-accent bg-accent/10' : ''
              }`}
              {...getRootProps()}
            >
              <input {...getInputProps()} aria-label="Upload PDF file" />
              <FileUp className="mx-auto mb-4 h-12 w-12 text-muted" />
              <p className="text-muted mb-4">{isDragActive ? 'Drop the PDF here' : 'Drop PDF file here or click to upload'}</p>
              <Button variant="secondary" className="px-6 py-2 rounded-lg bg-accent/10 text-accent hover:bg-accent/20 transition-colors">
                Browse Files
              </Button>
            </div>
          </motion.div>
          {selectedFile && (
            <p className="mt-4 text-sm text-muted text-center">Selected: {selectedFile}</p>
          )}
          {loading && (
            <div className="mt-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
              <p className="text-muted mt-2">Processing your resume...</p>
            </div>
          )}
          <Button
            onClick={() => setSelectedFile(null)}
            variant="ghost"
            className="mt-4 text-muted hover:text-accent transition-colors w-full"
            disabled={!selectedFile || loading}
            aria-label="Clear selected file"
          >
            Clear Selection
          </Button>
        </Card>
        <Toast
          open={open}
          onOpenChange={setOpen}
          className={`p-4 rounded-2xl shadow-card border glass flex items-center gap-3 ${
            success ? 'bg-success/10 border-success/50' : 'bg-danger/10 border-danger/50'
          }`}
        >
          {success ? <CheckCircle className="h-6 w-6 text-success" /> : <AlertTriangle className="h-6 w-6 text-danger" />}
          <div>
            <ToastTitle className={`font-semibold text-lg ${success ? 'text-success' : 'text-danger'}`}>
              {success ? 'Upload Successful' : 'Upload Failed'}
            </ToastTitle>
            <ToastDescription className={`text-sm ${success ? 'text-success/80' : 'text-danger/80'}`}>
              {success ? 'Resume processed! Redirecting to results...' : error}
            </ToastDescription>
          </div>
          <ToastClose className="ml-auto text-accent hover:text-accent/80 font-medium text-sm" aria-label="Close notification">
            Close
          </ToastClose>
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 w-[90vw] max-w-[400px] z-50" />
      </motion.div>
    </ToastProvider>
  );
}