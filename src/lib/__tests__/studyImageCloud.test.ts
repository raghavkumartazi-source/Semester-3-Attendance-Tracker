import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  decodeStudyImageName, deleteCloudStudyImage, encodeStudyImageName, getCloudStudyImagePrefix,
  isCloudStudyImagePath, isValidCloudStudyImageScope, listCloudStudyImages, MAX_STUDY_IMAGES,
  STUDY_IMAGE_BUCKET, uploadCloudStudyImage,
} from '../studyImageCloud';

const mocks = vi.hoisted(() => ({ list: vi.fn(), createSignedUrls: vi.fn(), upload: vi.fn(), remove: vi.fn(), from: vi.fn() }));
vi.mock('../supabase', () => ({ supabase: { storage: { from: mocks.from } } }));

const USER = '11111111-1111-4111-8111-111111111111';
const OTHER_USER = '22222222-2222-4222-8222-222222222222';
const IMAGE = '33333333-3333-4333-8333-333333333333';
const SUBJECT = 'EC-201';
const CREATED = '2026-11-04T00:00:00.000Z';
const objectName = (name = 'notes.png') => `${IMAGE}__${encodeStudyImageName(name)}`;
const path = (name = 'notes.png') => `${USER}/${SUBJECT}/${objectName(name)}`;

beforeEach(() => {
  vi.resetAllMocks();
  mocks.from.mockReturnValue(mocks);
  mocks.list.mockResolvedValue({ data: [], error: null });
  mocks.upload.mockResolvedValue({ data: { path: path() }, error: null });
  mocks.remove.mockResolvedValue({ data: [], error: null });
});

describe('cloud study image names and ownership', () => {
  it('round-trips Unicode names into one path-safe object segment', () => {
    for (const name of ['SSED revision.png', '半导体 notes.png', 'दिवाली revision.jpg', 'Circuits & signals (2).jpg']) {
      const encoded = encodeStudyImageName(name);
      expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
      expect(decodeStudyImageName(encoded)).toBe(name);
    }
    for (const encoded of ['', 'bad/path', 'bad%2Fpath', 'bad==', '___']) expect(decodeStudyImageName(encoded)).toBeNull();
    expect(() => encodeStudyImageName('../secret.png')).toThrow('valid filename');
    expect(() => encodeStudyImageName('line\nbreak.png')).toThrow('valid filename');
  });

  it('requires an account UUID and an existing, safe subject code', () => {
    expect(isValidCloudStudyImageScope(USER, SUBJECT)).toBe(true);
    expect(getCloudStudyImagePrefix(USER, SUBJECT)).toBe(`${USER}/${SUBJECT}`);
    for (const [user, subject] of [['guest', SUBJECT], [USER + '/other', SUBJECT], [USER, '../EC-201'], [USER, 'EC-201/other'], [USER, 'UNKNOWN']]) {
      expect(isValidCloudStudyImageScope(user, subject)).toBe(false);
      expect(() => getCloudStudyImagePrefix(user, subject)).toThrow('Sign in');
    }
  });

  it('rejects cross-account, cross-subject, nested, traversal and malformed object paths', async () => {
    expect(isCloudStudyImagePath(USER, SUBJECT, path())).toBe(true);
    for (const invalid of [path().replace(USER, OTHER_USER), path().replace(SUBJECT, 'EC-202'), `${USER}/${SUBJECT}/../${objectName()}`, `${path()}/nested`, `${USER}/${SUBJECT}/${IMAGE}__bad%2Fname`, 'https://example.com/photo.png']) {
      expect(isCloudStudyImagePath(USER, SUBJECT, invalid)).toBe(false);
      await expect(deleteCloudStudyImage(USER, SUBJECT, invalid)).rejects.toThrow('does not belong');
    }
    expect(mocks.remove).not.toHaveBeenCalled();
    expect(mocks.from).not.toHaveBeenCalled();
  });
});

