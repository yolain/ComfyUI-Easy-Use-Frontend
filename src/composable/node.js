let origProps = {};
export const getWidgetByName = (node, name) => node.widgets.find((w) => w.name === name);
export const doesInputWithNameExist = (node, name) => node.inputs ? node.inputs.some((input) => input.name === name) : false;
export const doesInputWithNameLink = (node, name, show) => node.inputs ? node.inputs.some((input) => input.name === name && input.link && !show) : false;
export const toggleWidget = (node, widget, show = false, suffix = "") => {
	if (!widget || doesInputWithNameLink(node, widget.name, show)) return;
	if (!origProps[widget.name]) {
		origProps[widget.name] = { origType: widget.type, origComputeSize: widget.computeSize };
	}
	const origSize = node.size;
	widget.type = show ? origProps[widget.name].origType : "easyHidden" + suffix;
	widget.computeSize = show ? origProps[widget.name].origComputeSize : () => [0, -4];
	widget.linkedWidgets?.forEach(w => toggleWidget(node, w, ":" + widget.name, show));
	const height = show ? Math.max(node.computeSize()[1], origSize[1]) : node.size[1];
	node.setSize([node.size[0], height]);
}
export const getWidgetValue = (node, slot = 0) => {
	if (!node) return undefined;
	if (node.widgets?.[slot]) return node.widgets[slot].value;
	if (node.widgets_values) return node.widgets_values?.[slot];
	return undefined;
};

export const updateNodeHeight = node => node.setSize([node.size[0], node.computeSize()[1]])
export const getNodeById = (id,nodes) => nodes ? nodes.find((node) => node.id === id) : graph.getNodeById(id)
export const getSelectedNodes = _ =>  {
	try{
		return Object.values(graph?.list_of_graphcanvas[0]?.selected_nodes);
	}
	catch (e){
		return [];
	}
}

/* jump */
function easeInOut(t) {
	return 0.5 - 0.5 * Math.cos(Math.PI * t);
}
function lerp(a, b, alpha) {
	return a + easeInOut(alpha) * (b - a);
}
export const jumpToPosition = ([x,y], lGraph) => {
	const drag = lGraph.ds;
	const windowWidth = document.body.clientWidth;
	const windowHeight = document.body.clientHeight;
	const scale = drag.scale;
	const toX = -x + windowWidth * 0.5 / scale;
	const toY = -y + windowHeight * 0.5 / scale;
	const duration = 250;
	const end = Date.now() + duration;
	const fromX = drag.offset[0];
	const fromY = drag.offset[1];
	const update = () => {
		const delta = end - Date.now();
		if (Date.now() < end) {
			requestAnimationFrame(update);
		} else {
			drag.offset[0] = toX;
			drag.offset[1] = toY;
			lGraph.setDirty(true, true);
			return;
		}
		const proc = 1 - delta / duration;
		drag.offset[0] = lerp(fromX, toX, proc);
		drag.offset[1] = lerp(fromY, toY, proc);
		lGraph.setDirty(true, true);
	};
	requestAnimationFrame(update);
}
export const jumpToNode = (node, select=true) => {
	const lGraph = node.graph?.list_of_graphcanvas?.[0] || null;
	if (!lGraph) return;
	const [x2, y2] = node.pos;
	const [width, height] = node.size;
	jumpToPosition([x2 + width / 2, y2 + height / 2], lGraph);
	if(select) lGraph.selectNode(node)
}
export const jumpToNodeId = (id) => {
	const node = getNodeById(id);
	if (!node) {
		return;
	}
	jumpToNode(node);
};

/* chain */
const getLinks = () => graph.links ?? [];
const getLinkById = (linkId, links = getLinks()) => links[linkId];
const getAllNodes = _ => graph._nodes ?? [];
const formatVariables = (name) => name.toLowerCase().replace(/_./g, (str) => str.replace(`_`, ``).toUpperCase());
export const isGetNode = (node) => node.type === "easy getNode";
export const isSetNode = (node) => node.type === "easy setNode";
export const isGetSetNode = (node) => isGetNode(node) || isSetNode(node);
export const getGetSetNodes = (nodes = getAllNodes()) => nodes.filter((node) => isGetSetNode(node));

