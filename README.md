Project Name: Digital Traveller
 
Repository:
https://github.com/mikebrown747-spec/Digital-Traveller
 
Goal:
Build a production-quality Windows desktop application in Python
 
Requirements:
- Multi-file project structure
- Object-oriented design
- JSON data storage
- Future support for configurable workflows
- Future support for barcode-scanned serial numbers
- GitHub-ready code
- Windows desktop application only
 
When generating code:
- Create complete folder structure
- Follow SOLID principles
- Separate code into modules.
- Use classes throughout
- Include requirements.txt
- Include main.py
- Separate UI, models, services and data layers
- Provide all source files separately
- Avoid placing all code into one file
- Use version numbering, 1.X.Y, X for new features, Y for bug updates

The application 

Modern Windows-style appearance.
Single main window.
System selector at top: InVia / Virsa / inLux
Tabs across the top:
Setup, Calibration, Final Test & Release
Left side contains workflow steps.
Each step should display:
Step name
Status
Completion timestamp
Statuses:
Not Started / In Progress / Complete

When a step button is clicked:
Open a dialog window
Display placeholder instructions
Allow Mark Complete
Allow Close Without Completing
