import {app, api} from "@/composable/comfyAPI.js";

const IMAGE_NODE_PROPERTY = 'image_upload'
const VIDEO_NODE_PROPERTY = 'video_upload'

const getNodeData = (node) => node.constructor?.nodeData
const getInputSpecsFromData = (inputData) =>{
    if (!inputData) return []
    const { required, optional } = inputData
    const inputSpecs = []
    if (required) {
        for (const value of Object.values(required)) {
            inputSpecs.push(value)
        }
    }
    if (optional) {
        for (const value of Object.values(optional)) {
            inputSpecs.push(value)
        }
    }
    return inputSpecs
}
const hasInputProperty = (node, property
) => {
    if (!node) return false
    const nodeData = getNodeData(node)
    if (!nodeData?.input) return false

    const inputs = getInputSpecsFromData(nodeData.input)
    return inputs.some((input) => input?.[1]?.[property])
}

const hasImageElements = imgs => Array.isArray(imgs) && imgs.some(img => img instanceof HTMLImageElement)
export function isImageNode(node) {
    if (!node) return false
    if (node.imgs?.length && hasImageElements(node.imgs)) return true
    if (!node.widgets) return false

    return hasInputProperty(node, IMAGE_NODE_PROPERTY)
}
export function isVideoNode(node) {
    if (!node) return false
    if (node.videoContainer) return true
    if (!node.widgets) return false

    return hasInputProperty(node, VIDEO_NODE_PROPERTY)
}

const getNodeId = (node) =>  node?.id.toString()

const getNodeOutputs = (node) => {
    return app.nodeOutputs[getNodeId(node)]
}

const getNodePreviews = (node) => {
    return app.nodePreviewImages[getNodeId(node)]
}

const getPreviewParam = (node) => {
    if (node.animatedImages) return ''
    return app.getPreviewFormatParam()
}
function getNodeImageUrls(node) {
    const previews = getNodePreviews(node)
    const outputs = getNodeOutputs(node)
    // If the node is running, return the previews
    if (previews?.length && node.id == app?.runningNodeId) return previews
    if (!outputs?.images?.length) {
        if(previews?.length) return previews
        return
    }

    const rand = app.getRandParam()
    const previewParam = getPreviewParam(node)

    return outputs.images.map((image) => {
        const imgUrlPart = new URLSearchParams(image)
        return api.apiURL(`/view?${imgUrlPart}${previewParam}${rand}`)
    })
}


const ANIM_PREVIEW_WIDGET = '$$comfy_animation_preview'
const VIDEO_WIDGET_NAME = 'video-preview'
const VIDEO_DEFAULT_OPTIONS = {
    playsInline: true,
    controls: true,
    loop: true
}
const MEDIA_LOAD_TIMEOUT = 8192
const MAX_RETRIES = 1
const createContainer = () => {
    const container = document.createElement('div')
    container.classList.add('comfy-img-preview')
    return container
}
const createTimeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms))
export const useNodePreview = (node, options) => {
    const { loadElement, onLoaded, onFailedLoading } = options

    const loadElementWithTimeout = async (url, retryCount = 0) => {
        const result = await Promise.race([
            loadElement(url),
            createTimeout(MEDIA_LOAD_TIMEOUT)
        ])

        if (result === null && retryCount < MAX_RETRIES) {
            return loadElementWithTimeout(url, retryCount + 1)
        }

        return result
    }

    const loadElements = async (urls) =>
        Promise.all(urls.map((url) => loadElementWithTimeout(url)))

    const render = () => {
        node.setSizeForImage?.()
        node.graph?.setDirtyCanvas(true)
    }

    /**
     * Displays media element(s) on the node.
     */
    function showPreview() {
        if (node.isLoading) return

        const outputUrls = getNodeImageUrls(node)
        if (!outputUrls?.length) return

        node.isLoading = true

        loadElements(outputUrls)
            .then((elements) => {
                const validElements = elements.filter(
                    (el) => el !== null
                )
                if (validElements.length) {
                    onLoaded?.(validElements)
                    render()
                }
            })
            .catch(() => {
                onFailedLoading?.()
            })
            .finally(() => {
                node.isLoading = false
            })
    }

    return {
        showPreview
    }
}
export const useNodeImage = (node) => {
    const loadElement = (url) =>
        new Promise((resolve) => {
            const img = new Image()
            img.onload = () => resolve(img)
            img.onerror = () => resolve(null)
            img.src = url
        })

    const onLoaded = (elements) => {
        node.imageIndex = null
        node.imgs = elements
    }

    return useNodePreview(node, {
        loadElement,
        onLoaded,
        onFailedLoading: () => {
            node.imgs = undefined
        }
    })
}

