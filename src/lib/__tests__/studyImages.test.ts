import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  MAX_STUDY_IMAGE_INPUT_BYTES, fitStudyImageDimensions, getStudyImageName,
  getStudyImageRasterType, getStudyImageValidationError, listStudyImages, prepareStudyImage,
  saveStudyImage, deleteStudyImage,
} from '../studyImages';

afterEach(() => vi.unstubAllGlobals());

describe('study image preparation', () => {
  it('accepts normal phone images and checks empty, oversized and unsupported files before decoding', () => {
    expect(getStudyImageValidationError({ name: 'notes.JPG', type: 'image/jpeg', size: 1024 })).toBeNull();
    expect(getStudyImageValidationError({ name: 'notes.PNG', type: '', size: MAX_STUDY_IMAGE_INPUT_BYTES })).toBeNull();
    expect(getStudyImageValidationError({ name: 'empty.png', type: 'image/png', size: 0 })).toContain('empty');
    expect(getStudyImageValidationError({ name: 'large.jpg', type: 'image/jpeg', size: MAX_STUDY_IMAGE_INPUT_BYTES + 1 })).toContain('20 MB');
    for (const file of [{ name: 'notes.heic', type: 'image/heic' }, { name: 'notes.HEIF', type: '' }, { name: 'notes.svg', type: 'image/png' }, { name: 'notes.png', type: 'image/svg+xml' }, { name: 'notes.txt', type: '' }]) {
      expect(getStudyImageValidationError({ ...file, size: 1024 })).toContain('JPG or PNG');
    }
  });

  it('recognizes real raster signatures and rejects renamed SVG/HEIC content', () => {
    expect(getStudyImageRasterType(new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]))).toBe('image/png');
    expect(getStudyImageRasterType(new Uint8Array([255, 216, 255, 224]))).toBe('image/jpeg');
    const bytes = (value: string) => new Uint8Array([...value].map(character => character.charCodeAt(0)));
    expect(getStudyImageRasterType(bytes('RIFF1234WEBP'))).toBe('image/webp');
    expect(getStudyImageRasterType(bytes('GIF89a'))).toBe('image/gif');
    expect(getStudyImageRasterType(bytes('\0\0\0 ftypavif'))).toBe('image/avif');
    expect(getStudyImageRasterType(bytes('<svg xmlns="http://www.w3.org/2000/svg">'))).toBeNull();
    expect(getStudyImageRasterType(bytes('\0\0\0 ftypheic'))).toBeNull();
  });

  it('fits portrait and landscape photos without upscaling or changing their aspect ratio', () => {
    expect(fitStudyImageDimensions(4032, 3024)).toEqual({ width: 2000, height: 1500 });
    expect(fitStudyImageDimensions(3024, 4032)).toEqual({ width: 1500, height: 2000 });
    expect(fitStudyImageDimensions(300, 500)).toEqual({ width: 300, height: 500 });
    expect(fitStudyImageDimensions(100, 20_000)).toEqual({ width: 10, height: 2000 });
    expect(() => fitStudyImageDimensions(0, 10)).toThrow('JPG or PNG');
    expect(() => fitStudyImageDimensions(Infinity, 10)).toThrow('JPG or PNG');
  });

  it('keeps useful names while removing paths, control characters and stale extensions', () => {
    expect(getStudyImageName('C:\\photos\\revision.png', 'image/jpeg')).toBe('revision.jpg');
    expect(getStudyImageName('/private/notes/circuits.JPG', 'image/png')).toBe('circuits.png');
    expect(getStudyImageName('notes\n2026?.heic', 'image/jpeg')).toBe('notes-2026-.jpg');
    expect(getStudyImageName('', 'image/png')).toBe('study-image.png');
    expect(getStudyImageName('a'.repeat(250) + '.png', 'image/png').length).toBe(124);
  });

  it('reports unsupported HEIC before opening browser image or canvas resources', async () => {
    await expect(prepareStudyImage(new File(['not a jpeg'], 'phone.HEIC', { type: 'image/heic' }))).rejects.toThrow('JPG or PNG');
  });
});

describe('study image persistence failures', () => {
  it('reports unavailable storage rather than pretending an image was saved or removed', async () => {
    vi.stubGlobal('indexedDB', undefined);
    await expect(listStudyImages('guest', 'EC-201')).rejects.toThrow('Image storage is unavailable');
    await expect(saveStudyImage({ id: 'photo-1', scope: 'guest', subjectCode: 'EC-201', name: 'notes.png', blob: new Blob(['image'], { type: 'image/png' }), createdAt: new Date().toISOString() })).rejects.toThrow('Image storage is unavailable');
    await expect(deleteStudyImage('photo-1', 'guest')).rejects.toThrow('Image storage is unavailable');
  });

  it('rejects invalid records and empty owner scopes before accessing storage', async () => {
    await expect(listStudyImages('', 'EC-201')).rejects.toThrow('Choose a subject');
    await expect(deleteStudyImage('photo-1', '')).rejects.toThrow('could not be removed');
    await expect(saveStudyImage({ id: 'photo-1', scope: 'guest', subjectCode: 'EC-201', name: 'notes.svg', blob: new Blob(['<svg>'], { type: 'image/svg+xml' }), createdAt: new Date().toISOString() })).rejects.toThrow('could not be saved');
  });
});
