import { app,api,ComfyDialog, $el } from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";

import { restart_from_here } from "./prompt.js";
import { hud, FlowState } from "./state.js";
import { send_cancel, send_message, send_onstart, skip_next_restart_message } from "./messaging.js";
import { display_preview_images, additionalDrawBackground, click_is_in_image } from "./preview.js";
import {useTryCatchCallback} from "@/composable/utils/useChainCallback.js";

class chooserImageDialog extends ComfyDialog {

    constructor() {
		super();
        this.node = null
        this.select_index = []
        this.dialog_div = null
	}

    show(image,node){
        this.select_index = []
        this.node = node

        const images_div = image.map((img, index) => {
            const imgEl = $el('img', {
                src: img.src,
                onclick: _ => {
                    if(this.select_index.includes(index)){
                        this.select_index = this.select_index.filter(i => i !== index)
                        imgEl.classList.remove('selected')
                    } else {
                        this.select_index.push(index)
                        imgEl.classList.add('selected')
                    }
                    if (node.selected_images.has(index)) node.selected_images.delete(index);
                    else node.selected_images.add(index);
                }
            })
            return imgEl
        })
        super.show($el('div.comfyui-easyuse-chooser-dialog',[
            $el('h5.comfyui-easyuse-chooser-dialog-title', $t('Choose images to continue')),
            $el('div.comfyui-easyuse-chooser-dialog-images',images_div)
        ]))
    }
    createButtons() {
        const btns = super.createButtons();
        btns[0].onclick = _ => {
            if (FlowState.running()) { send_cancel();}
            super.close()
        }
        btns.unshift($el('button', {
            type: 'button',
            textContent: $t('Choose Selected Images'),
            onclick: _ => {
                if (FlowState.paused()) {
                    send_message(this.node.id, [...this.node.selected_images, -1, ...this.node.anti_selected]);
                }
                if (FlowState.idle()) {
                    skip_next_restart_message();
                    restart_from_here(this.node.id).then(() => { send_message(this.node.id, [...this.node.selected_images, -1, ...this.node.anti_selected]); });
                }
                super.close()
            }
        }))
        return btns
    }

}

function progressButtonPressed() {
    const node = app.graph._nodes_by_id[this.node_id];
    if (node) {
        const selected = [...node.selected_images]
        if(selected?.length>0){
            node.setProperty('values',selected)
        }
        if (FlowState.paused()) {
            hud.current_node_is_chooser = false
            send_message(node.id, [...node.selected_images, -1, ...node.anti_selected]);
        }
        if (FlowState.idle()) {
            skip_next_restart_message();
            restart_from_here(node.id).then(() => { send_message(node.id, [...node.selected_images, -1, ...node.anti_selected]); });
        }
    }
}

function cancelButtonPressed() {

    if (FlowState.running()) { send_cancel();}
}

function enable_disabling(button) {
    Object.defineProperty(button, 'clicked', {
        get : function() { return this._clicked; },
        set : function(v) { this._clicked = (v && this.name!=''); }
    })
}

function disable_serialize(widget) {
    if (!widget.options) widget.options = {  };
    widget.options.serialize = false;
}

