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

            const transformGroup = (group) => {
                return {
                    info: group,
                    children: group.sub_groups?.length>0 ? group.sub_groups.map(transformGroup) : []
                };
            };
            groups_nodes = this.groups.map(transformGroup)

            if(this.nodes?.length>0){
                this.nodes.map(node=>{
                    let pos = node.pos
                    let has_group = false

                    for (let i = 0; i < groups_nodes.length; i++) {
                        const group = groups_nodes[i];

                        // 递归查找匹配组的函数
                        const checkGroup = (currentGroup) => {
                            const groupInfo = currentGroup.info || currentGroup;

                            // 检查当前组边界
                            if (pos[0] >= groupInfo.pos[0] &&
                                pos[0] <= groupInfo.pos[0] + groupInfo.size[0] &&
                                pos[1] >= groupInfo.pos[1] &&
                                pos[1] <= groupInfo.pos[1] + groupInfo.size[1]) {

                                // 先检查子组
                                if (currentGroup.children) {
                                    for (const childGroup of currentGroup.children) {
                                        if (checkGroup(childGroup)) {
                                            return true;
                                        }
                                    }
                                }

                                // 没有子组匹配，添加到当前组
                                if (!currentGroup.children) {
                                    currentGroup.children = [];
                                }
                                currentGroup.children.push(node);
                                return true;
                            }
                            return false;
                        };

                        if (checkGroup(group)) {
                            has_group = true;
                            break;
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
            // 子组嵌套
            let _groups = cloneDeep(groups)
            _groups.forEach(group => {
                group.sub_groups = [];
                _groups.forEach(innerGroup => {
                    if (innerGroup !== group &&
                        innerGroup.pos[0] > group.pos[0] &&
                        innerGroup.pos[0] < group.pos[0] + group.size[0] &&
                        innerGroup.pos[1] > group.pos[1] &&
                        innerGroup.pos[1] < group.pos[1] + group.size[1]) {
                        group.sub_groups.push(innerGroup);
                    }
                });
                group.sub_groups.forEach(subGroup => {
                    _groups = _groups.filter(g => g !== subGroup);
                });
            });

            this.groups = getSetting('EasyUse.NodesMap.Sorting') == 'Manual drag&drop sorting' ? cloneDeep(_groups) :
                cloneDeep(
                    _groups
                        .sort((a,b)=> a['pos'][0] - b['pos'][0])
                        .sort((a,b)=> a['pos'][1] - b['pos'][1])
                )
        },
        setNodes(nodes) {
            this.nodes = cloneDeep(nodes)
        },
        update(){
            let activeSidebarTab = app.extensionManager?.activeSidebarTab || app.extensionManager.sidebarTab?.activeSidebarTab?.id
            if(activeSidebarTab !== NODES_MAP_ID && !this.isWatching) return
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