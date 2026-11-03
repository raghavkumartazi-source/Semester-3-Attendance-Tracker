/** Study images use their own database so large photos do not fill planner localStorage. */
export interface StudyImageRecord {
  id: string;
  scope: string;
  subjectCode: string;
  name: string;
  blob: Blob;
  createdAt: string;
  cloudPath?: string;
}

export const MAX_STUDY_IMAGE_INPUT_BYTES = 20 * 1024 * 1024;
export const MAX_STUDY_IMAGE_BYTES = 4 * 1024 * 1024;
const DATABASE = 'semester-study-images-v1';
const STORE = 'images';
const INDEX = 'scope-subject';
const UNSUPPORTED = 'This image format could not be opened. Please use a JPG or PNG image.';
const SUPPORTED_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif', 'image/avif', 'image/bmp', 'image/x-ms-bmp']);
const SUPPORTED_EXTENSION = /\.(?:jpe?g|png|webp|gif|avif|bmp)$/i;

export function getStudyImageValidationError(file: Pick<File, 'type' | 'name' | 'size'>): string | null {
  if (file.size <= 0) return 'This image is empty. Choose another image.';
  if (file.size > MAX_STUDY_IMAGE_INPUT_BYTES) return 'Choose an image of 20 MB or smaller.';
  if (/\.(?:heic|heif|svg|svgz)$/i.test(file.name)) return UNSUPPORTED;
  if (file.type ? !SUPPORTED_TYPES.has(file.type.toLowerCase()) : !SUPPORTED_EXTENSION.test(file.name)) return UNSUPPORTED;
  return null;
}

export function getStudyImageName(name: string, type: string): string {
  const filename = name.split(/[\\/]/).pop() || 'study-image';
  const stem = filename.replace(/\.[^.]*$/, '').replace(/[\u0000-\u001f\u007f<>:"|?*]/g, '-').trim().slice(0, 120) || 'study-image';
  return `${stem}.${type === 'image/png' ? 'png' : 'jpg'}`;
}

export function fitStudyImageDimensions(width: number, height: number, maxEdge = 2000) {
  if (![width, height, maxEdge].every(value => Number.isFinite(value) && value > 0)) throw new Error(UNSUPPORTED);
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

/** Check raster signatures before creating an Image; a renamed SVG is still rejected. */
export function getStudyImageRasterType(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/webp' | 'image/gif' | 'image/avif' | 'image/bmp' | null {
  const starts = (...signature: number[]) => signature.every((byte, index) => bytes[index] === byte);
  const text = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (starts(137, 80, 78, 71, 13, 10, 26, 10)) return 'image/png';
  if (starts(255, 216, 255)) return 'image/jpeg';
  if (text(0, 4) === 'RIFF' && text(8, 12) === 'WEBP') return 'image/webp';
  if (text(0, 6) === 'GIF87a' || text(0, 6) === 'GIF89a') return 'image/gif';
  if (text(4, 8) === 'ftyp' && ['avif', 'avis'].includes(text(8, 12))) return 'image/avif';
  if (starts(66, 77)) return 'image/bmp';
  return null;
}

function decodeImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    const timeout = window.setTimeout(() => {
      image.onload = image.onerror = null;
      image.src = '';
      reject(new Error('This image took too long to open. Try a smaller JPG or PNG image.'));
    }, 20_000);
    image.onload = () => {
      window.clearTimeout(timeout);
      if (image.naturalWidth && image.naturalHeight) resolve(image);
      else reject(new Error(UNSUPPORTED));
    };
    image.onerror = () => { window.clearTimeout(timeout); reject(new Error(UNSUPPORTED)); };
    image.src = url;
  });
}

