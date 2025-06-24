import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Globe, Monitor, Sun, Moon, FolderCog } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import type { Language } from '@/lib/language-context';
import { PathSettingsDialog } from './path-settings-dialog';
import { SearchableSelect } from './select';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();
  const [installPath, setInstallPath] = useState('C:/sonna');
  const [pathSettingsOpen, setPathSettingsOpen] = useState(false);
  const [pathUpdateLoading, setPathUpdateLoading] = useState(false);
  const [pathUpdateMessage, setPathUpdateMessage] = useState<{text: string, type: 'success' | 'error' | ''}>({text: '', type: ''});

  // Load current installation path
  useEffect(() => {
    loadInstallationPath();
  }, []);

  const loadInstallationPath = async () => {
    if (window.electronAPI) {
      try {
        const configResult = await window.electronAPI.getSonnaConfig();
        if (configResult.success && configResult.config) {
          setInstallPath(configResult.config.installPath || 'C:/sonna');
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
      setPathUpdateMessage({text: '', type: ''});
      
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
              onClick={() => setPathSettingsOpen(true)}
            >
              {t.change}
            </Button>
          </div>

          {pathUpdateMessage.text && (
            <div className={`p-3 rounded ${
              pathUpdateMessage.type === 'success' 
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
        open={pathSettingsOpen}
        onOpenChange={setPathSettingsOpen}
        currentPath={installPath}
        onSave={handlePathChange}
      />
    </div>
  );
} 