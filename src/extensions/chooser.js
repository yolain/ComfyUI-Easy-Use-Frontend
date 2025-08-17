import { app, api } from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n";
import { getWidgetByName } from "@/composable/node";


const chooserClassName = "easy imageChooser";
const isChooserNode = node => node?.comfyClass === chooserClassName;
const getPreviewFormatParam = img => `&type=${img.type}&subfolder=${img.subfolder}&rand=${img.random}`;
const cancelSelection = _=> {
    Object.values(app.graph?._nodes_by_id).forEach(node => {
        if (isChooserNode(node)) {
            node.cancelSelection("interrupt");
        }
    })
}

app.registerExtension({
    name:'Comfy.EasyUse.imageChooser',
    setup() {
        //When a run is interrupted, send a cancel message 
        const original_api_interrupt = api.interrupt;
        api.interrupt = function () {
            if(app.graph?._nodes_by_id){
                // Cancel Selection if we are in a chooser node
                cancelSelection()
            }
            original_api_interrupt.apply(this, arguments);
        }
        // When is running at the image chooser
        api.addEventListener("easyuse-image-choose", event => {
            const data = event.detail;
            
            const node = app.graph._nodes_by_id[data.id];
            if (!node || !isChooserNode(node)) {
                return;
            }

            node.setExecutingState(false);

            node.selected_images.clear();
            node.anti_selected.clear();
            
            node.isWaitingSelection = ["Always Pause", "Keep Last Selection"].includes(node.currentMode);
            node.isCanceling = false;

            node.overIndex = null;

            const imageData = data.urls?.map((url, index) => ({
                index: index,
                filename: url.filename,
                subfolder: url.subfolder,
                type: url.type
            })) || [];
            node.imageData = imageData;
            
            node.imgs = [];
            imageData.forEach(u => {
                const img = new Image();
                img.onload = () => { app.graph.setDirtyCanvas(true); };
                img.src = `/view?filename=${encodeURIComponent(u.filename)}${getPreviewFormatParam(u)}`
                node.imgs.push(img);
            })

            node.update();
            if (node.currentMode === "Always Pause") {
                node.setExecutingState(true);
            }
        });
        // When the user keep last selection
        api.addEventListener("easyuse-image-keep-selection", event => {
            const data = event.detail;
            const node = app.graph._nodes_by_id[data.id];
            if (node && isChooserNode(node)) {
                node.isWaitingSelection = false;
                node.isCancelling = false;
                
                if (data.selected && Array.isArray(data.selected)) {
                    node.selected_images.clear();
                    data.selected.forEach(index => {
                        node.selected_images.add(index);
                    });
                }
            
                node.update();
            }
        });
    },
    beforeRegisterNodeDef(nodeType, nodeData){
        if(nodeData.name == chooserClassName){

            nodeType.prototype.confirmSelection = function(){
                api.fetchApi("/easyuse/image_chooser_message", { method: "POST", body:JSON.stringify({
                    node_id:(this.id).toString(),
                    action: 'select',
                    selected:  Array.from(this.selected_images)
                })})
                .catch(err=> console.error(`Choosen Failed：${err}`))
                .finally(_=>{
                    this.isWaitingSelection = false;
                    this.update();
                    this.setExecutingState(false);
                });
            }

            nodeType.prototype.cancelSelection = function(type){
                api.fetchApi("/easyuse/image_chooser_message", { method: "POST", body:JSON.stringify({
                    node_id: (this.id).toString(),
                    action: 'cancel',
                    selected: []
                })})
                .catch(err=> console.error(`Cancel Failed：${err}`))
                .finally(_=>{
                    this.isCanceling = false;
                    this.isWaitingSelection = false;
                    this.update();
                    this.setExecutingState(false);
                });
            }

            nodeType.prototype.updateWidgets = function(){
                if(!this.confirm_button_widget || !this.cancel_button_widget) return;
                
                const selectedCount = this.selected_images.size;
                const imageCount = this.imgs?.length || 0;
                
                if(this.isCanceling){
                    this.confirm_button_widget.name = $t("Canceling");
                    this.cancel_button_widget.name = "";
                    this.confirm_button_widget.disabled = true;
                    this.cancel_button_widget.disabled = true;
                }
                else if(this.isWaitingSelection){
                    if (selectedCount > 0) {
                        this.confirm_button_widget.name = selectedCount > 1 ? 
                            `${$t('Progress selected')} (${selectedCount}/${imageCount})` : 
                            `${$t('Progress selected image')}`;
                        this.confirm_button_widget.disabled = false;
                    } else {
                        this.confirm_button_widget.name = $t("Please select images to continue");
                        this.confirm_button_widget.disabled = true;
                    }
                    this.cancel_button_widget.name = $t("Cancel current run");
                    this.cancel_button_widget.disabled = false;
                }
                else{
                    const modeText = {
                        "Always Pause": $t("Waiting for selection..."),
                        "Keep Last Selection": $t("Using last selection"),
                    }
                    this.confirm_button_widget.name = (selectedCount>0 && this.currentMode == 'Always Pause' ? $t("Please run first") : modeText?.[this.currentMode]) || $t("Unknown Mode");
                    this.cancel_button_widget.name = "";
                    this.confirm_button_widget.disabled = true;
                    this.cancel_button_widget.disabled = true;
                }
                this.setDirtyCanvas(true,true);
            }
            
            nodeType.prototype.serialize = function() {
                const data = LiteGraph.LGraphNode.prototype.serialize.call(this);
                
                data.isWaitingSelection = this.isWaitingSelection;
                data.currentMode = this.currentMode;
                
                if (this.imageData && this.imageData.length > 0) {
                    data.imageData = this.imageData;
                }
                
                if (this.selected_images && this.selected_images.size > 0) {
                    data.selected_images = Array.from(this.selected_images);
                }
                
                data.isExecuting = this.isExecuting || false;
                
                return data;
            };

            nodeType.prototype.configure = function(data) {
                LiteGraph.LGraphNode.prototype.configure.call(this, data);
                
                this.isWaitingSelection = data.isWaitingSelection || false;
                this.currentMode = data.currentMode || "Always Pause";
                this.imgs = [];
                
                this.updateWidgets();
            };

            nodeType.prototype.setExecutingState = function(isExecuting) {
                this.isExecuting = isExecuting;
                // this.strokeStyles = this.strokeStyles || {};
                // this.strokeStyles['customExecuting'] = function() {
                //     if (this.isExecuting) {return { color: '#0f0' }; }
                //     return null;
                // };
                if (app.graph) {
                    app.graph.setDirtyCanvas(true, false);
                }
            };


            const originalUpdate = nodeType.prototype.update;
            nodeType.prototype.update = function() {                
                originalUpdate?.call(this, arguments);
                this.updateWidgets();
            };

            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function(){
                onNodeCreated?.call(this, arguments);
                this.selected_images = new Set();
                this.anti_selected = new Set();
                this.currentMode = 'Always Pause'
                this.isWaitingSelection = false;
                this.isCanceling = false;
                this.imageData = [];
                this.imgs
                this.confirm_button_widget = this.addWidget("button", "", "", ()=>{this.confirmSelection()});
                this.cancel_button_widget = this.addWidget("button", "", "", ()=>{this.cancelSelection()});
                this.confirm_button_widget.serialize = false;
                this.cancel_button_widget.serialize = false;
                
                setTimeout(_=>{
                    const modeWidget = getWidgetByName(this, 'mode');
                    modeWidget.callback = (mode) => {
                        requestAnimationFrame(_=>{
                            this.currentMode = mode;
                            this.updateWidgets();
                            this.setDirtyCanvas(true, true);
                        })
                    }
                    this.currentMode = modeWidget.value || 'Always Pause';
                    this.updateWidgets();
                },1)

                
                Object.defineProperty(this.confirm_button_widget, 'clicked', {
                    get : function() { return this._clicked; },
                    set : function(v) { this._clicked = (v && this.name!=''); }
                })
                Object.defineProperty(this.cancel_button_widget, 'clicked', {
                    get : function() { return this._clicked; },
                    set : function(v) { this._clicked = (v && this.name!=''); }
                })

                Object.defineProperty(this, 'imageIndex', {
                    get : function() { return null; },
                    set: function (v) {this.overIndex= v},
                })
                Object.defineProperty(this, 'imagey', {
                    get: function (){
                        return this.widgets?.[this.widgets.length-1]?.last_y + LiteGraph.NODE_WIDGET_HEIGHT
                    },
                    set: function (v) {
                        this.imagey = v
                    }
                })

                /* Capture clicks */
                const org_onMouseDown = this.onMouseDown;
                this.onMouseDown = function( e, pos, canvas ) {
                    if (e.isPrimary) {
                        const i = click_is_in_image(this, pos);
                        if (i>=0) { this.toggleImageSelection(i); }
                    }
                    return (org_onMouseDown && org_onMouseDown.apply(this, arguments));
                }

                this.update();

            }

            const onDrawBackground = nodeType.prototype.onDrawBackground;
            nodeType.prototype.onDrawBackground = function(ctx) {
                additionalDrawBackground(this, ctx, this.imagey || 0);
            }

            nodeType.prototype.toggleImageSelection = function (imageIndex) {
                if (this.selected_images.has(imageIndex)) this.selected_images.delete(imageIndex);
                else this.selected_images.add(imageIndex);
                this.update();
            }

            
        }
    }
})


