import { useLocation } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';

export function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const [displayed, setDisplayed] = useState(children);
  const [phase, setPhase] = useState<'idle' | 'out' | 'in'>('idle');
  const pendingChildren = useRef(children);
  const pendingKey = useRef(pathname);

  useEffect(() => {
    if (pathname === pendingKey.current && children === displayed) return;

    pendingChildren.current = children;
    pendingKey.current = pathname;

    setPhase('out');
    const t = setTimeout(() => {
      setDisplayed(pendingChildren.current);
      setPhase('in');
      const t2 = setTimeout(() => setPhase('idle'), 220);
      return () => clearTimeout(t2);
    }, 120);
    return () => clearTimeout(t);
  }, [pathname, children]); // eslint-disable-line

  const style: React.CSSProperties =
    phase === 'out'  ? { opacity: 0, transform: 'translateY(6px)', transition: 'opacity 120ms ease, transform 120ms ease' } :
    phase === 'in'   ? { opacity: 0, transform: 'translateY(-4px)' } :
    phase === 'idle' ? { opacity: 1, transform: 'none', transition: 'opacity 200ms ease, transform 200ms ease' } :
    {};

  return <div style={style}>{displayed}</div>;
}
