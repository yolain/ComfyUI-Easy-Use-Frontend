import {app} from "@/composable/comfyAPI.js";
import {NODES_MAP_ID} from "@/config/index";
import { defineStore } from 'pinia'
import cloneDeep from "lodash/cloneDeep";
import {getSetting} from "@/composable/settings.js";
export const useNodesStore = defineStore('groups', {
    state: _ => ({
        groups:[],
        nodes:[],
        isWatching:false,
    }),
    getters:{
        groups_nodes(){
            let groups_nodes = []
            let un_groups = []
            if(this.nodes?.length>0){
                this.nodes.map(node=>{
                    let pos = node.pos
                    let has_group = false
                    for(let i=0;i< this.groups.length;i++){
                        let group = this.groups[i]
                        if(pos[0]> group.pos[0] && pos[0]<group.pos[0]+group.size[0] && pos[1]>group.pos[1] && pos[1]<group.pos[1]+group.size[1]){
                            if(!groups_nodes[i]) groups_nodes[i] = {info:group,children:[]}
                            groups_nodes[i]['children'].push(node)
                            has_group = true
                            break
                        }
                    }
                    if(!has_group){
                        un_groups.push({info:node})
                    }
                })
                // add groups without nodes
                for(let i=0;i< this.groups.length;i++){
                    if(!groups_nodes[i]){
                        groups_nodes[i] = {info:this.groups[i],children:[]}
                    }
                }
            }
            return [...groups_nodes,...un_groups]
        }
    },
    actions:{
        setGroups(groups){
            this.groups = getSetting('EasyUse.NodesMap.Sorting') == 'Manual drag&drop sorting' ? cloneDeep(groups) :
                cloneDeep(
                    groups
                        .sort((a,b)=> a['pos'][0] - b['pos'][0])
                        .sort((a,b)=> a['pos'][1] - b['pos'][1])
                )
        },
        setNodes(nodes) {
            this.nodes = cloneDeep(nodes)
        },
        update(){
            if(app.extensionManager.activeSidebarTab !== NODES_MAP_ID && !this.isWatching) return
            setTimeout(_=>{
                this.setGroups(app.canvas.graph._groups)
                this.setNodes(app.canvas.graph._nodes)
            },1)
        },
        watchGraph(addWatching = false){
            if(addWatching) this.isWatching = true
            let _this = this
            this.update()
            /* node */
            // onNodeAdded
            const onNodeAdded = app.graph.onNodeAdded
            app.graph.onNodeAdded = function (node) {
                _this.update()
                // onRemoved
                const onRemoved = node.onRemoved;
                node.onRemoved = function() {
                    _this.update()
                    return onRemoved?.apply(this, arguments)
                }
                return onNodeAdded?.apply(this, arguments)
            }
            // onNodeMoved
            app.canvas.onNodeMoved = function (node) {
                _this.update()
            }
            // onNodeAlign
            const onNodeAlign = LGraphCanvas.onNodeAlign
            LGraphCanvas.onNodeAlign = function (group) {
                _this.update()
                return onNodeAlign?.apply(this, arguments)
            }
            /* group */
            // onGroupAdd
            const onGroupAdd = LGraphCanvas.onGroupAdd
            LGraphCanvas.onGroupAdd = function () {
                _this.update()
                return onGroupAdd?.apply(this, arguments)
            }
            // onGroupAdd
            const onGroupAlign = LGraphCanvas.onGroupAlign
            LGraphCanvas.onGroupAlign = function (group) {
                _this.update()
                return onGroupAlign?.apply(this, arguments)
            }
            /* common */
            // onMenuNodeRemove
            const onMenuNodeRemove = LGraphCanvas.onMenuNodeRemove
            LGraphCanvas.onMenuNodeRemove = function (group){
                _this.update()
                return onMenuNodeRemove?.apply(this, arguments)
            }
        },
        unwatchGraph() {
            this.isWatching = false
        }
    }
})