
// --- Browser Action Utilities for Voice Control ---

/**
 * Adds a temporary highlight effect to an HTML element.
 * @param element The element to highlight.
 */
export const highlightElement = (element: HTMLElement) => {
  const originalOutline = element.style.outline;
  const originalBoxShadow = element.style.boxShadow;
  element.style.outline = '2px solid #00ffff';
  element.style.boxShadow = '0 0 15px rgba(0, 255, 255, 0.5)';
  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.boxShadow = originalBoxShadow;
  }, 1500);
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
  try {
      const element = document.querySelector<HTMLElement>(selector);
      if (element) {
        highlightElement(element);
        element.click();
        return { success: true, message: `Clicked element: "${selector}".` };
      }
      return { success: false, message: `Element "${selector}" not found.` };
  } catch (e) {
      return { success: false, message: `Invalid selector: ${selector}` };
  }
};

/**
 * Types text into an input field.
 * @param text - The text to type.
 * @param selector - The CSS selector of the input field.
 * @returns An object indicating the result of the operation.
 */
export const typeText = (text: string, selector: string): { success: boolean; message: string } => {
  try {
      const element = document.querySelector<HTMLInputElement | HTMLTextAreaElement>(selector);
      if (element) {
        highlightElement(element);
        element.focus();
        element.value = text;
        // Dispatch input event to trigger React/Framework listeners
        const event = new Event('input', { bubbles: true });
        element.dispatchEvent(event);
        return { success: true, message: `Typed "${text}" into "${selector}".` };
      }
      return { success: false, message: `Input "${selector}" not found.` };
  } catch (e) {
      return { success: false, message: `Invalid selector: ${selector}` };
  }
};

/**
 * Simulates pressing a specific key (e.g., Enter) on an element or the window.
 * @param key - The key to press (e.g., 'Enter', 'Escape').
 * @param selector - Optional selector to focus before pressing.
 */
export const pressKey = (key: string, selector?: string): { success: boolean, message: string } => {
    try {
        let element: HTMLElement | null = document.body;
        
        if (selector) {
            element = document.querySelector<HTMLElement>(selector);
            if (!element) return { success: false, message: `Element "${selector}" not found for key press.` };
            highlightElement(element);
            element.focus();
        }

        const keyEvent = new KeyboardEvent('keydown', {
            key: key,
            code: key,
            bubbles: true,
            cancelable: true,
            view: window
        });
        
        element.dispatchEvent(keyEvent);
        
        // Specific handling for 'Enter' on forms if the event didn't trigger native submit
        if (key === 'Enter' && element instanceof HTMLInputElement && element.form) {
             element.form.requestSubmit();
        }

        return { success: true, message: `Simulated key press: [${key}].` };
    } catch (e) {
        return { success: false, message: `Failed to press key: ${key}` };
    }
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
        'vscode': 'vscode://file', 
        'chatgpt': 'https://chat.openai.com',
        'claude': 'https://claude.ai'
    };

    const url = APP_URL_MAP[appName.toLowerCase()];
    if (url) {
        try {
            window.open(url, '_blank', 'noopener,noreferrer');
            return { success: true, message: `Launching ${appName}...` };
        } catch (e) {
            console.error("Failed to open URL:", e);
            return { success: false, message: `Popup blocked for ${appName}.` };
        }
    }
    return { success: false, message: `Application "${appName}" unknown.` };
};
