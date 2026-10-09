'use client';

import { useEffect, useId, useRef } from 'react';
import './semester-instrument.css';

export type SemesterInstrumentProps = {
  percentage: number;
  currentDay: number;
  totalDays: number;
  className?: string;
};

const safePercent = (value: number) => Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;

/** A real, draggable enamel dial. Its raised coral arc represents semester progress. */
export function SemesterInstrument({ percentage, currentDay, totalDays, className = '' }: SemesterInstrumentProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef(safePercent(percentage));
  const updateDataRef = useRef<((value: number) => void) | null>(null);
  const gradientId = useId().replace(/:/g, '');
  const progress = safePercent(percentage);
  const day = Number.isFinite(currentDay) ? Math.max(0, Math.round(currentDay)) : 0;
  const days = Number.isFinite(totalDays) ? Math.max(0, Math.round(totalDays)) : 0;

  useEffect(() => {
    progressRef.current = progress;
    updateDataRef.current?.(progress);
  }, [progress]);

  useEffect(() => {
    const root = rootRef.current;
    const stage = stageRef.current;
    if (!root || !stage) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    let disposed = false;
    let loading = false;
    let generation = 0;
    let disposeScene: (() => void) | undefined;
    let playback: (() => void) | undefined;

    const removeScene = () => {
      generation += 1;
      loading = false;
      disposeScene?.();
      disposeScene = undefined;
      playback = undefined;
      updateDataRef.current = null;
      root.classList.remove('is-ready', 'is-dragging');
    };

    const initialize = async () => {
      if (disposed || loading || disposeScene || !visible || document.hidden || reduced.matches) return;
      loading = true;
      const thisGeneration = generation;
      const cleanup: Array<() => void> = [];
      const release = () => { while (cleanup.length) cleanup.pop()?.(); };
      try {
        const [THREE, { RoomEnvironment }] = await Promise.all([
          import('three'), import('three/addons/environments/RoomEnvironment.js'),
        ]);
        if (disposed || thisGeneration !== generation || !visible || document.hidden || reduced.matches) return;
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('webgl2', {
          alpha: true, antialias: true, powerPreference: 'low-power', failIfMajorPerformanceCaveat: true,
        });
        if (!context) return;
        cleanup.push(() => { canvas.remove(); context.getExtension('WEBGL_lose_context')?.loseContext(); });
        const renderer = new THREE.WebGLRenderer({ canvas, context, alpha: true, antialias: true });
        cleanup.push(() => renderer.dispose());
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
        renderer.setClearColor(0x000000, 0);
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = .82;
        renderer.transmissionResolutionScale = .4;
        canvas.className = 'semester-instrument__canvas';
        canvas.setAttribute('aria-hidden', 'true');

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(39, 1, .1, 20);
        camera.position.set(0, .05, 4.8);
        const dial = new THREE.Group();
        dial.rotation.set(-.24, .28, -.24);
        scene.add(dial);

        const enamel = new THREE.MeshPhysicalMaterial({ color: 0x342034, metalness: .1, roughness: .33, clearcoat: .6, clearcoatRoughness: .18, envMapIntensity: .4 });
        const bronze = new THREE.MeshPhysicalMaterial({ color: 0x95616a, metalness: .78, roughness: .3, clearcoat: .35, clearcoatRoughness: .16, envMapIntensity: .55 });
        const coral = new THREE.MeshPhysicalMaterial({ color: 0xe98d79, metalness: 0, roughness: .26, clearcoat: .8, clearcoatRoughness: .12, emissive: 0x723c42, emissiveIntensity: .04 });
        cleanup.push(() => enamel.dispose(), () => bronze.dispose(), () => coral.dispose());
        const bodyGeometry = new THREE.CylinderGeometry(.99, .96, .17, 64);
        cleanup.push(() => bodyGeometry.dispose());
        const body = new THREE.Mesh(bodyGeometry, enamel);
        body.rotation.x = Math.PI / 2;
        dial.add(body);
        const rimGeometry = new THREE.TorusGeometry(1, .055, 12, 88);
        cleanup.push(() => rimGeometry.dispose());
        const rim = new THREE.Mesh(rimGeometry, bronze);
        rim.position.z = .095;
        dial.add(rim);
        const innerGeometry = new THREE.TorusGeometry(.86, .012, 8, 88);
        cleanup.push(() => innerGeometry.dispose());
        const innerRing = new THREE.Mesh(innerGeometry, bronze);
        innerRing.position.z = .109;
        dial.add(innerRing);

        // A restrained, knurled metal edge gives the object physical thickness.
        const toothGeometry = new THREE.BoxGeometry(.025, .055, .055);
        cleanup.push(() => toothGeometry.dispose());
        const teeth = new THREE.InstancedMesh(toothGeometry, bronze, 48);
        const dummy = new THREE.Object3D();
        for (let index = 0; index < 48; index++) {
          const angle = index / 48 * Math.PI * 2;
          dummy.position.set(Math.cos(angle) * 1.032, Math.sin(angle) * 1.032, .018);
          dummy.rotation.z = angle - Math.PI / 2;
          dummy.updateMatrix();
          teeth.setMatrixAt(index, dummy.matrix);
        }
        cleanup.push(() => teeth.dispose());
        dial.add(teeth);

        const faceCanvas = document.createElement('canvas');
        faceCanvas.width = faceCanvas.height = 512;
        const faceContext = faceCanvas.getContext('2d');
        if (!faceContext) throw new Error('Dial texture unavailable');
        const faceGradient = faceContext.createRadialGradient(200, 160, 0, 256, 256, 256);
        faceGradient.addColorStop(0, '#4c2c43');
        faceGradient.addColorStop(.65, '#2c1d2e');
        faceGradient.addColorStop(1, '#201623');
        faceContext.fillStyle = faceGradient;
        faceContext.fillRect(0, 0, 512, 512);
        for (let index = 0; index < 60; index++) {
          const angle = index / 60 * Math.PI * 2 - Math.PI / 2;
          const major = index % 5 === 0;
          const outer = 217;
          const inner = major ? 193 : 205;
          faceContext.beginPath();
          faceContext.strokeStyle = major ? '#e6c4ab' : '#926776';
          faceContext.lineWidth = major ? 2.5 : 1.5;
          faceContext.moveTo(256 + Math.cos(angle) * inner, 256 + Math.sin(angle) * inner);
          faceContext.lineTo(256 + Math.cos(angle) * outer, 256 + Math.sin(angle) * outer);
          faceContext.stroke();
        }
        const texture = new THREE.CanvasTexture(faceCanvas);
        texture.colorSpace = THREE.SRGBColorSpace;
        cleanup.push(() => texture.dispose());
        // The authored enamel gradient stays deep plum underneath the glazed layer.
        const faceMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false });
        const faceGeometry = new THREE.CircleGeometry(.96, 64);
        cleanup.push(() => faceMaterial.dispose(), () => faceGeometry.dispose());
        const face = new THREE.Mesh(faceGeometry, faceMaterial);
        face.position.z = .1;
        dial.add(face);

        // An offset gimbal ring and glazed inset provide real highlights and parallax.
        const orbitGeometry = new THREE.TorusGeometry(1.21, .023, 8, 88);
        cleanup.push(() => orbitGeometry.dispose());
        const orbit = new THREE.Mesh(orbitGeometry, bronze);
        orbit.rotation.set(.65, -.17, -.14);
        orbit.position.z = -.08;
        dial.add(orbit);
        const glassMaterial = new THREE.MeshPhysicalMaterial({ color: 0xf6dac3, transmission: .3, transparent: true, opacity: .075, roughness: .02, thickness: .04, ior: 1.45, clearcoat: .35, clearcoatRoughness: .04, envMapIntensity: .35, depthWrite: false });
        const glassGeometry = new THREE.CircleGeometry(.83, 64);
        cleanup.push(() => glassMaterial.dispose(), () => glassGeometry.dispose());
        const glass = new THREE.Mesh(glassGeometry, glassMaterial);
        glass.position.z = .13;
        dial.add(glass);

        const indicatorGeometry = new THREE.SphereGeometry(.066, 16, 10);
        cleanup.push(() => indicatorGeometry.dispose());
        const indicator = new THREE.Mesh(indicatorGeometry, coral);
        dial.add(indicator);
        let progressArc: InstanceType<typeof THREE.Mesh> | undefined;
        const setProgress = (value: number) => {
          const fraction = value / 100;
          if (progressArc) { dial.remove(progressArc); progressArc.geometry.dispose(); }
          const pointCount = Math.max(3, Math.ceil(fraction * 100) + 1);
          const arcPoints = Array.from({ length: pointCount }, (_, index) => {
            const angle = Math.PI / 2 - Math.max(.00001, fraction) * Math.PI * 2 * index / (pointCount - 1);
            return new THREE.Vector3(Math.cos(angle) * .956, Math.sin(angle) * .956, .146);
          });
          const curve = new THREE.CatmullRomCurve3(arcPoints);
          progressArc = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(3, Math.ceil(fraction * 96)), .029, 8, false), coral);
          progressArc.visible = fraction > .001;
          dial.add(progressArc);
          const end = Math.PI / 2 - fraction * Math.PI * 2;
          indicator.position.set(Math.cos(end) * .956, Math.sin(end) * .956, .17);
        };
        cleanup.push(() => progressArc?.geometry.dispose());
        setProgress(progressRef.current);
        updateDataRef.current = setProgress;

        const key = new THREE.DirectionalLight(0xffede0, 1.8);
        key.position.set(-3, 4, 5);
        const rimLight = new THREE.DirectionalLight(0xf09e8e, 1);
        rimLight.position.set(3, 1, -3);
        scene.add(key, rimLight, new THREE.HemisphereLight(0xf8dbc5, 0x291329, .8));
        const studio = new RoomEnvironment();
        cleanup.push(() => studio.dispose());
        const pmrem = new THREE.PMREMGenerator(renderer);
        cleanup.push(() => pmrem.dispose());
        const environment = pmrem.fromScene(studio, .04, .1, 100, { size: 128 });
        cleanup.push(() => environment.dispose());
        scene.environment = environment.texture;
        studio.dispose();
        pmrem.dispose();

        let frame = 0;
        let previousFrame = 0;
        let elapsed = 0;
        let rotationY = .28;
        let targetY = .28;
        let rotationX = -.24;
        let targetX = -.24;
        let velocity = 0;
        let pointer: number | null = null;
        let startX = 0;
        let startY = 0;
        let previousX = 0;
        let previousTime = 0;
        let dragging = false;
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
          if (sceneDisposed || !visible || document.hidden || reduced.matches) { frame = 0; return; }
          frame = requestAnimationFrame(tick);
          if (previousFrame && now - previousFrame < 1000 / 30) return;
          const delta = previousFrame ? Math.min((now - previousFrame) / 1000, .1) : 1 / 30;
          previousFrame = now;
          elapsed += delta;
          if (!dragging) { targetY += velocity * delta; velocity *= Math.exp(-4 * delta); }
          const ease = 1 - Math.exp(-6 * delta);
          rotationY += (targetY - rotationY) * ease;
          rotationX += (targetX - rotationX) * ease;
          dial.rotation.y = rotationY + Math.sin(elapsed * .38) * .045;
          dial.rotation.x = rotationX + Math.sin(elapsed * .5) * .04;
          dial.position.y = Math.sin(elapsed * .65) * .028;
          renderer.render(scene, camera);
        };
        playback = () => {
          if (visible && !document.hidden && !reduced.matches) {
            if (!frame) { previousFrame = 0; frame = requestAnimationFrame(tick); }
          } else if (frame) { cancelAnimationFrame(frame); frame = 0; }
        };
        const endDrag = () => {
          const captured = pointer;
          pointer = null;
          dragging = false;
          root.classList.remove('is-dragging');
          if (captured !== null && canvas.hasPointerCapture(captured)) canvas.releasePointerCapture(captured);
        };
        const pointerDown = (event: PointerEvent) => {
          if (!event.isPrimary || event.button !== 0) return;
          pointer = event.pointerId;
          startX = previousX = event.clientX;
          startY = event.clientY;
          previousTime = event.timeStamp;
          velocity = 0;
          canvas.setPointerCapture(event.pointerId);
        };
        const pointerMove = (event: PointerEvent) => {
          if (pointer !== event.pointerId) {
            if (event.pointerType === 'mouse' && pointer === null) {
              const bounds = canvas.getBoundingClientRect();
              targetX = -.24 - ((event.clientY - bounds.top) / bounds.height - .5) * .22;
            }
            return;
          }
          const dx = event.clientX - startX;
          const dy = event.clientY - startY;
          if (!dragging) {
            if (Math.abs(dy) > 7 && Math.abs(dy) > Math.abs(dx)) { endDrag(); return; }
            if (Math.abs(dx) < 7 || Math.abs(dx) < Math.abs(dy)) return;
            dragging = true;
            root.classList.add('is-dragging');
          }
          const distance = event.clientX - previousX;
          const delta = Math.max((event.timeStamp - previousTime) / 1000, 1 / 120);
          targetY += distance * .013;
          velocity = Math.max(-2.2, Math.min(2.2, distance * .013 / delta));
          previousX = event.clientX;
          previousTime = event.timeStamp;
        };
        const pointerLeave = () => { if (pointer === null) targetX = -.24; };
        const contextLost = (event: Event) => { event.preventDefault(); removeScene(); };
        const observer = new ResizeObserver(resize);
        canvas.addEventListener('pointerdown', pointerDown);
        canvas.addEventListener('pointermove', pointerMove);
        canvas.addEventListener('pointerleave', pointerLeave);
        canvas.addEventListener('pointerup', endDrag);
        canvas.addEventListener('pointercancel', endDrag);
        canvas.addEventListener('lostpointercapture', endDrag);
        canvas.addEventListener('webglcontextlost', contextLost);
        disposeScene = () => {
          sceneDisposed = true;
          cancelAnimationFrame(frame);
          observer.disconnect();
          endDrag();
          canvas.removeEventListener('pointerdown', pointerDown);
          canvas.removeEventListener('pointermove', pointerMove);
          canvas.removeEventListener('pointerleave', pointerLeave);
          canvas.removeEventListener('pointerup', endDrag);
          canvas.removeEventListener('pointercancel', endDrag);
          canvas.removeEventListener('lostpointercapture', endDrag);
          canvas.removeEventListener('webglcontextlost', contextLost);
          release();
        };
        stage.append(canvas);
        observer.observe(stage);
        resize();
        root.classList.add('is-ready');
        playback();
      } catch {
        // The data remains readable in the static enamel dial if graphics fail.
        removeScene();
        release();
      } finally {
        if (thisGeneration === generation) loading = false;
      }
    };
    const motionChange = () => { if (reduced.matches) removeScene(); else void initialize(); };
    const visibilityChange = () => { if (!document.hidden) void initialize(); playback?.(); };
    const intersection = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) void initialize(); playback?.(); }, { threshold: .05 });
    intersection.observe(root);
    reduced.addEventListener('change', motionChange);
    document.addEventListener('visibilitychange', visibilityChange);
    return () => {
      disposed = true;
      intersection.disconnect();
      reduced.removeEventListener('change', motionChange);
      document.removeEventListener('visibilitychange', visibilityChange);
      removeScene();
    };
  }, []);

  return <div ref={rootRef} className={`semester-instrument ${className}`} role="img" aria-label={`Semester ${Math.round(progress)} percent complete. Day ${day} of ${days}.`}>
    <div className="semester-instrument__halo" aria-hidden="true" />
    <div className="semester-instrument__shadow" aria-hidden="true" />
    <svg className="semester-instrument__fallback" viewBox="0 0 180 180" fill="none" aria-hidden="true">
      <defs>
        <linearGradient id={`${gradientId}-metal`} x1="26" y1="23" x2="151" y2="149"><stop stopColor="#FFDDC1" /><stop offset=".25" stopColor="#C69079" /><stop offset=".5" stopColor="#F0C5A2" /><stop offset=".8" stopColor="#90606B" /><stop offset="1" stopColor="#E8B39B" /></linearGradient>
        <radialGradient id={`${gradientId}-face`} cx="0" cy="0" r="1" gradientTransform="translate(62 51) rotate(46) scale(114)"><stop stopColor="#6B3F58" /><stop offset="1" stopColor="#2C1E2E" /></radialGradient>
      </defs>
      <ellipse cx="89" cy="91" rx="76" ry="62" transform="rotate(-28 89 91)" stroke={`url(#${gradientId}-metal)`} strokeWidth="2" />
      <circle cx="90" cy="91" r="61" fill="#211624" stroke="#563347" strokeWidth="13" />
      <circle cx="90" cy="87" r="61" fill={`url(#${gradientId}-face)`} stroke={`url(#${gradientId}-metal)`} strokeWidth="5" />
      <circle cx="90" cy="87" r="53" stroke="#D3A891" strokeOpacity=".4" strokeWidth="1" />
      <circle cx="90" cy="87" r="58" stroke="#F0AB9B" strokeWidth="3.5" strokeLinecap="round" strokeDasharray={`${progress / 100 * 364.42} 364.42`} transform="rotate(-90 90 87)" />
      {Array.from({ length: 24 }, (_, index) => <path key={index} d={index % 2 ? 'M90 37V40' : 'M90 36V42'} stroke={index % 2 ? '#936576' : '#E1BDA5'} strokeWidth="1" transform={`rotate(${index * 15} 90 87)`} />)}
      <path d="M45 64C51 37 74 29 99 32" stroke="#FFE1C0" strokeWidth="1.5" strokeLinecap="round" opacity=".55" />
    </svg>
    <div ref={stageRef} className="semester-instrument__stage" aria-hidden="true" />
    <div className="semester-instrument__readout" aria-hidden="true"><span className="semester-instrument__eyebrow">TERM COMPLETE</span><strong>{Math.round(progress)}<small>%</small></strong><span className="semester-instrument__day">{day}<span> / </span>{days}<span> DAYS</span></span></div>
    <span className="semester-instrument__hint" aria-hidden="true"><span>↔</span> TURN THE DIAL</span>
  </div>;
}

export default SemesterInstrument;
