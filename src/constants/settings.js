export default {
    // Hotkeys
    addGroup:{
        id: 'EasyUse.Hotkeys.AddGroup',
        name: 'Enable Shift+g to add selected nodes to a group',
        tooltip: 'After v1.2.39, Ctrl+g can be used instead of it',
        type: 'boolean',
        defaultValue: true,
    },
    cleanVRAMUsed:{
        id: 'EasyUse.Hotkeys.cleanVRAMUsed',
        name: 'Enable Shift+r to unload models and node cache',
        type: 'boolean',
        defaultValue: true,
    },
    toggleSiteMap:{
        id: 'EasyUse.Hotkeys.toggleNodesMap',
        name: 'Enable Shift+m to toggle nodes map',
        type: 'boolean',
        defaultValue: true,
    },
    alignSelectedNodes:{
        id: 'EasyUse.Hotkeys.AlignSelectedNodes',
        name:'Enable Shift+Up/Down/Left/Right key and Shift+Ctrl+Alt+Left/Right to align selected nodes',
        tooltip: 'Shift+Up/Down/Left/Right can align selected nodes, Shift+Ctrl+Alt+Left/Right can distribute horizontal/vertical nodes',
        type: 'boolean',
        defaultValue: true,
    },
    NormalizeSelectedNodes:{
        id: 'EasyUse.Hotkeys.NormalizeSelectedNodes',
        name: 'Enable Shift+Ctrl+Left/Right key to normalize selected nodes',
        tooltip: 'Enable Shift+Ctrl+Left key to normalize width and Shift+Ctrl+Right key to normalize height',
        type: 'boolean',
        defaultValue: true,
    },
    nodesTemplate:{
        id: 'EasyUse.Hotkeys.NodesTemplate',
        name: 'Enable Alt+1~9 to paste nodes from nodes template',
        type: 'boolean',
        defaultValue: true,
    },
    jumpNearestNodes:{
        id: 'EasyUse.Hotkeys.JumpNearestNodes',
        name: 'Enable Up/Down/Left/Right key to jump nearest nodes',
        type: 'boolean',
        defaultValue: true,
    },
    // ContextMenu
    subDirectories:{
        id: 'EasyUse.ContextMenu.SubDirectories',
        name: 'Enable contextMenu auto nest subdirectories',
        type: 'boolean',
        defaultValue: false,
    },
    modelsThumbnails:{
        id: 'EasyUse.ContextMenu.ModelsThumbnails',
        name: 'Enable model thumbnails display',
        type: 'boolean',
        defaultValue: false,
    },
    rightMenuNodesSort:{
        id: 'EasyUse.ContextMenu.NodesSort',
        name: 'Enable right-click menu to add node A~Z sorting',
        type: 'boolean',
        defaultValue: true,
    },
    quickOptions:{
        id: 'EasyUse.ContextMenu.QuickOptions',
        name: 'Use three shortcut buttons in the right-click menu',
        type: 'combo',
        options:['At the forefront', 'At the end', 'Disable'],
        defaultValue: 'At the forefront',
    },
    // Nodes
    nodesRuntime:{
        id: 'EasyUse.Nodes.Runtime',
        name: 'Enable nodes runtime display',
        type: 'boolean',
        defaultValue: true,
    },
    chainGetSet:{
        id: 'EasyUse.Nodes.ChainGetSet',
        name: 'Enable chain get node and set node with parent nodes',
        type: 'boolean',
        defaultValue: true,
    },
    // NodesMap
    nodesMap:{
        id: 'EasyUse.NodesMap.Sorting',
        name: 'Nodes map sorting mode',
        tooltip: 'Default automatic sorting, if set to manual, groups can be dragged and dropped and the sorting results saved.',
        type: 'combo',
        options: ['Auto sorting', 'Manual drag&drop sorting'],
        defaultValue: 'Auto sorting',
    },
    displayNodesID:{
        id: 'EasyUse.NodesMap.DisplayNodeID',
        name: 'Display Node ID',
        type: 'boolean',
        defaultValue: true,
    },
    onlyDisplayGroup:{
        id: 'EasyUse.NodesMap.DisplayGroupOnly',
        name: 'Display Groups Only',
        type: 'boolean',
        defaultValue: false,
    },
    enableNodesMap:{
        id: 'EasyUse.NodesMap.Enable',
        name: 'Enable Nodes Map',
        tooltip: 'You need to refresh the page to update successfully',
        type: 'boolean',
        defaultValue: true,
    },
    stylesSelectorDisplay:{
        id: 'EasyUse.StylesSelector.DisplayType',
        name: 'Styles Selector Display Type',
        tooltip: "Styles Selector Display Type, if set to 'Gird', it will display as a gird, if set to 'List', it will display as a list",
        type: 'combo',
        options: ['Gird', 'List'],
        defaultValue: 'Gird',
    }
}