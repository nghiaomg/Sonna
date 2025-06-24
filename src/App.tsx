import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Titlebar } from '@/components/ui/titlebar';
import { DownloadManager } from '@/components/ui/download-manager';
import { CleanupManager } from '@/components/ui/cleanup-manager';
import { Server, Database, Globe, Code, Play, Square, Settings, Moon, Sun, Download, Trash2 } from 'lucide-react';

interface Service {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  running: boolean;
  port?: number;
  installed: boolean;
}

function App() {
  const [services, setServices] = useState<Service[]>([
    { name: 'apache', displayName: 'Apache', icon: <Server className="w-5 h-5" />, running: false, port: 80, installed: false },
    { name: 'mysql', displayName: 'MySQL', icon: <Database className="w-5 h-5" />, running: false, port: 3306, installed: false },
    { name: 'nginx', displayName: 'Nginx', icon: <Globe className="w-5 h-5" />, running: false, port: 8080, installed: false },
    { name: 'php', displayName: 'PHP-FPM', icon: <Code className="w-5 h-5" />, running: false, installed: false },
    { name: 'redis', displayName: 'Redis', icon: <Database className="w-5 h-5" />, running: false, port: 6379, installed: false },
    { name: 'nodejs', displayName: 'Node.js', icon: <Code className="w-5 h-5" />, running: false, installed: false },
  ]);

  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'services' | 'install' | 'cleanup'>('services');

  useEffect(() => {
    // Apply dark mode class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    // Load services status when app starts
    loadServicesStatus();
  }, []);

  const loadServicesStatus = async () => {
    if (window.electronAPI) {
      try {
        const status = await window.electronAPI.getServicesStatus();
        setServices(prevServices => 
          prevServices.map(service => ({
            ...service,
            installed: status[service.name]?.installed || false,
            running: status[service.name]?.running || false
          }))
        );
      } catch (error) {
        console.error('Failed to load services status:', error);
      }
    }
  };

  const toggleService = async (serviceName: string) => {
    const service = services.find(s => s.name === serviceName);
    if (!service || !window.electronAPI) return;

    try {
      if (service.running) {
        await window.electronAPI.stopService(serviceName);
      } else {
        await window.electronAPI.startService(serviceName);
      }
      
      // Update local state
      setServices(prevServices =>
        prevServices.map(s =>
          s.name === serviceName ? { ...s, running: !s.running } : s
        )
      );
    } catch (error) {
      console.error(`Failed to toggle ${serviceName}:`, error);
    }
  };

  const startAllServices = async () => {
    for (const service of services) {
      if (!service.running && window.electronAPI) {
        try {
          await window.electronAPI.startService(service.name);
        } catch (error) {
          console.error(`Failed to start ${service.name}:`, error);
        }
      }
    }
    await loadServicesStatus();
  };

  const stopAllServices = async () => {
    for (const service of services) {
      if (service.running && window.electronAPI) {
        try {
          await window.electronAPI.stopService(service.name);
        } catch (error) {
          console.error(`Failed to stop ${service.name}:`, error);
        }
      }
    }
    await loadServicesStatus();
  };

  const handleServiceInstalled = (serviceName: string) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: true } : service
      )
    );
  };

  const handleServiceDeleted = (serviceName: string) => {
    setServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: false, running: false } : service
      )
    );
    setDownloadServices(prevServices =>
      prevServices.map(service =>
        service.name === serviceName ? { ...service, installed: false } : service
      )
    );
  };

  const [downloadServices, setDownloadServices] = useState<any[]>([]);

  // Load real service configurations
  useEffect(() => {
    loadServiceConfigurations();
  }, []);

  const loadServiceConfigurations = async () => {
    if (window.electronAPI) {
      try {
        const configResult = await window.electronAPI.getSonnaConfig();
        if (configResult.success && configResult.config) {
          const servicesList = Object.values(configResult.config.services).map((service: any) => ({
            name: service.name,
            displayName: service.displayName,
            version: service.version,
            installed: service.installed,
            downloadUrl: service.downloadUrl
          }));
          setDownloadServices(servicesList);
        }
      } catch (error) {
        console.error('Failed to load service configurations:', error);
        // Fallback to default services
        setDownloadServices(services.map(service => ({
          name: service.name,
          displayName: service.displayName,
          version: '8.3.0', // Default version
          installed: service.installed,
          downloadUrl: ''
        })));
      }
    }
  };

  const resetInstallationStatus = async () => {
    if (window.electronAPI) {
      try {
        const result = await window.electronAPI.resetInstallationStatus();
        if (result.success) {
          await loadServicesStatus();
          await loadServiceConfigurations();
        }
      } catch (error) {
        console.error('Failed to reset installation status:', error);
      }
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Custom Titlebar */}
      <Titlebar title="Sonna - Modern Local Dev Environment" />
      
      {/* Header */}
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <img src="/logo.png" alt="Sonna" className="w-8 h-8" />
            <h1 className="text-xl font-bold">Sonna</h1>
            <span className="text-sm text-muted-foreground">Modern Local Dev Environment</span>
          </div>
          
          <div className="flex items-center space-x-4">
            <Button variant="outline" size="sm" onClick={() => setDarkMode(!darkMode)}>
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button 
              variant={activeTab === 'services' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('services')}
            >
              Services
            </Button>
            <Button 
              variant={activeTab === 'install' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('install')}
            >
              <Download className="w-4 h-4 mr-2" />
              Install
            </Button>
            <Button 
              variant={activeTab === 'cleanup' ? 'default' : 'outline'} 
              size="sm"
              onClick={() => setActiveTab('cleanup')}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Cleanup
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={resetInstallationStatus}
            >
              Reset Status
            </Button>
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {activeTab === 'install' && (
            <DownloadManager 
              services={downloadServices}
              onServiceInstalled={handleServiceInstalled}
            />
          )}
          
          {activeTab === 'cleanup' && (
            <CleanupManager 
              services={downloadServices}
              onServiceDeleted={handleServiceDeleted}
            />
          )}
          
          {activeTab === 'services' && (
            <>
              {/* Control Panel */}
              <Card>
            <CardHeader>
              <CardTitle>Service Control</CardTitle>
              <CardDescription>
                Manage your local development services
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4 mb-6">
                <Button onClick={startAllServices} className="flex items-center">
                  <Play className="w-4 h-4 mr-2" />
                  Start All
                </Button>
                <Button onClick={stopAllServices} variant="destructive" className="flex items-center">
                  <Square className="w-4 h-4 mr-2" />
                  Stop All
                </Button>
              </div>

              {/* Services Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {services.map((service) => (
                  <Card key={service.name} className="transition-all hover:shadow-md">
                                         <CardContent className="p-4">
                       <div className="flex items-center justify-between gap-4">
                                                 <div className="flex items-center space-x-3 flex-1">
                           <div className={`p-2 rounded-md ${service.running ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                             {service.icon}
                           </div>
                           <div className="flex-1">
                            <h3 className="font-medium">{service.displayName}</h3>
                                                         <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                               <span className={`inline-block w-2 h-2 rounded-full ${
                                 !service.installed ? 'bg-gray-400' : 
                                 service.running ? 'bg-green-500' : 'bg-red-500'
                               }`}></span>
                               <span>
                                 {!service.installed ? 'Not Installed' : 
                                  service.running ? 'Running' : 'Stopped'}
                               </span>
                               {service.port && service.running && (
                                 <span>:{service.port}</span>
                               )}
                             </div>
                          </div>
                        </div>
                                                 <div className="flex gap-2">
                           {!service.installed ? (
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={() => setActiveTab('install')}
                               className="h-8 px-3"
                             >
                               <Download className="w-4 h-4 mr-1" />
                               Install
                             </Button>
                           ) : service.running ? (
                             <Button
                               variant="destructive"
                               size="sm"
                               onClick={() => toggleService(service.name)}
                               className="h-8 px-3"
                             >
                               Stop
                             </Button>
                           ) : (
                             <Button
                               variant="default"
                               size="sm"
                               onClick={() => toggleService(service.name)}
                               className="h-8 px-3"
                             >
                               Start
                             </Button>
                           )}
                         </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader>
              <CardTitle>Local Projects</CardTitle>
              <CardDescription>
                Your web development projects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Globe className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No projects found</p>
                <p className="text-sm">Projects will be automatically detected in your web root directory</p>
              </div>
            </CardContent>
          </Card>
          </>
        )}
        </div>
      </main>
    </div>
  );
}

export default App;
