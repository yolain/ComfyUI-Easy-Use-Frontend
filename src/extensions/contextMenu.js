import {app,api,$el} from "@/composable/comfyAPI";
import {reboot, cleanVRAM} from "@/composable/easyuseAPI.js";
import {$t} from "@/composable/i18n.js";
import {isLocalNetwork, normalize} from "@/composable/util.js";
import {toast} from "@/components/toast.js";
import {COMFYUI_NODE_BASIC_CATEGORY, NODES_MAP_ID, NO_PREVIEW_IMAGE} from "@/constants";
import {getSetting} from "@/composable/settings.js";
import {getWidgetByName, getWidgetValue} from "@/composable/node.js";

let modelsList = {}
let isPyssssNode = false
/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.ContextMenu',
    async setup() {
        LGraphCanvas.onMenuAdd = onMenuAdd;
        // Get Models List
        getModelsList();
        // ContextMenu ReWrite
        const contextMenu = LiteGraph.ContextMenu;
        LiteGraph.ContextMenu = function(values, options){
            if(!(options?.callback) || values.some(i => typeof i !== 'string')) {
                if (options.parentMenu) {
                    // 1. contextmenu on submenu
                }
                // 2. contextmenu on a node
                else if (options.extra) {

                }
                // 3. contextmenu on combo widget
                else if (options.scale) {

                }
                // 4. contextmenu on canvas
                else {
                    const options_enabled = getSetting('EasyUse.ContextMenu.QuickOptions',null, 'At the forefront');
                    if (options.hasOwnProperty('extra') && options_enabled !== 'Disable') {
                        // add reboot and cleanup
                        options_enabled == 'At the forefront' ? values.unshift(null) : values.push(null);
                        if (isLocalNetwork(window.location.host)) {
                            const reboot_icon = {
                                content: `<i class="mdi mdi-refresh-circle comfyui-easyuse-error" style="margin-right:2px;font-size:16px"></i>${$t('Reboot ComfyUI')}`,
                                callback: _ => reboot()
                            }
                            options_enabled == 'At the forefront' ? values.unshift(reboot_icon) : values.push(reboot_icon);
                        }
                        const vram_extra = getSetting('EasyUse.Hotkeys.cleanVRAMUsed',null, true) ? '('+normalize('Shift+r')+')' : ''
                        const vram_icon = {
                            content: `<i class="mdi mdi-rocket comfyui-easyuse-theme" style="margin-right:2px;font-size:16px"></i>${$t('Cleanup Of VRAM Usage')} ${vram_extra}`,
                            callback: _ => cleanVRAM()
                        }
                        options_enabled == 'At the forefront' ? values.unshift(vram_icon) : values.push(vram_icon);
                        const sitemap_extra = getSetting('EasyUse.Hotkeys.toggleNodesMap',null, true) ? '('+normalize('Shift+m')+')' : ''
                        const map_icon = {
                            content: `<i class="mdi mdi-sitemap comfyui-easyuse-warning" style="margin-right:2px;font-size:14px"></i>${$t('Nodes Map')} ${sitemap_extra}`,
                            callback: _ => {
                                const sidebarTab = app.extensionManager?.sidebarTab || app.extensionManager
                                const activeSidebarTab = app.extensionManager.sidebarTab?.activeSidebarTabId || app.extensionManager?.activeSidebarTab
                                if(activeSidebarTab == NODES_MAP_ID) sidebarTab.activeSidebarTabId = null
                                else sidebarTab.activeSidebarTabId = NODES_MAP_ID
                            }
                        }
                        options_enabled == 'At the forefront' ? values.unshift(map_icon) : values.push(map_icon);
                    }

                }
                return contextMenu.apply(this, [...arguments]);
            }
            else{
                const newValues = setComboOptions(values, options)
                if(newValues)  {
                    return contextMenu.call(this, newValues, options);
                }
                return contextMenu.apply(this, [...arguments]);
            }
        }
        LiteGraph.ContextMenu.prototype = contextMenu.prototype;
        if(getSetting('EasyUse.ContextMenu.NodesSort')){
            LiteGraph.ContextMenu.prototype.addItem = contextMenuAddItem;
        }

        // Force hide Model Thumbnail
        document.getElementById('graph-canvas').addEventListener('mouseenter',_=>{
            setTimeout(_=>{
                const image_element = document.getElementById('easyuse-model-thumbnail')
                if(!image_element || image_element.style.opacity == 0) return
                image_element.style.display = 'none'
                image_element.style.opacity = 0
                image_element.style.left = '0px'
                image_element.style.top = '0px'
            },100)
        })
    },
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        const onNodeCreated = nodeType.prototype.onNodeCreated;
        if (["CheckpointLoader|pysssss", "LoraLoader|pysssss"].includes(nodeData.name)) {
            nodeType.prototype.onNodeCreated = async function () {
                onNodeCreated ? onNodeCreated.apply(this, []) : undefined;
                let widget = getWidgetByName(this, 'lora_name') || getWidgetByName(this, 'ckpt_name')
                if (widget) {
                    let oldClick = widget.onClick
                    widget.onClick = function (options) {
                        isPyssssNode = true
                        setTimeout(_=>{
                            isPyssssNode = false
                        },500)
                        return oldClick.call(this, options)
                    }
                }
            }
        }
    }
})


