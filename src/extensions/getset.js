import { app } from "@/composable/comfyAPI";

const LGraphNode = LiteGraph.LGraphNode;
// Node that allows you to tunnel connections for cleaner graphs
const setIcon = '➡️'
const getIcon = '⬅️'

app.registerExtension({
    name: "easy setNode",
    registerCustomNodes() {
        class SetNode extends LGraphNode{
            defaultVisibility = true;
            serialize_widgets = true;
            constructor(title) {
                super('Set');
                if (!this.properties) {
                    this.properties = {
                        "previousName": ""
                    };
                }
                this.properties.showOutputText = SetNode.defaultVisibility;

                const node = this;
                node.color = LGraphCanvas.node_colors.blue.color;

                this.addWidget(
                    "text",
                    "Constant",
                    '',
                    (s, t, u, v, x) => {
                        node.validateName(node.graph);
                        if(this.widgets[0].value !== ''){
                            this.title = setIcon + this.widgets[0].value;
                        }
                        this.properties.previousName = this.widgets[0].value;
                        this.update();
                    },
                    {}
                )

                this.addInput("*", "*");


                this.onConnectionsChange = function(
                    slotType,	//1 = input, 2 = output
                    slot,
                    isChangeConnect,
                    link_info,
                    output
                ) {
                    console.log("onConnectionsChange");
                    //On Disconnect
                    if (slotType == 1 && !isChangeConnect) {
                        this.inputs[slot].type = '*';
                        this.inputs[slot].name = '*';
                        this.title = 'Set'
                    }

                    //On Connect
                    if (link_info && node.graph && slotType == 1 && isChangeConnect) {
                        const fromNode = node.graph._nodes.find((otherNode) => otherNode.id == link_info.origin_id);
                        const slot = fromNode.outputs[link_info.origin_slot];
                        if(!slot) return
                        const type = slot.type;
                        const name = node.is_auto_link ? this.widgets[0].value : slot.name;


                        if (this.title === 'Set'){
                            this.title = setIcon + name;
                            this.widgets[0].value = name;
                        }
                        if (this.widgets[0].value === '*'){
                            this.widgets[0].value = name
                        }

                        this.validateName(node.graph);
                        if(this.inputs[0]){
                            this.inputs[0].type = type;
                            this.inputs[0].name = name;
                        }

                        setTimeout(_=>{
                            this.title = setIcon + this.widgets[0].value;
                            this.properties.previousName = this.widgets[0].value;
                        },1)

                    }

                    //Update either way
                    this.update();
                }

                this.validateName = function(graph) {
                    let widgetValue = node.widgets[0].value;
                    if (widgetValue != '') {
                        let tries = 0;
                        let collisions = [];

                        do {
                            collisions = graph._nodes.filter((otherNode) => {
                                if (otherNode == this) {
                                    return false;
                                }
                                if (otherNode.type == 'easy setNode' && otherNode.widgets[0].value === widgetValue) {
                                    return true;
                                }
                                return false;
                            })
                            if (collisions.length > 0) {
                                widgetValue = node.widgets[0].value  + tries;
                            }
                            tries++;
                        } while (collisions.length > 0)
                        node.widgets[0].value = widgetValue;
                        this.update();
                    }
                }

                this.clone = function () {
                    const cloned = SetNode.prototype.clone.apply(this);
                    cloned.inputs[0].name = '*';
                    cloned.inputs[0].type = '*';
                    cloned.properties.previousName = '';
                    cloned.size = cloned.computeSize();
                    return cloned;
                };

                this.onAdded = function(graph) {
                    this.validateName(graph);
                }


                this.update = function() {
                    if (node.graph) {
                        this.findGetters(node.graph).forEach((getter) => {
                            getter.setType(this.inputs[0].type);
                        });
                        if (this.widgets[0].value) {
                            this.findGetters(node.graph, true).forEach((getter) => {
                                getter.setName(this.widgets[0].value)
                            });
                        }

                        const allGetters = node.graph._nodes.filter((otherNode) => otherNode.type == "easy getNode");
                        allGetters.forEach((otherNode) => {
                            if (otherNode.setComboValues) {
                                otherNode.setComboValues();
                            }
                        })
                    }
                }


                this.findGetters = function(graph, checkForPreviousName) {
                    const name = checkForPreviousName ? this.properties.previousName : this.widgets[0].value;
                    return graph._nodes.filter((otherNode) => {
                        if (otherNode.type == 'easy getNode' && otherNode.widgets[0].value === name && name != '') {
                            return true;
                        }
                        return false;
                    })
                }
                // This node is purely frontend and does not impact the resulting prompt so should not be serialized
                this.isVirtualNode = true;
            }

            onRemoved() {
                const allGetters = this.graph._nodes.filter((otherNode) => otherNode.type == "easy getNode");
                allGetters.forEach((otherNode) => {
                    if (otherNode.setComboValues) {
                        otherNode.setComboValues([this]);
                    }
                })
            }
        }


        LiteGraph.registerNodeType(
            "easy setNode",
            Object.assign(SetNode, {
                title: 'Set',
            })
        );

        SetNode.category = "EasyUse/Util";
    },
});


