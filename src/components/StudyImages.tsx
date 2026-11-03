'use client';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent } from 'react';
import { ArrowDownTrayIcon, ArrowPathIcon, MagnifyingGlassPlusIcon, PhotoIcon, PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useAttendance } from './AttendanceProvider';
import Dialog from './Dialog';
import { LiquidButton } from './ui/LiquidButton';
import { deleteStudyImage, listStudyImages, prepareStudyImage, saveStudyImage, type StudyImageRecord } from '@/lib/studyImages';
import { deleteCloudStudyImage, listCloudStudyImages, MAX_STUDY_IMAGES, uploadCloudStudyImage, type CloudStudyImage } from '@/lib/studyImageCloud';
import './study-images.css';

type ImageEntry = (StudyImageRecord & { kind: 'local' }) | (CloudStudyImage & { kind: 'cloud' });
const messageFor = (error: unknown) => error instanceof Error ? error.message : 'Something went wrong. Please try again.';

// Native images support device blobs and short-lived private URLs without a public image proxy.
/* eslint-disable @next/next/no-img-element */
function ImageVisual({ image, large = false }: { image: ImageEntry; large?: boolean }) {
  const blob = image.kind === 'local' ? image.blob : undefined;
  const [localUrl, setLocalUrl] = useState('');
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    // The URL belongs to this mounted image and is released when it changes or closes.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLocalUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [blob]);
  const src = image.kind === 'cloud' ? image.url : localUrl;
  if (failed) return <span className="study-image-unavailable"><PhotoIcon aria-hidden="true" />Preview unavailable. Refresh images to try again.</span>;
  return src ? <img src={src} alt={image.name} loading={large ? 'eager' : 'lazy'} decoding="async" onError={() => setFailed(true)} /> : <span className="study-image-unavailable">Loading image…</span>;
}
/* eslint-enable @next/next/no-img-element */

export default function StudyImages({ subjectCode }: { subjectCode: string }) {
  const { user } = useAttendance();
  // Switching accounts or subjects discards the previous view before any new data loads.
  return <StudyImageGallery key={`${user?.id ?? 'guest'}:${subjectCode}`} subjectCode={subjectCode} userId={user?.id} />;
}

