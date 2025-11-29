/**
 * Button styling utility module for ChatGPT inline button
 * Most styles are now in content-script.css, this only handles dynamic styling
 */

/**
 * Detects if ChatGPT is currently in dark mode
 * @returns true if dark mode is active, false otherwise
 */
export function isDarkMode(): boolean {
  // ChatGPT uses Tailwind dark mode with 'dark' class on <html>
  return document.documentElement.classList.contains('dark');
}

/**
 * Applies minimal dynamic button styles (most styles are in CSS now)
 * @param button - The button element to style
 */
export function applyButtonStyles(button: HTMLButtonElement): void {
  // Most styles are now in content-script.css
  // This function is kept for backwards compatibility and future dynamic styling needs
  console.log('[Prompt Optimizer] Button styles applied via CSS');
}

/**
 * Sets up a MutationObserver to watch for theme changes
 * This is no longer needed as CSS handles dark mode automatically via html.dark selector
 * Kept for compatibility
 * @param button - The button element to update on theme change
 * @returns MutationObserver instance (can be disconnected if needed)
 */
export function observeThemeChanges(button: HTMLButtonElement): MutationObserver {
  const observer = new MutationObserver(() => {
    const isDark = isDarkMode();
    console.log('[Prompt Optimizer] Theme changed to:', isDark ? 'dark' : 'light');
  });

  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class']
  });

  return observer;
}
