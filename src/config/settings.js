import { $t } from '@/composable/i18n';
export default {
    // Hotkeys
    addGroup:{
        id: 'EasyUse.Hotkeys.AddGroup',
        name: $t('Enable Shift+g to add selected nodes to a group'),
        type: 'boolean',
        defaultValue: true,
    },
    cleanVRAMUsed:{
        id: 'EasyUse.Hotkeys.cleanVRAMUsed',
        name: $t('Enable Shift+r to unload models and node cache'),
        type: 'boolean',
        defaultValue: true,
    },
    alignSelectedNodes:{
        id: 'EasyUse.Hotkeys.AlignSelectedNodes',
        name: $t('Enable Shift+Up/Down/Left/Right key to align selected nodes'),
        type: 'boolean',
        defaultValue: true,
    },
    nodesTemplate:{
        id: 'EasyUse.Hotkeys.NodesTemplate',
        name: $t('Enable ALT+1~9 to paste nodes from nodes template'),
        type: 'boolean',
        defaultValue: true,
    },
    jumpNearestNodes:{
        id: 'EasyUse.Hotkeys.JumpNearestNodes',
        name: $t('Enable Up/Down/Left/Right key to jump nearest nodes'),
        type: 'boolean',
        defaultValue: true,
    },
    // ContextMenu
    subDirectories:{
        id: 'EasyUse.ContextMenu.SubDirectories',
        name: $t('Enable contextMenu auto nest subdirectories'),
        type: 'boolean',
        defaultValue: true,
    },
    modelsThumbnails:{
        id: 'EasyUse.ContextMenu.ModelsThumbnails',
        name: $t('Enable model thumbnails display'),
        type: 'boolean',
        defaultValue: true,
    },
    rightMenuNodesSort:{
        id: 'EasyUse.ContextMenu.NodesSort',
        name: $t('Enable right-click menu to add node A~Z sorting'),
        type: 'boolean',
        defaultValue: true,
    },
    // Nodes
    nodesRuntime:{
        id: 'EasyUse.Nodes.Runtime',
        name: $t('Enable nodes runtime display'),
        type: 'boolean',
        defaultValue: true,
    },
    chainGetSet:{
        id: 'EasyUse.Nodes.ChainGetSet',
        name: $t('Enable chain get node and set node with parent nodes'),
        type: 'boolean',
        defaultValue: true,
    },
    // NodesMap
    nodesMap:{
        id: 'EasyUse.NodesMap.Sorting',
        name: $t('Nodes map sorting mode'),
        tooltip: $t('Default automatic sorting, if set to manual, groups can be dragged and dropped and the sorting results saved.'),
        type: 'combo',
        options: ['Auto sorting', 'Manual drag&drop sorting'],
        defaultValue: 'Auto sorting',
    },
}