let lastTargetGetPos = {}
let lastTargetSetPos = {}
export const chainNode = (focus=false, offset = {}) => {
	const allGetSetNodes = getGetSetNodes();
	if(!allGetSetNodes || allGetSetNodes.length < 1) return;
	const selectedNodes = getSelectedNodes();
	if(selectedNodes.length === 0) return;
	let offsetInputX = offset.inputX || 160;
	let offsetOutputX = offset.ouputX || 60;
	if(selectedNodes.filter(node=> isGetSetNode(node)).length > 1) return;
	for (const node of selectedNodes){
		let inputIndex = 0;
		let outputIndex = 0;
		let offsetInputY = offset.inputY || 10;
		let offsetOutputY = offset.outputY || 30;
		const nodesFixed = [];
		const nodeId = node.id;
		if (!node.graph) continue;
		// inputs
		if(!lastTargetGetPos[nodeId]) lastTargetGetPos[nodeId] = []
		for (const input of node.inputs ?? []) {
			const linkId = input.link;
			if (!linkId) continue;
			const {origin_id, target_slot} = getLinkById(linkId);
			const originNode = getNodeById(origin_id);

			if (!originNode) continue;
			if (!isGetSetNode(originNode)) continue;
			let targetGetPos = node.getConnectionPos(true, target_slot);
			if(!lastTargetGetPos[nodeId][target_slot]) lastTargetGetPos[nodeId][target_slot] = targetGetPos;
			if(lastTargetGetPos[nodeId] && (lastTargetGetPos[nodeId][target_slot][1] !== targetGetPos[1] || lastTargetGetPos[nodeId][target_slot][0] !== targetGetPos[0])){
				offsetInputX = targetGetPos[0] - lastTargetGetPos[nodeId][target_slot][0];
				offsetInputY = targetGetPos[1] - lastTargetGetPos[nodeId][target_slot][1];
				originNode.pos = [originNode.pos[0] + offsetInputX, originNode.pos[1] + offsetInputY];
			}
			lastTargetGetPos[nodeId][target_slot] = targetGetPos;
			inputIndex += 1;
			nodesFixed.push(originNode);
			// originNode.flags.collapsed = true;
		}
		// outputs
		if(!lastTargetSetPos[nodeId]) lastTargetSetPos[nodeId] = []
		for (const output of node.outputs ?? []) {
			if (!output.links) continue;
			if (!node.graph) continue;
			for (const linkId of output.links) {
				const {target_id, target_slot, origin_slot} = getLinkById(linkId);
				const originNode = getNodeById(target_id);
				if (!originNode) {
					console.error(`Failed`, node.id, `>`, target_id);
					continue;
				}
				if (!isGetSetNode(originNode)) continue;
				const links = originNode.outputs?.links;
				if (links?.length > 1) return;
				const targetSetPos = node.getConnectionPos(false, origin_slot);
				if(!lastTargetSetPos[nodeId][origin_slot]) lastTargetSetPos[nodeId][origin_slot] = targetSetPos;
				if(lastTargetSetPos[nodeId] && (lastTargetSetPos[nodeId][origin_slot][0] !== targetSetPos[0] || lastTargetSetPos[nodeId][origin_slot][1] !== targetSetPos[1])){
					offsetOutputX = targetSetPos[0] - lastTargetSetPos[nodeId][origin_slot][0];
					offsetOutputY = targetSetPos[1] - lastTargetSetPos[nodeId][origin_slot][1];
					originNode.pos = [originNode.pos[0] + offsetOutputX, originNode.pos[1] + offsetOutputY];
				}
				lastTargetSetPos[nodeId][origin_slot] = targetSetPos;
				outputIndex += 1;
				nodesFixed.push(originNode);
			}
		}
		if (focus && selectedNodes.length === 1) {
			const focused = [node, ...nodesFixed];
			const lGraph2 = node.graph?.list_of_graphcanvas?.[0];
			lGraph2.selectNodes(focused);
		}
	}
	const selectedNode = selectedNodes[0];
	if (!selectedNode) return;
	const lGraph = selectedNode.graph?.list_of_graphcanvas?.[0];
	lGraph.setDirty(true, true);
}
const setWidgetValue = (node, value, slot = 0) => {
	if (!node.widgets_values) node.widgets_values = [];
	node.widgets_values[slot] = value;
	node.widgets[slot].value = value;
};
const graphAdd = (node) => graph.add(node);
const graphRemove = (node) => graph.remove(node)
const traverseInputReroute = (node, slot = 0) => {
	if (node.type !== `Reroute`) return [node, slot];
	const rerouteNode = node;
	const linkId = rerouteNode.inputs?.[0]?.link;
	if (!linkId) return [rerouteNode, slot];
	const originLink = getLinkById(linkId);
	if (!originLink) return [rerouteNode, slot];
	const nextNode = getNodeById(originLink.origin_id);
	if (!nextNode) return [rerouteNode, slot];
	setTimeout(() => {graphRemove(rerouteNode);});
	return traverseInputReroute(nextNode, originLink.origin_slot);
};
const traverseOutputReroute = (node) => {
	if (node.type !== `Reroute`) return node;
	const rerouteNode = node;
	const links = rerouteNode.outputs?.[0]?.links;
	if (!links) return rerouteNode;
	const linkId = links[0];
	if (!linkId) return rerouteNode;
	const originLink = getLinkById(linkId);
	if (!originLink) return rerouteNode;
	const nextNode = getNodeById(originLink.target_id);
	if (!nextNode) return rerouteNode;
	if (rerouteNode.outputs[0].links?.length === 1) setTimeout(() => {graphRemove(rerouteNode);});
	return traverseOutputReroute(nextNode);
};
export const convertLinkToGetSetNode = (link, safe = false) => {
	const {type } = link;
	if (type === `*`) return;
	let {origin_id, target_id, origin_slot, target_slot} = link;
	let originNode = getNodeById(origin_id);
	let targetNode = getNodeById(target_id);
	if (!originNode || !targetNode) return false;
	if (originNode.type === `Reroute`) {
		let slot = 0;
		[originNode, slot] = traverseInputReroute(originNode);
		origin_id = originNode == null ? void 0 : originNode.id;
		origin_slot = slot;
		if (typeof origin_slot === `undefined` || origin_slot === -1) origin_slot = 0;
	}
	if (targetNode.type === `Reroute`) {
		targetNode = traverseOutputReroute(targetNode);
		target_id = targetNode == null ? void 0 : targetNode.id;
		target_slot = targetNode == null ? void 0 : targetNode.inputs.findIndex((slot) => slot.type === type);
		if (typeof target_slot === `undefined` || target_slot === -1) target_slot = 0;
	}
	if (typeof origin_id === `undefined` || typeof target_id === `undefined` || !originNode || !targetNode) {
		return false;
	}
	if (safe && (isGetSetNode(originNode) || isGetSetNode(targetNode))) return false;
	let valueType = formatVariables(targetNode.getInputInfo(target_slot)?.name ?? type.toLowerCase());
	if (!valueType) valueType = formatVariables(originNode?.outputs?.[origin_slot]?.name ?? originNode?.outputs?.[origin_slot]?.type.toString() ?? valueType + `_from_${origin_id}_to_${target_id}`);
	let variableNameExists = false;
	let setterAlreadyExists = false;
	if (!isGetSetNode(originNode)) {
		const outputLinks = originNode.outputs?.[origin_slot]?.links;
		if (outputLinks) {
			for (const linkId of outputLinks) {
				const toNode = getNodeById(getLinkById(linkId)?.target_id ?? -1);
				if (toNode && isGetSetNode(toNode) && isSetNode(toNode)) {
					valueType = getWidgetValue(toNode);
					setterAlreadyExists = true;
				}
			}
		}
		if (!setterAlreadyExists) {
			for (const node of getGetSetNodes()) {
				const value = getWidgetValue(node);
				const duplicateSource = valueType === value && isSetNode(node);
				if (!duplicateSource) {
					continue;
				}
				const linkId = node.inputs[0]?.link;
				const sourceId = getLinkById(linkId)?.origin_id;
				if (sourceId === originNode.id) {
					setterAlreadyExists = true;
				} else {
					variableNameExists = true;
				}
			}
			if (variableNameExists) {
				valueType += `_from_${origin_id}_to_${target_id}`;
			}
		}
	} else {
		valueType = getWidgetValue(originNode);
		setterAlreadyExists = true;
	}
	let newSetNode;
	if (!setterAlreadyExists) {
		newSetNode = LiteGraph.createNode('easy setNode');
		newSetNode.is_auto_link = true
		const targetSetPos = originNode.getConnectionPos(false, origin_slot);
		newSetNode.pos = [targetSetPos[0] + 20, targetSetPos[1]];
		newSetNode.inputs[0].name = valueType;
		newSetNode.inputs[0].type = type;
		newSetNode.inputs[0].widget = targetNode.inputs[target_slot].widget;
		setWidgetValue(newSetNode, valueType);
		graphAdd(newSetNode);
		newSetNode.flags.collapsed = true;
		let preValues = [];
		if (originNode.widgets) {
			preValues = Object.values(originNode.widgets).map((w2) => w2.value);
		} else if (originNode.widgets_values) {
			preValues = JSON.parse(JSON.stringify(originNode.widgets_values));
		}
		originNode.connect(origin_slot, newSetNode, 0);
		originNode.widgets_values = preValues;
		if (originNode.type === `PrimitiveNode`) {
			setTimeout(() => {
				if (!originNode) {
					return;
				}
				originNode.connect(origin_slot, newSetNode, 0);
				for (const [i2, value] of preValues.entries()) {
					setWidgetValue(originNode, value, i2);
				}
				if(newSetNode!==null) newSetNode.setSize(newSetNode.computeSize());
			});
		}
	}
	const newGetNode = LiteGraph.createNode(`easy getNode`);
	const targetGetPos = targetNode.getConnectionPos(true, target_slot);
	newGetNode.pos = [targetGetPos[0] - 150, targetGetPos[1]];
	newGetNode.outputs[0].name = valueType;
	newGetNode.outputs[0].type = type;
	newGetNode.outputs[0].widget = targetNode.inputs[target_slot].widget;
	graphAdd(newGetNode);
	setWidgetValue(newGetNode, valueType);
	if(newGetNode !== null) {
		newGetNode.flags.collapsed = true;
		newGetNode.setSize(newGetNode.computeSize());
		newGetNode.connect(0, targetNode, target_slot);
		if (safe || !variableNameExists) return;
	}
};

