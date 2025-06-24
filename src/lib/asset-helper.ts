/**
 * Helper functions to handle asset paths in both development and production environments
 */

/**
 * Get the correct path to a static asset based on the current environment
 * @param assetPath - The path to the asset (e.g., '/logo.png')
 * @returns The correct path to use in the current environment
 */
export function getAssetPath(assetPath: string): string {
  // In development, assets are served from the public folder
  // In production, assets are in the root of the dist folder
  return import.meta.env.DEV ? assetPath : `.${assetPath}`;
}

/**
 * Get the correct path to the logo image
 * @returns The correct path to the logo image
 */
export function getLogoPath(): string {
  return getAssetPath('/logo.png');
}

/**
 * Get the correct path to the favicon
 * @returns The correct path to the favicon
 */
export function getFaviconPath(): string {
  return getAssetPath('/logo.ico');
} 