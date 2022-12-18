# GSwitcher
## [**Download latest release**](https://github.com/Quenary/GSwitcher/releases/latest)
![Alt text](/extras//screenshots/gswitcher-1.0.0-screenshot.png?raw=true "Optional Title")

## Angular / Electron / Node.js 16.13.2.
### App provides controls over PC displays color settings (brightness, contrast, gamma) depending on active window.
### App makes only one internet request for checking for updates (there is an option to disable it).
---
## Localization
* Russian
* English
---
## Tested
* Windows 10 22H1, Windows 11 22H2
* Common windows apps, fullscreen / borderless modes in several games
* NVidia, AMD GPUs
---
### TODOs:
* Bundle main app scripts with Rollup or something (reduce package size, remove node_modules from resources)
* Write tests
* Replace timer window change detection to Windows events via ffi?
* Live preview option?