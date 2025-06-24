export type Language = 'en' | 'vi';

export interface TranslationKey {
  // App general
  appTitle: string;
  appSubtitle: string;
  
  // Navigation
  services: string;
  install: string;
  cleanup: string;
  settings: string;
  
  // Buttons
  startAll: string;
  stopAll: string;
  start: string;
  stop: string;
  install_button: string;
  delete: string;
  cleanupAll: string;
  resetStatus: string;
  
  // Service states
  running: string;
  stopped: string;
  notInstalled: string;
  installed: string;
  installing: string;
  deleting: string;
  
  // Service Management
  serviceControl: string;
  serviceControlDesc: string;
  localProjects: string;
  localProjectsDesc: string;
  noProjectsFound: string;
  noProjectsFoundDesc: string;
  
  // Installation
  serviceInstallation: string;
  serviceInstallationDesc: string;
  initializingSonna: string;
  preparingDownload: string;
  downloading: string;
  extracting: string;
  setup: string;
  completed: string;
  error: string;
  
  // Cleanup
  applicationCleanup: string;
  applicationCleanupDesc: string;
  installedServices: string;
  estimatedSize: string;
  cleaning: string;
  warning: string;
  warningMessage: string;
  noServicesInstalled: string;
  noServicesInstalledDesc: string;
  individualServices: string;
  
  // Settings
  settingsTitle: string;
  language: string;
  theme: string;
  lightMode: string;
  darkMode: string;
  general: string;
  generalDesc: string;
  appearance: string;
  appearanceDesc: string;
  
  // Messages
  failedToLoad: string;
  failedToToggle: string;
  failedToStart: string;
  failedToStop: string;
  failedToDownload: string;
  failedToDelete: string;
  failedToCleanup: string;
  
  // Window controls
  hideToTray: string;
  quitApp: string;
}

export const defaultLanguage: Language = 'en';

export const getStoredLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sonna-language') as Language;
    return stored && ['en', 'vi'].includes(stored) ? stored : defaultLanguage;
  }
  return defaultLanguage;
};

export const setStoredLanguage = (language: Language): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sonna-language', language);
  }
}; 