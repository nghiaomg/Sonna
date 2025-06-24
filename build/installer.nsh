; Custom NSIS installer script for Sonna
; This file customizes the Windows installer behavior

!macro customInstall
  ; Create Sonna directory in C:\
  CreateDirectory "$INSTDIR\sonna"
  CreateDirectory "C:\sonna"
  CreateDirectory "C:\sonna\applications"
  CreateDirectory "C:\sonna\downloads"
  CreateDirectory "C:\sonna\www"
  
  ; Set proper permissions for C:\sonna
  AccessControl::GrantOnFile "C:\sonna" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "C:\sonna\applications" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "C:\sonna\downloads" "(BU)" "FullAccess"
  AccessControl::GrantOnFile "C:\sonna\www" "(BU)" "FullAccess"
  
  ; Create default index.html for web root
  FileOpen $0 "C:\sonna\www\index.html" w
  FileWrite $0 "<!DOCTYPE html>$\r$\n"
  FileWrite $0 "<html lang='en'>$\r$\n"
  FileWrite $0 "<head>$\r$\n"
  FileWrite $0 "    <meta charset='UTF-8'>$\r$\n"
  FileWrite $0 "    <meta name='viewport' content='width=device-width, initial-scale=1.0'>$\r$\n"
  FileWrite $0 "    <title>Sonna - Local Development Environment</title>$\r$\n"
  FileWrite $0 "    <style>$\r$\n"
  FileWrite $0 "        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }$\r$\n"
  FileWrite $0 "        .container { max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }$\r$\n"
  FileWrite $0 "        h1 { color: #333; margin-bottom: 20px; }$\r$\n"
  FileWrite $0 "        p { color: #666; line-height: 1.6; margin-bottom: 15px; }$\r$\n"
  FileWrite $0 "        .status { background: #e8f5e8; color: #2d5a2d; padding: 10px; border-radius: 5px; margin: 20px 0; }$\r$\n"
  FileWrite $0 "    </style>$\r$\n"
  FileWrite $0 "</head>$\r$\n"
  FileWrite $0 "<body>$\r$\n"
  FileWrite $0 "    <div class='container'>$\r$\n"
  FileWrite $0 "        <h1>🧰 Sonna Development Environment</h1>$\r$\n"
  FileWrite $0 "        <div class='status'>✅ Apache is running successfully!</div>$\r$\n"
  FileWrite $0 "        <p>Welcome to your local development environment.</p>$\r$\n"
  FileWrite $0 "        <p>Place your web projects in <strong>C:\sonna\www</strong> to get started.</p>$\r$\n"
  FileWrite $0 "        <p>Manage your services through the Sonna application.</p>$\r$\n"
  FileWrite $0 "        <hr style='margin: 30px 0; border: 1px solid #eee;'>$\r$\n"
  FileWrite $0 "        <p><small>Powered by Sonna - Modern Local Development Environment</small></p>$\r$\n"
  FileWrite $0 "    </div>$\r$\n"
  FileWrite $0 "</body>$\r$\n"
  FileWrite $0 "</html>$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  ; Clean up Sonna directories on uninstall (optional - ask user)
  MessageBox MB_YESNO "Do you want to remove all Sonna data including installed services and projects?$\r$\n$\r$\nThis will delete C:\sonna directory completely." IDNO skip_cleanup
  RMDir /r "C:\sonna"
  skip_cleanup:
!macroend

; Custom installer pages
!macro customHeader
  !system "echo Sonna Installer - Setting up modern development environment..."
!macroend

; Version info
VIProductVersion "1.0.0.0"
VIAddVersionKey "ProductName" "Sonna"
VIAddVersionKey "CompanyName" "nghiaomg"
VIAddVersionKey "LegalCopyright" "Copyright © 2024 nghiaomg"
VIAddVersionKey "FileDescription" "Modern Local Development Environment for Windows"
VIAddVersionKey "FileVersion" "1.0.0"
VIAddVersionKey "ProductVersion" "1.0.0"
VIAddVersionKey "InternalName" "Sonna"
VIAddVersionKey "OriginalFilename" "Sonna-1.0.0-Setup.exe" 