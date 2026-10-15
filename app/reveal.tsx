'use client';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

/** Rises each [data-reveal] part once as it enters, staggered within its chapter. Content stays visible if this never runs. */
export default function Reveal() {
  const path = usePathname();
  useEffect(() => {
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Inner pages are not hand-marked: every direct child of a section rises.
    document.querySelectorAll<HTMLElement>('.site-main > section > *').forEach(el => el.setAttribute('data-reveal', ''));
    const items = [...document.querySelectorAll<HTMLElement>('[data-reveal]')];
    document.documentElement.classList.add('reveal-ready');
    const io = new IntersectionObserver(entries => entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target as HTMLElement, i = items.filter(x => x.parentElement === el.parentElement).indexOf(el);
      el.style.transitionDelay = `${Math.min(i, 4) * 80}ms`;
      el.classList.add('in');
      io.unobserve(el);
    }), { threshold: 0.12 });
    items.forEach(el => io.observe(el));
    return () => { io.disconnect(); document.documentElement.classList.remove('reveal-ready'); items.forEach(el => el.classList.remove('in')); };
  }, [path]);
  return null;
}
