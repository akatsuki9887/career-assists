'use client';
import { useState } from 'react';
import { useAnalysis } from '@/context/store';
import { analyzeResume } from '@/context/api';
import { FileUp } from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import * as Toast from '@radix-ui/react-toast';

export default function UploadPage() {
  const { setAnalysis } = useAnalysis();
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  const onDrop = async (files: File[]) => {
    if (!files[0]) {
      setOpen(true);
      return;
    }
    setLoading(true);
    try {
      const result = await analyzeResume(files[0]);
      console.log('API Response:', result); // Debug
      setAnalysis(result);
      window.location.href = '/results';
    } catch (error) {
      console.error('Upload Error:', error); // Debug
      setOpen(true);
    }
    setLoading(false);
  };

  const { getRootProps, getInputProps } = useDropzone({ onDrop });

  return (
    <Toast.Provider swipeDirection="right">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h1 className="text-2xl font-semibold mb-2">Upload Your Resume</h1>
          <p className="text-gray-600 mb-6">Drag & drop or click to upload (PDF only).</p>
          <div {...getRootProps()} className="border-2 border-dashed rounded-xl p-10 text-center cursor-pointer">
            <input {...getInputProps()} />
            <FileUp className="mx-auto mb-3 h-12 w-12 text-gray-400" />
            <p>Drop PDF file here or click to upload</p>
          </div>
          {loading && (
            <div className="mt-4 flex justify-center">
              <svg className="animate-spin h-8 w-8 text-indigo-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8h8a8 8 0 01-16 0z" />
              </svg>
            </div>
          )}
        </div>
      </div>
      <Toast.Root open={open} onOpenChange={setOpen} className="bg-red-100 border border-red-300 rounded-xl p-4 shadow-lg">
        <Toast.Title className="font-semibold text-red-800">Upload Failed</Toast.Title>
        <Toast.Description className="text-red-600">Please try uploading a PDF file again.</Toast.Description>
        <Toast.Close className="text-indigo-600 hover:text-indigo-800 font-medium">Close</Toast.Close>
      </Toast.Root>
      <Toast.Viewport className="fixed bottom-0 right-0 p-4" />
    </Toast.Provider>
  );
}