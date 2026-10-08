'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { ArrowUpRightIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { SUBJECTS } from '@/lib/config';
import { getOverallAttendance } from '@/lib/calculations';
import { getFocusClass } from '@/lib/focusClass';
import { useAttendance } from '../AttendanceProvider';
import AttendanceButtons from '../AttendanceButtons';
import StudySculpture from '../ui/StudySculpture';

export function NextClass({ now }: { now: Date }) {
  const { sessions, updateSessionStatus } = useAttendance();
  const reduced = useReducedMotion();
  const card = useRef<HTMLDivElement>(null);
  const restoreKeyboardFocus = useRef(false);
  const focus = getFocusClass(sessions, now);
  const session = focus?.session;
  const subject = SUBJECTS.find(s => s.code === session?.subjectCode);
  const attendance = session ? getOverallAttendance(sessions.filter(s => s.subjectCode === session.subjectCode)).percentage : null;

  return (
    <section aria-label="Your next class" className="next-class-section focus-deck">
      <div className="focus-stack-layer stack-layer-back" aria-hidden="true" />
      <div className="focus-stack-layer stack-layer-front" aria-hidden="true" />
      <AnimatePresence mode="wait" initial={false}>
        <motion.div ref={card} key={session?.id ?? 'free-day'} initial={reduced ? false : { opacity: 0, x: 24, rotate: 1.5 }} animate={{ opacity: 1, x: 0, rotate: 0 }} exit={reduced ? undefined : { opacity: 0, x: -30, rotate: -2 }} transition={{ duration: reduced ? 0 : .28, ease: [.22, 1, .36, 1] }} onAnimationComplete={definition => {
          if (typeof definition === 'object' && !Array.isArray(definition) && definition.opacity === 1 && restoreKeyboardFocus.current) {
            restoreKeyboardFocus.current = false;
            card.current?.querySelector<HTMLElement>('button, a[href]')?.focus({ preventScroll: true });
          }
        }}>
          <div className={`focus-card${focus?.kind === 'current' ? ' is-current' : ''}`}>
            <div className="focus-card-top">
              <span className="focus-kicker"><span className={focus?.kind === 'current' ? 'live-dot' : ''} />{focus?.label ?? 'A little breathing room'}</span>
              {attendance !== null && <Link className="focus-attendance" href={`/subjects/${session?.subjectCode}`}>{Math.round(attendance)}% attendance<ArrowUpRightIcon aria-hidden="true" /></Link>}
            </div>
            {session && focus ? <>
              <div className="focus-class-copy">
                <p className="focus-subject-code">{session.subjectCode} <span>/ {session.classType}</span></p>
                <h2>{subject?.name ?? session.subjectCode}</h2>
                <div className="focus-time"><ClockIcon aria-hidden="true" /><span>{session.startTime} – {session.endTime}</span><span className="focus-countdown">{focus.timing}</span></div>
              </div>
              {focus.kind === 'current' && <div className="focus-progress" role="progressbar" aria-label="Class progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(focus.progress)}><motion.span initial={false} animate={{ width: `${focus.progress}%` }} transition={{ duration: reduced ? 0 : .5 }} /></div>}
              {focus.canMark ? <div className="focus-marking">
                <div className="focus-marking-label"><span>{session.status === 'UNMARKED' ? focus.kind === 'catchup' ? 'Were you there?' : 'Mark attendance' : 'Attendance recorded'}</span><AnimatePresence mode="wait" initial={false}><motion.strong key={session.status} initial={reduced ? false : { opacity: 0, scale: .8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} aria-live="polite">{session.status === 'UNMARKED' ? 'One tap to mark' : session.status.toLowerCase()}</motion.strong></AnimatePresence></div>
                <AttendanceButtons status={session.status} onMark={status => {
                  const advances = status === 'CANCELLED' || (focus.kind === 'catchup' && status !== 'UNMARKED');
                  restoreKeyboardFocus.current = advances && Boolean(document.activeElement?.matches(':focus-visible'));
                  updateSessionStatus(session.id, status);
                }} />
              </div> : <Link href="/schedule" className="focus-schedule-link">See your weekly schedule<ArrowUpRightIcon aria-hidden="true" /></Link>}
            </> : <div className="focus-free"><CheckCircleIcon aria-hidden="true" /><h2>You’re all set.</h2><p>Your schedule is clear. Make room for a little focus—or a well-earned break.</p><Link href="/tasks" className="focus-schedule-link">Choose a study goal<ArrowUpRightIcon aria-hidden="true" /></Link></div>}
          </div>
        </motion.div>
      </AnimatePresence>
      <StudySculpture className="focus-sculpture" />
    </section>
  );
}