/* Functions */
function serializeParentNodeMenu(context_menus){
    let basic_menus = []
    let others_menus = []
    context_menus.forEach(menu=>{
        if(menu?.value && COMFYUI_NODE_BASIC_CATEGORY.includes(menu.value.split('/')[0])) basic_menus.push(menu)
        else others_menus.push(menu)
    })
    return [...[{title:$t('ComfyUI Basic'),is_category_title:true}],...basic_menus,...[{title:$t('Others A~Z'),is_category_title:true}],...others_menus.sort((a,b)=>a.content.localeCompare(b.content))]
}


// MenuAdd
function onMenuAdd(node, options, e, prev_menu, callback) {
    var canvas = LGraphCanvas.active_canvas;
    var ref_window = canvas.getCanvasWindow();
    var graph = canvas.graph;
    if (!graph)
        return;
    function inner_onMenuAdded(base_category ,prev_menu){
        var categories  = LiteGraph.getNodeTypesCategories(canvas.filter || graph.filter).filter(function(category){return category.startsWith(base_category)});
        var entries = [];

        categories.map(function(category){
            if (!category) return;

            var base_category_regex = new RegExp('^(' + base_category + ')');
            var category_name = category.replace(base_category_regex,"").split('/')[0];
            var category_path = base_category  === '' ? category_name + '/' : base_category + category_name + '/';

            var name = category_name;
            if(name.indexOf("::") != -1) //in case it has a namespace like "shader::math/rand" it hides the namespace
                name = name.split("::")[1];

            var index = entries.findIndex(function(entry){return entry.value === category_path});
            if (index === -1) {
                entries.push({ value: category_path, content: name, has_submenu: true, callback : function(value, event, mouseEvent, contextMenu){
                        inner_onMenuAdded(value.value, contextMenu)
                    }});
            }

        });

        var nodes = LiteGraph.getNodeTypesInCategory(base_category.slice(0, -1), canvas.filter || graph.filter );
        nodes.map(function(node){

            if (node.skip_list)
                return;

            var entry = { value: node.type, content: node.title, has_submenu: false , callback : function(value, event, mouseEvent, contextMenu){
                    var first_event = contextMenu.getFirstEvent();
                    canvas.graph.beforeChange();
                    var node = LiteGraph.createNode(value.value);
                    if (node) {
                        node.pos = canvas.convertEventToCanvasOffset(first_event);
                        canvas.graph.add(node);
                    }
                    if(callback)
                        callback(node);
                    canvas.graph.afterChange();
                }
            }

            entries.push(entry);

        });
        // change sort order of parent context menu
        const enabled = getSetting('EasyUse.ContextMenu.NodesSort',null, true);
        if(base_category === '' && enabled) entries = serializeParentNodeMenu(entries)
        new LiteGraph.ContextMenu( entries, { event: e, parentMenu: prev_menu }, ref_window );
    }
    inner_onMenuAdded('',prev_menu);
    return false;
}


