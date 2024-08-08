import {getLocale} from "./settings.js";
import zhCN from "../locale/zh-CN.js";

export const locale = getLocale()
export const $t = (key) => {
    switch (locale){
        case 'zh-CN':
            return zhCN[key] || key
        default:
            return key
    }
}
