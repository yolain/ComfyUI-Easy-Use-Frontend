export let app = window.comfyAPI?.app?.app || null;
export let api = window.comfyAPI?.api?.api ||  null;
export let $el = window.comfyAPI?.ui?.$el || null;
export let ComfyDialog = window.comfyAPI?.dialog?.ComfyDialog || null;
export let ComfyWidgets = window.comfyAPI?.widgets?.ComfyWidgets || null;
export let applyTextReplacements =  window.comfyAPI?.utils?.applyTextReplacements || null;
export let GroupNodeConfig = window.comfyAPI?.groupNode?.GroupNodeConfig || null;

export let registerExtension = obj => {
    try{
        app.registerExtension(obj)
    }catch (e){
        console.log(e)
    }
}