// ContextMenu AddItem
function encodeRFC3986URIComponent(str) {
    try{
        return encodeURIComponent(str).replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        );
    }
    catch (e){
        return str
    }
}
const isCustomItem = (value) => value && typeof value === "object" && "image" in value && value.content;
function contextMenuAddItem(name, value, options){
    var that = this;
    options = options || {};
    var element = document.createElement("div");
    element.className = "litemenu-entry submenu";

    var disabled = false;

    if (value === null) {
        element.classList.add("separator");
    }
    else if(value.is_category_title) {
        element.classList.remove("litemenu-entry");
        element.classList.remove("submenu");
        element.classList.add("litemenu-title");
        element.innerHTML = value.title;
    }
    else {
        element.innerHTML = value && value.title ? value.title : name;
        element.value = value;

        if (value) {
            if (value.disabled) {
                disabled = true;
                element.classList.add("disabled");
            }
            if (value.submenu || value.has_submenu) {
                element.classList.add("has_submenu");
            }
        }

        if (typeof value == "function") {
            element.dataset["value"] = name;
            element.onclick_callback = value;
        } else {
            element.dataset["value"] = value;
        }

        if (value.className) {
            element.className += " " + value.className;
        }
    }
    if (element && value?.thumbnail){
        element.addEventListener("mouseenter", showModelsThumbnail(element, value, this.root),{passive:true})
        element.addEventListener("mouseleave", closeModelsThumbnail(),{passive:true})
        element.addEventListener("click",closeModelsThumbnail(),{passive:true})
    }

    this.root.appendChild(element);
    if (!disabled) {
        element.addEventListener("click", inner_onclick);
    }
    if (!disabled && options.autoopen) {
        LiteGraph.pointerListenerAdd(element,"enter",inner_over);
    }

    function inner_over(e) {
        var value = this.value;
        if (!value || !value.has_submenu) {
            return;
        }
        //if it is a submenu, autoopen like the item was clicked
        inner_onclick.call(this, e);
    }

    //menu option clicked
    function inner_onclick(e) {
        var value = this.value;
        var close_parent = true;

        if (that.current_submenu) {
            that.current_submenu.close(e);
        }

        //global callback
        if (options.callback) {
            var r = options.callback.call(
                this,
                value,
                options,
                e,
                that,
                options.node
            );
            if (r === true) {
                close_parent = false;
            }
        }

        //special cases
        if (value) {
            if (
                value.callback &&
                !options.ignore_item_callbacks &&
                value.disabled !== true
            ) {
                //item callback
                var r = value.callback.call(
                    this,
                    value,
                    options,
                    e,
                    that,
                    options.extra
                );
                if (r === true) {
                    close_parent = false;
                }
            }
            if (value.submenu) {
                if (!value.submenu.options) {
                    throw "ContextMenu submenu needs options";
                }
                var submenu = new that.constructor(value.submenu.options, {
                    callback: value.submenu.callback,
                    event: e,
                    parentMenu: that,
                    ignore_item_callbacks:
                    value.submenu.ignore_item_callbacks,
                    title: value.submenu.title,
                    extra: value.submenu.extra,
                    autoopen: options.autoopen
                });
                close_parent = false;
            }
        }

        if (close_parent && !that.lock) {
            that.close();
        }
    }
    return element;
}

function spliceExtensions(fileName){
    return fileName?.substring(0,fileName.lastIndexOf('.'))
}
function getExtensions(fileName){
    return fileName?.substring(fileName.lastIndexOf('.') + 1)
}

const calculateImagePosition = (el, rootRect, bodyRect) => {
    const {x} = el.getBoundingClientRect();
    let {top, left} = rootRect;
    const {width: bodyWidth, height: bodyHeight} = bodyRect;

    const isSpaceRight = x <= bodyWidth;
    if (isSpaceRight) {
        left += rootRect.width;
    }
    const isSpaceBelow = rootRect.top <= bodyHeight;
    if (!isSpaceBelow) {
        top = bodyHeight;
    }
    return {left, top};
}
// Get Models List
const getModelsList = async () => {
    ['checkpoints','loras', 'diffusion_models'].map(async(cate)=>{
        const models = await api.getModels(cate)
        if(models?.length>0){
            models.map(i=>{
                modelsList[i.name] = {folder:cate, pathIndex:i.pathIndex}
            })
        }
    })
}
const showModelsThumbnail = (el, value, root) => (e) => {
    const image_show = src => {
        setTimeout(_ =>{
            const rootRect = root.getBoundingClientRect()
            if(!rootRect) return
            const bodyRect = document.body.getBoundingClientRect();
            if (!bodyRect) return;
            const { left, top } = calculateImagePosition(el, rootRect, bodyRect);
            const image_element = document.getElementById('easyuse-model-thumbnail')
            image_element.src = src
            image_element.style.left = `${left}px`
            image_element.style.top = `${top}px`
            image_element.style.display = 'block'
            image_element.style.opacity = 1
            image_element.onerror = _=> {
                image_element.src = NO_PREVIEW_IMAGE
            }
        },10)
    }

    if(modelsList?.[value.fullName]?.img){
        let img = modelsList[value.fullName].img
        img == 'no_preview_image' ?  image_show(NO_PREVIEW_IMAGE) : image_show(img.src)
    }else{
        let img = new Image()
        img.src = value.thumbnail
        img.onload = _ => {
            modelsList[value.fullName].img = img
            image_show(value.thumbnail)
        }
        img.onerror = _ => {
            img = null
            modelsList[value.fullName].img = 'no_preview_image'
            image_show(NO_PREVIEW_IMAGE)
        }
    }

}
const closeModelsThumbnail = () => (e) => {
    const image_element = document.getElementById('easyuse-model-thumbnail')
    if(!image_element || image_element.style.opacity == 0) return
    image_element.style.display = 'none'
    image_element.style.opacity = 0
    image_element.style.left = '0px'
    image_element.style.top = '0px'
}

