import {getLocale} from "./settings.js";
import zhCN from "../locale/zh-CN.js";

export const $t = (key, useNavigator=false) => {
    let _locale = getLocale()
    switch (_locale){
        case 'zh-CN':
        case 'zh':
            return zhCN[key] || key
        default:
            return key
    }
}
