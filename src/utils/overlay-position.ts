export interface OverlayPosition {
  left: number;
  top: number;
}

export function restoreOverlayPositionInViewport(
  savedPosition: unknown,
  viewportWidth: number,
  viewportHeight: number,
  overlayWidth: number,
  overlayHeight: number,
  margin = 8
): OverlayPosition | null {
  if (!savedPosition || typeof savedPosition !== 'object') return null;

  const saved = savedPosition as Record<string, unknown>;
  if (typeof saved.top !== 'number' || !Number.isFinite(saved.top)) return null;

  let left: number;
  if (typeof saved.fromRight === 'number' && Number.isFinite(saved.fromRight)) {
    left = viewportWidth - saved.fromRight - overlayWidth;
  } else if (typeof saved.left === 'number' && Number.isFinite(saved.left)) {
    left = saved.left;
  } else {
    return null;
  }

  const maxLeft = Math.max(margin, viewportWidth - overlayWidth - margin);
  const maxTop = Math.max(margin, viewportHeight - overlayHeight - margin);

  return {
    left: Math.min(Math.max(left, margin), maxLeft),
    top: Math.min(Math.max(saved.top, margin), maxTop),
  };
}
