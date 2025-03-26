import { app } from "@/composable/comfyAPI";
import {is_all_same_aspect_ratio, calculateImageGrid} from '@/composable/drawBackground.js';

const kSampler = ['easy kSampler', 'easy kSamplerTiled', 'easy fullkSampler']

function display_preview_images(event) {
    const node = app.graph._nodes_by_id[event.detail.id];
    if (node) {
        node.selected_images = new Set();
        node.anti_selected = new Set();
        const image = showImages(node, event.detail.urls);
        return {node,image,isKSampler:kSampler.includes(node.type)}
    } else {
        console.log(`Image Chooser Preview - failed to find ${event.detail.id}`)
    }
}

function showImages(node, urls) {
    node.imgs = [];
    urls.forEach((u)=> {
        const img = new Image();
        node.imgs.push(img);
        img.onload = () => { app.graph.setDirtyCanvas(true); };
        img.src = `/view?filename=${encodeURIComponent(u.filename)}&type=temp&subfolder=${app.getPreviewFormatParam()}`
    })
    node.setSizeForImage?.();
    return node.imgs
}

function drawRect(node, s, ctx) {
    const padding = 1;
    var rect;
    if (node.imageRects) {
        rect = node.imageRects[s];
    } else {
        const y = node.imagey;
        rect = [padding,y+padding,node.size[0]-2*padding,node.size[1]-y-2*padding];
    }
    ctx.strokeRect(rect[0]+padding, rect[1]+padding, rect[2]-padding*2, rect[3]-padding*2);
}

function additionalDrawBackground(node, ctx, shiftY=0) {
    if (!node.imgs) return;
    const canvas = app.canvas
    const mouse = canvas.graph_mouse

    const IMAGE_TEXT_SIZE_TEXT_HEIGHT = 15
    const dw = node.size[0]
    const dh = node.size[1] - shiftY - IMAGE_TEXT_SIZE_TEXT_HEIGHT
    if(node.imageIndex == null){
        // calculate the size of the images
        let cellWidth
        let cellHeight
        let shiftX
        let cell_padding
        let cols
        const compact_mode = is_all_same_aspect_ratio(node.imgs)
        if (!compact_mode) {
            // use rectangle cell style and border line
            cell_padding = 2
            // Prevent infinite canvas2d scale-up
            const largestDimension = node.imgs.reduce(
                (acc, current) =>
                    Math.max(acc, current.naturalWidth, current.naturalHeight),
                0
            )
            const fakeImgs = []
            fakeImgs.length = imgs.length
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
            cell_padding = 0;
            ({ cellWidth, cellHeight, cols, shiftX } = calculateImageGrid(
                node.imgs,
                dw,
                dh
            ))
        }
        let anyHovered = false
        let numImages = node.imgs.length
        node.imageRects = []
        for (let i = 0; i < numImages; i++) {
            const img = node.imgs[i]
            const row = Math.floor(i / cols)
            const col = i % cols
            const x = col * cellWidth + shiftX
            const y = row * cellHeight + shiftY
            if (!anyHovered) {
                anyHovered = LiteGraph.isInsideRectangle(
                    mouse[0],
                    mouse[1],
                    x + node.pos[0],
                    y + node.pos[1],
                    cellWidth,
                    cellHeight
                )
                if (anyHovered) {
                    node.overIndex = i
                    let value = 110
                    if (canvas.pointer_is_down) {
                        if (!node.pointerDown || node.pointerDown.index !== i) {
                            node.pointerDown = {index: i, pos: [...mouse]}
                        }
                        value = 125
                    }
                    ctx.filter = `contrast(${value}%) brightness(${value}%)`
                    canvas.canvas.style.cursor = 'pointer'
                }
            }
            node.imageRects.push([x, y, cellWidth, cellHeight])
        }
    }
    //
    if (node.imageRects) {
        for (let i = 0; i < node.imgs.length; i++) {
            // delete underlying image
            ctx.fillStyle = "#000";
            ctx.fillRect(...node.imageRects[i])
            // draw the new one
            const img = node.imgs[i];
            const cellWidth = node.imageRects[i][2];
            const cellHeight = node.imageRects[i][3];

            let wratio = cellWidth/img.width;
            let hratio = cellHeight/img.height;
            var ratio = Math.min(wratio, hratio);

            let imgHeight = ratio * img.height;
            let imgWidth = ratio * img.width;

            const imgX = node.imageRects[i][0] + (cellWidth - imgWidth)/2;
            const imgY = node.imageRects[i][1] + (cellHeight - imgHeight)/2;
            const cell_padding = 2;
            ctx.drawImage(img, imgX+cell_padding, imgY+cell_padding, imgWidth-cell_padding*2, imgHeight-cell_padding*2);
        }
    }
    ctx.lineWidth = 2;
    ctx.strokeStyle = "green";
    if(node && node.selected_images){
        node.selected_images.forEach((s) => { drawRect(node,s, ctx) })
    }
    ctx.strokeStyle = "#F88";
    node?.anti_selected?.forEach((s) => { drawRect(node,s, ctx) })
}

function click_is_in_image(node, pos) {
    if (node.imgs?.length>1) {
        for (var i = 0; i<node.imageRects.length; i++) {
            const dx = pos[0] - node.imageRects[i][0];
            const dy = pos[1] - node.imageRects[i][1];
            if ( dx > 0 && dx < node.imageRects[i][2] &&
                dy > 0 && dy < node.imageRects[i][3] ) {
                    return i;
                }
        }
    } else if (node.imgs?.length==1) {
        if (pos[1]>node.imagey) return 0;
    }
    return -1;
}

export { display_preview_images, additionalDrawBackground, click_is_in_image }