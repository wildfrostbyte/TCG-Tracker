// "Add to Home Screen": detect the device/browser and say exactly how to install.
// Android and desktop Chrome/Edge can show the real install dialog from a button (beforeinstallprompt).

let deferredPrompt = null;

addEventListener('beforeinstallprompt', (event) => {
  event.preventDefault(); // we show our own prompt instead of the browser's mini-bar
  deferredPrompt = event;
});
addEventListener('appinstalled', () => {
  deferredPrompt = null;
});

export function isInstalled() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

export function canPromptInstall() {
  return !!deferredPrompt;
}

export async function promptInstall() {
  if (!deferredPrompt) return false;
  const prompt = deferredPrompt;
  deferredPrompt = null;
  prompt.prompt();
  const { outcome } = await prompt.userChoice;
  return outcome === 'accepted';
}

// 'ios-safari' | 'ios-other' | 'in-app' | 'android' | 'desktop-chromium' | 'mac-safari' | 'unsupported'
export function detectPlatform(ua = navigator.userAgent) {
  const iOS = /iPhone|iPad|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1); // iPadOS says "Mac"
  const inApp = /FBAN|FBAV|Instagram|Line\/|GSA\/|Snapchat|LinkedInApp|Twitter|MicroMessenger|TikTok/.test(ua);
  if (iOS) {
    if (inApp) return 'in-app';
    return /CriOS|FxiOS|EdgiOS|OPiOS/.test(ua) ? 'ios-other' : 'ios-safari';
  }
  if (/Android/.test(ua)) return inApp ? 'in-app' : 'android';
  if (/Firefox\//.test(ua)) return 'unsupported';
  if (/Edg\/|Chrome\//.test(ua)) return 'desktop-chromium';
  if (/Macintosh/.test(ua) && /Safari\//.test(ua)) return 'mac-safari';
  return 'unsupported';
}

const PHONE_WHY = 'It opens full screen, and your phone keeps your collection safe even if you don’t visit for a while.';

// Icons: 'share' (iOS share), 'plus' (Add to Home Screen), or a short glyph like '⋮'.
export function installGuide(platform) {
  switch (platform) {
    case 'ios-safari':
      return {
        label: 'iPhone · Safari',
        title: 'Put SetGaps on your Home Screen',
        why: 'It opens full screen, and your iPhone won’t clear your collection after a week away.',
        steps: [['Tap Share in Safari’s toolbar', 'share'], ['Scroll down, tap Add to Home Screen', 'plus'], ['Tap Add', '']],
        hint: 'Share is in Safari’s bottom toolbar ↓',
      };
    case 'ios-other':
      return {
        label: 'iPhone · Chrome, Edge or Firefox',
        title: 'Put SetGaps on your Home Screen',
        why: 'It opens full screen, and your iPhone won’t clear your collection after a week away.',
        steps: [['Tap Share in the address bar', 'share'], ['Tap Add to Home Screen', 'plus'], ['Tap Add', '']],
      };
    case 'in-app':
      return {
        label: 'Opened inside another app',
        title: 'Open in your browser to install',
        why: 'You opened this inside another app, which can’t add it to your Home Screen.',
        steps: [['Tap ⋯ (or the compass) in the corner', '⋯'], ['Choose Open in Safari or Open in Chrome', ''], ['You’ll see the install steps there', '']],
      };
    case 'android':
      return {
        label: 'Android',
        title: 'Install SetGaps',
        why: PHONE_WHY,
        steps: [['Tap ⋮ in the browser’s top corner', '⋮'], ['Tap Install app or Add to Home screen', '']],
        oneTap: true,
      };
    case 'desktop-chromium':
      return {
        label: 'Chrome / Edge on a computer',
        title: 'Install SetGaps on this computer',
        why: 'It opens in its own window with its own icon, and works offline.',
        steps: [['Click the install icon at the right of the address bar', '⊕'], ['Or open the browser menu and choose Install SetGaps', '⋮']],
        oneTap: true,
      };
    case 'mac-safari':
      return {
        label: 'Safari on a Mac',
        title: 'Add SetGaps to your Dock',
        why: 'It opens in its own window with its own icon, and works offline.',
        steps: [['In the menu bar, choose File', ''], ['Choose Add to Dock', '']],
      };
    default:
      return null;
  }
}
