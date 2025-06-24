!macro customInstall
  CreateDirectory "C:\sonna"
  CreateDirectory "C:\sonna\applications"
  CreateDirectory "C:\sonna\downloads"
  CreateDirectory "C:\sonna\www"
  
  FileOpen $0 "C:\sonna\www\index.html" w
  FileWrite $0 "<!DOCTYPE html>$\r$\n"
  FileWrite $0 "<html><head><title>Sonna</title></head><body>$\r$\n"
  FileWrite $0 "<h1>Sonna Development Environment</h1>$\r$\n"
  FileWrite $0 "<p>Welcome to your local development environment.</p>$\r$\n"
  FileWrite $0 "</body></html>$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Remove all Sonna data?" IDNO skip_cleanup
  RMDir /r "C:\sonna"
  skip_cleanup:
!macroend 