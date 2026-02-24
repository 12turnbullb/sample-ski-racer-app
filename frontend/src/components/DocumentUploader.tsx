/**
 * DocumentUploader Component
 *
 * Uploads ski analysis videos/images using the 3-step presigned S3 URL flow:
 *   1. POST /upload-url  → backend returns presigned PUT URL + documentId
 *   2. PUT file directly to S3 via presigned URL (no auth headers)
 *   3. POST /analyze     → backend reads from S3, runs Bedrock, returns result
 *
 * Falls back to single-step multipart upload when running against a local
 * backend that has no S3 bucket configured.
 *
 * Requirements: 10.2, 10.5
 */

import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { getUploadUrl, analyzeDocument, uploadDocument, ApiClientError } from '../services/api';
import type { Document } from '../types';

// ============================================================================
// Constants
// ============================================================================

const ALLOWED_FILE_TYPES = [
  'video/mp4',
  'video/quicktime',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

const ALLOWED_EXTENSIONS = ['MP4', 'MOV', 'JPG', 'JPEG', 'PNG'];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// ============================================================================
// Props
// ============================================================================

interface DocumentUploaderProps {
  racerId: string;
  onUploadComplete?: (document: Document) => void;
}

// ============================================================================
// Component
// ============================================================================

export default function DocumentUploader({ racerId, onUploadComplete }: DocumentUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Validation
  // ============================================================================

  const validateFile = (file: File): boolean => {
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      setErrorMessage(
        `Invalid file type. Please upload one of: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('File size exceeds 50 MB limit. Please choose a smaller file.');
      return false;
    }

    return true;
  };

  // ============================================================================
  // File selection handlers
  // ============================================================================

  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) setSelectedFile(file);
    }
  };

  const handleFileInputClick = () => fileInputRef.current?.click();

  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) setSelectedFile(file);
    }
  };

  // ============================================================================
  // Upload handler — 3-step presigned URL flow
  // ============================================================================

  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);
    setUploadProgress(0);

    const isVideo = selectedFile.type.startsWith('video/');
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const estimatedAnalysisSeconds = isVideo
      ? Math.max(30, Math.min(120, fileSizeMB * 5))
      : Math.max(10, Math.min(30, fileSizeMB * 2));

    try {
      // ------------------------------------------------------------------
      // Step 1: Get presigned PUT URL from backend
      // ------------------------------------------------------------------
      setUploadStatus('Requesting upload URL…');
      setUploadProgress(5);

      let documentId: string;
      let uploadUrl: string | null = null;

      try {
        const result = await getUploadUrl(
          racerId,
          selectedFile.name,
          selectedFile.type,
          selectedFile.size,
        );
        documentId = result.documentId;
        uploadUrl = result.uploadUrl;
        setUploadProgress(15);
      } catch (e) {
        // If upload-url endpoint doesn't exist (local dev), fall through to
        // the legacy single-step multipart upload
        if (e instanceof ApiClientError && e.statusCode === 404) {
          uploadUrl = null;
          documentId = '';
        } else {
          throw e;
        }
      }

      if (!uploadUrl) {
        // ------------------------------------------------------------------
        // Local dev fallback: single-step multipart upload
        // ------------------------------------------------------------------
        setUploadStatus('Uploading and analyzing…');

        let progress = 15;
        const interval = setInterval(() => {
          progress = Math.min(progress + 3, 88);
          setUploadProgress(progress);
          setUploadStatus(
            isVideo
              ? `Analyzing video… (est. ${Math.ceil(estimatedAnalysisSeconds)}s)`
              : 'Analyzing image…'
          );
        }, estimatedAnalysisSeconds * 10);

        try {
          const document = await uploadDocument(racerId, selectedFile);
          clearInterval(interval);
          finishUpload(document);
        } catch (err) {
          clearInterval(interval);
          throw err;
        }
        return;
      }

      // ------------------------------------------------------------------
      // Step 2: PUT file directly to S3 via presigned URL
      // ------------------------------------------------------------------
      setUploadStatus('Uploading file to secure storage…');

      // Use XMLHttpRequest so we get real upload progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open('PUT', uploadUrl!);
        xhr.setRequestHeader('Content-Type', selectedFile.type);

        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            // S3 upload maps to 15–60% of overall progress
            const s3Progress = 15 + Math.round((event.loaded / event.total) * 45);
            setUploadProgress(s3Progress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error(`S3 upload failed with status ${xhr.status}`));
          }
        };
        xhr.onerror = () => reject(new Error('S3 upload network error'));
        xhr.send(selectedFile);
      });

      setUploadProgress(62);

      // ------------------------------------------------------------------
      // Step 3: Trigger Bedrock analysis via backend
      // ------------------------------------------------------------------
      setUploadStatus(
        isVideo
          ? `Analyzing video with AI… (est. ${Math.ceil(estimatedAnalysisSeconds)}s)`
          : 'Analyzing image with AI…'
      );

      let progress = 62;
      const analysisInterval = setInterval(() => {
        progress = Math.min(progress + 2, 92);
        setUploadProgress(progress);
      }, estimatedAnalysisSeconds * 15);

      let document: Document;
      try {
        document = await analyzeDocument(racerId, documentId);
      } finally {
        clearInterval(analysisInterval);
      }

      finishUpload(document);
    } catch (error) {
      setUploadProgress(0);
      setUploadStatus('');
      if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else if (error instanceof Error) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred during upload');
      }
    } finally {
      setIsUploading(false);
    }
  };

  const finishUpload = (document: Document) => {
    setUploadProgress(100);
    setUploadStatus('Complete!');
    setSuccessMessage(`"${selectedFile?.name}" uploaded and analyzed successfully!`);
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (onUploadComplete) onUploadComplete(document);
    setTimeout(() => {
      setSuccessMessage(null);
      setUploadProgress(0);
      setUploadStatus('');
    }, 3000);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <h2 className="text-2xl font-bold gradient-text mb-4">
        Upload Ski Video or Image
      </h2>

      {/* Drag and Drop Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-200
          ${isDragging
            ? 'border-neon-cyan bg-ice-500/10 shadow-neon'
            : 'border-white/20 bg-white/5 hover:border-ice-400/40 hover:bg-white/10'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileInputClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-ice-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
            aria-hidden="true"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="text-sm text-ice-300">
          <p className="font-medium text-white">
            {isDragging
              ? 'Drop file here'
              : 'Drag and drop a video or image here, or click to select'}
          </p>
          <p className="mt-2 text-xs text-ice-400">
            Supported formats: {ALLOWED_EXTENSIONS.join(', ')}
          </p>
          <p className="text-xs text-ice-400">Maximum file size: 50 MB</p>
          <p className="mt-2 text-xs text-neon-cyan font-medium">
            AI will analyze your ski form and provide feedback
          </p>
          <p className="mt-1 text-xs text-ice-500">
            💡 Tip: Images process in ~10–30s, videos may take 30–120s
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-4 glass-dark border border-white/10 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-ice-400" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{selectedFile.name}</p>
                <p className="text-xs text-ice-400">
                  {formatFileSize(selectedFile.size)}
                  {selectedFile.type.startsWith('video/') &&
                    ` • Est. ${Math.ceil(Math.max(30, Math.min(120, (selectedFile.size / (1024 * 1024)) * 5)))}s to analyze`
                  }
                </p>
              </div>
            </div>
            {!isUploading && (
              <button
                onClick={(e) => { e.stopPropagation(); handleClear(); }}
                className="ml-4 flex-shrink-0 text-ice-500 hover:text-white transition-colors"
                aria-label="Clear file"
              >
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          {selectedFile.type.startsWith('video/') && (selectedFile.size / (1024 * 1024)) > 20 && (
            <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300">
              ⚠️ Large video file — analysis may take 1–2 minutes. Please be patient.
            </div>
          )}
        </div>
      )}

      {/* Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-ice-200">{uploadStatus}</span>
            <span className="text-sm font-medium text-ice-200">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-2">
            <div
              className="bg-gradient-ice h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {uploadProgress > 62 && uploadProgress < 92 && (
            <p className="text-xs text-ice-500 mt-2">
              AI is analyzing your ski form. This process cannot be interrupted.
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 glass-dark border border-red-500/30 rounded-xl">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-400">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-4 p-4 glass-dark border border-green-500/30 rounded-xl">
          <div className="flex items-start">
            <svg className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`
            w-full py-3 px-4 rounded-xl font-semibold text-white
            transition-all duration-200
            ${!selectedFile || isUploading
              ? 'bg-white/10 cursor-not-allowed text-ice-500'
              : 'bg-gradient-ice hover:shadow-neon-blue'
            }
          `}
        >
          {isUploading ? 'Uploading & Analyzing…' : 'Upload and Analyze'}
        </button>
      </div>
    </div>
  );
}
