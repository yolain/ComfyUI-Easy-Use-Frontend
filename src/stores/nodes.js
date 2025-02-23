import {app} from "@/composable/comfyAPI.js";
import {NODES_MAP_ID} from "@/constants/index";
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

            // 首先构建组树结构
            const transformGroup = (group) => {
                return {
                    info: group,
                    children: group.sub_groups?.length>0 ? group.sub_groups.map(transformGroup) : [],
                    bounds: {
                        x1: group.pos[0],
                        y1: group.pos[1],
                        x2: group.pos[0] + group.size[0],
                        y2: group.pos[1] + group.size[1]
                    }
                };
            };
            groups_nodes = this.groups.map(transformGroup)

            if(this.nodes?.length>0){
                // 检查一个点是否在组的边界内
                const isPointInBounds = (pos, bounds) => {
                    return pos[0] >= bounds.x1 &&
                           pos[0] <= bounds.x2 &&
                           pos[1] >= bounds.y1 &&
                           pos[1] <= bounds.y2;
                }

                // 查找节点所属的最内层组
                const findDeepestGroup = (node, groups) => {
                    let deepestGroup = null;
                    let maxDepth = -1;

                    const traverse = (group, depth) => {
                        if (group.bounds && isPointInBounds(node.pos, group.bounds)) {
                            if (depth > maxDepth) {
                                maxDepth = depth;
                                deepestGroup = group;
                            }
                            group.children.forEach(child => traverse(child, depth + 1));
                        }
                    };

                    groups.forEach(group => traverse(group, 0));
                    return deepestGroup;
                };

                // 为每个节点找到对应的组
                this.nodes.forEach(node => {
                    const group = findDeepestGroup(node, groups_nodes);
                    if (group) {
                        if (!group.children) {
                            group.children = [];
                        }
                        group.children.push(node);
                    } else {
                        un_groups.push({info: node});
                    }
                });

            }

            return [...groups_nodes, ...un_groups];
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