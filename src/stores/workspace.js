import { defineStore } from 'pinia'

export const useWorkspaceStore = defineStore('workspace',{
    state: _=> ({
        activeSidebarTab: null,
        sidebarTabs: []
    }),
    actions:{
        updateActiveSidebarTab(tabId) {
            this.activeSidebarTab = tabId
        },
        registerSidebarTab(tab) {
            this.sidebarTabs = [...this.sidebarTabs, tab]
        },
        unregisterSidebarTab(id) {
            const index = this.sidebarTabs.findIndex((tab) => tab.id === id)
            if (index !== -1) {
                const tab = this.sidebarTabs[index]
                if (tab.type === 'custom' && tab.destroy) {
                    tab.destroy()
                }
                const newSidebarTabs = [...this.sidebarTabs]
                newSidebarTabs.splice(index, 1)
                this.sidebarTabs = newSidebarTabs
            }
        },
        getSidebarTabs() {
            return [...this.sidebarTabs]
        }
    }
})