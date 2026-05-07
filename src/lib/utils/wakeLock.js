let wakeLock = null;
let installedListener = false;

async function acquire() {
  if (!('wakeLock' in navigator)) return null;
  try {
    wakeLock = await navigator.wakeLock.request('screen');
    wakeLock.addEventListener('release', () => {
      wakeLock = null;
    });
    return wakeLock;
  } catch (err) {
    console.warn('Wake Lock request failed:', err);
    return null;
  }
}

function ensureReacquireOnVisible() {
  if (installedListener) return;
  installedListener = true;
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && wakeLock === null) {
      acquire();
    }
  });
}

export async function requestWakeLock() {
  ensureReacquireOnVisible();
  return acquire();
}

export async function releaseWakeLock() {
  if (wakeLock) {
    try {
      await wakeLock.release();
    } catch (err) {
      console.warn('Wake Lock release failed:', err);
    }
    wakeLock = null;
  }
}