function StudyImageGallery({ subjectCode, userId }: { subjectCode: string; userId?: string }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const addButton = useRef<HTMLDivElement>(null);
  const mounted = useRef(false);
  const request = useRef(0);
  const working = useRef(false);
  const [images, setImages] = useState<ImageEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState<ImageEntry | null>(null);
  const [removing, setRemoving] = useState<ImageEntry | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const refresh = useCallback(async (initial = false) => {
    const current = ++request.current;
    if (!initial) setLoading(true);
    try {
      const next: ImageEntry[] = userId
        ? (await listCloudStudyImages(userId, subjectCode)).map(image => ({ ...image, kind: 'cloud' }))
        : (await listStudyImages('guest', subjectCode)).map(image => ({ ...image, kind: 'local' }));
      if (mounted.current && current === request.current) { setImages(next); setError(''); }
    } catch (cause) {
      if (mounted.current && current === request.current) setError(messageFor(cause));
    } finally {
      if (mounted.current && current === request.current) setLoading(false);
    }
  }, [userId, subjectCode]);

  useEffect(() => {
    mounted.current = true;
    // Initial loading is already true; all hydration state updates follow the storage read.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh(true);
    const onFocus = () => { if (!working.current) void refresh(); };
    window.addEventListener('focus', onFocus);
    return () => { mounted.current = false; window.removeEventListener('focus', onFocus); };
  }, [refresh]);

  async function addImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = '';
    if (!files.length || working.current) return;
    if (files.length + images.length > MAX_STUDY_IMAGES) { setError(`Keep up to ${MAX_STUDY_IMAGES} images per subject. Download and remove an image to make room.`); return; }
    working.current = true;
    request.current++;
    setBusy(true); setLoading(false); setError('');
    let saved = 0;
    const failures: string[] = [];
    for (const [index, file] of files.entries()) {
      if (mounted.current) setNotice(`Preparing image ${index + 1} of ${files.length}…`);
      try {
        const prepared = await prepareStudyImage(file);
        if (userId) await uploadCloudStudyImage(userId, subjectCode, prepared);
        else await saveStudyImage({ id: crypto.randomUUID(), scope: 'guest', subjectCode, ...prepared, createdAt: new Date().toISOString() });
        saved++;
      } catch (cause) { failures.push(`${file.name}: ${messageFor(cause)}`); }
    }
    if (mounted.current) {
      await refresh();
      setNotice(saved ? `${saved} image${saved === 1 ? '' : 's'} saved ${userId ? 'to your account' : 'on this device'}.` : '');
      if (failures.length) setError(failures.join(' '));
      setBusy(false);
    }
    working.current = false;
  }

  async function removeImage() {
    if (!removing || working.current) return;
    working.current = true; request.current++;
    setBusy(true); setError('');
    try {
      if (removing.kind === 'cloud' && userId) await deleteCloudStudyImage(userId, subjectCode, removing.path);
      else if (removing.kind === 'local') await deleteStudyImage(removing.id, 'guest');
      if (!mounted.current) return;
      setImages(previous => previous.filter(image => image.id !== removing.id));
      setPreview(null); setRemoving(null); setNotice('Image removed.');
      requestAnimationFrame(() => addButton.current?.querySelector('button')?.focus());
    } catch (cause) { if (mounted.current) { setError(messageFor(cause)); setRemoving(null); } }
    finally { working.current = false; if (mounted.current) setBusy(false); }
  }

  async function downloadImage(image: ImageEntry) {
    try {
      let blob: Blob;
      if (image.kind === 'local') blob = image.blob;
      else {
        const response = await fetch(image.url);
        if (!response.ok) throw new Error('This download link has expired. Close the preview, refresh images and try again.');
        blob = await response.blob();
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url; link.download = image.name;
      document.body.append(link); link.click(); link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
      if (mounted.current) setNotice('Image download started.');
    } catch (cause) { if (mounted.current) setError(messageFor(cause)); }
  }

  function confirmRemoval(image: ImageEntry) {
    setPreview(null);
    setRemoving(image);
  }

  return <section className="study-images glass-panel" aria-labelledby={`${id}-title`} aria-busy={busy || loading}>
    <div className="study-images-heading">
      <div><p className="planning-eyebrow">Your visual notebook</p><h3 id={`${id}-title`}>Study images{images.length > 0 && <span>{images.length}</span>}</h3><p>Keep notes, diagrams and reference photos with {subjectCode}.</p></div>
      <div ref={addButton} className="study-images-heading-actions"><LiquidButton type="button" onClick={() => input.current?.click()} disabled={busy || loading || images.length >= MAX_STUDY_IMAGES}><PlusIcon aria-hidden="true" />Add images</LiquidButton><button type="button" className="glass-control study-images-refresh" aria-label="Refresh study images" title="Refresh study images" disabled={busy || loading} onClick={() => void refresh()}><ArrowPathIcon aria-hidden="true" /></button></div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif,image/bmp" multiple className="sr-only" tabIndex={-1} aria-label={`Add study images for ${subjectCode}`} onChange={addImages} disabled={busy} />
    </div>
    <p className="study-images-storage">{userId ? 'Private to your account · available on your signed-in devices.' : 'Saved on this device only · download images to keep a separate copy.'} Images are resized for faster loading.</p>
    {notice && <p className="study-images-notice" role="status">{notice}</p>}
    {error && <div className="study-images-error" role="alert"><p>{error}</p><button type="button" className="glass-control" disabled={busy} onClick={() => void refresh()}><ArrowPathIcon aria-hidden="true" />Refresh images</button></div>}
    {loading && images.length === 0 ? <p className="study-images-loading" role="status">Opening your images…</p> : images.length ? <div className="study-images-grid">
      {images.map(image => <article className="study-image-card" key={image.id}>
        <button type="button" className="study-image-open" aria-label={`Open ${image.name}`} onClick={() => { setPreview(image); setZoomed(false); }}><ImageVisual key={image.kind === 'cloud' ? image.url : image.id} image={image} /><span className="study-image-expand"><MagnifyingGlassPlusIcon aria-hidden="true" />View image</span></button>
        <div className="study-image-caption"><p title={image.name}>{image.name}</p><div><button type="button" aria-label={`Download ${image.name}`} onClick={() => void downloadImage(image)}><ArrowDownTrayIcon aria-hidden="true" /></button><button type="button" aria-label={`Remove ${image.name}`} disabled={busy} onClick={() => confirmRemoval(image)}><TrashIcon aria-hidden="true" /></button></div></div>
      </article>)}
    </div> : !error && <div className="study-images-empty"><span aria-hidden="true"><PhotoIcon /></span><div><strong>A place for the pages you’ll come back to.</strong><p>Add a photo of your notes, a useful diagram or a screenshot. Choose several images at once from your photo library.</p></div></div>}
    {preview && <Dialog label={`Study image: ${preview.name}`} onClose={() => setPreview(null)}><div className="study-image-preview">
      <div className="study-image-preview-heading"><div><span>{subjectCode} · Study image</span><h3>{preview.name}</h3></div><button type="button" className="glass-control" aria-label="Close image preview" onClick={() => setPreview(null)}><XMarkIcon aria-hidden="true" /></button></div>
      <div className={`study-image-viewer ${zoomed ? 'is-zoomed' : ''}`} tabIndex={0} aria-label={zoomed ? 'Enlarged image. Scroll to explore.' : 'Image preview'}><ImageVisual key={preview.kind === 'cloud' ? preview.url : preview.id} image={preview} large /></div>
      {error && <p className="study-image-preview-error" role="alert">{error}</p>}
      <div className="study-image-preview-actions"><button type="button" className="glass-control" aria-pressed={zoomed} onClick={() => setZoomed(value => !value)}><MagnifyingGlassPlusIcon aria-hidden="true" />{zoomed ? 'Fit image' : 'Zoom in'}</button><button type="button" className="glass-control" onClick={() => void downloadImage(preview)}><ArrowDownTrayIcon aria-hidden="true" />Download</button><button type="button" className="glass-control" aria-label={`Remove ${preview.name}`} disabled={busy} onClick={() => confirmRemoval(preview)}><TrashIcon aria-hidden="true" /></button></div>
    </div></Dialog>}
    {removing && <Dialog label="Remove study image" onClose={() => { if (!busy) setRemoving(null); }}><div className="study-image-confirm"><h3>Remove this image?</h3><p>{removing.name}</p><p>{userId ? 'This removes it from your account and signed-in devices.' : 'This removes the saved copy on this device.'} Download a copy first if you want to keep it.</p><div><button type="button" className="glass-control" disabled={busy} onClick={() => setRemoving(null)}>Keep image</button><button type="button" className="ink-btn" disabled={busy} onClick={() => void removeImage()}>{busy ? 'Removing…' : 'Remove image'}</button></div></div></Dialog>}
  </section>;
}
