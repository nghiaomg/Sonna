import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import { Titlebar } from '@/components/ui/titlebar';
import { Server, Database, Globe, Code, Play, Square, Settings, Moon, Sun } from 'lucide-react';

interface Service {
  name: string;
  displayName: string;
  icon: React.ReactNode;
  running: boolean;
  port?: number;
}

function App() {
  const [services, setServices] = useState<Service[]>([
    { name: 'apache', displayName: 'Apache', icon: <Server className="w-5 h-5" />, running: false, port: 80 },
    { name: 'mysql', displayName: 'MySQL', icon: <Database className="w-5 h-5" />, running: false, port: 3306 },
    { name: 'nginx', displayName: 'Nginx', icon: <Globe className="w-5 h-5" />, running: false, port: 8080 },
    { name: 'php', displayName: 'PHP-FPM', icon: <Code className="w-5 h-5" />, running: false },
    { name: 'redis', displayName: 'Redis', icon: <Database className="w-5 h-5" />, running: false, port: 6379 },
    { name: 'nodejs', displayName: 'Node.js', icon: <Code className="w-5 h-5" />, running: false },
  ]);

  const [darkMode, setDarkMode] = useState(false);

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
            running: status[service.name] || false
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
                              <span className={`inline-block w-2 h-2 rounded-full ${service.running ? 'bg-green-500' : 'bg-red-500'}`}></span>
                              <span>{service.running ? 'Running' : 'Stopped'}</span>
                              {service.port && service.running && (
                                <span>:{service.port}</span>
                              )}
                            </div>
                          </div>
                        </div>
                                                 <div className="flex gap-2">
                           {service.running ? (
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
        </div>
      </main>
    </div>
  );
}

export default App;
