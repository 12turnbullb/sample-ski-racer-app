/**
 * VideoAnalysisViewer Component
 * 
 * Displays uploaded ski videos/images with AI-generated form analysis.
 * Shows the media file alongside or below the Bedrock analysis feedback.
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Document } from '../types';
import ConfirmDialog from './ConfirmDialog';

interface VideoAnalysisViewerProps {
  documents: Document[];
  onDelete?: (documentId: string) => void;
  isLoading?: boolean;
}

export default function VideoAnalysisViewer({
  documents,
  onDelete,
  isLoading = false,
}: VideoAnalysisViewerProps) {
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  const formatUploadDate = (dateString: string): string => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    };
    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };
    const formattedDate = date.toLocaleDateString('en-US', dateOptions);
    const formattedTime = date.toLocaleTimeString('en-US', timeOptions);
    return `${formattedDate} at ${formattedTime}`;
  };

  const isVideo = (fileType: string): boolean => {
    return fileType.startsWith('video/');
  };

  const isImage = (fileType: string): boolean => {
    return fileType.startsWith('image/');
  };

  const handleDeleteClick = (documentId: string) => {
    setDeleteConfirmId(documentId);
  };

  const handleDeleteConfirm = () => {
    if (deleteConfirmId && onDelete) {
      onDelete(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  const toggleExpanded = (documentId: string) => {
    setExpandedId(expandedId === documentId ? null : documentId);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Ski Form Analysis
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          Ski Form Analysis
        </h2>
        <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No videos or images yet
          </h3>
          <p className="text-sm text-gray-500">
            Upload a ski video or image to get AI-powered form analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        Ski Form Analysis
      </h2>

      <div className="space-y-6">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 truncate">
                    {document.filename}
                  </h3>
                  <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                    <span>{formatFileSize(document.fileSize)}</span>
                    <span>•</span>
                    <span>{formatUploadDate(document.uploadedAt)}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteClick(document.id)}
                  className="ml-4 p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  aria-label="Delete"
                  title="Delete"
                >
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Media Preview */}
                <div className="space-y-2">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    {isVideo(document.fileType) ? 'Video' : 'Image'}
                  </h4>
                  <div className="bg-black rounded-lg overflow-hidden">
                    {isVideo(document.fileType) ? (
                      <video
                        controls
                        className="w-full h-auto"
                        src={`http://localhost:8000/${document.filePath}`}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : isImage(document.fileType) ? (
                      <img
                        src={`http://localhost:8000/${document.filePath}`}
                        alt={document.filename}
                        className="w-full h-auto"
                        onError={(e) => {
                          console.error('Image failed to load:', document.filePath);
                          console.error('Attempted URL:', `http://localhost:8000/${document.filePath}`);
                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                        }}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-white">
                        Unsupported file type
                      </div>
                    )}
                  </div>
                </div>

                {/* AI Analysis */}
                <div className="space-y-2">
                  {expandedId === document.id ? (
                    // Expanded view - show full analysis
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-sm font-medium text-gray-700">
                          AI Form Analysis
                        </h4>
                        <button
                          onClick={() => toggleExpanded(document.id)}
                          className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Collapse
                        </button>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 overflow-y-auto">
                        {document.analysis ? (
                          <div className="prose prose-sm prose-blue max-w-none">
                            <ReactMarkdown
                              components={{
                                // Customize heading styles
                                h1: ({node, ...props}) => <h1 className="text-xl font-bold text-gray-900 mt-4 mb-2" {...props} />,
                                h2: ({node, ...props}) => <h2 className="text-lg font-bold text-gray-900 mt-3 mb-2" {...props} />,
                                h3: ({node, ...props}) => <h3 className="text-base font-semibold text-gray-900 mt-2 mb-1" {...props} />,
                                // Customize list styles
                                ul: ({node, ...props}) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                ol: ({node, ...props}) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                                li: ({node, ...props}) => <li className="text-gray-800" {...props} />,
                                // Customize paragraph styles
                                p: ({node, ...props}) => <p className="text-gray-800 my-2" {...props} />,
                                // Customize strong/bold text
                                strong: ({node, ...props}) => <strong className="font-semibold text-gray-900" {...props} />,
                                // Customize emphasis/italic text
                                em: ({node, ...props}) => <em className="italic text-gray-700" {...props} />,
                              }}
                            >
                              {document.analysis}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <div className="flex items-start space-x-2 text-amber-700">
                            <svg
                              className="h-5 w-5 flex-shrink-0 mt-0.5"
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path
                                fillRule="evenodd"
                                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                clipRule="evenodd"
                              />
                            </svg>
                            <p className="text-sm">
                              Analysis is not available for this file. This may be due to
                              processing limitations or AWS configuration.
                            </p>
                          </div>
                        )}
                      </div>
                    </>
                  ) : (
                    // Collapsed view - show compact row with expand button
                    <button
                      onClick={() => toggleExpanded(document.id)}
                      className="w-full flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm font-medium text-gray-700">
                          AI Form Analysis
                        </span>
                        {document.analysis && (
                          <span className="text-xs text-gray-500">
                            • Click to view detailed feedback
                          </span>
                        )}
                      </div>
                      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Analysis"
        message="Are you sure you want to delete this video/image and its analysis? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
