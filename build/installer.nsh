!macro customInstall
  CreateDirectory "C:\sonna"
  CreateDirectory "C:\sonna\applications"
  CreateDirectory "C:\sonna\downloads"
  CreateDirectory "C:\sonna\www"
  CreateDirectory "C:\sonna\conf"
  
  # Create a simple welcome page (the app will replace this with the beautiful template)
  FileOpen $0 "C:\sonna\www\index.html" w
  FileWrite $0 "<!DOCTYPE html>$\r$\n"
  FileWrite $0 "<html lang='en'>$\r$\n"
  FileWrite $0 "<head>$\r$\n"
  FileWrite $0 "  <meta charset='UTF-8'>$\r$\n"
  FileWrite $0 "  <meta name='viewport' content='width=device-width, initial-scale=1.0'>$\r$\n"
  FileWrite $0 "  <title>Welcome to Sonna</title>$\r$\n"
  FileWrite $0 "  <style>$\r$\n"
  FileWrite $0 "    body { font-family: system-ui, sans-serif; background: #0a0a0a; color: #fafafa; margin: 0; padding: 2rem; text-align: center; }$\r$\n"
  FileWrite $0 "    .container { max-width: 600px; margin: 0 auto; padding: 2rem; background: #171717; border-radius: 12px; }$\r$\n"
  FileWrite $0 "    h1 { color: #fafafa; margin-bottom: 1rem; }$\r$\n"
  FileWrite $0 "    p { color: #a1a1aa; line-height: 1.6; }$\r$\n"
  FileWrite $0 "    .emoji { font-size: 3rem; margin-bottom: 1rem; }$\r$\n"
  FileWrite $0 "  </style>$\r$\n"
  FileWrite $0 "</head>$\r$\n"
  FileWrite $0 "<body>$\r$\n"
  FileWrite $0 "  <div class='container'>$\r$\n"
  FileWrite $0 "    <div class='emoji'>🚀</div>$\r$\n"
  FileWrite $0 "    <h1>Welcome to Sonna v1.4.0</h1>$\r$\n"
  FileWrite $0 "    <p>Your modern local development environment is ready!</p>$\r$\n"
  FileWrite $0 "    <p>Start Apache or Nginx from the Sonna application to begin developing.</p>$\r$\n"
  FileWrite $0 "  </div>$\r$\n"
  FileWrite $0 "</body>$\r$\n"
  FileWrite $0 "</html>$\r$\n"
  FileClose $0
!macroend

!macro customUnInstall
  MessageBox MB_YESNO "Remove all Sonna data?" IDNO skip_cleanup
  RMDir /r "C:\sonna"
  skip_cleanup:
!macroend 