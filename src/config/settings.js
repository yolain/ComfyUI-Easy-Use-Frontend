import { $t } from '@/composable/i18n';
export default {
    // Hotkeys
    addGroup:{
        id: 'EasyUse.Hotkeys.AddGroup',
        name: $t('Enable Shift+g to add selected nodes to a group'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    alignSelectedNodes:{
        id: 'EasyUse.Hotkeys.AlignSelectedNodes',
        name: $t('Enable Shift+Up/Down/Left/Right key to align selected nodes'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    nodesTemplate:{
        id: 'EasyUse.Hotkeys.NodesTemplate',
        name: $t('Enable ALT+1~9 to paste nodes from nodes template'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    jumpNearestNodes:{
        id: 'EasyUse.Hotkeys.JumpNearestNodes',
        name: $t('Enable Up/Down/Left/Right key to jump nearest nodes'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    // ContextMenu
    subDirectories:{
        id: 'EasyUse.ContextMenu.SubDirectories',
        name: $t('Enable contextMenu auto nest subdirectories'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: false,
    },
    modelsThumbnails:{
        id: 'EasyUse.ContextMenu.ModelsThumbnails',
        name: $t('Enable models thumbnails display'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: false,
    },
    rightMenuNodesSort:{
        id: 'EasyUse.ContextMenu.NodesSort',
        name: $t('Enable right-click menu to add node A~Z sorting'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    // Nodes
    nodesRuntime:{
        id: 'EasyUse.Nodes.Runtime',
        name: $t('Enable nodes runtime display'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    },
    chainGetSet:{
        id: 'EasyUse.Nodes.ChainGetSet',
        name: $t('Enable chain get node and set node with parent nodes'),
        tooltip: $t(''),
        type: 'boolean',
        defaultValue: true,
    }
}