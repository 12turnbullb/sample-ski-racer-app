/**
 * DocumentUploader Component
 * 
 * A file upload component with drag-and-drop support for uploading ski analysis documents.
 * Provides client-side validation, upload progress tracking, and error handling.
 * 
 * Requirements: 10.2, 10.5
 * 
 * Features:
 * - Drag-and-drop file selection
 * - File input button as fallback
 * - Client-side validation (file type and size)
 * - Upload progress bar
 * - File preview/name display before upload
 * - Success/error message display
 * - Responsive design with Tailwind CSS
 */

import { useState, useRef } from 'react';
import type { DragEvent, ChangeEvent } from 'react';
import { uploadDocument } from '../services/api';
import type { Document } from '../types';
import { ApiClientError } from '../services/api';

// ============================================================================
// Constants
// ============================================================================

/**
 * Allowed file types for video/image upload.
 * Matches backend validation requirements.
 */
const ALLOWED_FILE_TYPES = [
  'video/mp4',
  'video/quicktime',
  'image/jpeg',
  'image/jpg',
  'image/png',
];

/**
 * File extensions for display purposes.
 */
const ALLOWED_EXTENSIONS = ['MP4', 'MOV', 'JPG', 'JPEG', 'PNG'];

/**
 * Maximum file size in bytes (50MB).
 */
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

// ============================================================================
// Component Props
// ============================================================================

interface DocumentUploaderProps {
  /**
   * UUID of the racer who owns this document.
   */
  racerId: string;

  /**
   * Callback function invoked when upload completes successfully.
   * Receives the uploaded document metadata.
   */
  onUploadComplete?: (document: Document) => void;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DocumentUploader component for uploading ski analysis documents.
 * 
 * @param props - Component props
 * @returns React component
 */
export default function DocumentUploader({
  racerId,
  onUploadComplete,
}: DocumentUploaderProps) {
  // State management
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Ref for file input element
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Validation Functions
  // ============================================================================

  /**
   * Validate file type against allowed types.
   * 
   * @param file - File to validate
   * @returns True if file type is allowed, false otherwise
   */
  const validateFileType = (file: File): boolean => {
    return ALLOWED_FILE_TYPES.includes(file.type);
  };

  /**
   * Validate file size against maximum allowed size.
   * 
   * @param file - File to validate
   * @returns True if file size is within limit, false otherwise
   */
  const validateFileSize = (file: File): boolean => {
    return file.size <= MAX_FILE_SIZE;
  };

  /**
   * Validate file and set error message if validation fails.
   * 
   * @param file - File to validate
   * @returns True if file is valid, false otherwise
   */
  const validateFile = (file: File): boolean => {
    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validate file type
    if (!validateFileType(file)) {
      setErrorMessage(
        `Invalid file type. Please upload one of the following: ${ALLOWED_EXTENSIONS.join(', ')}`
      );
      return false;
    }

    // Validate file size
    if (!validateFileSize(file)) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024);
      setErrorMessage(
        `File size exceeds ${maxSizeMB}MB limit. Please choose a smaller file.`
      );
      return false;
    }

    // Show warning for large video files
    const isVideo = file.type.startsWith('video/');
    const fileSizeMB = file.size / (1024 * 1024);
    
    if (isVideo && fileSizeMB > 10) {
      // Large video - show warning but allow upload
      console.warn(`Large video file (${fileSizeMB.toFixed(1)}MB) - analysis may take 1-2 minutes`);
    }

