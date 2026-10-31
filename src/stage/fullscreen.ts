// Full screen, asked for from the click that starts the check or a task.

/** Asks for full screen and carries on in a window if it's refused. */
export function wantFullscreen(): void {
  try {
    if (!document.fullscreenElement && document.fullscreenEnabled) document.documentElement.requestFullscreen().catch(() => {});
  } catch { /* not available in this view */ }
}

/** Goes full screen; resolves false if the browser won't. */
export async function goFullscreen(): Promise<boolean> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
    return true;
  } catch {
    return false;
  }
}
