import type { Project } from '@/types';

/**
 * Project Manager class for handling project operations
 */
export class ProjectManager {
  /**
   * Get all projects
   */
  static async getProjects(): Promise<{ projects: Project[], wwwPath: string }> {
    if (!window.electronAPI) {
      return { projects: [], wwwPath: 'C:\\sonna\\www' };
    }
    
    try {
      const result = await window.electronAPI.getProjects();
      if (result.success) {
        return {
          projects: result.projects || [],
          wwwPath: result.wwwPath || 'C:\\sonna\\www'
        };
      }
      return { projects: [], wwwPath: 'C:\\sonna\\www' };
    } catch (error) {
      console.error('Failed to load projects:', error);
      return { projects: [], wwwPath: 'C:\\sonna\\www' };
    }
  }

  /**
   * Open project folder
   */
  static async openProjectFolder(projectPath: string): Promise<boolean> {
    if (!window.electronAPI) {
      console.error('Electron API not available');
      return false;
    }
    
    try {
      const result = await window.electronAPI.openFolder(projectPath);
      if (!result.success) {
        console.error('Failed to open folder:', result.error || 'Unknown error');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Failed to open project folder:', error);
      return false;
    }
  }

  /**
   * Open project URL in browser
   */
  static async openProjectUrl(url: string): Promise<boolean> {
    if (!window.electronAPI) {
      return false;
    }
    
    try {
      await window.electronAPI.openExternal(url);
      return true;
    } catch (error) {
      console.error('Failed to open project URL:', error);
      return false;
    }
  }

  /**
   * Get icon for project type
   */
  static getProjectTypeIcon(type: string): React.ReactNode {
    // This will be implemented in the UI component
    return null;
  }
} 