export const useNodeVideo = (node) => {
    const loadElement = (url) =>
        new Promise((resolve) => {
            const video = document.createElement('video')
            Object.assign(video, VIDEO_DEFAULT_OPTIONS)
            video.onloadeddata = () => resolve(video)
            video.onerror = () => resolve(null)
            video.src = url
        })

    const addVideoDomWidget = (container) => {
        const hasWidget = node.widgets?.some((w) => w.name === VIDEO_WIDGET_NAME)
        if (!hasWidget) {
            node.addDOMWidget(VIDEO_WIDGET_NAME, 'video', container, {
                hideOnZoom: false
            })
        }
    }

    const onLoaded = (videoElements) => {
        const videoElement = videoElements[0]
        if (!videoElement) return

        if (!node.videoContainer) {
            node.videoContainer = createContainer()
            addVideoDomWidget(node.videoContainer)
        }

        node.videoContainer.replaceChildren(videoElement)
        node.imageOffset = 64
    }

    return useNodePreview(node, {
        loadElement,
        onLoaded,
        onFailedLoading: () => {
            node.videoContainer = undefined
        }
    })
}




export function unsafeDrawBackground(_this, ctx) {
    if (_this.flags.collapsed) return

    const output = getNodeOutputs(_this)
    const preview = getNodePreviews(_this)

    const isNewOutput = output && _this.images !== output.images
    const isNewPreview = preview && _this.preview !== preview

    if (isNewPreview) _this.preview = preview
    if (isNewOutput) _this.images = output.images

    if (isNewOutput || isNewPreview) {
        _this.animatedImages = output?.animated

        if (_this.animatedImages || isVideoNode(_this)) {
            useNodeVideo(_this).showPreview()
        } else {
            useNodeImage(_this).showPreview()
        }
    }

    // Nothing to do
    if (!_this.imgs?.length) return

    const widgetIdx = _this.widgets?.findIndex(
        (w) => w.name === ANIM_PREVIEW_WIDGET
    )

    if (_this.animatedImages) {
        // Instead of using the canvas we'll use a IMG
        if (widgetIdx > -1) {
            // Replace content
            const widget = _this.widgets[widgetIdx] || {options: { host:null }}
            widget.options.host?.updateImages(_this.imgs)
        } else {
            const host = createImageHost(_this)
            _this.setSizeForImage(true)
            const widget = _this.addDOMWidget(
                ANIM_PREVIEW_WIDGET,
                'img',
                host.el,
                {
                    host,
                    getHeight: host.getHeight,
                    onDraw: host.onDraw,
                    hideOnZoom: false
                }
            )
            widget.serializeValue = () => undefined
            widget.options.host.updateImages(_this.imgs)
        }
        return
    }

    if (widgetIdx > -1) {
        _this.widgets[widgetIdx].onRemove?.()
        _this.widgets.splice(widgetIdx, 1)
    }

    const canvas = app.graph.list_of_graphcanvas[0]
    const mouse = canvas.graph_mouse
    if (!canvas.pointer_is_down && _this.pointerDown) {
        if (
            mouse[0] === _this.pointerDown.pos[0] &&
            mouse[1] === _this.pointerDown.pos[1]
        ) {
            _this.imageIndex = _this.pointerDown.index
        }
        _this.pointerDown = null
    }

    let { imageIndex } = _this
    const numImages = _this.imgs.length
    if (numImages === 1 && !imageIndex) {
        // This skips the thumbnail render section below
        _this.imageIndex = imageIndex = 0
    }

    const shiftY = getImageTop(_this)

    const dw = _this.size[0]
    const dh = _this.size[1] - shiftY

    if (imageIndex == null) {
        // No image selected; draw thumbnails of all
        let cellWidth
        let cellHeight
        let shiftX
        let cell_padding
        let cols

        const compact_mode = is_all_same_aspect_ratio(_this.imgs)
        if (!compact_mode) {
            // use rectangle cell style and border line
            cell_padding = 2
            // Prevent infinite canvas2d scale-up
            const largestDimension = _this.imgs.reduce(
                (acc, current) =>
                    Math.max(acc, current.naturalWidth, current.naturalHeight),
                0
            )
            const fakeImgs = []
            fakeImgs.length = _this.imgs.length
            fakeImgs[0] = {
                naturalWidth: largestDimension,
                naturalHeight: largestDimension
            }
            ;({ cellWidth, cellHeight, cols, shiftX } = calculateImageGrid(
                fakeImgs,
                dw,
                dh
            ))
        } else {
            cell_padding = 0
            ;({ cellWidth, cellHeight, cols, shiftX } = calculateImageGrid(
                _this.imgs,
                dw,
                dh
            ))
        }

        let anyHovered = false
        _this.imageRects = []
        for (let i = 0; i < numImages; i++) {
            const img = _this.imgs[i]
            const row = Math.floor(i / cols)
            const col = i % cols
            const x = col * cellWidth + shiftX
            const y = row * cellHeight + shiftY
            if (!anyHovered) {
                anyHovered = LiteGraph.isInsideRectangle(
                    mouse[0],
                    mouse[1],
                    x + _this.pos[0],
                    y + _this.pos[1],
                    cellWidth,
                    cellHeight
                )
                if (anyHovered) {
                    _this.overIndex = i
                    let value = 110
                    if (canvas.pointer_is_down) {
                        if (!_this.pointerDown || _this.pointerDown.index !== i) {
                            _this.pointerDown = { index: i, pos: [...mouse] }
                        }
                        value = 125
                    }
                    ctx.filter = `contrast(${value}%) brightness(${value}%)`
                    canvas.canvas.style.cursor = 'pointer'
                }
            }
            _this.imageRects.push([x, y, cellWidth, cellHeight])

            const wratio = cellWidth / img.width
            const hratio = cellHeight / img.height
            const ratio = Math.min(wratio, hratio)

            const imgHeight = ratio * img.height
            const imgY = row * cellHeight + shiftY + (cellHeight - imgHeight) / 2
            const imgWidth = ratio * img.width
            const imgX = col * cellWidth + shiftX + (cellWidth - imgWidth) / 2

            ctx.drawImage(
                img,
                imgX + cell_padding,
                imgY + cell_padding,
                imgWidth - cell_padding * 2,
                imgHeight - cell_padding * 2
            )
            if (!compact_mode) {
                // rectangle cell and border line style
                ctx.strokeStyle = '#8F8F8F'
                ctx.lineWidth = 1
                ctx.strokeRect(
                    x + cell_padding,
                    y + cell_padding,
                    cellWidth - cell_padding * 2,
                    cellHeight - cell_padding * 2
                )
            }

            ctx.filter = 'none'
        }

        if (!anyHovered) {
            _this.pointerDown = null
            _this.overIndex = null
        }

        return
    }
    // Draw individual
    const img = _this.imgs[imageIndex]
    let w = img.naturalWidth
    let h = img.naturalHeight

    const scaleX = dw / w
    const scaleY = dh / h
    const scale = Math.min(scaleX, scaleY, 1)

    w *= scale
    h *= scale

    const x = (dw - w) / 2
    const y = (dh - h) / 2 + shiftY
    ctx.drawImage(img, x, y, w, h)

    // Draw image size text below the image
    ctx.fillStyle = LiteGraph.NODE_TEXT_COLOR
    ctx.textAlign = 'center'
    const sizeText = `${Math.round(img.naturalWidth)} × ${Math.round(img.naturalHeight)}`
    const textY = y + h + 10
    ctx.fillText(sizeText, x + w / 2, textY)

    const drawButton = (
        x,
        y,
        sz,
        text
    ) => {
        const hovered = LiteGraph.isInsideRectangle(
            mouse[0],
            mouse[1],
            x + _this.pos[0],
            y + _this.pos[1],
            sz,
            sz
        )
        let fill = '#333'
        let textFill = '#fff'
        let isClicking = false
        if (hovered) {
            canvas.canvas.style.cursor = 'pointer'
            if (canvas.pointer_is_down) {
                fill = '#1e90ff'
                isClicking = true
            } else {
                fill = '#eee'
                textFill = '#000'
            }
        }

        ctx.fillStyle = fill
        ctx.beginPath()
        ctx.roundRect(x, y, sz, sz, [4])
        ctx.fill()
        ctx.fillStyle = textFill
        ctx.font = '12px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(text, x + 15, y + 20)

        return isClicking
    }

    if (!(numImages > 1)) return

    const imageNum = _this.imageIndex + 1
    if (
        drawButton(dw - 40, dh + shiftY - 40, 30, `${imageNum}/${numImages}`)
    ) {
        const i = imageNum >= numImages ? 0 : imageNum
        if (!_this.pointerDown || _this.pointerDown.index !== i) {
            _this.pointerDown = { index: i, pos: [...mouse] }
        }
    }

    if (drawButton(dw - 40, shiftY + 10, 30, `x`)) {
        if (!_this.pointerDown || _this.pointerDown.index !== null) {
            _this.pointerDown = { index: null, pos: [...mouse] }
        }
    }
}

