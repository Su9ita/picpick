let iconGhosted = false;

export function applyIconGhostState(): void {
  document.getElementById('picpick-btn')?.classList.toggle('picpick-ghosted', iconGhosted);
  document.getElementById('picpick-batch-btn')?.classList.toggle('pb-ghosted', iconGhosted);
}

export function toggleIconGhostState(): void {
  iconGhosted = !iconGhosted;
  applyIconGhostState();
}
