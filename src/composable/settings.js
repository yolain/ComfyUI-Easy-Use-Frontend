import {api, app} from "./comfyAPI";

/**
 * Get user settings value by id
 * @param id
 * @returns {*|null}
 */
export const getUserSettingsValue = id => id ? app?.ui?.settings?.getSettingValue(id) : null

/**
 * Get setting value by id
 * @param {string} id - setting id
 * @param {string} storge_key - key to get value from local storage
 * @returns {string|object|null} - setting value
 */
export function getSetting(id, storage_key=null){
    try{
        let setting = id ? getUserSettingsValue(id) : null
        if(setting === null || setting === undefined) setting = storage_key ? localStorage[storage_key] : (localStorage[id] || null)
        return setting
    }
    catch(e){
        console.error(e)
        return null
    }
}

/**
 * getSettingsLookup
 * @param {string} id - setting id
 * @param {function} callback - callback function
 */
export function getSettingsLookup(id, callback = _ => {}){
    const lookup = app.ui.settings.settingsLookup?.[id]
    if(lookup) lookup.onChange = v => callback(v)
}
/**
 * Set setting value by id
 * @param id
 * @param value
 * @param storge_key
 * @returns {Promise<void>}
 */
export async function setSetting(id, value, storge_key=null) {
    if(!id) throw new Error('Invalid arguments')
    try {
        if(app?.ui?.settings?.setSettingValue) app.ui.settings.setSettingValue(id, value)
        else await api.storeSetting(id, value)
        if(storge_key) localStorage[storge_key] =  typeof value === 'object' ? JSON.stringify(value) : value
    }
    catch (e){
        console.error(e)
    }
}

/**
 * Add setting
 * @param value
 */
export function addSetting(settings){
    if(!app.ui.settings.settingsLookup[settings.id]) app.ui.settings.addSetting(settings)
}

/**
 * Get locale
 * @returns {string}
 */
export function getLocale(){
    return getSetting('Comfy.Locale')
}

