import {app,api} from "@/composable/comfyAPI";
import {getNodeById} from "@/composable/node.js";
import {$t} from "@/composable/i18n.js";
import {drawRoundedRect, drawText} from "@/composable/canvas.js";

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.TimeTaken',

    setup() {
        const timeMap =  new Map();
        let lastId = 0;
        api.addEventListener('executing', data => {
            const id = data?.node || data?.detail || null;
            const node = getNodeById(id);
            if (node) node.executionDuration = ``;
            const timeTaken = timeMap.get(lastId);
            timeMap.delete(lastId);
            if (lastId && timeTaken) {
                const delta = Date.now() - timeTaken;
                const lastNode = getNodeById(lastId);
                if (lastNode) lastNode.executionDuration = `${(delta / 1e3).toFixed(2)}${$t('s')}`
            }
            lastId = id;
            timeMap.set(id, Date.now());
        });
    },

    beforeRegisterNodeDef(nodeType, nodeData) {
        const orig = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(...args) {
          // todo: add setting to toggle time used show
          const [ctx] = args;
            drawTime(ctx, this.executionDuration || ``);
          return orig == null ? void 0 : orig.apply(this, args);
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
    ctx.save();
    ctx.fillStyle = LiteGraph.NODE_DEFAULT_BGCOLOR
    drawRoundedRect(ctx, 0, - LiteGraph.NODE_TITLE_HEIGHT - 20, ctx.measureText(text).width + 10, LiteGraph.NODE_TITLE_HEIGHT - 10, 4);
    ctx.fill()
    drawText(ctx, text, 8, -LiteGraph.NODE_TITLE_HEIGHT - 6, LiteGraph.NODE_TITLE_COLOR);
    ctx.restore();
}
