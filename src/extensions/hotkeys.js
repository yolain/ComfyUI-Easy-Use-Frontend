import hotkeys from "hotkeys-js";
import {app, api, GroupNodeConfig} from "@/composable/comfyAPI";
import {getSetting} from "@/composable/settings";
import {toast} from "@/components/toast.js";
import {$t} from "@/composable/i18n.js";
import {
    getSelectedNodes,
    isGetNode,
    isSetNode,
    jumpToNode,
    addNodesToGroup,
    setNodesSameSize,
    distributeNodes
} from "@/composable/node.js";
import {useNodesStore} from "@/stores/nodes.js";
import {cleanVRAM} from "@/composable/easyuseAPI.js";
import {NODES_MAP_ID} from "@/constants/index.js";
/* Variables */
let nodesStore = null

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.HotKeys',
    setup() {
        if(hotkeys !== undefined){
            // Register hotkeys with Up, Down, Left, Right to jump Selected Node
            hotkeys('up,down,left,right', function(event, handler){
                event.preventDefault();
                const enableJumpNearestNodes = getSetting('EasyUse.Hotkeys.JumpNearestNodes',null, true);
                if(!enableJumpNearestNodes) return
                // Get Selected Nodes Jump
                const selectNodes = getSelectedNodes();
                if(selectNodes.length === 0) return;
                const node = selectNodes[0];
                switch (handler.key) {
                    case 'up':
                    case 'left':
                        let prev_node_link_id = null
                        if(isGetNode(node)){
                            const widget_value = node.widgets_values?.[0]
                            const all_nodes = node.graph?._nodes
                            const prev_node = all_nodes?.find((n)=>{
                                if(isSetNode(n)){
                                    const widget_value_next = n.widgets_values?.[0]
                                    if(widget_value_next === widget_value){
                                        return n
                                    }
                                }
                                return null
                            })
                            if(prev_node) jumpToNode(prev_node)
                        }
                        else if(node.inputs?.length>0){
                            for(let i =0;i<node.inputs.length;i++){
                                if(node.inputs[i].link){
                                    prev_node_link_id = node.inputs[i].link
                                    break
                                }
                            }
                            if(prev_node_link_id){
                                const links = node.graph?.links
                                if(links[prev_node_link_id]){
                                    const origin_id = links[prev_node_link_id]?.origin_id
                                    const origin_node = node.graph?._nodes_by_id?.[origin_id]
                                    if(origin_node) jumpToNode(origin_node)
                                }
                            }
                        }
                        break
                    case 'down':
                    case 'right':
                        let next_node_link_id = null
                        if(isSetNode(node)){
                            const widget_value = node.widgets_values?.[0]
                            const all_nodes = node.graph?._nodes
                            const next_node = all_nodes?.find((n)=>{
                                if(isGetNode(n)){
                                    const widget_value_next = n.widgets_values?.[0]
                                    if(widget_value_next === widget_value){
                                        return n
                                    }
                                }
                                return null
                            })
                            if(next_node) jumpToNode(next_node)
                        }
                        else if(node.outputs?.length>0){
                            for(let i =0;i<node.outputs.length;i++){
                                if(node.outputs[i].links?.length>0 && node.outputs[i].links[0]){
                                    next_node_link_id = node.outputs[i].links[0]
                                    break
                                }
                            }
                            if(next_node_link_id){
                                const links = node.graph?.links
                                if(links[next_node_link_id]){
                                    const target_id = links[next_node_link_id]?.target_id
                                    const target_node = node.graph?._nodes_by_id?.[target_id]
                                    if(target_node) jumpToNode(target_node)
                                }
                            }
                        }
                        break
                }
            })


            // Register hotkeys with Shift + Up, Down, Left, Right to align Selected Node
            hotkeys('shift+up,shift+down,shift+left,shift+right,shift+alt+⌘+left,shift+alt+⌘+right,shift+alt+ctrl+left,shift+alt+ctrl+right', function(event, handler){
                event.preventDefault();
                const enableAlighSelectedNodes = getSetting('EasyUse.Hotkeys.AlignSelectedNodes',null, true);
                if(!enableAlighSelectedNodes) return
                // Get Selected Nodes Jump
                const selectNodes = getSelectedNodes();
                if(selectNodes.length <= 1) return;
                const nodes = selectNodes;
                switch (handler.key) {
                    case 'shift+up':
                        LGraphCanvas.alignNodes(nodes, 'top', nodes[0])
                        break
                    case 'shift+down':
                        LGraphCanvas.alignNodes(nodes, 'bottom', nodes[0])
                        break
                    case 'shift+left':
                        LGraphCanvas.alignNodes(nodes, 'left', nodes[0])
                        break
                    case 'shift+right':
                        LGraphCanvas.alignNodes(nodes, 'right', nodes[0])
                        break
                    case 'shift+alt+ctrl+left':
                    case 'shift+alt+⌘+left':
                        distributeNodes(nodes, 'horizontal')
                        break
                    case 'shift+alt+ctrl+right':
                    case 'shift+alt+⌘+right':
                        distributeNodes(nodes, 'vertical')
                        break
                }
                // Update NodesStore
                if(!nodesStore) nodesStore = useNodesStore()
                if(nodesStore) nodesStore.update()
            })

            // Register hotkeys with Shift + Ctrl + Left, Right to normalize Selected Node
            hotkeys('shift+⌘+left,shift+⌘+right,shift+ctrl+left,shift+ctrl+right', function(event, handler) {
                event.preventDefault();
                const enableAlighSelectedNodes = getSetting('EasyUse.Hotkeys.NormalizeSelectedNodes', null, true);
                if (!enableAlighSelectedNodes) return
                // Get Selected Nodes Jump
                const selectNodes = getSelectedNodes();
                if (selectNodes.length <= 1) return;
                const nodes = selectNodes;
                switch (handler.key) {
                    case 'shift+ctrl+left':
                    case 'shift+⌘+left':
                        setNodesSameSize(nodes, 'width')
                        break
                    case 'shift+ctrl+right':
                    case 'shift+⌘+right':
                        setNodesSameSize(nodes, 'height')
                        break
                }
                // Update NodesStore
                if(!nodesStore) nodesStore = useNodesStore()
                if(nodesStore) nodesStore.update()
            })

            // Register hotkeys with Shift + g to add selected nodes to a group
            hotkeys('shift+g', function (event, handler) {
                event.preventDefault();
                const enableAddGroup = getSetting('EasyUse.Hotkeys.AddGroup',null, true);
                if(!enableAddGroup) return
                // Get Selected Nodes Jump
                addSelectedNodesToGroup()
                // Update NodesStore
                if(!nodesStore) nodesStore = useNodesStore()
                if(nodesStore) nodesStore.update()
            })

            // Clean VRAM Used with Shift + r to unload models and node cache
            hotkeys('shift+r', function (event, handler) {
                event.preventDefault();
                const enableClean = getSetting('EasyUse.Hotkeys.cleanVRAMused',null, true);
                if(!enableClean) return
                // clean VRAM Used
                cleanVRAM()
            })

            // Toggle Nodes Map with Shift + m
            hotkeys('shift+m', function (event, handler) {
                const enableToggleMap = getSetting('EasyUse.Hotkeys.toggleNodesMap',null, true);
                if(!enableToggleMap) return
                let sidebarTab = app.extensionManager?.sidebarTab || app.extensionManager
                let activeSidebarTab = app.extensionManager.sidebarTab?.activeSidebarTabId || app.extensionManager?.activeSidebarTab
                if(activeSidebarTab == NODES_MAP_ID) sidebarTab.activeSidebarTabId = null
                else sidebarTab.activeSidebarTabId = NODES_MAP_ID
            })

            // Register hotkeys with ALT+1~9 to add node template to canvas qulickly
            const node_template_keys = []
            Array.from(Array(10).keys()).forEach((i) => node_template_keys.push(`alt+${i}`))
            hotkeys(node_template_keys.join(','), async function (event, handler) {
                event.preventDefault();
                const enableNodesTemplate = getSetting('EasyUse.Hotkeys.NodesTemplate',null, true);
                if(!enableNodesTemplate) return
                const key = handler.key
                let number = parseInt(key.split('+')[1])
                const file = await api.getUserData('comfy.templates.json')
                let templates = null
                if (file.status == 200) {
                    try {
                        templates = await file.json()
                    } catch (e) {
                        toast.error($t('Get Node Templates File Failed'))
                    }
                } else if (localStorage['Comfy.NodeTemplates']) {
                    templates = JSON.parse(localStorage['Comfy.NodeTemplates'])
                } else {
                    toast.warn($t('No Node Templates Found'))
                }
                if (!templates) {
                    toast.warn($t('No Node Templates Found'))
                    return
                }
                number = number === 0 ? 9 : number - 1
                const template = templates[number]
                if (!template) {
                    toast.warn($t('Node template with {key} not set').replace('{key}', key))
                    return
                }
                try {
                    const name = template?.name || 'Group'
                    const data = template?.data ? JSON.parse(template.data) : []
                    clipboardAction(async () => {
                        await GroupNodeConfig.registerFromWorkflow(data.groupNodes, {});
                        localStorage["litegrapheditor_clipboard"] = template.data;
                        app.canvas.pasteFromClipboard();
                        if (!data.groupNodes) {
                            // todo: add setting to always set group name with node template paste to canvas
                            addSelectedNodesToGroup(name)
                        }
                    })
                } catch (e) {
                    toast.error(e)
                }
            })

            const keybindListener = async function (e) {
                if ((e.key === 'b' || e.key == 'm') && (e.metaKey || e.ctrlKey)) {
                    // Get Selected Nodes Jump
                    const selectNodes = getSelectedNodes();
                    if(selectNodes.length === 0) return;
                    // Update NodesStore
                    if(!nodesStore) nodesStore = useNodesStore()
                    if(nodesStore) nodesStore.update()
                }
            }
            window.addEventListener("keydown",keybindListener,true)
        }
    }
});


/* Functions */
const clipboardAction = async(cb) =>{
    const old = localStorage['litegrapheditor_clipboard'];
    await cb();
    localStorage['litegrapheditor_clipboard'] = old;
}
const addSelectedNodesToGroup = (name)=>{
    const selectNodes = getSelectedNodes();
    if(selectNodes.length === 0) return;
    const nodes = selectNodes;
    let group = new LiteGraph.LGraphGroup();
    group.title = name || 'Group';
    addNodesToGroup(group, nodes);
    app.canvas.graph.add(group);
}