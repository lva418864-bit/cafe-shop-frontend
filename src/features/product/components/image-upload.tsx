'use client';

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from 'react';
import { CheckCircle2, ImagePlus, RefreshCw, Trash2, UploadCloud, XCircle } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { ProductImageResponse } from '@/features/product/types';
import { resolveProductImageUrl } from '@/utils/resolveImageUrl';

export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5 MB
export const ALLOWED_IMAGE_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const;

export interface UploadHandlerOptions {
  altText: string;
  onProgress: (percent: number) => void;
  signal: AbortSignal;
}

export interface StagedImageSelection {
  file: File | null;
  altText: string;
}

export interface ImageUploadProps {
  /** Existing server-stored product image (used in edit mode). */
  existingImage?: ProductImageResponse | null;
  /** Default alt text fallback (e.g. product name). */
  defaultAltText?: string;
  /** Maximum allowed file size in bytes (defaults to 5 MB). */
  maxSizeBytes?: number;
  /** Allowed MIME types (defaults to JPEG, PNG, WebP). */
  allowedTypes?: readonly string[];
  /**
   * Optional direct upload handler (used when productId exists or in standalone upload mode).
   * When provided, selecting a file enables immediate upload with progress and cancel support.
   */
  onUpload?: (file: File, options: UploadHandlerOptions) => Promise<ProductImageResponse>;
  /** Optional handler to update existing image alt text on the server. */
  onUpdateAltText?: (imageId: string, altText: string) => Promise<ProductImageResponse>;
  /** Optional handler to delete the existing server image. */
  onDelete?: (imageId: string) => Promise<void>;
  /**
   * Callback fired whenever the staged file or alt text changes (used on the Create Product form
   * before a product ID exists).
   */
  onPendingChange?: (selection: StagedImageSelection) => void;
  /** External upload progress (0-100) when parent form drives the upload on submit. */
  externalProgress?: number | null;
  /** External cancel callback when parent form drives the upload on submit. */
  onExternalCancel?: () => void;
}

async function hasValidImageMagicBytes(file: File): Promise<boolean> {
  try {
    if (typeof file.slice !== 'function') {
      return true;
    }
    const slice = file.slice(0, 12);
    if (typeof slice.arrayBuffer !== 'function') {
      return true;
    }
    const buffer = await slice.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    if (bytes.length === 0) {
      return false;
    }
    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return true;
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    ) {
      return true;
    }
    // WebP: RIFF....WEBP
    if (
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50
    ) {
      return true;
    }
    return false;
  } catch {
    return true;
  }
}