app.registerExtension({
    name: "easy getNode",
    registerCustomNodes() {
        class GetNode extends LGraphNode{

            defaultVisibility = true;
            serialize_widgets = true;

            constructor(title) {
                super('Get');
                if (!this.properties) {
                    this.properties = {};
                }
                this.properties.showOutputText = GetNode.defaultVisibility;

                const node = this;
                node.color = LGraphCanvas.node_colors.blue.color;
                this.addWidget(
                    "combo",
                    "Constant",
                    "",
                    (e) => {
                        this.onRename();
                    },
                    {
                        values: () => {
                            const setterNodes = node.graph._nodes.filter((otherNode) => otherNode.type == 'easy setNode');
                            return setterNodes.map((otherNode) => otherNode.widgets[0].value).sort();
                        }
                    }
                )


                this.addOutput("*", '*');


                this.onConnectionsChange = function(
                    slotType,	//0 = output, 1 = input
                    slot,	//self-explanatory
                    isChangeConnect,
                    link_info,
                    output
                ) {
                    this.validateLinks();

                    if (slotType == 2 && !isChangeConnect) {
                        this.outputs[slot].type = '*';
                        this.outputs[slot].name = '*';
                        this.title = 'Get'
                    }
                    else{
                        this.onRename();
                        setTimeout(_=>{
                            this.title = getIcon + this.widgets[0].value
                        },1)
                    }

                }


                this.setName = function(name) {
                    node.widgets[0].value = name;
                    node.onRename();
                    node.serialize();
                }


                this.onRename = function(slot=0) {
                    const setter = this.findSetter(node.graph);
                    if (setter) {
                        const type = setter.inputs[0].type;
                        const name = setter.inputs[0].name
                        this.setType(type, name);
                        this.outputs[slot].type = type;
                        this.outputs[slot].name = name;
                        this.title = getIcon + setter.widgets[0].value;
                    } else {
                        this.setType('*', '*');
                        this.outputs[slot].type = '*';
                        this.outputs[slot].name = '*';
                    }
                }

                this.clone = function () {
                    const cloned = GetNode.prototype.clone.apply(this);
                    cloned.size = cloned.computeSize();
                    return cloned;
                };

                this.validateLinks = function() {
                    if (this.outputs[0].type != '*' && this.outputs[0].links) {
                        this.outputs[0].links.forEach((linkId) => {
                            const link = node.graph.links[linkId];
                            if (link && link.type != this.outputs[0].type && link.type != '*') {
                                node.graph.removeLink(linkId)
                            }
                        })
                    }
                }

                this.setType = function(type, name) {
                    this.outputs[0].name = name;
                    this.outputs[0].type = type;
                    this.validateLinks();
                }

                this.findSetter = function(graph) {
                    const name = this.widgets[0].value;
                    return graph._nodes.find((otherNode) => {
                        if (otherNode.type == 'easy setNode' && otherNode.widgets[0].value === name && name != '') {
                            return true;
                        }
                        return false;
                    })
                }

                // This node is purely frontend and does not impact the resulting prompt so should not be serialized
                this.isVirtualNode = true;
            }


            getInputLink(slot) {
                const setter = this.findSetter(this.graph);

                if (setter) {
                    const slot_info = setter.inputs[slot];
                    const link = this.graph.links[ slot_info.link ];
                    return link;
                } else {
                    throw new Error("No setter found for " + this.widgets[0].value + "(" + this.type + ")");
                }

            }
            onAdded(graph) {
                //this.setComboValues();
                //this.validateName(graph);
            }

        }

        LiteGraph.registerNodeType(
            "easy getNode",
            Object.assign(GetNode, {
                title: 'Get',
            })
        );

        GetNode.category = "EasyUse/Util";
    },
});