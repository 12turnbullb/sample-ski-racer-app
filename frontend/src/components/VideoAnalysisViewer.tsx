/**
 * VideoAnalysisViewer Component
 *
 * Displays uploaded ski videos/images with AI-generated form analysis.
 *
 * In production, file_path stores an S3 key, not a public URL.
 * The component fetches a short-lived presigned GET URL from the backend
 * for each document so the browser can render the media.
 */

import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Document } from '../types';
import ConfirmDialog from './ConfirmDialog';
import { getDocumentUrl } from '../services/api';

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
  // Map of documentId → presigned media URL
  const [mediaUrls, setMediaUrls] = useState<Record<string, string>>({});

  // Fetch presigned GET URLs for all documents whenever the list changes
  useEffect(() => {
    let cancelled = false;

    const fetchUrls = async () => {
      const entries = await Promise.all(
        documents.map(async (doc) => {
          // Skip pending documents (not yet uploaded to S3)
          if (doc.status === 'pending') return [doc.id, ''] as [string, string];

          // Detect local dev: if the path looks like a local filesystem path
          // (starts with "uploads/" or contains a slash without "documents/"),
          // use a localhost URL instead of calling the presigned URL endpoint.
          const isLocalPath =
            doc.filePath.startsWith('uploads/') ||
            (!doc.filePath.startsWith('documents/') && doc.filePath.includes('/'));

          if (isLocalPath) {
            return [doc.id, `http://localhost:8000/${doc.filePath}`] as [string, string];
          }

          try {
            const url = await getDocumentUrl(doc.id);
            return [doc.id, url] as [string, string];
          } catch {
            return [doc.id, ''] as [string, string];
          }
        })
      );

      if (!cancelled) {
        setMediaUrls(Object.fromEntries(entries));
      }
    };

    if (documents.length > 0) {
      fetchUrls();
    }

    return () => {
      cancelled = true;
    };
  }, [documents]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formatUploadDate = (dateString: string): string => {
    const date = new Date(dateString);
    const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: 'short', day: 'numeric' };
    const timeOptions: Intl.DateTimeFormatOptions = { hour: 'numeric', minute: '2-digit', hour12: true };
    return `${date.toLocaleDateString('en-US', dateOptions)} at ${date.toLocaleTimeString('en-US', timeOptions)}`;
  };

  const isVideo = (fileType: string) => fileType.startsWith('video/');
  const isImage = (fileType: string) => fileType.startsWith('image/');

  const handleDeleteClick = (documentId: string) => setDeleteConfirmId(documentId);
  const handleDeleteConfirm = () => {
    if (deleteConfirmId && onDelete) onDelete(deleteConfirmId);
    setDeleteConfirmId(null);
  };
  const handleDeleteCancel = () => setDeleteConfirmId(null);
  const toggleExpanded = (documentId: string) =>
    setExpandedId(expandedId === documentId ? null : documentId);

  if (isLoading) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold gradient-text mb-4">Ski Form Analysis</h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan"></div>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    return (
      <div className="w-full max-w-6xl mx-auto p-4">
        <h2 className="text-2xl font-bold gradient-text mb-4">Ski Form Analysis</h2>
        <div className="glass-dark border-2 border-dashed border-white/20 rounded-2xl p-12 text-center">
          <svg
            className="mx-auto h-12 w-12 text-ice-500 mb-4"
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
          <h3 className="text-lg font-semibold text-white mb-2">No videos or images yet</h3>
          <p className="text-sm text-ice-400">
            Upload a ski video or image to get AI-powered form analysis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto p-4">
      <h2 className="text-2xl font-bold gradient-text mb-4">Ski Form Analysis</h2>

      <div className="space-y-6">
        {documents.map((document) => {
          const mediaSrc = mediaUrls[document.id] || '';
          const isPending = document.status === 'pending';

          return (
            <div
              key={document.id}
              className="glass-dark border border-white/10 rounded-2xl overflow-hidden card-hover"
            >
              {/* Header */}
              <div className="p-4 border-b border-white/10 bg-white/5">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-semibold text-white truncate">
                        {document.filename}
                      </h3>
                      {isPending && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                          Pending
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-sm text-ice-400">
                      <span>{formatFileSize(document.fileSize)}</span>
                      <span>•</span>
                      <span>{formatUploadDate(document.uploadedAt)}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteClick(document.id)}
                    className="ml-4 p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                    aria-label="Delete"
                    title="Delete"
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {!isPending && (
                <div className="p-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Media Preview */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-ice-300 mb-2 uppercase tracking-wider">
                        {isVideo(document.fileType) ? 'Video' : 'Image'}
                      </h4>
                      <div className="bg-black rounded-lg overflow-hidden">
                        {!mediaSrc ? (
                          <div className="flex items-center justify-center h-40">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-neon-cyan" />
                          </div>
                        ) : isVideo(document.fileType) ? (
                          <video controls className="w-full h-auto" src={mediaSrc}>
                            Your browser does not support the video tag.
                          </video>
                        ) : isImage(document.fileType) ? (
                          <img
                            src={mediaSrc}
                            alt={document.filename}
                            className="w-full h-auto"
                            onError={(e) => {
                              e.currentTarget.src =
                                'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="300"%3E%3Crect fill="%23ddd" width="400" height="300"/%3E%3Ctext fill="%23999" x="50%25" y="50%25" text-anchor="middle" dy=".3em"%3EImage not available%3C/text%3E%3C/svg%3E';
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-40 text-white">
                            Unsupported file type
                          </div>
                        )}
                      </div>
                    </div>

                    {/* AI Analysis */}
                    <div className="space-y-2">
                      {expandedId === document.id ? (
                        <>
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-sm font-medium text-ice-300 uppercase tracking-wider">
                              AI Form Analysis
                            </h4>
                            <button
                              onClick={() => toggleExpanded(document.id)}
                              className="flex items-center gap-1 text-neon-cyan hover:text-ice-200 text-sm font-medium transition-colors"
                            >
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                              </svg>
                              Collapse
                            </button>
                          </div>
                          <div className="glass border border-white/10 rounded-xl p-4 overflow-y-auto">
                            {document.analysis ? (
                              <div className="prose prose-sm max-w-none">
                                <ReactMarkdown
                                  components={{
                                    h1: ({ node, ...props }) => <h1 className="text-xl font-bold text-white mt-4 mb-2" {...props} />,
                                    h2: ({ node, ...props }) => <h2 className="text-lg font-bold text-white mt-3 mb-2" {...props} />,
                                    h3: ({ node, ...props }) => <h3 className="text-base font-semibold text-ice-100 mt-2 mb-1" {...props} />,
                                    ul: ({ node, ...props }) => <ul className="list-disc list-inside space-y-1 my-2" {...props} />,
                                    ol: ({ node, ...props }) => <ol className="list-decimal list-inside space-y-1 my-2" {...props} />,
                                    li: ({ node, ...props }) => <li className="text-ice-200" {...props} />,
                                    p: ({ node, ...props }) => <p className="text-ice-200 my-2" {...props} />,
                                    strong: ({ node, ...props }) => <strong className="font-semibold text-white" {...props} />,
                                    em: ({ node, ...props }) => <em className="italic text-ice-300" {...props} />,
                                  }}
                                >
                                  {document.analysis}
                                </ReactMarkdown>
                              </div>
                            ) : (
                              <div className="flex items-start space-x-2 text-amber-300">
                                <svg className="h-5 w-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                  <path
                                    fillRule="evenodd"
                                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                                <p className="text-sm">
                                  Analysis is not available for this file.
                                </p>
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <button
                          onClick={() => toggleExpanded(document.id)}
                          className="w-full flex items-center justify-between p-3 glass border border-white/10 rounded-xl hover:bg-white/10 transition-all"
                        >
                          <div className="flex items-center gap-2">
                            <svg className="h-5 w-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm font-medium text-ice-200">AI Form Analysis</span>
                            {document.analysis && (
                              <span className="text-xs text-ice-400">• Click to view detailed feedback</span>
                            )}
                          </div>
                          <svg className="h-5 w-5 text-neon-cyan" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
