import { app, api} from './comfyAPI.js'

import {useNodeCanvasImagePreview} from "@/composable/node/canvasImagePreview.js";
import {useNodeVideoPreview} from "@/composable/node/videoPreview.js";

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
    if (previews?.length && !node.isOutputFinal) return previews
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


const VIDEO_WIDGET_NAME = 'video-preview'
const VIDEO_DEFAULT_OPTIONS = {
    playsInline: true,
    controls: true,
    loop: true
}
const MEDIA_LOAD_TIMEOUT = 8192
const MAX_RETRIES = 1
const VIDEO_PIXEL_OFFSET = 64
const createContainer = () => {
    const container = document.createElement('div')
    container.classList.add('comfy-img-preview')
    return container
}
const createTimeout = (ms) => new Promise((resolve) => setTimeout(() => resolve(null), ms))
const getVideoRealURL = obj => {
    return api.apiURL(`/view?filename=${encodeURIComponent(obj.filename)}&type=${obj.type}&subfolder=${obj.subfolder}&rand=${Math.random()}`)
}
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

    // const render = () => {
    //   node.graph?.setDirtyCanvas(true)
    // }

    /**
     * Displays media element(s) on the node.
     */
    function showPreview() {
        if (node.isLoading) return

        const outputUrls = node.videos?.length>0 ? node.videos.map(cate=> getVideoRealURL(cate)) : getNodeImageUrls(node)
        if (!outputUrls?.length) return

        if (options?.block) node.isLoading = true

        loadElements(outputUrls)
            .then((elements) => {
                const validElements = elements.filter(
                    (el) => el !== null
                )
                if (validElements.length) {
                    onLoaded?.(validElements)
                    // render()
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
    node.previewMediaType = 'image'

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
    node.previewMediaType = 'video'

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
                hideOnZoom: false,
                serialize: false
            })
        }
    }

    const onLoaded = (videoElements) => {
        const videoElement = videoElements[0]
        if (!videoElement) return
        if (!node.videoContainer) {
            if(node.imgs) node.imgs = undefined
            node.videoContainer = createContainer()
            node.videoContainer.style.pointerEvents = 'auto'
            addVideoDomWidget(node.videoContainer)
        }

        node.videoContainer.replaceChildren(videoElement)
        node.imageOffset = VIDEO_PIXEL_OFFSET
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

    const { showCanvasImagePreview, removeCanvasImagePreview } = useNodeCanvasImagePreview()
    const { showVideoPreview, removeVideoPreview} = useNodeVideoPreview()

    const output = getNodeOutputs(_this)
    const preview = getNodePreviews(_this)

    const isNewOutput = output && (_this.images !== output.images || _this.videos !== output.videos)
    const isNewPreview = preview && _this.preview !== preview

    if (isNewPreview) {
        _this.isOutputFinal = false
        if(_this.isTwiceRendered) _this.isTwiceRendered = false
        _this.preview = preview
    }
    if (isNewOutput) {
        _this.isOutputFinal = true
        if(output.images) _this.images = output.images
        if(output.videos) _this.videos = output.videos
    }

    if (isNewOutput || isNewPreview) {
        _this.animatedImages = output?.animated
        const isAnimatedWebp = _this.animatedImages && output.images.some((img) => img.filename?.includes('webp'))
        const isVideo = (_this.animatedImages && !isAnimatedWebp) || isVideoNode(this)
        if (isNewOutput && output?.videos){
            useNodeVideo(_this).showPreview()
        }
        else if (isVideo) {
            useNodeVideo(_this).showPreview()
        } else {
            useNodeImage(_this).showPreview()
        }
    }

    // 二次渲染
    if(_this.id != app.runningNodeId && !_this.isTwiceRendered && _this.isOutputFinal){
        if(_this.videos) useNodeVideo(_this.videos)
        else useNodeImage(_this).showPreview()
        _this.isTwiceRendered = true
    }

    // Nothing to do
    if (!_this.imgs?.length) return

    if (_this.animatedImages || (isNewOutput && output?.videos)) {
        removeCanvasImagePreview(_this)
        showVideoPreview(_this)
    } else {
        removeVideoPreview(_this)
        showCanvasImagePreview(_this)
    }
}