export async function prepareStudyImage(file: File): Promise<{ blob: Blob; name: string }> {
  const validationError = getStudyImageValidationError(file);
  if (validationError) throw new Error(validationError);
  const sourceType = getStudyImageRasterType(new Uint8Array(await file.slice(0, 32).arrayBuffer()));
  if (!sourceType) throw new Error(UNSUPPORTED);
  const url = URL.createObjectURL(file);
  let image: HTMLImageElement | undefined;
  try {
    image = await decodeImage(url);
    const outputType = sourceType === 'image/png' ? 'image/png' : 'image/jpeg';
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('This browser could not prepare the image. Try a JPG or PNG image in another browser.');
    let edge = 2000;
    for (let attempt = 0; attempt < 8; attempt++) {
      const dimensions = fitStudyImageDimensions(image.naturalWidth, image.naturalHeight, edge);
      canvas.width = dimensions.width;
      canvas.height = dimensions.height;
      if (outputType === 'image/jpeg') { context.fillStyle = '#fff'; context.fillRect(0, 0, canvas.width, canvas.height); }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(result => result ? resolve(result) : reject(new Error('This image could not be prepared. Try a smaller JPG or PNG image.')), outputType, .85));
      if (blob.size > 0 && blob.size <= MAX_STUDY_IMAGE_BYTES) return { blob, name: getStudyImageName(file.name, blob.type) };
      edge = Math.round(Math.max(canvas.width, canvas.height) * .8);
    }
    throw new Error('This image is still too large after resizing. Please choose a smaller image.');
  } catch (error) {
    if (error instanceof Error) throw error;
    throw new Error(UNSUPPORTED);
  } finally {
    URL.revokeObjectURL(url);
    if (image) { image.onload = image.onerror = null; image.src = ''; }
  }
}

function storageError(error: unknown): Error {
  const name = error && typeof error === 'object' && 'name' in error ? String(error.name) : '';
  if (name === 'QuotaExceededError') return new Error('Your device storage is full. Download any images you want to keep, then free some space and try again.');
  return new Error('Image storage is unavailable. Try a regular browser tab, and check that this site can save data on your device.');
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') { reject(storageError(null)); return; }
    let settled = false;
    let request: IDBOpenDBRequest;
    try { request = indexedDB.open(DATABASE, 1); }
    catch (error) { reject(storageError(error)); return; }
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore(STORE, { keyPath: ['scope', 'id'] });
      store.createIndex(INDEX, ['scope', 'subjectCode']);
    };
    request.onsuccess = () => {
      const database = request.result;
      if (settled) { database.close(); return; }
      settled = true;
      database.onversionchange = () => database.close();
      resolve(database);
    };
    request.onerror = () => { settled = true; reject(storageError(request.error)); };
    request.onblocked = () => { settled = true; reject(new Error('Close other tabs of this app, then try adding your image again.')); };
  });
}

async function runRequest<T>(mode: IDBTransactionMode, requestFor: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const database = await openDatabase();
  return new Promise((resolve, reject) => {
    let transaction: IDBTransaction;
    let request: IDBRequest<T>;
    try {
      transaction = database.transaction(STORE, mode);
      request = requestFor(transaction.objectStore(STORE));
    } catch (error) { database.close(); reject(storageError(error)); return; }
    transaction.oncomplete = () => { database.close(); resolve(request.result); };
    transaction.onabort = transaction.onerror = () => {
      let error = transaction.error;
      try { error ||= request.error; } catch { /* An aborted request may still be pending. */ }
      database.close();
      reject(storageError(error));
    };
  });
}

function validKey(value: string) { return typeof value === 'string' && value.length > 0 && value.length <= 200; }

export async function listStudyImages(scope: string, subjectCode: string): Promise<StudyImageRecord[]> {
  if (!validKey(scope) || !validKey(subjectCode)) throw new Error('Choose a subject before opening its images.');
  const images = await runRequest<StudyImageRecord[]>('readonly', store => store.index(INDEX).getAll([scope, subjectCode]));
  return images.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id));
}

export async function saveStudyImage(record: StudyImageRecord): Promise<void> {
  if (!validKey(record.id) || !validKey(record.scope) || !validKey(record.subjectCode) || !(record.blob instanceof Blob) || record.blob.size <= 0 || record.blob.size > MAX_STUDY_IMAGE_BYTES || !['image/jpeg', 'image/png'].includes(record.blob.type) || !record.name || record.name.length > 200 || !Number.isFinite(Date.parse(record.createdAt))) throw new Error('This image could not be saved. Please add it again.');
  await runRequest('readwrite', store => store.put(record));
}

export async function deleteStudyImage(id: string, scope: string): Promise<void> {
  if (!validKey(id) || !validKey(scope)) throw new Error('This image could not be removed. Please try again.');
  await runRequest('readwrite', store => store.delete([scope, id]));
}
