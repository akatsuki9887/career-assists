'use client';
import { useState, useCallback, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useDropzone } from 'react-dropzone';
import {ToastProvider,Toast,ToastTitle,ToastDescription,ToastClose,ToastViewport} from '@radix-ui/react-toast';
import { FileUp, CheckCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
export default function UploadPage() {
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const normalizeError = (err: any, fallback: string) => {
    if (!err) return fallback;
    if (typeof err === 'string') return err;
    if (err instanceof Error) return err.message;
    if (typeof err.detail === 'string') return err.detail;
    if (typeof err.detail === 'object') return JSON.stringify(err.detail);
    try {
      return JSON.stringify(err);
    } catch {
      return fallback;
    }
  };
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: useCallback(
      async (files: File[]) => {
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
        setSelectedFile(file);
        setLoading(true);
        setError('');
        setSuccess(false);
        try {
          const formData = new FormData();
          formData.append('file', file);
          const data = await uploadWithRetry(formData, session?.accessToken);
          localStorage.setItem('analysis', JSON.stringify(data));
          setSuccess(true);
          setOpen(true);
          confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
          startTransition(() => {
            setTimeout(() => router.push('/results'), 1500);
          });
        } catch (err: unknown) {
          const message = normalizeError(
            err,
            'Failed to upload file. Please check your connection and try again.'
          );
          setError(message);
          setOpen(true);
          setLoading(false);
          console.error('Upload error:', err);
        }
      },
      [router, session?.accessToken]
    ),
    accept: { 'application/pdf': ['.pdf'] },
    maxSize: 5 * 1024 * 1024,
    multiple: false,
  });
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);
  const uploadWithRetry = async (
    formData: FormData,
    accessToken?: string,
    retries = 3
  ): Promise<any> => {
    if (!accessToken) {
      throw new Error('No access token available. Please re-login.');
    }
    let backendToken: string | undefined;
    try {
      setLoading(true);
      const tokenRes = await fetch(
        `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/auth/exchange-token`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ github_token: accessToken }),
        }
      );
      if (!tokenRes.ok) {
        const errorData = await tokenRes.json().catch(() => ({}));
        if (tokenRes.status === 401) {
          throw new Error('GitHub token invalid or expired. Please re-login.');
        }
        throw new Error(
          normalizeError(errorData, `Token exchange failed: ${tokenRes.status}`)
        );
      }
      const { access_token } = await tokenRes.json();
      backendToken = access_token;
    } catch (err) {
      throw new Error(
        `Token exchange failed: ${normalizeError(
          err,
          'Unexpected error during token exchange'
        )}. Please try again or re-login.`
      );
    }
    for (let i = 0; i < retries; i++) {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000'}/api/analyze?func=resume`,
          {
            method: 'POST',
            body: formData,
            headers: {
              Authorization: `Bearer ${backendToken}`,
            },
            signal: AbortSignal.timeout(60000),
          }
        );
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(normalizeError(errorData, `Upload failed: ${res.status}`));
        }
        return await res.json();
      } catch (err) {
        if (i === retries - 1) throw err;
        await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  };
  if (status === 'loading') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-screen bg-surface"
      >
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
        <p className="text-muted mt-2 text-base leading-relaxed">
          Loading session...
        </p>
      </motion.div>
    );
  }
  return (
    <ToastProvider swipeDirection="right" duration={4000}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mx-auto max-w-6xl px-4 py-8 md:py-12"
      >
        <Card className="max-w-2xl mx-auto p-6 md:p-8 bg-surface-2 border border-border rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200">
          <h1 className="text-4xl font-bold mb-4 text-accent text-center">
            Upload Your Resume
          </h1>
          <p className="text-base leading-relaxed text-muted text-center mb-6">
            Drag & drop or click to upload a PDF (max 5MB).
          </p>
          <motion.div whileHover={{ scale: 1.02 }} transition={{ duration: 0.3 }}>
            <div
              className={`border-2 border-dashed rounded-xl p-8 md:p-10 text-center bg-gradient-to-br from-surface-2 to-surface hover:border-accent transition-colors duration-200 ${
                isDragActive ? 'border-accent bg-accent/10' : ''
              }`}
              {...getRootProps()}
            >
              <input {...getInputProps()} aria-label="Upload PDF file" />
              <FileUp className="mx-auto mb-4 h-12 w-12 text-muted" />
              <p className="text-muted mb-4 text-base leading-relaxed">
                {isDragActive
                  ? 'Drop the PDF here'
                  : 'Drop PDF file here or click to upload'}
              </p>
              <Button
                variant="secondary"
                className="px-6 py-3 rounded-xl bg-accent/10 text-accent hover:bg-accent/20 transition-colors duration-200 hover:scale-105"
              >
                Browse Files
              </Button>
            </div>
          </motion.div>
          {selectedFile && (
            <p className="mt-4 text-sm text-muted text-center">
              Selected: {selectedFile.name}
            </p>
          )}
          {loading && (
            <div className="mt-6 text-center">
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-accent" />
              <p className="text-muted mt-2 text-base leading-relaxed">
                Processing your resume...
              </p>
            </div>
          )}
          <Button
            onClick={() => setSelectedFile(null)}
            variant="ghost"
            className="mt-4 text-muted hover:text-accent transition-colors duration-200 w-full rounded-xl"
            disabled={!selectedFile || loading}
            aria-label="Clear selected file"
          >
            Clear Selection
          </Button>
        </Card>
        <Toast
          open={open}
          onOpenChange={setOpen}
          className={`p-4 rounded-xl shadow-md hover:shadow-xl transition-shadow duration-200 border glass flex items-center gap-3 ${
            success ? 'bg-success/10 border-success/50' : 'bg-danger/10 border-danger/50'
          }`}
        >
          {success ? (
            <CheckCircle className="h-6 w-6 text-success" />
          ) : (
            <AlertTriangle className="h-6 w-6 text-danger" />
          )}
          <div>
            <ToastTitle className={`font-semibold text-lg ${success ? 'text-success' : 'text-danger'}`}>
              {success ? 'Upload Successful' : 'Upload Failed'}
            </ToastTitle>
            <ToastDescription className={`text-sm ${success ? 'text-success/80' : 'text-danger/80'}`}>
              {success ? 'Resume processed! Redirecting to results...' : error}
            </ToastDescription>
          </div>
          <ToastClose
            className="ml-auto text-accent hover:text-accent/80 font-medium text-sm"
            aria-label="Close notification"
          >
            Close
          </ToastClose>
        </Toast>
        <ToastViewport className="fixed bottom-4 right-4 w-[90vw] max-w-[400px] z-50" />
      </motion.div>
    </ToastProvider>
  );
}
