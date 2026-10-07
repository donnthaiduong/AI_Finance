'use client';
import { useEffect, useRef, type ReactNode } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';

export type QCard = { key: string; label: string; valid: boolean; hint?: string; nextLabel?: string; content: ReactNode };

/**
 * One small group of related questions at a time. A completed card slides to the next one.
 * Controlled: `index === null` means the last (review) card. Forward moves require a valid card; going back is always allowed.
 */
export default function QuestionFlow({ cards, index, onIndex, ariaLabel }: { cards: QCard[]; index: number | null; onIndex: (i: number) => void; ariaLabel: string }) {
  const last = cards.length - 1;
  const idx = Math.min(index ?? last, last);
  const card = cards[idx];
  const prev = useRef(idx), mounted = useRef(false), stage = useRef<HTMLDivElement>(null), start = useRef<{ x: number; y: number } | null>(null);
  const dir = idx >= prev.current ? 'fwd' : 'back';
  useEffect(() => { prev.current = idx; });
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    stage.current?.querySelector<HTMLElement>('input:not([type=range]),select')?.focus({ preventScroll: true });
  }, [idx]);
  const canGo = (j: number) => cards.slice(0, j).every(c => c.valid);
  const next = () => { if (idx < last && card.valid) onIndex(idx + 1); };
  const back = () => { if (idx > 0) onIndex(idx - 1); };
  return <div className="qflow" role="group" aria-label={ariaLabel}
    onKeyDown={e => { if (e.key === 'Enter' && (e.target as HTMLElement).tagName === 'INPUT' && idx < last && card.valid) { e.preventDefault(); next(); } }}>
    <div className="qprogress">
      <span className="qcount" aria-live="polite">{idx + 1} of {cards.length}</span>
      <div className="qdots">{cards.map((c, j) => <button key={c.key} type="button" className={'qdot' + (j === idx ? ' on' : j < idx ? ' done' : '')} aria-label={c.label} aria-current={j === idx ? 'step' : undefined} disabled={!canGo(j)} onClick={() => onIndex(j)} />)}</div>
    </div>
    <div className="qstage" ref={stage}
      onPointerDown={e => { start.current = (e.target as HTMLElement).closest('input,select,textarea,button,label') ? null : { x: e.clientX, y: e.clientY }; }}
      onPointerUp={e => {
        const s = start.current; start.current = null; if (!s) return;
        const dx = e.clientX - s.x, dy = e.clientY - s.y;
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
        if (dx < 0) next(); else back();
      }}>
      <div key={card.key} className={'qcard ' + dir}>{card.content}</div>
    </div>
    {idx < last && <div className="qnav">
      {idx > 0 ? <button type="button" className="secondary" onClick={back}><ArrowLeft size={16} /> Back</button> : <span />}
      <button type="button" className="primary" disabled={!card.valid} onClick={next}>{card.nextLabel ?? 'Next'} <ArrowRight size={16} /></button>
    </div>}
    {idx < last && !card.valid && card.hint && <p className="small muted qhint">{card.hint}</p>}
  </div>;
}
