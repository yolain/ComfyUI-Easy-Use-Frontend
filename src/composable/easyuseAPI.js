import {api} from "@/composable/comfyAPI.js";
import {toast} from "@/components/toast.js";
import {$t} from "@/composable/i18n.js";

/*
* Clean GPU
*/
export const cleanVRAM = async() =>{
    try {
        const {Running, Pending} = await api.getQueue()
        if(Running.length>0 || Pending.length>0){
            toast.error($t("Clean Failed")+ ":"+ $t("Please stop all running tasks before cleaning GPU"))
            return
        }
        const res = await api.fetchApi("/easyuse/cleangpu",{method:"POST"})
        if(res.status == 200){
            toast.success($t("Clean SuccessFully"))
        }else{
            toast.error($t("Clean Failed"))
        }
    } catch (exception) {}
}

/*
* Reboot
*/
export const reboot = async()=>{
    if (confirm($t("Are you sure you'd like to reboot the server?"))){
        try {
            api.fetchApi("/easyuse/reboot");
        } catch (exception) {}
    }
}