app.registerExtension({
    name:'Comfy.EasyUse.imageChooser',
    init() {
        window.addEventListener("beforeunload", _=>{
            if (FlowState.paused()) {
                send_cancel();
            }
        }, true);
    },
    setup(app) {

        const draw = LGraphCanvas.prototype.draw;
        const newDraw = function() {
            if (hud.update()) {
                app.graph._nodes.forEach((node)=> { if (node.update) { node.update(); } })
            }
            draw.apply(this,arguments);
        }
        LGraphCanvas.prototype.draw = useTryCatchCallback(draw, newDraw)

        function easyuseImageChooser(event) {
            const {node,image,isKSampler} = display_preview_images(event);
            if(isKSampler) {
                hud.current_node_is_chooser = true
                const dialog = new chooserImageDialog();
                dialog.show(image,node)
            }
        }
        api.addEventListener("easyuse-image-choose", easyuseImageChooser);

        /*
        If a run is interrupted, send a cancel message (unless we're doing the cancelling, to avoid infinite loop)
        */
        const original_api_interrupt = api.interrupt;
        api.interrupt = function () {
            if (FlowState.paused() && !FlowState.cancelling) send_cancel();
            original_api_interrupt.apply(this, arguments);
        }

        /*
        At the start of execution
        */
        function on_execution_start() {
            if (send_onstart()) {
                app.graph._nodes.forEach((node)=> {
                    if (node.selected_images || node.anti_selected) {
                        node.selected_images.clear();
                        node.anti_selected.clear();
                        if(node.update) node.update();
                    }
                })
            }
        }
        api.addEventListener("execution_start", on_execution_start);
    },

    async nodeCreated(node, app) {

        if(node.comfyClass == 'easy imageChooser'){
            node.setProperty('values',[])

            /* A property defining the top of the image when there is just one */
            if(node?.imageIndex === undefined){
              Object.defineProperty(node, 'imageIndex', {
                    get : function() { return null; },
                    set: function (v) {node.overIndex= v},
                })
            }
            if(node?.imagey === undefined){
                setTimeout(_=>{
                    let value = node.imagey
                    Object.defineProperty(node, 'imagey', {
                        get: function (){
                            return node.widgets[node.widgets.length-1].last_y+LiteGraph.NODE_WIDGET_HEIGHT
                        },
                        set: function (v) {
                            node.imagey = v
                        }
                    })
                },100)
            }

            /* Capture clicks */
            const org_onMouseDown = node.onMouseDown;
            node.onMouseDown = function( e, pos, canvas ) {
                if (e.isPrimary) {
                    const i = click_is_in_image(node, pos);
                    if (i>=0) { this.imageClicked(i); }
                }
                return (org_onMouseDown && org_onMouseDown.apply(this, arguments));
            }

            node.send_button_widget = node.addWidget("button", "", "", progressButtonPressed);
            node.cancel_button_widget = node.addWidget("button", "", "", cancelButtonPressed);
            enable_disabling(node.cancel_button_widget);
            enable_disabling(node.send_button_widget);
            disable_serialize(node.cancel_button_widget);
            disable_serialize(node.send_button_widget);

        }
    },

    beforeRegisterNodeDef(nodeType, nodeData, app) {
        if(nodeData?.name == 'easy imageChooser'){

            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                additionalDrawBackground(this, ctx, this.imagey || 0);
            }

            nodeType.prototype.imageClicked = function (imageIndex) {
                if (nodeType?.comfyClass==="easy imageChooser") {
                    if (this.selected_images.has(imageIndex)) this.selected_images.delete(imageIndex);
                    else this.selected_images.add(imageIndex);
                    this.update();
                }
            }

            const update = nodeType.prototype.update;
            nodeType.prototype.update = function() {
                if (update) update.apply(this,arguments);
                if (this.send_button_widget) {
                    this.send_button_widget.node_id = this.id;
                    const selection = ( this.selected_images ? this.selected_images.size : 0 ) + ( this.anti_selected ? this.anti_selected.size : 0 )
                    const maxlength = this.imgs?.length || 0;
                    if (FlowState.paused_here(this.id) && selection>0) {
                        this.send_button_widget.name = (selection>1) ? "Progress selected (" + selection + '/' + maxlength  +")" : "Progress selected image";
                    } else if (selection>0) {
                        this.send_button_widget.name = (selection>1) ? "Progress selected (" + selection + '/' + maxlength  +")" : "Progress selected image as restart";
                    }
                    else {
                        this.send_button_widget.name = "";
                    }
                }
                if (this.cancel_button_widget) {
                    const isRunning = FlowState.running()
                    this.cancel_button_widget.name = isRunning ? "Cancel current run" : "";
                }
                this.setDirtyCanvas(true,true);
            }
		}
    }
})