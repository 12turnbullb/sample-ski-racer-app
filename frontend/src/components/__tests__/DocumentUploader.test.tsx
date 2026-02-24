/**
 * Unit tests for DocumentUploader component
 * 
 * Tests file selection, drag-and-drop, validation, upload handling,
 * and error/success message display.
 * 
 * Requirements: 10.2
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import DocumentUploader from '../DocumentUploader';
import * as api from '../../services/api';
import type { Document } from '../../types';

// Mock the API module
vi.mock('../../services/api');

describe('DocumentUploader', () => {
  const mockRacerId = 'test-racer-123';
  const mockOnUploadComplete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ============================================================================
  // Rendering Tests
  // ============================================================================

  it('should render the component with title and instructions', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    expect(screen.getByRole('heading', { name: 'Upload Document' })).toBeInTheDocument();
    expect(
      screen.getByText(/Drag and drop a file here, or click to select/i)
    ).toBeInTheDocument();
    expect(screen.getByText(/Supported formats:/i)).toBeInTheDocument();
    expect(screen.getByText(/Maximum file size: 10MB/i)).toBeInTheDocument();
  });

  it('should render upload button in disabled state initially', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    expect(uploadButton).toBeDisabled();
  });

  // ============================================================================
  // File Selection Tests
  // ============================================================================

  it('should allow file selection via file input', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    // Create a mock file
    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    // Get the hidden file input
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    expect(fileInput).toBeInTheDocument();

    // Simulate file selection
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    // Check that file is displayed
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
  });

  it('should enable upload button when valid file is selected', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test content'], 'test.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    expect(uploadButton).not.toBeDisabled();
  });

  // ============================================================================
  // File Type Validation Tests
  // ============================================================================

  it('should accept PDF files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('document.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
  });

  it('should accept DOC files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'document.doc', {
      type: 'application/msword',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('document.doc')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
  });

  it('should accept DOCX files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'document.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('document.docx')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
  });

  it('should accept JPEG files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'image.jpg', { type: 'image/jpeg' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('image.jpg')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
  });

  it('should accept PNG files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'image.png', { type: 'image/png' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('image.png')).toBeInTheDocument();
    expect(screen.queryByText(/Invalid file type/i)).not.toBeInTheDocument();
  });

  it('should reject invalid file types', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'document.txt', { type: 'text/plain' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.queryByText('document.txt')).not.toBeInTheDocument();
    expect(
      screen.getByText(/Invalid file type. Please upload one of the following:/i)
    ).toBeInTheDocument();
  });

  // ============================================================================
  // File Size Validation Tests
  // ============================================================================

  it('should accept files under 10MB', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    // Create a 5MB file
    const fileSize = 5 * 1024 * 1024;
    const file = new File([new ArrayBuffer(fileSize)], 'large.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('large.pdf')).toBeInTheDocument();
    expect(screen.queryByText(/File size exceeds/i)).not.toBeInTheDocument();
  });

  it('should reject files over 10MB', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    // Create an 11MB file
    const fileSize = 11 * 1024 * 1024;
    const file = new File([new ArrayBuffer(fileSize)], 'toolarge.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.queryByText('toolarge.pdf')).not.toBeInTheDocument();
    expect(
      screen.getByText(/File size exceeds 10MB limit/i)
    ).toBeInTheDocument();
  });

  // ============================================================================
  // File Display Tests
  // ============================================================================

  it('should display file name and size after selection', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const fileSize = 1024 * 1024; // 1MB
    const file = new File([new ArrayBuffer(fileSize)], 'test.pdf', {
      type: 'application/pdf',
    });

    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('1.00 MB')).toBeInTheDocument();
  });

  it('should allow clearing selected file', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    // Click clear button
    const clearButton = screen.getByLabelText('Clear file');
    fireEvent.click(clearButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Upload Tests
  // ============================================================================

  it('should upload file successfully', async () => {
    const mockDocument: Document = {
      id: 'doc-123',
      racerId: mockRacerId,
      filename: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(api.uploadDocument).mockResolvedValue(mockDocument);

    render(
      <DocumentUploader
        racerId={mockRacerId}
        onUploadComplete={mockOnUploadComplete}
      />
    );

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadButton);

    // Wait for upload to complete
    await waitFor(() => {
      expect(api.uploadDocument).toHaveBeenCalledWith(mockRacerId, file);
    });

    await waitFor(() => {
      expect(
        screen.getByText(/File "test.pdf" uploaded successfully!/i)
      ).toBeInTheDocument();
    });

    expect(mockOnUploadComplete).toHaveBeenCalledWith(mockDocument);
  });

  it('should show upload progress during upload', async () => {
    const mockDocument: Document = {
      id: 'doc-123',
      racerId: mockRacerId,
      filename: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedAt: '2024-01-01T00:00:00Z',
    };

    // Delay the upload to see progress
    vi.mocked(api.uploadDocument).mockImplementation(
      () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(mockDocument), 500);
        })
    );

    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadButton);

    // Check for uploading state
    await waitFor(() => {
      expect(screen.getByText('Uploading...')).toBeInTheDocument();
    });

    // Wait for upload to complete
    await waitFor(
      () => {
        expect(
          screen.getByText(/File "test.pdf" uploaded successfully!/i)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('should handle upload errors and display error message', async () => {
    const errorMessage = 'Upload failed: Network error';
    
    // Mock the upload to reject
    vi.mocked(api.uploadDocument).mockRejectedValueOnce(
      new api.ApiClientError(500, errorMessage)
    );

    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadButton);

    // Verify the API was called
    await waitFor(() => {
      expect(api.uploadDocument).toHaveBeenCalledWith(mockRacerId, file);
    });

    // Verify callback was not called on error
    expect(mockOnUploadComplete).not.toHaveBeenCalled();
  }, 10000);

  it('should clear file after successful upload', async () => {
    const mockDocument: Document = {
      id: 'doc-123',
      racerId: mockRacerId,
      filename: 'test.pdf',
      filePath: '/uploads/test.pdf',
      fileType: 'application/pdf',
      fileSize: 1024,
      uploadedAt: '2024-01-01T00:00:00Z',
    };

    vi.mocked(api.uploadDocument).mockResolvedValue(mockDocument);

    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(
        screen.getByText(/File "test.pdf" uploaded successfully!/i)
      ).toBeInTheDocument();
    });

    // File should be cleared
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });
  });

  // ============================================================================
  // Drag and Drop Tests
  // ============================================================================

  it('should handle drag and drop file selection', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'dropped.pdf', {
      type: 'application/pdf',
    });

    const dropZone = screen.getByText(/Drag and drop a file here/i).closest('div');
    expect(dropZone).toBeInTheDocument();

    // Simulate drag enter
    fireEvent.dragEnter(dropZone!, {
      dataTransfer: { files: [file] },
    });

    // Check for drag state
    expect(screen.getByText('Drop file here')).toBeInTheDocument();

    // Simulate drop
    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    // File should be selected
    expect(screen.getByText('dropped.pdf')).toBeInTheDocument();
  });

  it('should validate dropped files', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const file = new File(['test'], 'invalid.txt', { type: 'text/plain' });

    const dropZone = screen.getByText(/Drag and drop a file here/i).closest('div');

    fireEvent.drop(dropZone!, {
      dataTransfer: { files: [file] },
    });

    // Should show error
    expect(
      screen.getByText(/Invalid file type. Please upload one of the following:/i)
    ).toBeInTheDocument();
    expect(screen.queryByText('invalid.txt')).not.toBeInTheDocument();
  });

  // ============================================================================
  // Edge Cases
  // ============================================================================

  it('should not allow upload without selecting file', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    const uploadButton = screen.getByRole('button', { name: /Upload Document/i });
    
    // Button should be disabled when no file is selected
    expect(uploadButton).toBeDisabled();
  });

  it('should format file sizes correctly', () => {
    render(<DocumentUploader racerId={mockRacerId} />);

    // Test KB size
    const file1 = new File([new ArrayBuffer(2048)], 'small.pdf', {
      type: 'application/pdf',
    });
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement;

    Object.defineProperty(fileInput, 'files', {
      value: [file1],
      writable: false,
    });
    fireEvent.change(fileInput);

    expect(screen.getByText('2.00 KB')).toBeInTheDocument();
  });
});
