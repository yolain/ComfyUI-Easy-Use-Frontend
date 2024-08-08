import {app, api} from '@/composable/comfyAPI'
import {chainNode, getSelectedNodes, convertLinkToGetSetNode} from "@/composable/node";
import {$t} from "@/composable/i18n.js";
import {drawRoundedRect, drawText} from "@/composable/canvas.js";

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.ChainNode',
    init(){
        app.canvas._mousemove_callback = _=>{
            // todo: add setting to set chain node enable/disable
            const selectedNodes = getSelectedNodes();
            chainNode(selectedNodes);
        }
        const showLinkMenu = LGraphCanvas.prototype.showLinkMenu;
        const convertLinkIntoNodes = function(link, event) {
            if (!event.shiftKey) {
                showLinkMenu.apply(this, [link, event]);
                return false;
            }
            convertLinkToGetSetNode(link);
            return false;
        };
        LGraphCanvas.prototype.showLinkMenu = convertLinkIntoNodes;
    }
})

