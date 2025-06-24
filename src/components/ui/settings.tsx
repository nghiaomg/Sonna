import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Settings as SettingsIcon, Globe, Monitor, Sun, Moon } from 'lucide-react';
import { useLanguage } from '@/lib/language-context';
import type { Language } from '@/lib/language-context';

interface SettingsProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
}

export function Settings({ darkMode, onToggleDarkMode }: SettingsProps) {
  const { language, setLanguage, t } = useLanguage();

  const handleLanguageChange = (newLanguage: Language) => {
    setLanguage(newLanguage);
  };

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
                <p className="text-sm text-muted-foreground">
                  {language === 'en' ? 'English' : 'Tiếng Việt'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={language === 'en' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('en')}
              >
                English
              </Button>
              <Button
                variant={language === 'vi' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleLanguageChange('vi')}
              >
                Tiếng Việt
              </Button>
            </div>
          </div>
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
    </div>
  );
} 