describe('cloud study image operations', () => {
  it('lists only owned image objects and signs their full paths for one hour', async () => {
    mocks.list.mockResolvedValue({ data: [{ id: IMAGE, name: objectName(), created_at: CREATED }, { id: null, name: 'nested-folder', created_at: null }, { id: 'foreign', name: `${OTHER_USER}/${objectName()}`, created_at: CREATED }], error: null });
    mocks.createSignedUrls.mockResolvedValue({ data: [{ path: path(), signedUrl: 'https://storage.example.com/signed-photo', error: null }], error: null });
    await expect(listCloudStudyImages(USER, SUBJECT)).resolves.toEqual([{ id: path(), path: path(), name: 'notes.png', createdAt: CREATED, url: 'https://storage.example.com/signed-photo' }]);
    expect(mocks.from).toHaveBeenCalledWith(STUDY_IMAGE_BUCKET);
    expect(mocks.list).toHaveBeenCalledWith(`${USER}/${SUBJECT}`, { limit: MAX_STUDY_IMAGES, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
    expect(mocks.createSignedUrls).toHaveBeenCalledWith([path()], 3600);
  });

  it('keeps an empty subject empty without asking for signed URLs', async () => {
    await expect(listCloudStudyImages(USER, SUBJECT)).resolves.toEqual([]);
    expect(mocks.createSignedUrls).not.toHaveBeenCalled();
  });

  it('surfaces list/signature failures instead of returning an incomplete gallery', async () => {
    mocks.list.mockResolvedValueOnce({ data: null, error: { message: 'offline' } });
    await expect(listCloudStudyImages(USER, SUBJECT)).rejects.toThrow('Could not load');
    mocks.list.mockResolvedValue({ data: [{ id: IMAGE, name: objectName(), created_at: CREATED }], error: null });
    for (const signatures of [
      { data: null, error: { message: 'signing failed' } },
      { data: [], error: null },
      { data: [{ path: path(), signedUrl: null, error: 'missing object' }], error: null },
      { data: [{ path: path().replace(USER, OTHER_USER), signedUrl: 'https://storage.example.com/foreign', error: null }], error: null },
      { data: [{ path: path(), signedUrl: 'javascript:alert(1)', error: null }], error: null },
    ]) {
      mocks.createSignedUrls.mockResolvedValueOnce(signatures);
      await expect(listCloudStudyImages(USER, SUBJECT)).rejects.toThrow('Could not open');
    }
  });

  it('uploads a new UUID object with the prepared MIME type and never overwrites', async () => {
    const blob = new Blob(['image'], { type: 'image/png' });
    await uploadCloudStudyImage(USER, SUBJECT, { blob, name: 'Circuits 图.png' });
    const [uploadPath, body, options] = mocks.upload.mock.calls[0];
    expect(isCloudStudyImagePath(USER, SUBJECT, uploadPath)).toBe(true);
    expect(decodeStudyImageName(uploadPath.split('__')[1])).toBe('Circuits 图.png');
    expect(body).toBe(blob);
    expect(options).toEqual({ contentType: 'image/png', upsert: false });
  });

  it('surfaces upload/delete errors and validates blobs before sending them', async () => {
    mocks.upload.mockResolvedValueOnce({ data: null, error: { message: 'offline' } });
    await expect(uploadCloudStudyImage(USER, SUBJECT, { blob: new Blob(['image'], { type: 'image/jpeg' }), name: 'notes.jpg' })).rejects.toThrow('Could not upload');
    await expect(uploadCloudStudyImage(USER, SUBJECT, { blob: new Blob(['<svg>'], { type: 'image/svg+xml' }), name: 'notes.svg' })).rejects.toThrow('prepared JPG or PNG');
    mocks.remove.mockResolvedValueOnce({ data: null, error: { message: 'offline' } });
    await expect(deleteCloudStudyImage(USER, SUBJECT, path())).rejects.toThrow('Could not delete');
    expect(mocks.remove).toHaveBeenCalledWith([path()]);
    mocks.remove.mockResolvedValueOnce({ data: null, error: { statusCode: '403' } });
    await expect(deleteCloudStudyImage(USER, SUBJECT, path())).rejects.toThrow('Sign in again');
  });
});
