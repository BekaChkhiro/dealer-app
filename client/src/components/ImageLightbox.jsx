import { useEffect, useState, useCallback, useRef } from 'react';
import './ImageLightbox.css';

/**
 * Full-screen image viewer with zoom (wheel / click), pan (drag when zoomed),
 * and prev/next navigation (arrows + keyboard). Dependency-free.
 *
 * Props:
 *   images: array of { url, name? } (or plain URL strings)
 *   index: current index
 *   onClose(): close the viewer
 *   onIndexChange(nextIndex): navigate
 */
export default function ImageLightbox({ images = [], index = 0, onClose, onIndexChange }) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragRef = useRef(null);

  const count = images.length;
  const item = images[index];
  const url = typeof item === 'string' ? item : item?.url;
  const name = typeof item === 'string' ? '' : (item?.name || '');

  const resetZoom = useCallback(() => { setScale(1); setOffset({ x: 0, y: 0 }); }, []);

  const go = useCallback((dir) => {
    if (count < 2) return;
    resetZoom();
    onIndexChange((index + dir + count) % count);
  }, [count, index, onIndexChange, resetZoom]);

  useEffect(() => { resetZoom(); }, [index, resetZoom]);

  // keyboard
  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === '+' || e.key === '=') setScale((s) => Math.min(5, s + 0.5));
      else if (e.key === '-') setScale((s) => Math.max(1, s - 0.5));
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, onClose]);

  // lock body scroll while open
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, []);

  function onWheel(e) {
    e.preventDefault();
    setScale((s) => {
      const next = Math.min(5, Math.max(1, s - e.deltaY * 0.002));
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function onImgClick(e) {
    e.stopPropagation();
    setScale((s) => {
      const next = s > 1 ? 1 : 2;
      if (next === 1) setOffset({ x: 0, y: 0 });
      return next;
    });
  }

  function onPointerDown(e) {
    if (scale <= 1) return;
    dragRef.current = { startX: e.clientX, startY: e.clientY, ox: offset.x, oy: offset.y };
  }
  function onPointerMove(e) {
    if (!dragRef.current) return;
    setOffset({
      x: dragRef.current.ox + (e.clientX - dragRef.current.startX),
      y: dragRef.current.oy + (e.clientY - dragRef.current.startY),
    });
  }
  function onPointerUp() { dragRef.current = null; }

  if (!url) return null;

  return (
    <div className="lightbox-overlay" onClick={onClose}>
      <button className="lightbox-close" onClick={onClose} aria-label="Close">×</button>

      {count > 1 && (
        <button
          className="lightbox-nav lightbox-prev"
          onClick={(e) => { e.stopPropagation(); go(-1); }}
          aria-label="Previous"
        >‹</button>
      )}

      <div
        className="lightbox-stage"
        onClick={(e) => e.stopPropagation()}
        onWheel={onWheel}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
      >
        <img
          src={url}
          alt={name}
          className="lightbox-img"
          draggable={false}
          onClick={onImgClick}
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
            cursor: scale > 1 ? 'grab' : 'zoom-in',
          }}
        />
      </div>

      {count > 1 && (
        <button
          className="lightbox-nav lightbox-next"
          onClick={(e) => { e.stopPropagation(); go(1); }}
          aria-label="Next"
        >›</button>
      )}

      <div className="lightbox-footer" onClick={(e) => e.stopPropagation()}>
        <div className="lightbox-zoom">
          <button onClick={() => setScale((s) => Math.max(1, s - 0.5))} aria-label="Zoom out">−</button>
          <span>{Math.round(scale * 100)}%</span>
          <button onClick={() => setScale((s) => Math.min(5, s + 0.5))} aria-label="Zoom in">+</button>
        </div>
        {count > 1 && <div className="lightbox-counter">{index + 1} / {count}</div>}
        {name && <div className="lightbox-name" title={name}>{name}</div>}
      </div>
    </div>
  );
}
