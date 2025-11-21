
// --- Browser Action Utilities for Voice Control ---

/**
 * Adds a temporary highlight effect to an HTML element.
 * @param element The element to highlight.
 */
export const highlightElement = (element: HTMLElement) => {
  const originalOutline = element.style.outline;
  const originalBoxShadow = element.style.boxShadow;
  element.style.outline = '3px solid #00ffff';
  element.style.boxShadow = '0 0 15px #00ffff';
  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.boxShadow = originalBoxShadow;
  }, 2000);
};

/**
 * Navigates the browser history or reloads the page.
 * @param direction - The direction to navigate: 'back', 'forward', or 'home'.
 * @returns An object indicating the result of the operation.
 */
export const navigate = (direction: 'back' | 'forward' | 'home'): { success: boolean; message: string } => {
  if (direction === 'back') window.history.back();
  else if (direction === 'forward') window.history.forward();
  else if (direction === 'home') window.location.reload();
  return { success: true, message: `Navigated ${direction}.` };
};

/**
 * Scrolls the window up or down.
 * @param direction - The direction to scroll: 'up' or 'down'.
 * @param pixels - Optional number of pixels to scroll. Defaults to 80% of window height.
 * @returns An object indicating the result of the operation.
 */
export const scroll = (direction: 'up' | 'down', pixels: number = window.innerHeight * 0.8): { success: boolean; message: string } => {
  const scrollAmount = direction === 'up' ? -pixels : pixels;
  window.scrollBy({ top: scrollAmount, left: 0, behavior: 'smooth' });
  return { success: true, message: `Scrolled ${direction} by ${Math.abs(scrollAmount)}px.` };
};

/**
 * Clicks an element on the page identified by a CSS selector.
 * @param selector - The CSS selector of the element to click.
 * @returns An object indicating the result of the operation.
 */
export const click = (selector: string): { success: boolean; message: string } => {
  const element = document.querySelector<HTMLElement>(selector);
  if (element) {
    highlightElement(element);
    element.click();
    return { success: true, message: `Clicked element with selector "${selector}".` };
  }
  return { success: false, message: `Element with selector "${selector}" not found.` };
};

/**
 * Types text into an input field.
 * @param text - The text to type.
 * @param selector - The CSS selector of the input field.
 * @returns An object indicating the result of the operation.
 */
export const typeText = (text: string, selector: string): { success: boolean; message: string } => {
  const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
  if (element) {
    highlightElement(element);
    element.focus();
    element.value = text;
    // Dispatch input event to trigger any listeners (e.g., in React)
    element.dispatchEvent(new Event('input', { bubbles: true }));
    return { success: true, message: `Typed "${text}" into element with selector "${selector}".` };
  }
  return { success: false, message: `Input element with selector "${selector}" not found.` };
};

/**
 * Opens a known web application in a new tab.
 * @param appName The name of the application to open.
 * @returns An object indicating the result of the operation.
 */
export const openApplication = (appName: string): { success: boolean, message: string } => {
    const APP_URL_MAP: { [key: string]: string } = {
        'youtube': 'https://www.youtube.com',
        'spotify': 'https://open.spotify.com',
        'google': 'https://www.google.com',
        'gmail': 'https://mail.google.com',
        'github': 'https://github.com',
        'reddit': 'https://www.reddit.com',
        'twitter': 'https://twitter.com',
        'x': 'https://x.com',
        'amazon': 'https://www.amazon.com',
        'wikipedia': 'https://www.wikipedia.org',
        'whatsapp': 'https://web.whatsapp.com',
        'vscode': 'vscode://file', // Will prompt to open desktop app
    };

    const url = APP_URL_MAP[appName.toLowerCase()];
    if (url) {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
            return { success: true, message: `Opening ${appName} in a new tab.` };
        } catch (e) {
            console.error("Failed to open URL:", e);
            return { success: false, message: `Could not open ${appName}. Browser may be blocking pop-ups.` };
        }
    }
    return { success: false, message: `Application "${appName}" is not recognized.` };
};
