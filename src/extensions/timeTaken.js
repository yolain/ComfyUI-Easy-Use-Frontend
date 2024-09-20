import {app,api} from "@/composable/comfyAPI";
import {getNodeById} from "@/composable/node.js";
import {$t} from "@/composable/i18n.js";
import {drawRoundedRect, drawText} from "@/composable/canvas.js";
import {getSetting} from "@/composable/settings.js";

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.TimeTaken',

    setup() {
        let timeMap =  new Map();
        let lastId = 0;
        api.addEventListener('execution_start', data =>{
            if(graph){
                graph._nodes.forEach(node => {
                    if(node.executionDuration) delete node.executionDuration;
                })
            }
        });
        api.addEventListener('executing', data => {
            const enabled = getSetting('EasyUse.Nodes.Runtime',null, true);
            if(!enabled) return;
            const id = data?.node || data?.detail || null;
            const timeTaken = timeMap.get(lastId);
            timeMap.delete(lastId);
            if (lastId && timeTaken) {
                const delta = Date.now() - timeTaken;
                const lastNode = getNodeById(lastId);
                if (lastNode) {
                    if(!lastNode.executionDuration) lastNode.executionDuration = 0.00;
                    lastNode.executionDuration = lastNode.executionDuration + (delta / 1e3)
                }
            }
            lastId = id;
            timeMap.set(id, Date.now());
        });
    },

    beforeRegisterNodeDef(nodeType, nodeData) {

        const orig = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(...args) {
          const [ctx] = args;
          drawTime(ctx, this.executionDuration);
          return orig == null ? undefined : orig.apply(this, args);
        };
    }
})

/* Functions */
/**
 * Draw time taken to Node
 * @param ctx
 * @param text
 */
function drawTime(ctx, text) {
    if(!text) return
    text = parseFloat(text).toFixed(3) +$t('s')
    ctx.save();
    ctx.fillStyle = LiteGraph.NODE_DEFAULT_BGCOLOR
    drawRoundedRect(ctx, 0, - LiteGraph.NODE_TITLE_HEIGHT - 20, ctx.measureText(text).width + 10, LiteGraph.NODE_TITLE_HEIGHT - 10, 4);
    ctx.fill()
    drawText(ctx, text, 8, -LiteGraph.NODE_TITLE_HEIGHT - 6, LiteGraph.NODE_TITLE_COLOR);
    ctx.restore();
}
