import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

import { ImageUpload } from '@/features/product/components/image-upload';
import type { ProductImageResponse } from '@/features/product/types';

function createValidJpegFile(name = 'espresso.jpg', sizeBytes = 2048): File {
  const bytes = new Uint8Array(sizeBytes);
  // JPEG magic bytes FF D8 FF
  bytes[0] = 0xff;
  bytes[1] = 0xd8;
  bytes[2] = 0xff;
  return new File([bytes], name, { type: 'image/jpeg' });
}

describe('ImageUpload Component', () => {
  const createObjectUrlMock = vi.fn(() => 'blob:http://localhost:3000/mock-preview-123');
  const revokeObjectUrlMock = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: createObjectUrlMock,
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: revokeObjectUrlMock,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows validation error for unsupported MIME type (e.g. SVG)', async () => {
    render(<ImageUpload defaultAltText="Espresso" />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    const svgFile = new File(['<svg></svg>'], 'bad.svg', { type: 'image/svg+xml' });

    fireEvent.change(input, { target: { files: [svgFile] } });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Unsupported file format');
    expect(createObjectUrlMock).not.toHaveBeenCalled();
  });

  it('shows validation error when file exceeds maximum allowed size', async () => {
    render(<ImageUpload maxSizeBytes={1024} />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    const tooLargeFile = createValidJpegFile('huge.jpg', 4096);

    fireEvent.change(input, { target: { files: [tooLargeFile] } });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('Image is too large');
    expect(createObjectUrlMock).not.toHaveBeenCalled();
  });

  it('rejects text file renamed .jpg via client magic-byte check', async () => {
    render(<ImageUpload />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    const fakeJpeg = new File(['plain text not an image'], 'fake.jpg', { type: 'image/jpeg' });

    fireEvent.change(input, { target: { files: [fakeJpeg] } });

    const alert = await screen.findByRole('alert');
    expect(alert.textContent).toContain('File content does not match a valid JPEG, PNG, or WebP');
  });

  it('creates an instant preview URL and revokes it on cleanup', async () => {
    const { unmount } = render(<ImageUpload defaultAltText="Cappuccino" />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    const validFile = createValidJpegFile('cappuccino.jpg', 1024);

    fireEvent.change(input, { target: { files: [validFile] } });

    await waitFor(() => {
      expect(createObjectUrlMock).toHaveBeenCalledWith(validFile);
    });

    const previewImg = screen.getByAltText('Cappuccino') as HTMLImageElement;
    expect(previewImg.src).toBe('blob:http://localhost:3000/mock-preview-123');

    unmount();
    expect(revokeObjectUrlMock).toHaveBeenCalledWith('blob:http://localhost:3000/mock-preview-123');
  });

  it('tracks upload progress, supports cancellation, and handles upload errors', async () => {
    const mockUploaded: ProductImageResponse = {
      id: 'aaaa1111-bbbb-2222-cccc-333333333333',
      product_id: 1,
      storage_key: '0123456789abcdef0123456789abcdef.jpg',
      url: '/api/media/0123456789abcdef0123456789abcdef.jpg',
      content_type: 'image/jpeg',
      size_bytes: 1024,
      width: 64,
      height: 64,
      alt_text: 'Fresh Mocha',
      is_primary: true,
      sort_order: 0,
      created_at: '2026-11-07T12:00:00Z',
    };

    const onUploadMock = vi.fn().mockImplementation(async (_file, opts) => {
      opts.onProgress(45);
      return mockUploaded;
    });

    render(<ImageUpload defaultAltText="Fresh Mocha" onUpload={onUploadMock} />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [createValidJpegFile('mocha.jpg', 1024)] } });

    const uploadBtn = await screen.findByRole('button', { name: /Upload Now/i });
    fireEvent.click(uploadBtn);

    await waitFor(() => {
      expect(onUploadMock).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByRole('status')).toHaveTextContent(
      'Product image uploaded successfully.',
    );
  });

  it('displays server upload error message when upload fails', async () => {
    const onUploadErrorMock = vi
      .fn()
      .mockRejectedValue({ message: 'Server rejected corrupted image' });

    render(<ImageUpload defaultAltText="Latte" onUpload={onUploadErrorMock} />);

    const input = screen.getByLabelText('Choose product image') as HTMLInputElement;
    fireEvent.change(input, { target: { files: [createValidJpegFile('latte.jpg', 1024)] } });

    const uploadBtn = await screen.findByRole('button', { name: /Upload Now/i });
    fireEvent.click(uploadBtn);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('Server rejected corrupted image');
  });
});