const click_is_in_image = (node, pos) => {
    if (node.imgs?.length>1) {
        for (var i = 0; i<node.imageRects.length; i++) {
            const dx = pos[0] - node.imageRects[i][0];
            const dy = pos[1] - node.imageRects[i][1];
            if ( dx > 0 && dx < node.imageRects[i][2] &&
                dy > 0 && dy < node.imageRects[i][3] ) {
                    return i;
                }
        }
    } else if (node.imgs?.length==1) {
        if (pos[1]>node.imagey) return 0;
    }
    return -1;
}
function drawRect(node, s, ctx) {
    const padding = 1;
    var rect;
    if (node.imageRects) {
        rect = node.imageRects[s];
    } else {
        const y = node.imagey;
        rect = [padding,y+padding,node.size[0]-2*padding,node.size[1]-y-2*padding];
    }
    ctx.strokeRect(rect[0]+padding, rect[1]+padding, rect[2]-padding*2, rect[3]-padding*2);
}
const is_all_same_aspect_ratio = imgs => {
    if (!imgs.length || imgs.length === 1) return true

    const ratio = imgs[0].naturalWidth / imgs[0].naturalHeight

    for (let i = 1; i < imgs.length; i++) {
        const this_ratio = imgs[i].naturalWidth / imgs[i].naturalHeight
        if (ratio != this_ratio) return false
    }
    return true
}
function calculateImageGrid(imgs, dw, dh) {
    let best = 0
    let w = imgs[0].naturalWidth
    let h = imgs[0].naturalHeight
    const numImages = imgs.length

    let cellWidth, cellHeight, cols, rows, shiftX
    // compact style
    for (let c = 1; c <= numImages; c++) {
        const r = Math.ceil(numImages / c)
        const cW = dw / c
        const cH = dh / r
        const scaleX = cW / w
        const scaleY = cH / h

        const scale = Math.min(scaleX, scaleY, 1)
        const imageW = w * scale
        const imageH = h * scale
        const area = imageW * imageH * numImages

        if (area > best) {
            best = area
            cellWidth = imageW
            cellHeight = imageH
            cols = c
            rows = r
            shiftX = c * ((cW - imageW) / 2)
        }
    }
    return { cellWidth, cellHeight, cols, rows, shiftX }
}
function additionalDrawBackground(node, ctx, shiftY=0) {
    if (!node.imgs || !node.imgs.length) return;
    const canvas = app.canvas
    const mouse = canvas.graph_mouse

    const IMAGE_TEXT_SIZE_TEXT_HEIGHT = 15
    const dw = node.size[0]
    let dh = node.size[1] - shiftY - IMAGE_TEXT_SIZE_TEXT_HEIGHT
    if(dh < 200) {
        dh = 200
        requestAnimationFrame(_=>{
            node.size[1] = shiftY + IMAGE_TEXT_SIZE_TEXT_HEIGHT + 200
        })
    }
    if(node.imageIndex == null){
        // calculate the size of the images
        let cellWidth
        let cellHeight
        let shiftX
        let cell_padding
        let cols
        const compact_mode = is_all_same_aspect_ratio(node.imgs)
        if (!compact_mode) {
            // use rectangle cell style and border line
            cell_padding = 2
            // Prevent infinite canvas2d scale-up
            const largestDimension = node.imgs.reduce(
                (acc, current) =>
                    Math.max(acc, current.naturalWidth, current.naturalHeight),
                0
            )
            const fakeImgs = []
            fakeImgs.length = node.imgs?.length
            fakeImgs[0] = {
                naturalWidth: largestDimension,
                naturalHeight: largestDimension
            }
            ;({ cellWidth, cellHeight, cols, shiftX } = calculateImageGrid(
                fakeImgs,
                dw,
                dh
            ))
        } else {
            cell_padding = 0;
            ({ cellWidth, cellHeight, cols, shiftX } = calculateImageGrid(
                node.imgs,
                dw,
                dh
            ))
        }
        let anyHovered = false
        let numImages = node.imgs.length
        node.imageRects = []
        for (let i = 0; i < numImages; i++) {
            const img = node.imgs[i]
            const row = Math.floor(i / cols)
            const col = i % cols
            const x = col * cellWidth + shiftX
            const y = row * cellHeight + shiftY
            if (!anyHovered) {
                anyHovered = LiteGraph.isInsideRectangle(
                    mouse[0],
                    mouse[1],
                    x + node.pos[0],
                    y + node.pos[1],
                    cellWidth,
                    cellHeight
                )
                if (anyHovered) {
                    node.overIndex = i
                    let value = 110
                    if (canvas.pointer_is_down) {
                        if (!node.pointerDown || node.pointerDown.index !== i) {
                            node.pointerDown = {index: i, pos: [...mouse]}
                        }
                        value = 125
                    }
                    ctx.filter = `contrast(${value}%) brightness(${value}%)`
                    canvas.canvas.style.cursor = 'pointer'
                }
            }
            node.imageRects.push([x, y, cellWidth, cellHeight])
        }
    }
    if (node.imageRects) {
        for (let i = 0; i < node.imgs.length; i++) {
            // delete underlying image
            ctx.fillStyle = "#000";
            ctx.fillRect(...node.imageRects[i])
            // draw the new one
            const img = node.imgs[i];
            const cellWidth = node.imageRects[i][2];
            const cellHeight = node.imageRects[i][3];

            let wratio = cellWidth/img.width;
            let hratio = cellHeight/img.height;
            var ratio = Math.min(wratio, hratio);

            let imgHeight = ratio * img.height;
            let imgWidth = ratio * img.width;

            const imgX = node.imageRects[i][0] + (cellWidth - imgWidth)/2;
            const imgY = node.imageRects[i][1] + (cellHeight - imgHeight)/2;
            const cell_padding = 2;
            ctx.drawImage(img, imgX+cell_padding, imgY+cell_padding, imgWidth-cell_padding*2, imgHeight-cell_padding*2);

        }
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = "green";
    if(node && node.selected_images){
        node.selected_images.forEach((s) => { drawRect(node,s, ctx) })
    }
    ctx.strokeStyle = "#F88";
    node?.anti_selected?.forEach((s) => { drawRect(node,s, ctx) })
}