import { SUBJECTS } from './config';
import { MAX_STUDY_IMAGE_BYTES } from './studyImages';
import { supabase } from './supabase';

export interface CloudStudyImage {
  id: string;
  name: string;
  createdAt: string;
  path: string;
  url: string;
}

export const MAX_STUDY_IMAGES = 100;
export const STUDY_IMAGE_BUCKET = 'study-planner-images';
const UUID = '[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}';
const UUID_PATTERN = new RegExp(`^${UUID}$`, 'i');
const OBJECT_NAME = new RegExp(`^${UUID}__([A-Za-z0-9_-]+)$`, 'i');
const VALID_SUBJECTS = new Set(SUBJECTS.map(subject => subject.code));

export function isValidCloudStudyImageScope(userId: string, subjectCode: string): boolean {
  return typeof userId === 'string' && UUID_PATTERN.test(userId) && typeof subjectCode === 'string' && /^[A-Z0-9][A-Z0-9-]{0,39}$/.test(subjectCode) && VALID_SUBJECTS.has(subjectCode);
}

export function getCloudStudyImagePrefix(userId: string, subjectCode: string): string {
  if (!isValidCloudStudyImageScope(userId, subjectCode)) throw new Error('Sign in and choose a subject before opening cloud images.');
  return `${userId.toLowerCase()}/${subjectCode}`;
}

function validDisplayName(name: string): boolean {
  return typeof name === 'string' && name.length > 0 && name.length <= 200 && name.trim() === name && !name.includes('/') && !name.includes('\\') && !Array.from(name).some(character => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127);
}

/** UTF-8 base64url makes spaces and Unicode names safe inside a single object segment. */
export function encodeStudyImageName(name: string): string {
  if (!validDisplayName(name)) throw new Error('Choose an image with a valid filename.');
  const bytes = new TextEncoder().encode(name);
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeStudyImageName(encoded: string): string | null {
  if (typeof encoded !== 'string' || !/^[A-Za-z0-9_-]+$/.test(encoded) || encoded.length > 1100) return null;
  try {
    const binary = atob(encoded.replace(/-/g, '+').replace(/_/g, '/'));
    const name = new TextDecoder('utf-8', { fatal: true }).decode(Uint8Array.from(binary, character => character.charCodeAt(0)));
    return validDisplayName(name) && encodeStudyImageName(name) === encoded ? name : null;
  } catch { return null; }
}

export function isCloudStudyImagePath(userId: string, subjectCode: string, path: string): boolean {
  if (!isValidCloudStudyImageScope(userId, subjectCode) || typeof path !== 'string') return false;
  const prefix = `${getCloudStudyImagePrefix(userId, subjectCode)}/`;
  if (!path.startsWith(prefix)) return false;
  const match = OBJECT_NAME.exec(path.slice(prefix.length));
  return !!match && decodeStudyImageName(match[1]) !== null;
}

function cloudError(action: 'load' | 'upload' | 'delete' | 'open', error?: unknown): Error {
  const status = error && typeof error === 'object' && 'statusCode' in error ? String(error.statusCode) : '';
  if (status === '401' || status === '403') return new Error('Your images could not be accessed. Sign in again and try once more.');
  return new Error(`Could not ${action} your study image${action === 'load' || action === 'open' ? 's' : ''}. Check your connection and try again.`);
}

function usableSignedUrl(value: string | null): value is string {
  if (!value) return false;
  try { return ['https:', 'http:'].includes(new URL(value).protocol); }
  catch { return false; }
}

export async function listCloudStudyImages(userId: string, subjectCode: string): Promise<CloudStudyImage[]> {
  const prefix = getCloudStudyImagePrefix(userId, subjectCode);
  const bucket = supabase.storage.from(STUDY_IMAGE_BUCKET);
  const { data, error } = await bucket.list(prefix, { limit: MAX_STUDY_IMAGES, offset: 0, sortBy: { column: 'created_at', order: 'desc' } });
  if (error || !data) throw cloudError('load', error);
  const images = data.flatMap(file => {
    const path = `${prefix}/${file.name}`;
    if (!file.id || !file.created_at || !Number.isFinite(Date.parse(file.created_at)) || !isCloudStudyImagePath(userId, subjectCode, path)) return [];
    const encoded = OBJECT_NAME.exec(file.name)![1];
    return [{ id: path, path, name: decodeStudyImageName(encoded)!, createdAt: file.created_at }];
  });
  if (!images.length) return [];
  const paths = images.map(image => image.path);
  const signatures = await bucket.createSignedUrls(paths, 3600);
  if (signatures.error || !signatures.data || signatures.data.length !== images.length) throw cloudError('open', signatures.error);
  const urls = new Map<string, string>();
  for (const signature of signatures.data) {
    if (signature.error || !signature.path || !paths.includes(signature.path) || urls.has(signature.path) || !usableSignedUrl(signature.signedUrl)) throw cloudError('open', signature.error);
    urls.set(signature.path, signature.signedUrl);
  }
  return images.map(image => {
    const url = urls.get(image.path);
    if (!url) throw cloudError('open');
    return { ...image, url };
  });
}

export async function uploadCloudStudyImage(userId: string, subjectCode: string, image: { blob: Blob; name: string }): Promise<void> {
  const prefix = getCloudStudyImagePrefix(userId, subjectCode);
  if (!(image.blob instanceof Blob) || image.blob.size <= 0 || image.blob.size > MAX_STUDY_IMAGE_BYTES || !['image/png', 'image/jpeg'].includes(image.blob.type)) throw new Error('Choose a prepared JPG or PNG image of 4 MB or smaller.');
  const filename = `${crypto.randomUUID()}__${encodeStudyImageName(image.name)}`;
  const { error } = await supabase.storage.from(STUDY_IMAGE_BUCKET).upload(`${prefix}/${filename}`, image.blob, { contentType: image.blob.type, upsert: false });
  if (error) throw cloudError('upload', error);
}

export async function deleteCloudStudyImage(userId: string, subjectCode: string, path: string): Promise<void> {
  if (!isCloudStudyImagePath(userId, subjectCode, path)) throw new Error('This image does not belong to the selected subject and account.');
  const { error } = await supabase.storage.from(STUDY_IMAGE_BUCKET).remove([path]);
  if (error) throw cloudError('delete', error);
}
