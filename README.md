# GSwitcher

![Alt text](/extras//screenshots/gswitcher-1.0.0-screenshot.png?raw=true "Optional Title")

## Angular / Electron app.
### App provides controls over PC displays color settings depending on the active window. Available settings: brightness, contrast, gamma.
### Tested on Windows 10 22H1 / Windows 11 22H2, borderless / fullscreen mode, NVidia GPUs.
### App makes only one internet request for checking for updates (there is an option to disable it).
### Locales: Ru, En.

---
### TODOs:
* Bundle main app scripts with Rollup or something (reduce package size, remove node_modules from resources)
* Write tests
* Replace timer window change detection to Windows events via ffi?
* Live preview option?