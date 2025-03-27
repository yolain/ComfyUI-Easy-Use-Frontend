
import {app} from "@/composable/comfyAPI.js";

export const ANIM_PREVIEW_WIDGET = '$$comfy_animation_preview'

export function createImageHost(node) {
    const el = $el('div.comfy-img-preview')
    let currentImgs
    let first = true

    function updateSize() {
        let w = null
        let h = null

        if (currentImgs) {
            let elH = el.clientHeight
            if (first) {
                first = false
                // On first run, if we are small then grow a bit
                if (elH < 190) {
                    elH = 190
                }
                el.style.setProperty('--comfy-widget-min-height', elH.toString())
            } else {
                el.style.setProperty('--comfy-widget-min-height', null)
            }

            const nw = node.size[0]
            ;({ cellWidth: w, cellHeight: h } = calculateImageGrid(
                currentImgs,
                nw - 20,
                elH
            ))
            w += 'px'
            h += 'px'

            el.style.setProperty('--comfy-img-preview-width', w)
            el.style.setProperty('--comfy-img-preview-height', h)
        }
    }
    return {
        el,
        updateImages(imgs) {
            if (imgs !== currentImgs) {
                if (currentImgs == null) {
                    requestAnimationFrame(() => {
                        updateSize()
                    })
                }
                el.replaceChildren(...imgs)
                currentImgs = imgs
                node.onResize(node.size)
                node.graph.setDirtyCanvas(true, true)
            }
        },
        getHeight() {
            updateSize()
        },
        onDraw() {
            // Element from point uses a hittest find elements so we need to toggle pointer events
            el.style.pointerEvents = 'all'
            const over = document.elementFromPoint(
                app.canvas.mouse[0],
                app.canvas.mouse[1]
            )
            el.style.pointerEvents = 'none'

            if (!over) return
            // Set the overIndex so Open Image etc work
            const idx = currentImgs.indexOf(over)
            node.overIndex = idx
        }
    }
}

/**
 * Composable for handling animated image previews in nodes
 */
export function useNodeVideoPreview() {
    /**
     * Shows animated image preview for a node
     * @param node The graph node to show the preview for
     */
    function showVideoPreview(node) {
        if (!node.video?.length) return
        if (!node.widgets) return

        const widgetIdx = node.widgets.findIndex(
            (w) => w.name === ANIM_PREVIEW_WIDGET
        )

        if (widgetIdx > -1) {
            // Replace content in existing widget
            // const widget = node.widgets[widgetIdx] || {options: { host: null}}
            // widget.options.host.updateImages(node.imgs)
        } else {
            // Create new widget
            // const host = createImageHost(node)
            // @ts-expect-error host is not a standard DOM widget option.
            // const widget = node.addDOMWidget(ANIM_PREVIEW_WIDGET, 'img', host.el, {
            //     host,
            //     // @ts-expect-error `getHeight` of image host returns void instead of number.
            //     getHeight: host.getHeight,
            //     onDraw: host.onDraw,
            //     hideOnZoom: false
            // }) || {
            //     options: { host: null }
            // }
            // widget.serializeValue = () => undefined
            // widget.options.host.updateImages(node.imgs)
        }
    }

    /**
     * Removes video image preview from a node
     * @param node The graph node to remove the preview from
     */
    function removeVideoPreview(node) {
        if (!node.widgets) return

        const widgetIdx = node.widgets.findIndex(
            (w) => w.name === 'video-preview'
        )

        if (widgetIdx > -1) {
            node.widgets[widgetIdx].onRemove?.()
            node.widgets.splice(widgetIdx, 1)
        }
    }

    return {
        showVideoPreview,
        removeVideoPreview
    }
}