export function ImageUpload({
  existingImage = null,
  defaultAltText = '',
  maxSizeBytes = DEFAULT_MAX_UPLOAD_BYTES,
  allowedTypes = ALLOWED_IMAGE_MIME_TYPES,
  onUpload,
  onUpdateAltText,
  onDelete,
  onPendingChange,
  externalProgress = null,
  onExternalCancel,
}: ImageUploadProps) {
  const inputId = useId();
  const altInputId = useId();
  const helperId = useId();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImage, setCurrentImage] = useState<ProductImageResponse | null>(existingImage);
  const [altText, setAltText] = useState<string>(
    existingImage?.alt_text || defaultAltText || '',
  );
  const [isDragging, setIsDragging] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [ isDeleting, setIsDeleting ] = useState(false);
  const [ isSavingAlt, setIsSavingAlt ] = useState(false);
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    setCurrentImage(existingImage);
    if (existingImage?.alt_text) {
      setAltText(existingImage.alt_text);
    }
  }, [existingImage]);

  // Revoke object URL on change or unmount to prevent browser memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const notifyPending = useCallback(
    (file: File | null, nextAlt: string) => {
      if (onPendingChange) {
        onPendingChange({ file, altText: nextAlt });
      }
    },
    [onPendingChange],
  );

  const clearSelectedFile = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    notifyPending(null, altText);
  }, [previewUrl, altText, notifyPending]);

  const validateAndSelectFile = useCallback(
    async (file: File) => {
      setValidationError(null);
      setUploadError(null);
      setUploadSuccess(null);

      if (!allowedTypes.includes(file.type)) {
        setValidationError(
          'Unsupported file format. Please choose a JPEG, PNG, or WebP image.',
        );
        clearSelectedFile();
        return;
      }

      if (file.size <= 0) {
        setValidationError('Selected image file is empty.');
        clearSelectedFile();
        return;
      }

      if (file.size > maxSizeBytes) {
        const maxMb = (maxSizeBytes / (1024 * 1024)).toFixed(0);
        setValidationError(`Image is too large. Maximum allowed size is ${maxMb} MB.`);
        clearSelectedFile();
        return;
      }

      const magicValid = await hasValidImageMagicBytes(file);
      if (!magicValid) {
        setValidationError(
          'File content does not match a valid JPEG, PNG, or WebP image.',
        );
        clearSelectedFile();
        return;
      }

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      const nextPreviewUrl = URL.createObjectURL(file);
      setPreviewUrl(nextPreviewUrl);
      setSelectedFile(file);
      notifyPending(file, altText);
    },
    [allowedTypes, maxSizeBytes, previewUrl, altText, clearSelectedFile, notifyPending],
  );

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      void validateAndSelectFile(file);
    }
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) {
      void validateAndSelectFile(file);
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleZoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      fileInputRef.current?.click();
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile || !onUpload) {
      return;
    }
    setValidationError(null);
    setUploadError(null);
    setUploadSuccess(null);
    setIsUploading(true);
    setProgress(0);

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const uploaded = await onUpload(selectedFile, {
        altText: altText.trim(),
        onProgress: (pct) => setProgress(pct),
        signal: controller.signal,
      });
      setCurrentImage(uploaded);
      if (uploaded.alt_text) {
        setAltText(uploaded.alt_text);
      }
      clearSelectedFile();
      setProgress(100);
      setUploadSuccess('Product image uploaded successfully.');
    } catch (err: unknown) {
      if (controller.signal.aborted) {
        setUploadError('Upload was cancelled.');
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setUploadError(err.message);
      } else {
        setUploadError('Failed to upload image. Please try again.');
      }
    } finally {
      setIsUploading(false);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (onExternalCancel) {
      onExternalCancel();
    }
  };

  const handleDeleteExisting = async () => {
    if (!currentImage || !onDelete) {
      return;
    }
    setIsDeleting(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      await onDelete(currentImage.id);
      setCurrentImage(null);
      setUploadSuccess('Product image removed.');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setUploadError(err.message);
      } else {
        setUploadError('Could not remove image.');
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSaveAltText = async () => {
    if (!currentImage || !onUpdateAltText) {
      return;
    }
    setIsSavingAlt(true);
    setUploadError(null);
    setUploadSuccess(null);
    try {
      const updated = await onUpdateAltText(currentImage.id, altText.trim());
      setCurrentImage(updated);
      setUploadSuccess('Image alt text updated.');
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setUploadError(err.message);
      } else {
        setUploadError('Could not update image alt text.');
      }
    } finally {
      setIsSavingAlt(false);
    }
  };

  const activeProgress = externalProgress !== null ? externalProgress : isUploading ? progress : null;
  const displayedImageUrl = previewUrl || resolveProductImageUrl(currentImage?.url);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-foreground text-sm font-medium">
          Product Image
        </label>
        <span id={helperId} className="text-foreground/60 text-xs">
          JPEG, PNG, or WebP • Max {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
        </span>
      </div>

      <input
        id={inputId}
        ref={fileInputRef}
        type="file"
        accept={allowedTypes.join(',')}
        aria-describedby={helperId}
        aria-label="Choose product image"
        onChange={handleFileChange}
        className="sr-only"
      />

      <div
        role="button"
        tabIndex={0}
        aria-label="Drop product image here or press Enter to browse"
        aria-describedby={helperId}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={handleZoneKeyDown}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`focus-visible:ring-ring relative flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 text-center transition-colors focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-border hover:border-primary/60 bg-muted/20'
        }`}
      >
        {displayedImageUrl ? (
          <div className="flex flex-col items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={displayedImageUrl}
              alt={altText || defaultAltText || 'Product preview'}
              width={180}
              height={180}
              className="border-border h-36 w-36 rounded-md border object-cover shadow-sm"
            />
            <span className="text-foreground/70 text-xs">
              {selectedFile
                ? `Selected: ${selectedFile.name} (${(selectedFile.size / 1024).toFixed(1)} KB)`
                : 'Current product image (click or drop a new file to replace)'}
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-4">
            <ImagePlus className="text-foreground/50 h-10 w-10" aria-hidden="true" />
            <p className="text-foreground text-sm font-medium">
              Drag &amp; drop an image here, or click to choose a file
            </p>
            <p className="text-foreground/50 text-xs">
              Supports .jpg, .png, and .webp up to {(maxSizeBytes / (1024 * 1024)).toFixed(0)} MB
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Input
          id={altInputId}
          label="Image alt text"
          placeholder="Describe this product image for screen readers"
          value={altText}
          onChange={(e) => {
            const next = e.target.value;
            setAltText(next);
            notifyPending(selectedFile, next);
          }}
        />
      </div>

      {activeProgress !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-foreground/70">Uploading image... {activeProgress}%</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancelUpload}
            >
              Cancel Upload
            </Button>
          </div>
          <div
            role="progressbar"
            aria-label="Image upload progress"
            aria-valuenow={activeProgress}
            aria-valuemin={0}
            aria-valuemax={100}
            className="bg-muted h-2 w-full overflow-hidden rounded-full"
          >
            <div
              className="bg-primary h-full transition-all duration-150"
              style={{ width: `${activeProgress}%` }}
            />
          </div>
        </div>
      )}

      {validationError && (
        <div
          role="alert"
          className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-md px-3 py-2 text-sm"
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{validationError}</span>
        </div>
      )}

      {uploadError && (
        <div
          role="alert"
          className="text-destructive bg-destructive/10 flex items-center gap-2 rounded-md px-3 py-2 text-sm"
        >
          <XCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{uploadError}</span>
        </div>
      )}

      {uploadSuccess && (
        <div
          role="status"
          className="flex items-center gap-2 rounded-md bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading || isDeleting}
        >
          <RefreshCw className="h-3.5 w-3.5" />
          {displayedImageUrl ? 'Replace Image' : 'Choose Image'}
        </Button>

        {selectedFile && onUpload && (
          <Button
            type="button"
            size="sm"
            onClick={() => void handleStartUpload()}
            isLoading={isUploading}
          >
            <UploadCloud className="h-3.5 w-3.5" />
            Upload Now
          </Button>
        )}

        {selectedFile && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSelectedFile}
            disabled={isUploading}
          >
            Clear Selection
          </Button>
        )}

        {!selectedFile && currentImage && onUpdateAltText && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void handleSaveAltText()}
            isLoading={isSavingAlt}
          >
            Save Alt Text
          </Button>
        )}

        {!selectedFile && currentImage && onDelete && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => void handleDeleteExisting()}
            isLoading={isDeleting}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove Image
          </Button>
        )}
      </div>
    </div>
  );
}
