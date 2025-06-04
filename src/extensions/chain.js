import {app, api} from '@/composable/comfyAPI'
import {chainNode, convertLinkToGetSetNode} from "@/composable/node";
import {$t} from "@/composable/i18n.js";
import {drawRoundedRect, drawText} from "@/composable/canvas.js";
import {getSetting} from "@/composable/settings.js";
import {useTryCatchCallback} from "@/composable/utils/useChainCallback.js";

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.ChainNode',
    init(){
        app.canvas._mousemove_callback = _=>{
            const enabled = getSetting('EasyUse.Nodes.ChainGetSet',null, true);
            if(!enabled) return
            chainNode();
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
        LGraphCanvas.prototype.showLinkMenu = useTryCatchCallback(showLinkMenu, convertLinkIntoNodes);
    }
})

