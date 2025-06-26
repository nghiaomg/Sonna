import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Settings, Loader2, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DiagnosticResult {
  success: boolean;
  diagnostics?: {
    foundInstallations: Array<{
      version: string;
      phpPath: string;
      dllFiles: string[];
      hasApacheDll: boolean;
      actualDlls: string[];
    }>;
    recommendations: string[];
  };
  workingInstallations?: number;
  message: string;
}

interface FixResult {
  success: boolean;
  fixed?: boolean;
  steps: string[];
  message: string;
}

export function PhpDiagnosticDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [diagnosticResult, setDiagnosticResult] = useState<DiagnosticResult | null>(null);
  const [fixResult, setFixResult] = useState<FixResult | null>(null);

  const runDiagnostic = async () => {
    setIsRunning(true);
    setDiagnosticResult(null);
    setFixResult(null);

    try {
      const result = await (window as any).electronAPI.invoke('diagnose-php-installation');
      setDiagnosticResult(result);
    } catch (error) {
      setDiagnosticResult({
        success: false,
        message: `Diagnostic failed: ${error}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const autoFix = async () => {
    setIsRunning(true);
    setFixResult(null);

    try {
      const result = await (window as any).electronAPI.invoke('auto-fix-php-apache');
      setFixResult(result);
    } catch (error) {
      setFixResult({
        success: false,
        steps: [],
        message: `Auto-fix failed: ${error}`,
      });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Wrench className="w-4 h-4" />
          Fix PHP Issue
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            PHP-Apache Integration Diagnostic
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Diagnostic Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">PHP Installation Status</h3>
              <Button 
                onClick={runDiagnostic} 
                disabled={isRunning}
                size="sm"
                variant="outline"
              >
                {isRunning ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  'Run Diagnostic'
                )}
              </Button>
            </div>

            {diagnosticResult && (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2">
                  {diagnosticResult.success ? (
                    <CheckCircle className="w-4 h-4 text-green-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span className="font-medium">{diagnosticResult.message}</span>
                </div>

                {diagnosticResult.diagnostics && (
                  <div className="space-y-3">
                    {/* Working Installations */}
                    {diagnosticResult.diagnostics.foundInstallations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Found PHP Installations:</h4>
                        <div className="space-y-2">
                          {diagnosticResult.diagnostics.foundInstallations.map((install, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm">
                              <span>PHP {install.version}</span>
                              <div className="flex items-center gap-2">
                                <Badge variant={install.hasApacheDll ? "default" : "secondary"}>
                                  {install.hasApacheDll ? `DLL: ${install.actualDlls[0]}` : 'No Apache DLL'}
                                </Badge>
                                {install.hasApacheDll ? (
                                  <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : (
                                  <AlertCircle className="w-4 h-4 text-orange-600" />
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Recommendations */}
                    {diagnosticResult.diagnostics.recommendations.length > 0 && (
                      <div>
                        <h4 className="text-sm font-medium mb-2">Recommendations:</h4>
                        <ul className="text-sm space-y-1">
                          {diagnosticResult.diagnostics.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <span className="text-muted-foreground">•</span>
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Fix Section */}
          {diagnosticResult && diagnosticResult.workingInstallations && diagnosticResult.workingInstallations > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Auto-Fix Integration</h3>
                <Button 
                  onClick={autoFix} 
                  disabled={isRunning}
                  size="sm"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Fixing...
                    </>
                  ) : (
                    'Auto-Fix'
                  )}
                </Button>
              </div>

              {fixResult && (
                <div className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    {fixResult.fixed ? (
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    ) : fixResult.success ? (
                      <AlertCircle className="w-4 h-4 text-orange-600" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-red-600" />
                    )}
                    <span className="font-medium">{fixResult.message}</span>
                  </div>

                  {fixResult.steps.length > 0 && (
                    <div>
                      <h4 className="text-sm font-medium mb-2">Fix Steps:</h4>
                      <ul className="text-sm space-y-1">
                        {fixResult.steps.map((step, idx) => (
                          <li key={idx} className="flex items-start gap-2">
                            <CheckCircle className="w-3 h-3 mt-0.5 text-green-600" />
                            <span>{step}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {fixResult.fixed && (
                    <div className="bg-green-50 border border-green-200 rounded p-3">
                      <p className="text-sm text-green-800">
                        ✅ PHP-Apache integration fixed! Visit http://localhost/phpmyadmin/ to test.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 