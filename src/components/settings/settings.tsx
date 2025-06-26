import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Globe, Monitor, Sun, Moon, FolderCog, Server, RefreshCw, AlertTriangle, CheckCircle, Database, Search } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import type { Language } from '@/lib/language-context';
import { PathSettingsDialog } from '@/components/settings/path-settings-dialog';
import { SearchableSelect } from '@/components/ui/select';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [installPath, setInstallPath] = useState('C:/sonna');
  const [pathSettingsOpen, setPathSettingsOpen] = useState(false);
  const [pathUpdateLoading, setPathUpdateLoading] = useState(false);
  const [pathUpdateMessage, setPathUpdateMessage] = useState<{ text: string, type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [pathDialogOpen, setPathDialogOpen] = useState(false);
  const [isUpdatingConfigs, setIsUpdatingConfigs] = useState(false);
  const [configUpdateResult, setConfigUpdateResult] = useState<{ success: boolean; message: string } | null>(null);
  const [isRegeneratingApache, setIsRegeneratingApache] = useState(false);
  const [apacheRegenResult, setApacheRegenResult] = useState<{ success: boolean; message: string; phpDetected?: boolean } | null>(null);
  const [isFixingPHPWarnings, setIsFixingPHPWarnings] = useState(false);
  const [phpWarningsResult, setPHPWarningsResult] = useState<{ success: boolean; message: string; fixedCount?: number } | null>(null);

  // Load current installation path
  useEffect(() => {
    loadInstallationPath();
  }, []);

  const loadInstallationPath = async () => {
    if (window.electronAPI) {
      try {
        const api = window.electronAPI as any;
        if (api.getSonnaConfig) {
          const configResult = await api.getSonnaConfig();
          if (configResult.success && configResult.config) {
            setInstallPath(configResult.config.installPath || 'C:/sonna');
          }
        }
      } catch (error) {
        console.error('Failed to load installation path:', error);
      }
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage as Language);
  };

  const handlePathChange = async (newPath: string, moveFiles: boolean) => {
    if (window.electronAPI) {
      setPathUpdateLoading(true);
      setPathUpdateMessage({ text: '', type: '' });

      try {
        // Use type assertion to tell TypeScript that the method exists
        const api = window.electronAPI as any;
        const result = await api.changeInstallationPath(newPath, moveFiles);

        if (result.success) {
          setInstallPath(result.newPath);
          setPathUpdateMessage({
            text: `Installation path updated to ${result.newPath}`,
            type: 'success'
          });
        } else {
          throw new Error(result.message);
        }
      } catch (error) {
        console.error('Failed to change installation path:', error);
        setPathUpdateMessage({
          text: String(error),
          type: 'error'
        });
        throw error;
      } finally {
        setPathUpdateLoading(false);
      }
    } else {
      throw new Error('Electron API not available');
    }
  };

  // Handle web server configuration update
  const handleUpdateWebServerConfigs = async () => {
    setIsUpdatingConfigs(true);
    setConfigUpdateResult(null);

    try {
      if (window.electronAPI && window.electronAPI.updateWebServerConfigs) {
        const result = await window.electronAPI.updateWebServerConfigs();
        setConfigUpdateResult(result);

        if (result.success) {
          console.log('Web server configurations updated successfully');
        } else {
          console.error('Configuration update failed:', result.message);
        }
      }
    } catch (error) {
      console.error('Failed to update web server configurations:', error);
      setConfigUpdateResult({
        success: false,
        message: `Failed to update configurations: ${error}`
      });
    } finally {
      setIsUpdatingConfigs(false);
    }
  };

  // Handle Apache configuration regeneration with PHP auto-detection
  const handleRegenerateApacheConfig = async () => {
    setIsRegeneratingApache(true);
    setApacheRegenResult(null);

    try {
      if (window.electronAPI) {
        const api = window.electronAPI as any;
        if (api.regenerateApacheConfig) {
          const result = await api.regenerateApacheConfig();
          setApacheRegenResult(result);

          if (result.success) {
            console.log('Apache configuration regenerated:', result.message);
          } else {
            console.error('Apache regeneration failed:', result.message);
          }
        } else {
          throw new Error('regenerateApacheConfig method not available');
        }
      }
    } catch (error) {
      console.error('Failed to regenerate Apache config:', error);
      setApacheRegenResult({
        success: false,
        message: `Failed to regenerate Apache config: ${error}`,
        phpDetected: false
      });
    } finally {
      setIsRegeneratingApache(false);
    }
  };

  // Handle PHP warnings fix
  const handleFixPHPWarnings = async () => {
    setIsFixingPHPWarnings(true);
    setPHPWarningsResult(null);

    try {
      if (window.electronAPI) {
        const api = window.electronAPI as any;
        if (api.fixPhpWarnings) {
          const result = await api.fixPhpWarnings();
          setPHPWarningsResult(result);

          if (result.success) {
            console.log('PHP warnings fixed:', result.message);
          } else {
            console.error('PHP warnings fix failed:', result.message);
          }
        } else {
          throw new Error('fixPhpWarnings method not available');
        }
      }
    } catch (error) {
      console.error('Failed to fix PHP warnings:', error);
      setPHPWarningsResult({
        success: false,
        message: `Failed to fix PHP warnings: ${error}`,
        fixedCount: 0
      });
    } finally {
      setIsFixingPHPWarnings(false);
    }
  };

  const languageOptions = [
    { value: 'en', label: t.english || 'English', flag: '🇺🇸' },
    { value: 'vi', label: t.vietnamese || 'Tiếng Việt', flag: '🇻🇳' },
    { value: 'ru', label: t.russian || 'Русский', flag: '🇷🇺' },
    { value: 'zh', label: t.chinese || '中文', flag: '🇨🇳' },
    { value: 'ja', label: t.japanese || '日本語', flag: '🇯🇵' },
    { value: 'ko', label: t.korean || '한국어', flag: '🇰🇷' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{t.settings}</h2>
        <p className="text-muted-foreground">Manage Sonna application settings and configurations</p>
      </div>

      {/* Web Server Configuration */}
      <Card className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <Server className="w-5 h-5" />
          <h3 className="text-lg font-semibold">Web Server Configuration</h3>
        </div>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-3">
              Update Apache and Nginx configurations to fix phpMyAdmin routing issues.
              Use this if phpMyAdmin returns 404 errors after migration.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Button
                onClick={handleUpdateWebServerConfigs}
                disabled={isUpdatingConfigs}
              >
                {isUpdatingConfigs ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Server className="w-4 h-4 mr-2" />
                    Update Configs
                  </>
                )}
              </Button>

              <Button
                onClick={handleRegenerateApacheConfig}
                disabled={isRegeneratingApache}
                variant="outline"
              >
                {isRegeneratingApache ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Regenerating...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Apache + PHP
                  </>
                )}
              </Button>

              <Button
                onClick={handleFixPHPWarnings}
                disabled={isFixingPHPWarnings}
                variant="outline"
              >
                {isFixingPHPWarnings ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Fixing...
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 mr-2" />
                    Fix PHP Warnings
                  </>
                )}
              </Button>
            </div>

            {configUpdateResult && (
              <div className={`mt-3 p-3 rounded-md ${configUpdateResult.success
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                }`}>
                <div className="flex items-center">
                  {configUpdateResult.success ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {configUpdateResult.success ? 'Success' : 'Error'}
                  </span>
                </div>
                <p className="text-sm mt-1">{configUpdateResult.message}</p>
              </div>
            )}

            {apacheRegenResult && (
              <div className={`mt-3 p-3 rounded-md ${apacheRegenResult.success
                ? 'bg-blue-50 border border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-200'
                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                }`}>
                <div className="flex items-center">
                  {apacheRegenResult.success ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {apacheRegenResult.success ?
                      (apacheRegenResult.phpDetected ? '🐘 PHP Detected' : '⚠️ PHP Required') :
                      'Error'}
                  </span>
                </div>
                <p className="text-sm mt-1">{apacheRegenResult.message}</p>
                {apacheRegenResult.success && !apacheRegenResult.phpDetected && (
                  <p className="text-sm mt-1 italic">
                    Install PHP through Sonna to enable phpMyAdmin functionality
                  </p>
                )}
              </div>
            )}

            {phpWarningsResult && (
              <div className={`mt-3 p-3 rounded-md ${phpWarningsResult.success
                ? 'bg-green-50 border border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-200'
                : 'bg-red-50 border border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-200'
                }`}>
                <div className="flex items-center">
                  {phpWarningsResult.success ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">
                    {phpWarningsResult.success ?
                      (phpWarningsResult.fixedCount && phpWarningsResult.fixedCount > 0 ?
                        `🐘 Fixed ${phpWarningsResult.fixedCount} PHP config(s)` :
                        '✅ All PHP configs OK') :
                      'Error'}
                  </span>
                </div>
                <p className="text-sm mt-1">{phpWarningsResult.message}</p>
                {phpWarningsResult.success && phpWarningsResult.fixedCount && phpWarningsResult.fixedCount > 0 && (
                  <p className="text-sm mt-1 italic">
                    Restart Apache to apply changes and suppress deprecation warnings
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* General Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-5 h-5" />
            {t.general}
          </CardTitle>
          <CardDescription>
            {t.generalDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="w-5 h-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{t.language}</h4>
              </div>
            </div>
            <div className="w-48">
              <SearchableSelect
                options={languageOptions}
                value={language}
                onChange={handleLanguageChange}
                placeholder={t.language}
              />
            </div>
          </div>

          {/* Installation Path */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <FolderCog className="w-5 h-5 text-muted-foreground" />
              <div>
                <h4 className="font-medium">{t.installPath}</h4>
                <p className="text-sm text-muted-foreground">
                  {installPath}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPathDialogOpen(true)}
            >
              {t.change}
            </Button>
          </div>

          {pathUpdateMessage.text && (
            <div className={`p-3 rounded ${pathUpdateMessage.type === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
              }`}>
              {pathUpdateMessage.text}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Appearance Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            {t.appearance}
          </CardTitle>
          <CardDescription>
            {t.appearanceDesc}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Theme Toggle */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? (
                <Moon className="w-5 h-5 text-muted-foreground" />
              ) : (
                <Sun className="w-5 h-5 text-muted-foreground" />
              )}
              <div>
                <h4 className="font-medium">{t.theme}</h4>
                <p className="text-sm text-muted-foreground">
                  {darkMode ? t.darkMode : t.lightMode}
                </p>
              </div>
            </div>
            <Switch
              checked={darkMode}
              onCheckedChange={onToggleDarkMode}
            />
          </div>
        </CardContent>
      </Card>

      {/* Path Settings Dialog */}
      <PathSettingsDialog
        open={pathDialogOpen}
        onOpenChange={setPathDialogOpen}
        currentPath={installPath}
        onSave={handlePathChange}
      />
    </div>
  );
} 