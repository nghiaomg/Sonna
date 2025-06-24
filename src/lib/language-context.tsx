import React, { createContext, useState, useContext, useEffect } from 'react';
import type { ReactNode } from 'react';

// Define supported languages
export type Language = 'en' | 'vi' | 'ru' | 'zh' | 'ja' | 'ko';

// Define translation keys structure
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
  refresh: string;
  loading: string;
  change: string;
  
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
  openFolder: string;
  openInBrowser: string;
  
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
  
  // Language names
  english: string;
  vietnamese: string;
  russian: string;
  chinese: string;
  japanese: string;
  korean: string;
  
  // Port Settings
  portSettings: string;
  portSettingsDesc: string;
  defaultPort: string;
  reset: string;
  save: string;
  portUpdated: string;
  failedToUpdatePort: string;
  
  // Path Settings
  installPathSettings: string;
  installPathDesc: string;
  installPath: string;
  pathRequired: string;
  selectFolder: string;
  cancel: string;
  saving: string;
  confirmPathChange: string;
  pathChangeConfirmDesc: string;
  changingPath: string;
  changingPathDesc: string;
  toNewPath: string;
  back: string;
  moveFiles: string;
  moving: string;
  dontMove: string;
  
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

// Create language context
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationKey;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Default language
const defaultLanguage: Language = 'en';

// Get stored language from localStorage
const getStoredLanguage = (): Language => {
  if (typeof window !== 'undefined') {
    const stored = localStorage.getItem('sonna-language') as Language;
    return stored && ['en', 'vi', 'ru', 'zh', 'ja', 'ko'].includes(stored) ? stored : defaultLanguage;
  }
  return defaultLanguage;
};

// Provider component
interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(defaultLanguage);
  const [translations, setTranslations] = useState<TranslationKey | null>(null);

  // Load translations
  useEffect(() => {
    const loadTranslations = async () => {
      try {
        const storedLang = getStoredLanguage();
        setLanguage(storedLang);
        
        const module = await import(`./translations/${storedLang}.json`);
        setTranslations(module.default);
        
        // Store language preference
        localStorage.setItem('sonna-language', storedLang);
      } catch (error) {
        console.error('Failed to load translations:', error);
        // Fallback to English
        const fallback = await import('./translations/en.json');
        setTranslations(fallback.default);
      }
    };
    
    loadTranslations();
  }, []);

  // Update translations when language changes
  const handleLanguageChange = async (newLanguage: Language) => {
    try {
      const module = await import(`./translations/${newLanguage}.json`);
      setTranslations(module.default);
      setLanguage(newLanguage);
      
      // Store language preference
      localStorage.setItem('sonna-language', newLanguage);
    } catch (error) {
      console.error('Failed to load translations:', error);
    }
  };

  // Provide empty translations while loading
  const emptyTranslations: TranslationKey = {
    appTitle: 'Sonna',
    appSubtitle: 'Loading...',
    services: 'Services',
    install: 'Install',
    cleanup: 'Cleanup',
    settings: 'Settings',
    startAll: 'Start All',
    stopAll: 'Stop All',
    start: 'Start',
    stop: 'Stop',
    install_button: 'Install',
    delete: 'Delete',
    cleanupAll: 'Cleanup All',
    resetStatus: 'Reset Status',
    refresh: 'Refresh',
    loading: 'Loading...',
    change: 'Change',
    running: 'Running',
    stopped: 'Stopped',
    notInstalled: 'Not Installed',
    installed: 'Installed',
    installing: 'Installing...',
    deleting: 'Deleting...',
    serviceControl: 'Service Control',
    serviceControlDesc: 'Manage your local development services',
    localProjects: 'Local Projects',
    localProjectsDesc: 'Projects detected in your www folder',
    noProjectsFound: 'No projects found',
    noProjectsFoundDesc: 'Create a new project or add one to your www folder',
    openFolder: 'Open Folder',
    openInBrowser: 'Open in Browser',
    serviceInstallation: 'Service Installation',
    serviceInstallationDesc: 'Install and configure development services',
    initializingSonna: 'Initializing Sonna',
    preparingDownload: 'Preparing Download',
    downloading: 'Downloading',
    extracting: 'Extracting',
    setup: 'Setup',
    completed: 'Completed',
    error: 'Error',
    applicationCleanup: 'Application Cleanup',
    applicationCleanupDesc: 'Free up disk space by removing unused services',
    installedServices: 'Installed Services',
    estimatedSize: 'Estimated Size',
    cleaning: 'Cleaning...',
    warning: 'Warning',
    warningMessage: 'This will permanently delete the selected services and all their data',
    noServicesInstalled: 'No services installed',
    noServicesInstalledDesc: 'Install services from the Install tab',
    individualServices: 'Individual Services',
    settingsTitle: 'Settings',
    language: 'Language',
    theme: 'Theme',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    general: 'General',
    generalDesc: 'Application settings and preferences',
    appearance: 'Appearance',
    appearanceDesc: 'Customize the look and feel of Sonna',
    english: 'English',
    vietnamese: 'Vietnamese',
    russian: 'Russian',
    chinese: 'Chinese',
    japanese: 'Japanese',
    korean: 'Korean',
    portSettings: 'Port Settings',
    portSettingsDesc: 'Configure service ports',
    defaultPort: 'Default Port',
    reset: 'Reset',
    save: 'Save',
    portUpdated: 'Port updated successfully',
    failedToUpdatePort: 'Failed to update port',
    installPathSettings: 'Installation Path',
    installPathDesc: 'Change where Sonna installs services',
    installPath: 'Install Path',
    pathRequired: 'Path is required',
    selectFolder: 'Select Folder',
    cancel: 'Cancel',
    saving: 'Saving...',
    confirmPathChange: 'Confirm Path Change',
    pathChangeConfirmDesc: 'Do you want to move existing files to the new location?',
    changingPath: 'Changing Path',
    changingPathDesc: 'Updating installation path to',
    toNewPath: 'to new path',
    back: 'Back',
    moveFiles: 'Move Files',
    moving: 'Moving...',
    dontMove: 'Don\'t Move',
    failedToLoad: 'Failed to load',
    failedToToggle: 'Failed to toggle service',
    failedToStart: 'Failed to start service',
    failedToStop: 'Failed to stop service',
    failedToDownload: 'Failed to download',
    failedToDelete: 'Failed to delete',
    failedToCleanup: 'Failed to cleanup',
    hideToTray: 'Hide to System Tray',
    quitApp: 'Quit Application'
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage: handleLanguageChange,
        t: translations || emptyTranslations
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

// Custom hook to use language context
export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}; 