export function calculateImageGrid(imgs, dw, dh) {
    let best = 0
    let w = imgs[0].naturalWidth
    let h = imgs[0].naturalHeight
    const numImages = imgs.length

    let cellWidth, cellHeight, cols, rows, shiftX
    // compact style
    for (let c = 1; c <= numImages; c++) {
        const r = Math.ceil(numImages / c)
        const cW = dw / c
        const cH = dh / r
        const scaleX = cW / w
        const scaleY = cH / h

        const scale = Math.min(scaleX, scaleY, 1)
        const imageW = w * scale
        const imageH = h * scale
        const area = imageW * imageH * numImages

        if (area > best) {
            best = area
            cellWidth = imageW
            cellHeight = imageH
            cols = c
            rows = r
            shiftX = c * ((cW - imageW) / 2)
        }
    }

    return { cellWidth, cellHeight, cols, rows, shiftX }
}
export function getImageTop(node) {
    let shiftY
    if (node.imageOffset != null) {
        return node.imageOffset
    } else if (node.widgets?.length) {
        const w = node.widgets[node.widgets.length - 1]
        shiftY = w.last_y ?? 0
        if (w.computeSize) {
            shiftY += w.computeSize()[1] + 4
        } else if (w.computedHeight) {
            shiftY += w.computedHeight
        } else {
            shiftY += LiteGraph.NODE_WIDGET_HEIGHT + 4
        }
    } else {
        return node.computeSize()[1]
    }
    return shiftY
}
export const is_all_same_aspect_ratio = imgs => {
    if (!imgs.length || imgs.length === 1) return true

    const ratio = imgs[0].naturalWidth / imgs[0].naturalHeight

    for (let i = 1; i < imgs.length; i++) {
        const this_ratio = imgs[i].naturalWidth / imgs[i].naturalHeight
        if (ratio != this_ratio) return false
    }
    return true
}
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