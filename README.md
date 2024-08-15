# ComfyUI-Easy-Use-Frontend

New Front-end of [ComfyUI-Easy-Use](https://github.com/yolain/ComfyUI-Easy-Use) custom nodes. This repo will replace the original web_extension in future releases.
<br>It cannot be used in older versions of Comfy because it uses a new API.

## Road Map

### What has been done

- Beautify the right-click menu and allow custom nodes to be sorted A-Z.
- Added some shortcut keys (e.g: Align nodes in selection, Shift key and click the center point of the connection to convert it to get set nodes).
- Chain get node and set node with parent nodes. Credit by [ComfyUI-mape-Helpers](https://github.com/mape/ComfyUI-mape-Helpers)
- Added statistics time in node.
- Re-designed the node of the `easy stylesSelector`.
- Add settings to manage the shortcut keys and some other settings. (If the official Keybinding settings management is added it may be adjusted accordingly.)
- Re-designed the Group Map and rename it to `nodes map`.

### What to be done

- More features...

## Development

### 1.Clone to the root directory of the ComfyUI-Easy-Use project.
```bash
cd ComfyUI/custom_nodes/ComfyUI-Easy-Use
git clone https://github.com/yolain/ComfyUI-Easy-Use-Frontend
```
### 2.Install dependencies
```bash
cd ComfyUI-Easy-Use-Frontend
npm install
```
### 3.Build the code
- It will watch for code changes and build the `easyuse.js` into the `../web_version/dev/` folder.
```bash
npm run build:dev 
```
### 4. Modify the `config.yaml` file located in the root directory of the ComfyUI-Easy-Use project.
```yaml
# ... others  
WEB_VERSION: dev
```