export const addNodesToGroup = (group, nodes=[], padding=20) => {
    var x1, y1, x2, y2;
    var nx1, ny1, nx2, ny2;
    var node;

    x1 = y1 = x2 = y2 = -1;
    nx1 = ny1 = nx2 = ny2 = -1;

    for (var n of [group._nodes, nodes]) {
        for (var i in n) {
            node = n[i]

            nx1 = node.pos[0]
            ny1 = node.pos[1]
            nx2 = node.pos[0] + node.size[0]
            ny2 = node.pos[1] + node.size[1]

            if (node.type != "Reroute") {
                ny1 -= LiteGraph.NODE_TITLE_HEIGHT;
            }
            if (node.flags?.collapsed) {
                ny2 = ny1 + LiteGraph.NODE_TITLE_HEIGHT;

                if (node?._collapsed_width) {
                    nx2 = nx1 + Math.round(node._collapsed_width);
                }
            }
            if (x1 == -1 || nx1 < x1) {
                x1 = nx1;
            }

            if (y1 == -1 || ny1 < y1) {
                y1 = ny1;
            }

            if (x2 == -1 || nx2 > x2) {
                x2 = nx2;
            }

            if (y2 == -1 || ny2 > y2) {
                y2 = ny2;
            }
        }
    }

    y1 = y1 - Math.round(group.font_size * 1.4);

    group.pos = [x1 - padding, y1 - padding];
    group.size = [x2 - x1 + padding * 2, y2 - y1 + padding * 2];
}
export const setNodesSameSize = (nodes, type='width') => {
	const firstNode = nodes[0];
	const index = type == 'width' ? 0 : 1
	const size = firstNode.size?.[index];
	if(!size) return
	nodes.forEach(node => {node.size[index] = size;});
	LGraphCanvas.active_canvas.setDirty(true, true);
}

export const distributeNodes = (nodes, type='horizontal') => {
	if(nodes.length < 3) return;
	const index = type === 'horizontal' ? 0 : 1;
	nodes.sort((a, b) => a.pos[index] - b.pos[index]);
	const min = Math.min(...nodes.map(node => node.pos[index]));
	const max = Math.max(...nodes.map(node => node.pos[index] + node.size[index]));
	const total = nodes.reduce((sum, node) => sum + node.size[index], 0);
	const spacing = (max - min - total) / (nodes.length - 1);
	let current = min;
	nodes.forEach(node => {
		node.pos[index] = current;
		current += node.size[index] + spacing;
	});
	LGraphCanvas.active_canvas.setDirty(true, true);
}