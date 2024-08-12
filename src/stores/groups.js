import { defineStore } from 'pinia'
import cloneDeep from "lodash/cloneDeep";
export const useGroupsStore = defineStore('groups', {
    state: _ => ({
        groups:[],
        nodes:[],
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
                    // add groups without nodes
                    for(let i=0;i< this.groups.length;i++){
                        if(!groups_nodes[i]){
                            groups_nodes[i] = {info:this.groups[i],children:[]}
                        }
                    }
                })
            }
            return [...groups_nodes,...un_groups]
        }
    },
    actions:{
        setGroups(groups){
            this.groups = cloneDeep(groups.sort((a,b)=> a['pos'][0] - b['pos'][0]).sort((a,b)=> a['pos'][1] - b['pos'][1]))
        },
        setNodes(nodes) {
            this.nodes = cloneDeep(nodes)
        }
    }
})