    return true;
  };

  // ============================================================================
  // File Selection Handlers
  // ============================================================================

  /**
   * Handle file selection from file input.
   * 
   * @param event - Change event from file input
   */
  const handleFileSelect = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  /**
   * Handle click on file input area to open file picker.
   */
  const handleFileInputClick = () => {
    fileInputRef.current?.click();
  };

  // ============================================================================
  // Drag and Drop Handlers
  // ============================================================================

  /**
   * Handle drag enter event.
   * 
   * @param event - Drag event
   */
  const handleDragEnter = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handle drag over event.
   * 
   * @param event - Drag event
   */
  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
  };

  /**
   * Handle drag leave event.
   * 
   * @param event - Drag event
   */
  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle file drop event.
   * 
   * @param event - Drag event
   */
  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        setSelectedFile(file);
      }
    }
  };

  // ============================================================================
  // Upload Handler
  // ============================================================================

  /**
   * Handle file upload to backend.
   */
  const handleUpload = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a file to upload');
      return;
    }

    // Clear previous messages
    setErrorMessage(null);
    setSuccessMessage(null);
    setIsUploading(true);
    setUploadProgress(0);
    setUploadStatus('Uploading file...');

    // Estimate processing time based on file size and type
    const isVideo = selectedFile.type.startsWith('video/');
    const fileSizeMB = selectedFile.size / (1024 * 1024);
    const estimatedSeconds = isVideo 
      ? Math.max(30, Math.min(120, fileSizeMB * 5)) // 5 seconds per MB for video, 30-120s range
      : Math.max(10, Math.min(30, fileSizeMB * 2));  // 2 seconds per MB for image, 10-30s range

    // Simulate progress with status updates
    let currentProgress = 0;
    const progressInterval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress <= 30) {
        setUploadProgress(currentProgress);
        setUploadStatus('Uploading file...');
      } else if (currentProgress <= 90) {
        setUploadProgress(currentProgress);
        setUploadStatus(
          isVideo 
            ? `Analyzing video with AI... (this may take ${Math.ceil(estimatedSeconds)}s)`
            : 'Analyzing image with AI...'
        );
      } else {
        clearInterval(progressInterval);
        setUploadProgress(90);
        setUploadStatus('Finalizing...');
      }
    }, estimatedSeconds * 10); // Adjust interval based on estimated time

    try {
      // Upload file with timeout
      const timeoutMs = Math.max(120000, estimatedSeconds * 1000 + 30000); // Add 30s buffer
      const uploadPromise = uploadDocument(racerId, selectedFile);
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error('Upload timeout')), timeoutMs)
      );

      const document = await Promise.race([uploadPromise, timeoutPromise]);

      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('Complete!');

      // Show success message
      setSuccessMessage(
        `File "${selectedFile.name}" uploaded and analyzed successfully!`
      );

      // Reset state
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // Call callback if provided
      if (onUploadComplete) {
        onUploadComplete(document);
      }

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
        setUploadProgress(0);
        setUploadStatus('');
      }, 3000);
    } catch (error) {
      // Clear progress interval on error
      clearInterval(progressInterval);
      
      // Handle upload error
      if (error instanceof Error && error.message === 'Upload timeout') {
        setErrorMessage(
          `Upload timed out after ${Math.ceil(timeoutMs / 1000)} seconds. ` +
          `Large ${isVideo ? 'videos' : 'files'} may take longer to process. ` +
          `Try a shorter video or check your network connection.`
        );
      } else if (error instanceof ApiClientError) {
        setErrorMessage(error.message);
      } else {
        setErrorMessage('An unexpected error occurred during upload');
      }
      setUploadProgress(0);
      setUploadStatus('');
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * Handle cancel/clear selected file.
   */
  const handleClear = () => {
    setSelectedFile(null);
    setErrorMessage(null);
    setSuccessMessage(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Format file size for display.
   * 
   * @param bytes - File size in bytes
   * @returns Formatted file size string
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(2)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      {/* Title */}
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Upload Ski Video or Image
      </h2>

      {/* Drag and Drop Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
          transition-colors duration-200
          ${
            isDragging
              ? 'border-blue-500 bg-blue-50'
              : 'border-gray-300 bg-gray-50 hover:border-gray-400 hover:bg-gray-100'
          }
          ${isUploading ? 'pointer-events-none opacity-50' : ''}
        `}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileInputClick}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={ALLOWED_FILE_TYPES.join(',')}
          onChange={handleFileSelect}
          disabled={isUploading}
        />

        {/* Upload icon */}
        <div className="mb-4">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
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

        {/* Instructions */}
        <div className="text-sm text-gray-600">
          <p className="font-medium">
            {isDragging
              ? 'Drop file here'
              : 'Drag and drop a video or image here, or click to select'}
          </p>
          <p className="mt-2 text-xs">
            Supported formats: {ALLOWED_EXTENSIONS.join(', ')}
          </p>
          <p className="text-xs">Maximum file size: 50MB</p>
          <p className="mt-2 text-xs text-blue-600 font-medium">
            AI will analyze your ski form and provide feedback
          </p>
          <p className="mt-1 text-xs text-gray-500">
            💡 Tip: Images process in ~10-30s, videos may take 30-120s
          </p>
        </div>
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="mt-4 p-4 bg-white border border-gray-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              {/* File icon */}
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-blue-500"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>

              {/* File info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(selectedFile.size)}
                  {selectedFile.type.startsWith('video/') && 
                    ` • Est. ${Math.ceil(Math.max(30, Math.min(120, (selectedFile.size / (1024 * 1024)) * 5)))}s to analyze`
                  }
                </p>
              </div>
            </div>

            {/* Clear button */}
            {!isUploading && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleClear();
                }}
                className="ml-4 flex-shrink-0 text-gray-400 hover:text-gray-600"
                aria-label="Clear file"
              >
                <svg
                  className="h-5 w-5"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            )}
          </div>
          
          {/* Large file warning */}
          {selectedFile.type.startsWith('video/') && (selectedFile.size / (1024 * 1024)) > 20 && (
            <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
              ⚠️ Large video file - analysis may take 1-2 minutes. Please be patient.
            </div>
          )}
        </div>
      )}

      {/* Upload Progress Bar */}
      {isUploading && uploadProgress > 0 && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm font-medium text-gray-700">
              {uploadStatus}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          {uploadProgress > 30 && uploadProgress < 90 && (
            <p className="text-xs text-gray-500 mt-2">
              AI is analyzing your ski form. This process cannot be interrupted.
            </p>
          )}
        </div>
      )}

      {/* Error Message */}
      {errorMessage && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-red-400 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Success Message */}
      {successMessage && (
        <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-400 mt-0.5 mr-3 flex-shrink-0"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-green-700">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Upload Button */}
      <div className="mt-6">
        <button
          onClick={handleUpload}
          disabled={!selectedFile || isUploading}
          className={`
            w-full py-3 px-4 rounded-lg font-medium text-white
            transition-colors duration-200
            ${
              !selectedFile || isUploading
                ? 'bg-gray-300 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
            }
          `}
        >
          {isUploading ? 'Analyzing...' : 'Upload and Analyze'}
        </button>
      </div>
    </div>
  );
}
