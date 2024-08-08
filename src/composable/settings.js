import {api, app} from "./comfyAPI";


/**
 * Get user settings value by id
 * @param id
 * @returns {*|null}
 */
export const getUserSettingsValue = id => id ? app?.ui?.settings?.settingsValues?.[id] : null

/**
 * Get setting value by id
 * @param {string} id - setting id
 * @param {string} storge_key - key to get value from local storage
 * @returns {string|object|null} - setting value
 */
export function getSetting(id, storge_key=null){
    try{
        let setting = id ? getUserSettingsValue(id) : null
        if(!setting) setting = storge_key ? localStorage[storge_key] : localStorage[id]
        return setting || null
    }
    catch(e){
        console.error(e)
        return null
    }
}

/**
 * Set setting value by id
 * @param id
 * @param value
 * @param storge_key
 * @returns {Promise<void>}
 */
export async function setSetting(id, value, storge_key=null) {
    if(!id || !value) throw new Error('Invalid arguments')
    if(!storge_key) storge_key = id
    try {
        if(app?.ui?.settings?.setSettingValue) app.ui.settings.setSettingValue(id, value)
        else await api.storeSetting(id, value)
        localStorage[storge_key] =  typeof value === 'object' ? JSON.stringify(value) : value
    }
    catch (e){
        console.error(e)
    }
}

/**
 * Get locale
 * @returns {string}
 */
export function getLocale(){
    return getSetting('AGL.Locale')
}

