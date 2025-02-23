import {$el} from "@/composable/comfyAPI";
import {PREFIX_CLASS} from '@/constants'
import sleep from "@/composable/sleep.js";
class Toast {

    element = $el(`div.${PREFIX_CLASS}toast`)
    children = HTMLElement
    container =  document.body

    constructor() {
        this.container.appendChild(this.element)
    }

    async show(data){
        let animContainer = $el(`div.${PREFIX_CLASS}toast-container`,[
            $el('div',[$el('span',[
                ...data.icon ? [$el('i',{className:data.icon})] : [],
                $el('span',data.content)
            ])]),
        ])
        animContainer.setAttribute("toast-id", data.id);
        this.element.replaceChildren(animContainer)
        this.container.appendChild(this.element)
        await sleep(64);
        animContainer.style.marginTop = `-${animContainer.offsetHeight}px`;
        await sleep(64);
        animContainer.classList.add("show");
        if (data.duration) {
            await sleep(data.duration);
            this.hide(data.id);
        }

    }

    async hide(id){
        const msg = document.querySelector(`.${PREFIX_CLASS}toast > [toast-id="${id}"]`);
        if (msg === null || msg === void 0 ? void 0 : msg.classList.contains("show")) {
            msg.classList.remove("show");
            await sleep(750);
        }
        msg && msg.remove();
    }

    async clearAllMessages() {
        let container = document.querySelector(`.${PREFIX_CLASS}container`);
        container && (container.innerHTML = "");
    }

    async info(content, duration = 3000, actions = []) {
        this.show({
            id: `toast-info`,
            icon:`mdi mdi-information ${PREFIX_CLASS}theme`,
            content,
            duration,
        });
    }
    async success(content, duration = 3000) {
        this.show({
            id: `toast-success`,
            icon:`mdi mdi-check-circle ${PREFIX_CLASS}success`,
            content,
            duration,
        });
    }
    async error(content, duration = 3000) {
        this.show({
            id: `toast-error`,
            icon:`mdi mdi-close-circle ${PREFIX_CLASS}error`,
            content,
            duration,
        });
    }
    async warn(content, duration = 3000) {
        this.show({
            id: `toast-warn`,
            icon:`mdi mdi-alert-circle ${PREFIX_CLASS}warning`,
            content,
            duration,
        });
    }
    async showLoading(content, duration = 0) {
        this.show({
            id: `toast-loading`,
            icon:`mdi mdi-rotate-right loading`,
            content,
            duration,
        });
    }

    async hideLoading() {
        this.hide("toast-loading");
    }

}

export const toast = new Toast();
