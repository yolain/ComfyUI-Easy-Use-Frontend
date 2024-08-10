import {app,api,$el} from "@/composable/comfyAPI";
import {$t} from "@/composable/i18n.js";
import {isLocalNetwork} from "@/composable/util.js";
import {toast} from "@/components/toast.js";
import {COMFYUI_NODE_BASIC_CATEGORY} from "@/config";
import {getSetting} from "@/composable/settings.js";

/* Variables */
let thumbnails = []

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.ContextMenu',
    async setup() {
        LGraphCanvas.onMenuAdd = onMenuAdd;

        const imgRes = await api.fetchApi(`/easyuse/models/thumbnail`)
        if (imgRes.status === 200) {
            let data = await imgRes.json();
            thumbnails = data
        }
        else {
            toast.error($t("Too many thumbnails, have closed the display"))
        }

        const contextMenu = LiteGraph.ContextMenu;
        LiteGraph.ContextMenu = function(values,options){
            if(options.parentMenu){
                // 1. contextmenu on submenu
            }
            // 2. contextmenu on a node
            else if(options.extra){
                const constructor_name = options.extra.constructor?.name
                if(constructor_name == 'ComfyNode'){

                }
            }
            // 3. contextmenu on combo widget
            else if(options.scale){
                const enabled = getSetting('EasyUse.ContextMenu.SubDirectories',null, true);
                if(enabled){
                    const newValues = displayThumbnails(values,options)
                    if(newValues)  {
                        return contextMenu.call(this, newValues, options);
                    }
                }
            }
            // 4. contextmenu on canvas
            else{
                if(options.hasOwnProperty('extra')){
                    // add reboot and cleanup
                    values.unshift(null)
                    if(isLocalNetwork(window.location.host)) {
                        values.unshift({
                            content:`<i class="mdi mdi-refresh-circle comfyui-easyuse-error" style="margin-right:2px;font-size:16px"></i>${$t('Reboot ComfyUI')}`,
                            callback: _=> reboot()
                        })
                    }
                    values.unshift({
                        content:`<i class="mdi mdi-rocket comfyui-easyuse-theme" style="margin-right:2px;font-size:16px"></i>${$t('Cleanup Of GPU Usage')}`,
                        callback: _=> cleanup()
                    })
                }

            }
            return contextMenu.apply(this,[...arguments]);
        }
        LiteGraph.ContextMenu.prototype = contextMenu.prototype;
        LiteGraph.ContextMenu.prototype.addItem = contextMenuAddItem;
    }
})


/* Functions */
function serializeParentNodeMenu(context_menus){
    let basic_menus = []
    let easyuse_menus = []
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

// cleanup
async function cleanup(){
    try {
        const {Running, Pending} = await api.getQueue()
        if(Running.length>0 || Pending.length>0){
            toast.error($t("Clean Failed")+ ":"+ $t("Please stop all running tasks before cleaning GPU"))
            return
        }
        const res = await api.fetchApi("/easyuse/cleangpu",{method:"POST"})
        if(res.status == 200){
            toast.success($t("Clean SuccessFully"))
        }else{
            toast.error($t("Clean Failed"))
        }

    } catch (exception) {}
}

// reboot
async function reboot(){
    if (confirm($t("Are you sure you'd like to reboot the server?"))){
        try {
            api.fetchApi("/easyuse/reboot");
        } catch (exception) {}
    }
}


function spliceExtension(fileName){
    return fileName.substring(0,fileName.lastIndexOf('.'))
}
function getExtension(fileName){
    return fileName.substring(fileName.lastIndexOf('.') + 1)
}
// display model thumbnails preview
function displayThumbnails(values, options){
    const compatValues = values;
    const originalValues = [...compatValues];
    const folders = {};
    const specialOps = [];
    const folderless = [];
    const allow_extensions = ['ckpt', 'pt', 'bin', 'pth', 'safetensors']
    if(values?.length>0){
        const firstExt = getExtension(values[values.length-1]);
        if(!allow_extensions.includes(firstExt)) return null;
    }
    for(const value of compatValues){
        const splitBy = value.indexOf('/') > -1 ? '/' : '\\';
        const valueSplit = value.split(splitBy);
        if(valueSplit.length > 1){
            const key = valueSplit.shift();
            folders[key] = folders[key] || [];
            folders[key].push(valueSplit.join(splitBy));
        }else if(value === 'CHOOSE' || value.startsWith('DISABLE ')){
            specialOps.push(value);
        }else{
            folderless.push(value);
        }
    }
    const foldersCount = Object.values(folders).length;
    if(foldersCount > 0){
        const oldcallback = options.callback;
        options.callback = null;
        const newCallback = (item,options) => {
            if(['None','无','無','なし'].includes(item.content)) oldcallback('None',options)
            else oldcallback(originalValues.find(i => i.endsWith(item.content),options));
        };
        const addContent = (content, folderName='') => {
            const name = folderName ? folderName + '\\' + spliceExtension(content) : spliceExtension(content);
            const ext = getExtension(content)
            const time = new Date().getTime()
            let thumbnail = ''
            if(allow_extensions.includes(ext)){
                for(let i=0;i<thumbnails.length;i++){
                    let thumb = thumbnails[i]
                    if(name && thumb && thumb.indexOf(name) != -1){
                        thumbnail = thumbnails[i]
                        break
                    }
                }
            }

            let newContent
            const enabled = getSetting('EasyUse.ContextMenu.ModelsThumbnails',null, true);
            if(thumbnail && enabled){
                const protocol = window.location.protocol
                const host = window.location.host
                const base_url = `${protocol}//${host}`
                const thumb_url = thumbnail.replace(':','%3A').replace(/\\/g,'/')
                newContent = $el("div.comfyui-easyuse-contextmenu-model", {},[$el("span",{},content + ' *'),$el("img",{src:`${base_url}/${thumb_url}?t=${time}`})])
            }else{
                newContent = $el("div.comfyui-easyuse-contextmenu-model", {},[
                    $el("span",{},content)
                ])
            }

            return {
                content,
                title:newContent.outerHTML,
                callback: newCallback
            }
        }
        const newValues = [];
        const add_sub_folder = (folder, folderName) => {
            let subs = []
            let less = []
            const b = folder.map(name=> {
                const _folders = {};
                const splitBy = name.indexOf('/') > -1 ? '/' : '\\';
                const valueSplit = name.split(splitBy);
                if(valueSplit.length > 1){
                    const key = valueSplit.shift();
                    _folders[key] = _folders[key] || [];
                    _folders[key].push(valueSplit.join(splitBy));
                }
                const foldersCount = Object.values(folders).length;
                if(foldersCount > 0){
                    let key = Object.keys(_folders)[0]
                    if(key && _folders[key]) subs.push({key, value:_folders[key][0]})
                    else{
                        less.push(addContent(name,key))
                    }
                }
                return addContent(name,folderName)
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
        newValues.push(...folderless.map(f => addContent(f, '')));
        if(specialOps.length > 0) newValues.push(...specialOps.map(f => addContent(f, '')));
        return newValues;
    }
    else return null;
}