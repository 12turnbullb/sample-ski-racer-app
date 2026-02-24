/**
 * DocumentList Component
 * 
 * Displays a list of uploaded ski analysis documents with metadata and actions.
 * Provides download and delete functionality with confirmation dialogs.
 * 
 * Requirements: 10.2, 10.5
 * 
 * Features:
 * - Display document list in clean card layout
 * - Show document metadata (filename, file size, upload date, file type)
 * - File type icons based on document type
 * - Download and delete buttons for each document
 * - Confirmation dialog before delete
 * - Empty state when no documents exist
 * - Loading state while fetching documents
 * - Responsive design with Tailwind CSS
 * - Formatted file sizes (e.g., "1.5 MB")
 * - Formatted upload dates in readable format
 */

import { useState } from 'react';
import type { Document } from '../types';
import ConfirmDialog from './ConfirmDialog';

// ============================================================================
// Constants
// ============================================================================

/**
 * File type categories for icon display.
 */
const FILE_TYPE_CATEGORIES = {
  PDF: ['application/pdf'],
  WORD: [
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  IMAGE: ['image/jpeg', 'image/jpg', 'image/png'],
} as const;

// ============================================================================
// Component Props
// ============================================================================

interface DocumentListProps {
  /**
   * Array of documents to display.
   */
  documents: Document[];

  /**
   * Callback function invoked when delete is confirmed.
   * Receives the document ID to delete.
   */
  onDelete?: (documentId: string) => void;

  /**
   * Loading state while fetching documents.
   */
  isLoading?: boolean;
}

// ============================================================================
// Component
// ============================================================================

/**
 * DocumentList component for displaying uploaded documents.
 * 
 * @param props - Component props
 * @returns React component
 */
export default function DocumentList({
  documents,
  onDelete,
  isLoading = false,
}: DocumentListProps) {
  // State for delete confirmation dialog
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // ============================================================================
  // Utility Functions
  // ============================================================================

  /**
   * Format file size for display.
   * 
   * @param bytes - File size in bytes
   * @returns Formatted file size string (e.g., "1.5 MB")
   */
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) {
      return `${bytes} B`;
    } else if (bytes < 1024 * 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    } else {
      return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    }
  };

  /**
   * Format upload date for display.
   * 
   * @param dateString - ISO date string
   * @returns Formatted date string (e.g., "Jan 15, 2024 at 3:45 PM")
   */
  const formatUploadDate = (dateString: string): string => {
    const date = new Date(dateString);
    
    // Format date as "Jan 15, 2024 at 3:45 PM"
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

  /**
   * Get file type category for icon display.
   * 
   * @param fileType - MIME type of the file
   * @returns File type category ('PDF', 'WORD', 'IMAGE', or 'UNKNOWN')
   */
  const getFileTypeCategory = (fileType: string): string => {
    if (FILE_TYPE_CATEGORIES.PDF.includes(fileType as any)) {
      return 'PDF';
    } else if (FILE_TYPE_CATEGORIES.WORD.includes(fileType as any)) {
      return 'WORD';
    } else if (FILE_TYPE_CATEGORIES.IMAGE.includes(fileType as any)) {
      return 'IMAGE';
    }
    return 'UNKNOWN';
  };

  /**
   * Get file extension from filename.
   * 
   * @param filename - Name of the file
   * @returns File extension in uppercase (e.g., "PDF")
   */
  const getFileExtension = (filename: string): string => {
    const parts = filename.split('.');
    if (parts.length > 1) {
      return parts[parts.length - 1].toUpperCase();
    }
    return '';
  };

  // ============================================================================
  // Event Handlers
  // ============================================================================

  /**
   * Handle download button click.
   * 
   * @param document - Document to download
   */
  const handleDownload = (document: Document) => {
    // Create a temporary link element to trigger download
    const link = window.document.createElement('a');
    link.href = `http://localhost:8000${document.filePath}`;
    link.download = document.filename;
    link.click();
  };

  /**
   * Handle delete button click - show confirmation dialog.
   * 
   * @param documentId - ID of document to delete
   */
  const handleDeleteClick = (documentId: string) => {
    setDeleteConfirmId(documentId);
  };

  /**
   * Handle delete confirmation.
   */
  const handleDeleteConfirm = () => {
    if (deleteConfirmId && onDelete) {
      onDelete(deleteConfirmId);
    }
    setDeleteConfirmId(null);
  };

  /**
   * Handle delete cancellation.
   */
  const handleDeleteCancel = () => {
    setDeleteConfirmId(null);
  };

  // ============================================================================
  // Icon Components
  // ============================================================================

  /**
   * Render file type icon based on file type category.
   * 
   * @param fileType - MIME type of the file
   * @returns SVG icon element
   */
  const renderFileIcon = (fileType: string) => {
    const category = getFileTypeCategory(fileType);

    switch (category) {
      case 'PDF':
        return (
          <svg
            className="h-10 w-10 text-red-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );

      case 'WORD':
        return (
          <svg
            className="h-10 w-10 text-blue-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z"
              clipRule="evenodd"
            />
          </svg>
        );

      case 'IMAGE':
        return (
          <svg
            className="h-10 w-10 text-green-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
              clipRule="evenodd"
            />
          </svg>
        );

      default:
        return (
          <svg
            className="h-10 w-10 text-gray-500"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"
              clipRule="evenodd"
            />
          </svg>
        );
    }
  };

  // ============================================================================
  // Render
  // ============================================================================

  // Loading state
  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          My Documents
        </h2>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  // Empty state
  if (documents.length === 0) {
    return (
      <div className="w-full max-w-4xl mx-auto p-4">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">
          My Documents
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
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No documents yet
          </h3>
          <p className="text-sm text-gray-500">
            Upload your first ski analysis document to get started.
          </p>
        </div>
      </div>
    );
  }

  // Document list
  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-bold text-gray-800 mb-4">
        My Documents
      </h2>

      {/* Document cards */}
      <div className="space-y-3">
        {documents.map((document) => (
          <div
            key={document.id}
            className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow duration-200"
          >
            <div className="flex items-start space-x-4">
              {/* File icon */}
              <div className="flex-shrink-0 mt-1">
                {renderFileIcon(document.fileType)}
              </div>

              {/* Document info */}
              <div className="flex-1 min-w-0">
                {/* Filename */}
                <h3 className="text-base font-semibold text-gray-900 truncate mb-1">
                  {document.filename}
                </h3>

                {/* Metadata */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                  {/* File type */}
                  <div className="flex items-center">
                    <span className="font-medium">
                      {getFileExtension(document.filename) || getFileTypeCategory(document.fileType)}
                    </span>
                  </div>

                  {/* File size */}
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{formatFileSize(document.fileSize)}</span>
                  </div>

                  {/* Upload date */}
                  <div className="flex items-center">
                    <svg
                      className="h-4 w-4 mr-1"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>{formatUploadDate(document.uploadedAt)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex-shrink-0 flex items-center space-x-2">
                {/* Download button */}
                <button
                  onClick={() => handleDownload(document)}
                  className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                  aria-label="Download document"
                  title="Download"
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
                      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                    />
                  </svg>
                </button>

                {/* Delete button */}
                <button
                  onClick={() => handleDeleteClick(document.id)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200"
                  aria-label="Delete document"
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
          </div>
        ))}
      </div>

      {/* Delete confirmation dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmId !== null}
        title="Delete Document"
        message="Are you sure you want to delete this document? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
}
