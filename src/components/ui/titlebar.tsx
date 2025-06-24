import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Minus, Square, X, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TitlebarProps {
  title?: string;
  className?: string;
}

export function Titlebar({ title = "Sonna", className }: TitlebarProps) {
  const [isMaximized, setIsMaximized] = useState(false);

  useEffect(() => {
    // Check if window is maximized on mount
    if (window.electronAPI) {
      window.electronAPI.isWindowMaximized().then(setIsMaximized);
    }
  }, []);

  const handleMinimize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.minimizeWindow();
    }
  };

  const handleMaximize = async () => {
    if (window.electronAPI) {
      await window.electronAPI.maximizeWindow();
      const maximized = await window.electronAPI.isWindowMaximized();
      setIsMaximized(maximized);
    }
  };

  const handleClose = async () => {
    if (window.electronAPI) {
      await window.electronAPI.closeWindow();
    }
  };

  return (
    <div className={cn(
      "flex items-center justify-between h-8 bg-background border-b select-none",
      "drag-region relative z-50",
      className
    )}>
      {/* Left side - Logo and title */}
      <div className="flex items-center px-4 gap-2">
        <img src="/logo.png" alt="Sonna" className="w-4 h-4" />
        <span className="text-sm font-medium text-foreground">{title}</span>
      </div>

      {/* Right side - Window controls */}
      <div className="flex">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted no-drag p-0"
          onClick={handleMinimize}
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-muted no-drag p-0"
          onClick={handleMaximize}
        >
          {isMaximized ? (
            <Copy className="w-3 h-3" />
          ) : (
            <Square className="w-3 h-3" />
          )}
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-12 rounded-none hover:bg-destructive hover:text-destructive-foreground no-drag p-0"
          onClick={handleClose}
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
} 