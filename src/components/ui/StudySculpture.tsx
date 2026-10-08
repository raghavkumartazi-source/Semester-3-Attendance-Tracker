'use client';

import { useEffect, useId, useRef } from 'react';
import './study-sculpture.css';

type StudySculptureProps = {
  className?: string;
};

/** A decorative, draggable ceramic link. It never carries app information. */
export function StudySculpture({ className = '' }: StudySculptureProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const gradientId = useId().replace(/:/g, '');

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;

    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let disposed = false;
    let loading = false;
    let generation = 0;
    let disposeScene: (() => void) | undefined;
    let updatePlayback: (() => void) | undefined;

    const removeScene = () => {
      generation += 1;
      loading = false;
      disposeScene?.();
      disposeScene = undefined;
      updatePlayback = undefined;
      root.classList.remove('is-ready', 'is-dragging');
    };

    const initialize = async () => {
      if (disposed || loading || disposeScene || !visible || document.hidden || motionPreference.matches) return;
      loading = true;
      const currentGeneration = generation;
      const cleanupStack: Array<() => void> = [];
      const releaseResources = () => {
        while (cleanupStack.length) cleanupStack.pop()?.();
      };

      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import('three'),
          import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (disposed || currentGeneration !== generation || !visible || document.hidden || motionPreference.matches) return;

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', {
          alpha: true,
          antialias: true,
          powerPreference: 'low-power',
          failIfMajorPerformanceCaveat: true,
        });
        if (!context) return;
        cleanupStack.push(() => {
          canvas.remove();
          context.getExtension('WEBGL_lose_context')?.loseContext();
        });

        const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        cleanupStack.push(() => renderer.dispose());
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.25;
        canvas.setAttribute('aria-hidden', 'true');
        canvas.className = 'study-sculpture__canvas';

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 30);
        camera.position.set(0, 0.05, 5.5);
        const link = new THREE.Group();
        link.rotation.set(0.34, 0.45, -0.3);
        scene.add(link);

        const geometry = new THREE.TorusGeometry(0.83, 0.235, 20, 64);
        cleanupStack.push(() => geometry.dispose());
        const cobalt = new THREE.MeshPhysicalMaterial({
          color: 0x254dff,
          metalness: 0.12,
          roughness: 0.21,
          clearcoat: 1,
          clearcoatRoughness: 0.12,
          envMapIntensity: 1.1,
        });
        cleanupStack.push(() => cobalt.dispose());
        const blue = cobalt.clone();
        cleanupStack.push(() => blue.dispose());
        blue.color.setHex(0x5273ff);
        const firstRing = new THREE.Mesh(geometry, cobalt);
        firstRing.position.x = -0.46;
        const secondRing = new THREE.Mesh(geometry, blue);
        secondRing.position.x = 0.46;
        secondRing.rotation.x = Math.PI / 2;
        link.add(firstRing, secondRing);

        const keyLight = new THREE.DirectionalLight(0xffffff, 3.5);
        keyLight.position.set(-3, 4, 5);
        const rimLight = new THREE.DirectionalLight(0x8caaff, 3);
        rimLight.position.set(3, 1, -3);
        scene.add(keyLight, rimLight, new THREE.HemisphereLight(0xdbe6ff, 0x15295e, 1.2));

        // A small procedural studio supplies reflections without image downloads.
        const studio = new RoomEnvironment();
        let studioActive = true;
        cleanupStack.push(() => { if (studioActive) studio.dispose(); });
        const pmrem = new THREE.PMREMGenerator(renderer);
        let pmremActive = true;
        cleanupStack.push(() => { if (pmremActive) pmrem.dispose(); });
        const environment = pmrem.fromScene(studio, 0.04, 0.1, 100, { size: 128 });
        cleanupStack.push(() => environment.dispose());
        scene.environment = environment.texture;
        studio.dispose();
        studioActive = false;
        pmrem.dispose();
        pmremActive = false;

        let frame = 0;
        let previousFrame = 0;
        let elapsed = 0;
        let angle = 0.45;
        let velocity = 0;
        let pointerId: number | null = null;
        let horizontalDrag = false;
        let startX = 0;
        let startY = 0;
        let previousX = 0;
        let previousMove = 0;
        let sceneDisposed = false;

        const resize = () => {
          if (sceneDisposed) return;
          const { width, height } = stage.getBoundingClientRect();
          if (!width || !height) return;
          camera.aspect = width / height;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height, false);
          if (visible && !document.hidden) renderer.render(scene, camera);
        };

        const tick = (now: number) => {
          if (sceneDisposed || !visible || document.hidden || motionPreference.matches) {
            frame = 0;
            return;
          }
          frame = window.requestAnimationFrame(tick);
          if (previousFrame && now - previousFrame < 1000 / 30) return;
          const delta = previousFrame ? Math.min((now - previousFrame) / 1000, 0.1) : 1 / 30;
          previousFrame = now;
          elapsed += delta;
          if (!horizontalDrag) {
            angle += (0.13 + velocity) * delta;
            velocity *= Math.exp(-3.2 * delta);
          }
          link.rotation.y = angle;
          link.rotation.x = 0.34 + Math.sin(elapsed * 0.55) * 0.045;
          link.position.y = Math.sin(elapsed * 0.8) * 0.035;
          renderer.render(scene, camera);
        };

        updatePlayback = () => {
          if (visible && !document.hidden && !motionPreference.matches) {
            if (!frame) {
              previousFrame = 0;
              frame = window.requestAnimationFrame(tick);
            }
          } else if (frame) {
            window.cancelAnimationFrame(frame);
            frame = 0;
          }
        };

        const endDrag = () => {
          const capturedPointer = pointerId;
          pointerId = null;
          horizontalDrag = false;
          root.classList.remove('is-dragging');
          if (capturedPointer !== null && canvas.hasPointerCapture(capturedPointer)) {
            canvas.releasePointerCapture(capturedPointer);
          }
        };

        const pointerDown = (event: PointerEvent) => {
          if (!event.isPrimary || event.button !== 0) return;
          pointerId = event.pointerId;
          startX = previousX = event.clientX;
          startY = event.clientY;
          previousMove = event.timeStamp;
          horizontalDrag = false;
          velocity = 0;
          canvas.setPointerCapture(event.pointerId);
        };

        const pointerMove = (event: PointerEvent) => {
          if (pointerId !== event.pointerId) return;
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (!horizontalDrag) {
            if (Math.abs(dy) > 7 && Math.abs(dy) > Math.abs(dx)) {
              endDrag();
              return;
            }
            if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;
            horizontalDrag = true;
            root.classList.add('is-dragging');
          }
          const distance = event.clientX - previousX;
          const delta = Math.max((event.timeStamp - previousMove) / 1000, 1 / 120);
          angle += distance * 0.014;
          velocity = Math.max(-4, Math.min(4, (distance * 0.014) / delta));
          previousX = event.clientX;
          previousMove = event.timeStamp;
        };

        const contextLost = (event: Event) => {
          event.preventDefault();
          removeScene();
        };
        const resizeObserver = new ResizeObserver(resize);
        canvas.addEventListener('pointerdown', pointerDown);
        canvas.addEventListener('pointermove', pointerMove);
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('lostpointercapture', endDrag);
        canvas.addEventListener('webglcontextlost', contextLost);

        disposeScene = () => {
          sceneDisposed = true;
          if (frame) window.cancelAnimationFrame(frame);
          resizeObserver.disconnect();
          endDrag();
          canvas.removeEventListener('pointerdown', pointerDown);
          canvas.removeEventListener('pointermove', pointerMove);
          canvas.removeEventListener('pointerup', endDrag);
          canvas.removeEventListener('pointercancel', endDrag);
          canvas.removeEventListener('lostpointercapture', endDrag);
          canvas.removeEventListener('webglcontextlost', contextLost);
          releaseResources();
        };

        stage.append(canvas);
        resizeObserver.observe(stage);
        resize();
        root.classList.add('is-ready');
        updatePlayback();
      } catch {
        // Unsupported graphics retain the static vector already in the markup.
        removeScene();
        releaseResources();
      } finally {
        if (currentGeneration === generation) loading = false;
      }
    };

    const onMotionChange = () => {
      if (motionPreference.matches) removeScene();
      else void initialize();
    };
    const onVisibilityChange = () => {
      if (!document.hidden) void initialize();
      updatePlayback?.();
    };
    const intersection = new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      if (visible) void initialize();
      updatePlayback?.();
    }, { threshold: 0.05 });
    intersection.observe(root);
    motionPreference.addEventListener('change', onMotionChange);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      disposed = true;
      intersection.disconnect();
      motionPreference.removeEventListener('change', onMotionChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      removeScene();
    };
  }, []);

  return (
    <div ref={rootRef} className={`study-sculpture ${className}`} aria-hidden="true">
      <div className="study-sculpture__halo" />
      <div className="study-sculpture__shadow" />
      <svg className="study-sculpture__fallback" viewBox="0 0 180 180" fill="none">
        <defs>
          <linearGradient id={`${gradientId}-ceramic`} x1="40" y1="35" x2="125" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#9EB8FF" />
            <stop offset="0.23" stopColor="#537CFF" />
            <stop offset="0.58" stopColor="#254DFF" />
            <stop offset="1" stopColor="#132591" />
          </linearGradient>
          <linearGradient id={`${gradientId}-glaze`} x1="45" y1="35" x2="125" y2="145" gradientUnits="userSpaceOnUse">
            <stop stopColor="#F1F5FF" stopOpacity="0.75" />
            <stop offset="1" stopColor="#8BA7FF" stopOpacity="0" />
          </linearGradient>
        </defs>
        <g transform="rotate(-25 90 90)">
          <ellipse cx="68" cy="84" rx="34" ry="46" transform="rotate(15 68 84)" stroke={`url(#${gradientId}-ceramic)`} strokeWidth="19" />
          <ellipse cx="113" cy="93" rx="24" ry="40" transform="rotate(-27 113 93)" stroke={`url(#${gradientId}-ceramic)`} strokeWidth="19" />
          <path d="M55 41C37 52 33 83 44 107" stroke={`url(#${gradientId}-glaze)`} strokeWidth="3" strokeLinecap="round" />
          <path d="M100 55C109 53 121 68 127 82" stroke={`url(#${gradientId}-glaze)`} strokeWidth="3" strokeLinecap="round" />
          <path d="M88 110C86 119 80 125 73 130" stroke={`url(#${gradientId}-ceramic)`} strokeWidth="19" strokeLinecap="round" />
        </g>
      </svg>
      <div ref={stageRef} className="study-sculpture__stage" />
    </div>
  );
}

export default StudySculpture;