// display model thumbnails preview
function setComboOptions(values, options){
    const enableModelThumbnail = getSetting('EasyUse.ContextMenu.ModelsThumbnails',null);
    const enableSubDirectories = getSetting('EasyUse.ContextMenu.SubDirectories',null);
    if(!enableModelThumbnail && !enableSubDirectories) return null;
    if(isPyssssNode) return null;
    // Allow Extensions
    const allow_extensions = ['ckpt', 'pt', 'bin', 'pth', 'safetensors', 'gguf']
    if(values?.length>0){
        const ext = getExtensions(values[values.length-1]);
        if(!allow_extensions.includes(ext)) return null;
    }

    // setCallback
    const oldcallback = options.callback;
    const originalValues = [...values];
    options.callback = null;
    const newCallback = (item,options) => {
        if(['None','无','無','なし'].includes(item.content)) oldcallback('None',options)
        else oldcallback(originalValues.find(i => i.endsWith(item.content),options));
    };
    // only enable models thumbnails
    if(enableModelThumbnail && !enableSubDirectories){
        return values.map(value => {
            let folder = modelsList[value]?.folder
            let pathIndex = modelsList[value]?.pathIndex
            const protocol = window.location.protocol
            const host = window.location.host
            const base_url = `${protocol}//${host}`
            let src = folder ? `${base_url}/api/experiment/models/preview/${folder}/${pathIndex}/${encodeRFC3986URIComponent(value)}` : ''
            let newContent = $el("div.comfyui-easyuse-contextmenu-model", {},[$el("span",{}, value)])
            return {
                folder,
                content: value,
                fullName: value,
                title: newContent.outerHTML,
                thumbnail:src,
                callback: newCallback
            }
        })
    }

    const compatValues = values;
    const folders = {};
    const specialOps = [];
    const folderless = [];

    for(const value of compatValues){
        const splitBy = value.indexOf('/') > -1 ? '/' : '\\';
        const valueSplit = value.split(splitBy);
        if(valueSplit.length > 1){
            const key = valueSplit.shift();
            folders[key] = folders[key] || [];
            folders[key].push({value:valueSplit.join(splitBy),fullValue:value});
        }else if(value === 'CHOOSE' || value.startsWith('DISABLE ')){
            specialOps.push({value, fullValue:value});
        }else{
            folderless.push({value, fullValue:value});
        }
    }
    const foldersCount = Object.values(folders).length;
    const newValues = [];
    const addContent = (content, folderName='', fullName) => {
        let newContent
        newContent = $el("div.comfyui-easyuse-contextmenu-model", {},[
            $el("span",{},content)
        ])
        let folder = modelsList[fullName]?.folder
        let pathIndex = modelsList[fullName]?.pathIndex
        const protocol = window.location.protocol
        const host = window.location.host
        const base_url = `${protocol}//${host}`
        let src = folder ? `${base_url}/api/experiment/models/preview/${folder}/${pathIndex}/${encodeRFC3986URIComponent(fullName)}` : ''
        return {
            folder,
            content,
            fullName,
            thumbnail:enableModelThumbnail ? src : null,
            title:newContent.outerHTML,
            callback: newCallback
        }
    }
    if(foldersCount > 0){
        const add_sub_folder = (folder, folderName) => {
            let subs = []
            let less = []
            const b = folder.map(({value:name,fullValue:fullName})=> {
                const _folders = {};
                const splitBy = name.indexOf('/') > -1 ? '/' : '\\';
                const valueSplit = name.split(splitBy);
                if(valueSplit.length > 1){
                    const key = valueSplit.shift();
                    _folders[key] = _folders[key] || [];
                    _folders[key].push({value:valueSplit.join(splitBy),fullValue:fullName});
                }
                const foldersCount = Object.values(folders).length;
                if(foldersCount > 0){
                    let key = Object.keys(_folders)[0]
                    if(key && _folders[key]) subs.push({key, value:_folders[key][0]})
                    else{
                        less.push(addContent(name,key,fullName))
                    }
                }
                return addContent(name,folderName,fullName)
            })
            if(subs.length>0){
                let subs_obj = {}
                subs.forEach(item => {
                    subs_obj[item.key] = subs_obj[item.key] || []
                    subs_obj[item.key].push(item.value)
                })
                return [...Object.entries(subs_obj).map(f => {
                    return {
                        content: f[0],
                        has_submenu: true,
                        callback: () => {},
                        submenu: {
                            options: add_sub_folder(f[1], f[0]),
                        }
                    }
                }),...less]
            }
            else return b
        }

        for(const [folderName,folder] of Object.entries(folders)){
            newValues.push({
                content:folderName,
                has_submenu:true,
                callback:() => {},
                submenu:{
                    options:add_sub_folder(folder,folderName),
                }
            });
        }
    }
    newValues.push(...folderless.map(f => addContent(f.value, '', f.fullValue)));
    if(specialOps.length > 0) newValues.push(...specialOps.map(f => addContent(f.value, '', f.fullValue)));
    return newValues;
}