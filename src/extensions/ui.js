import { api, app, $el } from '@/composable/comfyAPI'
import {addCss, addPreconnect} from "@/composable/head";
import {getSetting, setSetting, addSetting} from "@/composable/settings";
import {on} from "@/composable/util.js";
import {CUSTOM_LINK_TYPES_COLOR, THEME_COLOR, DARK_THEME_CLASS} from "@/config";
import obsidian from "@/config/theme/obsidian";
import obsidian_dark from "@/config/theme/obsidianDark";
import milk_white from "@/config/theme/milkWhite";
import settings from "@/config/settings";
import sleep from "@/composable/sleep";
import {useNodesStore} from "@/stores/nodes.js";
let nodesStore = null

/* Define Variable */
const custom_themes = ["custom_obsidian", "custom_obsidian_dark", "custom_milk_white"]
const NODE_CUSTOM_COLORS = {
    "easy positive": "green",
    "easy negative": "red",
    "easy promptList": "cyan",
    "easy promptLine": "cyan",
    "easy promptConcat": "cyan",
    "easy promptReplace": "cyan",
    'easy textSwitch': "pale_blue"
}
let NODE_COLOR_THEMES = LGraphCanvas.node_colors
let control_mode = null
let color_palettes = null
let color_palette = null
let monitor = null

/* add settings */
for(let i in settings) addSetting(settings[i])
/* The official interface for deleting settings api is missing. Settings of the v1 version cannot be deleted. */
// const OldestMenuNestSub = getSetting('Comfy.EasyUse.MenuNestSub')
// if(OldestMenuNestSub !== undefined){
//     setSetting('EasyUse.ContextMenu.SubDirectories', OldestMenuNestSub)
//     setSetting('EasyUse.ContextMenu.ModelsThumbnails', OldestMenuNestSub)
// }
// const OldestNodesTemplate = getSetting('Comfy.EasyUse.NodeTemplateShortcut')
// if(OldestNodesTemplate !== undefined){
//     setSetting('EasyUse.Hotkeys.NodesTemplate', OldestNodesTemplate)
// }

/* Register Extension */
app.registerExtension({
    name: 'Comfy.EasyUse.UI',
    init() {
        const id = 'Comfy.CustomColorPalettes'
        const storge_key = 'Comfy.Settings.Comfy.CustomColorPalettes'
        const current_id = 'Comfy.ColorPalette'
        const current_storge_key = 'Comfy.Settings.Comfy.ColorPalette'
        if (!color_palettes) color_palettes = getSetting(id, storge_key)
        if (!color_palette) color_palette = getSetting(current_id, current_storge_key) || 'dark'
        // Compare custom theme version & Set to settings
        if (!color_palettes?.obsidian?.version || color_palettes.obsidian.version < obsidian.ColorPalette.version) {
            color_palettes.obsidian = obsidian.ColorPalette
            color_palettes.obsidian_dark = obsidian_dark.ColorPalette
            setSetting(id, color_palettes, storge_key)
        }
        if (!color_palettes?.milk_white?.version || color_palettes.milk_white.version < milk_white.ColorPalette.version) {
            color_palettes.milk_white = milk_white.ColorPalette
            setSetting(id, color_palettes, storge_key)
        }

        // When color palette is obsidian or obsidian_dark or milk_white
        if (custom_themes.includes(color_palette)) {
            document.body.classList += ' comfyui-easyuse'
            addPreconnect("https://fonts.googleapis.com", true)
            addCss("https://fonts.googleapis.com/css2?family=Inter:wght@100;200;300;400;500;600;700&amp;family=JetBrains+Mono&amp;display=swap", false)
            switch (color_palette) {
                case 'custom_obsidian':
                case 'custom_obsidian_dark':
                case 'dark':
                    LGraphCanvas.node_colors = obsidian.NODE_COLORS
                    break
                case 'custom_milk_white':
                case 'light':
                    LGraphCanvas.node_colors = milk_white.NODE_COLORS
                    break
            }
            NODE_COLOR_THEMES = LGraphCanvas.node_colors
            LiteGraph.NODE_TEXT_SIZE = 13
            LGraphCanvas.prototype.drawNodeShape = drawNodeShape
            LGraphCanvas.prototype.drawNodeWidgets = drawNodeWidgets
        }else{
            document.body.classList.remove('comfyui-easyuse')
        }
        LGraphCanvas.onMenuNodeMode = onMenuNodeMode
        LGraphCanvas.onMenuNodeColors = onMenuNodeColors
        LGraphCanvas.onShowPropertyEditor = onShowPropertyEditor
    },

    async setup() {
        Object.assign(app.canvas.default_connection_color_byType, CUSTOM_LINK_TYPES_COLOR);
        Object.assign(LGraphCanvas.link_type_colors, CUSTOM_LINK_TYPES_COLOR);
        // ColorPalette Change Watcher
        if(color_palette == 'custom_milk_white') document.body.classList.remove(DARK_THEME_CLASS)
        app.ui.settings.addEventListener('Comfy.ColorPalette.change', async ({detail})=>{
            // Change Theme
            if(detail?.value && detail?.oldValue){
                await sleep(1)
                Object.assign(app.canvas.default_connection_color_byType, CUSTOM_LINK_TYPES_COLOR);
                Object.assign(LGraphCanvas.link_type_colors, CUSTOM_LINK_TYPES_COLOR);
            }
            if(detail.value == 'custom_milk_white') document.body.classList.remove(DARK_THEME_CLASS)
        })
        // crytools monitor
        setTimeout(_=> setCrystoolsUI(getSetting('Comfy.UseNewMenu') || 'Disabled'),1)
    },

    async nodeCreated(node) {
        // Add Custom Color For Nodes When Node Created
        if (NODE_CUSTOM_COLORS.hasOwnProperty(node.comfyClass)) {
            const colorKey = NODE_CUSTOM_COLORS[node.comfyClass]
            const theme = NODE_COLOR_THEMES[colorKey];
            if (!theme) return;
            if (theme.color) node.color = theme.color;
            if (theme.bgcolor) node.bgcolor = theme.bgcolor;
        }
        // Get Control Mode
        if (!control_mode) control_mode = getSetting('Comfy.WidgetControlMode')
        // Fix Official ComfyUI Bug
        // - When the widget value control mode is before, the widget text on the node is not changed when the page is loaded for the first time.
        if (control_mode == 'before') {
            const controlValueRunBefore = control_mode == 'before'
            if (node.widgets?.length > 0) {
                for (const w of node.widgets) {
                    if (['control_before_generate', 'control_after_generate'].includes(w.name)) {
                        await updateControlWidgetLabel(w, controlValueRunBefore);
                        if (w.linkedWidgets) {
                            for (const l of w.linkedWidgets) {
                                await updateControlWidgetLabel(l, controlValueRunBefore);
                            }
                        }
                    }
                }
            }
        }
    }
})


/* Functions */
function getColorBrightness(r, g, b) {
    return 0.299 * r + 0.587 * g + 0.114 * b;
}
function isColorDarkOrLight(hex) {
    let sanitizedHex = hex.replace("#", "");
    // 解析红、绿、蓝值
    let r = parseInt(sanitizedHex.substring(0, 2), 16);
    let g = parseInt(sanitizedHex.substring(2, 4), 16);
    let b = parseInt(sanitizedHex.substring(4, 6), 16);
    const brightness = getColorBrightness(r, g, b);
    return brightness > 127.5 ? 'light' : 'dark';
}
function updateControlWidgetLabel(widget, controlValueRunBefore = false) {
    let replacement = "after";
    let find = "before";
    if (controlValueRunBefore) [find, replacement] = [replacement, find]
    widget.label = (widget.label ?? widget.name).replace(find, replacement);
    widget.name = widget.label;
}

function drawNodeShape(node, ctx, size, fgcolor, bgcolor, selected, mouseOver) {
    //bg rect
    ctx.strokeStyle = fgcolor;
    ctx.fillStyle = bgcolor;

    let title_height = LiteGraph.NODE_TITLE_HEIGHT;
    let low_quality = this.ds.scale < 0.5;

    //render node area depending on shape
    let shape = node._shape || node.constructor.shape || LiteGraph.ROUND_SHAPE;
    let title_mode = node.constructor.title_mode;

    let render_title = true;
    if (title_mode == LiteGraph.TRANSPARENT_TITLE || title_mode == LiteGraph.NO_TITLE) {
        render_title = false;
    } else if (title_mode == LiteGraph.AUTOHIDE_TITLE && mouse_over) {
        render_title = true;
    }

    let area = new Float32Array(4);
    area = [0, render_title ? -title_height : 0, size[0] + 1, render_title ? size[1] + title_height : size[1]]; // [x,y,w,h]

    let old_alpha = ctx.globalAlpha;
    ctx.lineWidth = 1;
    ctx.beginPath();
    if (shape == LiteGraph.BOX_SHAPE || low_quality) {
        ctx.fillRect(area[0], area[1], area[2], area[3]);
    } else if (
        shape == LiteGraph.ROUND_SHAPE ||
        shape == LiteGraph.CARD_SHAPE
    ) {
        ctx.roundRect(
            area[0],
            area[1],
            area[2],
            area[3],
            shape == LiteGraph.CARD_SHAPE ? [this.round_radius, this.round_radius, 0, 0] : [this.round_radius]
        );
    } else if (shape == LiteGraph.CIRCLE_SHAPE) {
        ctx.arc(
            size[0] * 0.5,
            size[1] * 0.5,
            size[0] * 0.5,
            0,
            Math.PI * 2
        );
    }
    ctx.strokeStyle = LiteGraph.WIDGET_OUTLINE_COLOR;
    ctx.stroke();
    ctx.strokeStyle = fgcolor;
    ctx.fill();

    //separator
    if (!node.flags.collapsed && render_title) {
        ctx.shadowColor = "transparent";
        ctx.fillStyle = "rgba(0,0,0,0.2)";
        ctx.fillRect(0, -1, area[2], 2);
    }

    ctx.shadowColor = "transparent";

    if (node.onDrawBackground) {
        node.onDrawBackground(ctx, this, this.canvas, this.graph_mouse);
    }

    //title bg (remember, it is rendered ABOVE the node)
    if (render_title || title_mode == LiteGraph.TRANSPARENT_TITLE) {
        const nodeColorIsDark = isColorDarkOrLight(node?.color || '#ffffff') == 'dark'
        //title bar
        if (node.onDrawTitleBar) {
            node.onDrawTitleBar(ctx, title_height, size, this.ds.scale, fgcolor);
        } else if (
            title_mode != LiteGraph.TRANSPARENT_TITLE &&
            (node.constructor.title_color || this.render_title_colored)
        ) {
            let title_color = node.constructor.title_color || fgcolor;

            if (node.flags.collapsed) {
                ctx.shadowColor = LiteGraph.DEFAULT_SHADOW_COLOR;
            }

            //* gradient test
            if (this.use_gradients) {
                let grad = LGraphCanvas.gradients[title_color];
                if (!grad) {
                    grad = LGraphCanvas.gradients[title_color] = ctx.createLinearGradient(0, 0, 400, 0);
                    grad.addColorStop(0, title_color); // TODO refactor: validate color !! prevent DOMException
                    grad.addColorStop(1, "#000");
                }
                ctx.fillStyle = grad;
            } else {
                ctx.fillStyle = title_color;
            }

            //ctx.globalAlpha = 0.5 * old_alpha;
            ctx.beginPath();
            if (shape == LiteGraph.BOX_SHAPE || low_quality) {
                ctx.rect(0, -title_height, size[0] + 1, title_height);
            } else if (shape == LiteGraph.ROUND_SHAPE || shape == LiteGraph.CARD_SHAPE) {
                ctx.roundRect(
                    0,
                    -title_height,
                    size[0] + 1,
                    title_height,
                    node.flags.collapsed ? [this.round_radius] : [this.round_radius, this.round_radius, 0, 0]
                );
            }
            ctx.fill();
            ctx.shadowColor = "transparent";
        }

        let colState = false;
        if (LiteGraph.node_box_coloured_by_mode) {
            if (LiteGraph.NODE_MODES_COLORS[node.mode]) {
                colState = LiteGraph.NODE_MODES_COLORS[node.mode];
            }
        }
        if (LiteGraph.node_box_coloured_when_on) {
            colState = node.action_triggered ? "#FFF" : (node.execute_triggered ? "#AAA" : colState);
        }

        //title box
        let box_size = 10;
        if (node.onDrawTitleBox) {
            node.onDrawTitleBox(ctx, title_height, size, this.ds.scale);
        } else if (
            shape == LiteGraph.ROUND_SHAPE ||
            shape == LiteGraph.CIRCLE_SHAPE ||
            shape == LiteGraph.CARD_SHAPE
        ) {
            if (low_quality) {
                // ctx.fillStyle = "black";
                // ctx.beginPath();
                // ctx.arc(
                //     title_height * 0.5,
                //     title_height * -0.5,
                //     box_size * 0.5 + 1,
                //     0,
                //     Math.PI * 2
                // );
                // ctx.fill();
            }

            // BOX_TITLE_ICON
            const selected_color = nodeColorIsDark ? '#ffffff' : LiteGraph.NODE_SELECTED_TITLE_COLOR
            const default_color = nodeColorIsDark ? '#eeeeee' : (node.boxcolor || colState || LiteGraph.NODE_DEFAULT_BOXCOLOR)
            ctx.fillStyle = selected ? selected_color : default_color;
            ctx.beginPath();
            ctx.fillRect(10, 0 - box_size * 1.05 - 1, box_size * 1.1, box_size * 0.125);
            ctx.fillRect(10, 0 - box_size * 1.45 - 1, box_size * 1.1, box_size * 0.125);
            ctx.fillRect(10, 0 - box_size * 1.85 - 1, box_size * 1.1, box_size * 0.125);
        } else {
            if (low_quality) {
                // ctx.fillStyle = "black";
                // ctx.fillRect(
                //     (title_height - box_size) * 0.5 - 1,
                //     (title_height + box_size) * -0.5 - 1,
                //     box_size + 2,
                //     box_size + 2
                // );
            }
            ctx.fillStyle = node.boxcolor || colState || LiteGraph.NODE_DEFAULT_BOXCOLOR;
            ctx.fillRect(
                (title_height - box_size) * 0.5,
                (title_height + box_size) * -0.5,
                box_size,
                box_size
            );
        }
        ctx.globalAlpha = old_alpha;

        //title text
        if (node.onDrawTitleText) {
            node.onDrawTitleText(
                ctx,
                title_height,
                size,
                this.ds.scale,
                this.title_text_font,
                selected
            );
        }
        if (!low_quality) {
            ctx.font = this.title_text_font;
            let title = String(node.getTitle());
            if (title) {
                if (selected) {
                    ctx.fillStyle = nodeColorIsDark ? '#ffffff' : LiteGraph.NODE_SELECTED_TITLE_COLOR;
                } else {
                    ctx.fillStyle = nodeColorIsDark ? '#ffffff' : node.constructor.title_text_color || this.node_title_color;
                }
                if (node.flags.collapsed) {
                    ctx.textAlign = "left";
                    let measure = ctx.measureText(title);
                    ctx.fillText(
                        title.substr(0, 20), //avoid urls too long
                        title_height,// + measure.width * 0.5,
                        LiteGraph.NODE_TITLE_TEXT_Y - title_height
                    );
                    ctx.textAlign = "left";
                } else {
                    ctx.textAlign = "left";
                    ctx.fillText(
                        title,
                        title_height,
                        LiteGraph.NODE_TITLE_TEXT_Y - title_height
                    );
                }
            }
        }

        //subgraph box
        if (!node.flags.collapsed && node.subgraph && !node.skip_subgraph_button) {
            let w = LiteGraph.NODE_TITLE_HEIGHT;
            let x = node.size[0] - w;
            let over = LiteGraph.isInsideRectangle(this.graph_mouse[0] - node.pos[0], this.graph_mouse[1] - node.pos[1], x + 2, -w + 2, w - 4, w - 4);
            ctx.fillStyle = over ? "#888" : "#555";
            if (shape == LiteGraph.BOX_SHAPE || low_quality)
                ctx.fillRect(x + 2, -w + 2, w - 4, w - 4);
            else {
                ctx.beginPath();
                ctx.roundRect(x + 2, -w + 2, w - 4, w - 4, [4]);
                ctx.fill();
            }
            ctx.fillStyle = "#333";
            ctx.beginPath();
            ctx.moveTo(x + w * 0.2, -w * 0.6);
            ctx.lineTo(x + w * 0.8, -w * 0.6);
            ctx.lineTo(x + w * 0.5, -w * 0.3);
            ctx.fill();
        }

        //custom title render
        if (node.onDrawTitle) {
            node.onDrawTitle(ctx);
        }
    }

    //render selection marker
    if (selected) {
        if (node.onBounding) {
            node.onBounding(area);
        }

        if (title_mode == LiteGraph.TRANSPARENT_TITLE) {
            area[1] -= title_height;
            area[3] += title_height;
        }
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.8;
        ctx.beginPath();
        // let out_a = -6,out_b = 12,scale = 2
        let out_a = 0, out_b = 0, scale = 1
        if (shape == LiteGraph.BOX_SHAPE) {
            ctx.rect(
                out_a + area[0],
                out_a + area[1],
                out_b + area[2],
                out_b + area[3]
            );
        } else if (
            shape == LiteGraph.ROUND_SHAPE ||
            (shape == LiteGraph.CARD_SHAPE && node.flags.collapsed)
        ) {
            ctx.roundRect(
                out_a + area[0],
                out_a + area[1],
                out_b + area[2],
                out_b + area[3],
                [this.round_radius * scale]
            );
        } else if (shape == LiteGraph.CARD_SHAPE) {
            ctx.roundRect(
                out_a + area[0],
                out_a + area[1],
                out_b + area[2],
                out_b + area[3],
                [this.round_radius * scale, scale, this.round_radius * scale, scale]
            );
        } else if (shape == LiteGraph.CIRCLE_SHAPE) {
            ctx.arc(
                size[0] * 0.5,
                size[1] * 0.5,
                size[0] * 0.5 + 6,
                0,
                Math.PI * 2
            );
        }
        ctx.strokeStyle = LiteGraph.NODE_BOX_OUTLINE_COLOR;
        ctx.stroke();
        ctx.strokeStyle = fgcolor;
        ctx.globalAlpha = 1;
    }

    // these counter helps in conditioning drawing based on if the node has been executed or an action occurred
    if (node.execute_triggered > 0) node.execute_triggered--;
    if (node.action_triggered > 0) node.action_triggered--;
}

function drawNodeWidgets(node, posY, ctx, active_widget) {
    if (!node.widgets || !node.widgets.length) return 0;
    let width = node.size[0];
    let widgets = node.widgets;
    posY += 2;
    let H = LiteGraph.NODE_WIDGET_HEIGHT;
    let show_text = this.ds.scale > 0.5;
    ctx.save();
    ctx.globalAlpha = this.editor_alpha;
    let outline_color = LiteGraph.WIDGET_OUTLINE_COLOR;
    let background_color = LiteGraph.WIDGET_BGCOLOR;
    let text_color = LiteGraph.WIDGET_TEXT_COLOR;
    let secondary_text_color = LiteGraph.WIDGET_SECONDARY_TEXT_COLOR;
    let margin = 12;

    for (let i = 0; i < widgets.length; ++i) {
        let w = widgets[i];
        let y = posY;
        if (w.y) {
            y = w.y;
        }
        w.last_y = y;
        ctx.strokeStyle = outline_color;
        ctx.fillStyle = background_color;
        ctx.textAlign = "left";
        ctx.lineWidth = 1;
        if (w.disabled)
            ctx.globalAlpha *= 0.5;
        let widget_width = w.width || width;

        switch (w.type) {
            case "button":
                ctx.font = "10px Inter"
                ctx.fillStyle = background_color;
                if (w.clicked) {
                    ctx.fillStyle = "#AAA";
                    w.clicked = false;
                    this.dirty_canvas = true;
                }
                ctx.beginPath();
                ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.25]);
                ctx.fill();
                if (show_text && !w.disabled)
                    ctx.stroke();
                if (show_text) {
                    ctx.textAlign = "center";
                    ctx.fillStyle = text_color;
                    ctx.fillText(w.label || w.name, widget_width * 0.5, y + H * 0.7);
                }
                break;
            case "toggle":
                ctx.font = "10px Inter"
                ctx.textAlign = "left";
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
                    ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.25]);
                else
                    ctx.rect(margin, y, widget_width - margin * 2, H);
                ctx.fill();
                if (show_text && !w.disabled)
                    ctx.stroke();
                ctx.fillStyle = w.value ? THEME_COLOR : outline_color;
                ctx.beginPath();
                ctx.arc(widget_width - margin * 2, y + H * 0.5, H * 0.25, 0, Math.PI * 2);
                ctx.fill();
                if (show_text) {
                    ctx.fillStyle = secondary_text_color;
                    const label = w.label || w.name;
                    if (label != null) {
                        ctx.fillText(label, margin * 1.6, y + H * 0.7);
                    }
                    ctx.font = "10px Inter"
                    ctx.fillStyle = w.value ? text_color : secondary_text_color;
                    ctx.textAlign = "right";
                    ctx.fillText(
                        w.value
                            ? w.options.on || "true"
                            : w.options.off || "false",
                        widget_width - 35,
                        y + H * 0.7
                    );
                }
                break;
            case "slider":
                ctx.font = "10px Inter"
                ctx.fillStyle = background_color;
                ctx.strokeStyle = outline_color;
                ctx.beginPath();
                ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.25]);
                ctx.fill();
                ctx.stroke()
                let range = w.options.max - w.options.min;
                let nvalue = (w.value - w.options.min) / range;
                if (nvalue < 0.0) nvalue = 0.0;
                if (nvalue > 1.0) nvalue = 1.0;
                ctx.fillStyle = w.options.hasOwnProperty("slider_color") ? w.options.slider_color : (active_widget == w ? outline_color : THEME_COLOR);
                ctx.beginPath();
                ctx.roundRect(margin, y, nvalue * (widget_width - margin * 2), H, [H * 0.25]);
                ctx.fill();
                if (w.marker) {
                    let marker_nvalue = (w.marker - w.options.min) / range;
                    if (marker_nvalue < 0.0) marker_nvalue = 0.0;
                    if (marker_nvalue > 1.0) marker_nvalue = 1.0;
                    ctx.fillStyle = w.options.hasOwnProperty("marker_color") ? w.options.marker_color : "#AA9";
                    ctx.roundRect(margin + marker_nvalue * (widget_width - margin * 2), y, 2, H, [H * 0.25]);
                }
                if (show_text) {
                    ctx.textAlign = "center";
                    ctx.fillStyle = text_color;
                    let text = (w.label || w.name) + ": " + (Number(w.value).toFixed(w.options.precision != null ? w.options.precision : 3)).toString()
                    ctx.fillText(
                        text,
                        widget_width * 0.5,
                        y + H * 0.7
                    );

                }
                break;
            case "number":
            case "combo":
                ctx.textAlign = "left";
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
                    ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.25]);
                else
                    ctx.rect(margin, y, widget_width - margin * 2, H);
                ctx.fill();
                if (show_text) {
                    if (!w.disabled)
                        ctx.stroke();
                    ctx.fillStyle = text_color;
                    if (!w.disabled) {
                        ctx.beginPath();
                        ctx.moveTo(margin + 12, y + 6.5);
                        ctx.lineTo(margin + 6, y + H * 0.5);
                        ctx.lineTo(margin + 12, y + H - 6.5);
                        ctx.fill();
                        ctx.beginPath();
                        ctx.moveTo(widget_width - margin - 12, y + 6.5);
                        ctx.lineTo(widget_width - margin - 6, y + H * 0.5);
                        ctx.lineTo(widget_width - margin - 12, y + H - 6.5);
                        ctx.fill();
                    }
                    ctx.fillStyle = secondary_text_color;
                    ctx.font = "10px Inter"
                    ctx.fillText(w.label || w.name, margin * 2 + 5, y + H * 0.7);
                    ctx.fillStyle = text_color;
                    ctx.textAlign = "right";
                    let rightDistance = 6
                    if (w.type == "number") {
                        ctx.font = "10px Inter"
                        ctx.fillText(
                            Number(w.value).toFixed(
                                w.options.precision !== undefined
                                    ? w.options.precision
                                    : 3
                            ),
                            widget_width - margin * 2 - rightDistance,
                            y + H * 0.7
                        );
                    } else {
                        let v = w.value;
                        if (w.options.values) {
                            let values = w.options.values;
                            if (values.constructor === Function)
                                values = values();
                            if (values && values.constructor !== Array)
                                v = values[w.value];
                        }
                        ctx.fillText(
                            v,
                            widget_width - margin * 2 - rightDistance,
                            y + H * 0.7
                        );
                    }
                }
                break;
            case "string":
            case "text":
                ctx.textAlign = "left";
                ctx.strokeStyle = outline_color;
                ctx.fillStyle = background_color;
                ctx.beginPath();
                if (show_text)
                    ctx.roundRect(margin, y, widget_width - margin * 2, H, [H * 0.25]);
                else
                    ctx.rect(margin, y, widget_width - margin * 2, H);
                ctx.fill();
                if (show_text) {
                    if (!w.disabled)
                        ctx.stroke();
                    ctx.save();
                    ctx.beginPath();
                    ctx.rect(margin, y, widget_width - margin * 2, H);
                    ctx.clip();

                    //ctx.stroke();
                    ctx.fillStyle = secondary_text_color;
                    const label = w.label || w.name;
                    ctx.font = "10px Inter"
                    if (label != null) {
                        ctx.fillText(label, margin * 2, y + H * 0.7);
                    }
                    ctx.fillStyle = text_color;
                    ctx.textAlign = "right";
                    ctx.fillText(String(w.value).substr(0, 30), widget_width - margin * 2, y + H * 0.7); //30 chars max
                    ctx.restore();
                }
                break;
            default:
                if (w.draw) {
                    w.draw(ctx, node, widget_width, y, H);
                }
                break;
        }
        posY += (w.computeSize ? w.computeSize(widget_width)[1] : H) + 4;
        ctx.globalAlpha = this.editor_alpha;

    }
    ctx.restore();
    ctx.textAlign = "left";
}

function onMenuNodeMode(value, options, e, menu, node) {
    new LiteGraph.ContextMenu(
        LiteGraph.NODE_MODES,
        { event: e, callback: inner_clicked, parentMenu: menu, node: node }
    );

    function inner_clicked(v) {
        if (!node) {
            return;
        }
        var kV = Object.values(LiteGraph.NODE_MODES).indexOf(v);
        var fApplyMultiNode = function(node){
            if (kV>=0 && LiteGraph.NODE_MODES[kV])
                node.changeMode(kV);
            else{
                console.warn("unexpected mode: "+v);
                node.changeMode(LiteGraph.ALWAYS);
            }
            // Update Nodes Store
            if(!nodesStore) nodesStore = useNodesStore()
            nodesStore.update()
        }

        var graphcanvas = LGraphCanvas.active_canvas;
        if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
            fApplyMultiNode(node);
        }else{
            for (var i in graphcanvas.selected_nodes) {
                fApplyMultiNode(graphcanvas.selected_nodes[i]);
            }
        }
    }

    return false;
}
function onMenuNodeColors(value, options, e, menu, node) {
    if (!node) {
        throw "no node for color";
    }

    var values = [];
    values.push({
        value: null,
        content:
            "<span style='display: block; padding-left: 4px;'>No color</span>"
    });

    for (var i in LGraphCanvas.node_colors) {
        var color = LGraphCanvas.node_colors[i];
        var value = {
            value: i,
            content:
                "<span style='display: block; color: #999; padding-left: 4px; border-left: 8px solid " +
                color.color +
                "; background-color:" +
                color.bgcolor +
                "'>" +
                i +
                "</span>"
        };
        values.push(value);
    }
    new LiteGraph.ContextMenu(values, {
        event: e,
        callback: inner_clicked,
        parentMenu: menu,
        node: node
    });

    function inner_clicked(v) {
        if (!node) {
            return;
        }

        var color = v.value ? LGraphCanvas.node_colors[v.value] : null;

        var fApplyColor = function(node){
            if (color) {
                if (node.constructor === LiteGraph.LGraphGroup) {
                    node.color = color.groupcolor;
                } else {
                    node.color = color.color;
                    node.bgcolor = color.bgcolor;
                }
            } else {
                delete node.color;
                delete node.bgcolor;
            }
            // Update Nodes Store
            if(!nodesStore) nodesStore = useNodesStore()
            nodesStore.update()
        }

        var graphcanvas = LGraphCanvas.active_canvas;
        if (!graphcanvas.selected_nodes || Object.keys(graphcanvas.selected_nodes).length <= 1){
            fApplyColor(node);
        }else{
            for (var i in graphcanvas.selected_nodes) {
                fApplyColor(graphcanvas.selected_nodes[i]);
            }
        }
        node.setDirtyCanvas(true, true);
    }
    return false;
}
function onShowPropertyEditor(item, options, e, menu, node) {
    var input_html = "";
    var property = item.property || "title";
    var value = node[property];

    // TODO refactor :: use createDialog ?
    var dialog = document.createElement("div");
    dialog.is_modified = false;
    dialog.className = "graphdialog";
    dialog.innerHTML =
        "<span class='name'></span><input autofocus type='text' class='value'/><button>OK</button>";
    dialog.close = function () {
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
    };
    var title = dialog.querySelector(".name");
    title.innerText = property;
    var input = dialog.querySelector(".value");
    if (input) {
        input.value = value;
        input.addEventListener("blur", function (e) {
            this.focus();
        });
        input.addEventListener("keydown", function (e) {
            dialog.is_modified = true;
            if (e.keyCode == 27) {
                //ESC
                dialog.close();
            } else if (e.keyCode == 13) {
                inner(); // save
            } else if (e.keyCode != 13 && e.target.localName != "textarea") {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
        });
    }

    var graphcanvas = LGraphCanvas.active_canvas;
    var canvas = graphcanvas.canvas;

    var rect = canvas.getBoundingClientRect();
    var offsetx = -20;
    var offsety = -20;
    if (rect) {
        offsetx -= rect.left;
        offsety -= rect.top;
    }

    if (event) {
        dialog.style.left = event.clientX + offsetx + "px";
        dialog.style.top = event.clientY + offsety + "px";
    } else {
        dialog.style.left = canvas.width * 0.5 + offsetx + "px";
        dialog.style.top = canvas.height * 0.5 + offsety + "px";
    }

    var button = dialog.querySelector("button");
    button.addEventListener("click", inner);
    canvas.parentNode.appendChild(dialog);

    if (input) input.focus();

    var dialogCloseTimer = null;
    dialog.addEventListener("mouseleave", function (e) {
        if (LiteGraph.dialog_close_on_mouse_leave)
            if (!dialog.is_modified && LiteGraph.dialog_close_on_mouse_leave)
                dialogCloseTimer = setTimeout(dialog.close, LiteGraph.dialog_close_on_mouse_leave_delay); //dialog.close();
    });
    dialog.addEventListener("mouseenter", function (e) {
        if (LiteGraph.dialog_close_on_mouse_leave)
            if (dialogCloseTimer) clearTimeout(dialogCloseTimer);
    });

    function inner() {
        if (input) setValue(input.value);
    }

    function setValue(value) {
        if (item.type == "Number") {
            value = Number(value);
        } else if (item.type == "Boolean") {
            value = Boolean(value);
        }
        node[property] = value;
        if (dialog.parentNode) {
            dialog.parentNode.removeChild(dialog);
        }
        node.setDirtyCanvas(true, true);
        // Update Nodes Store
        if(!nodesStore) nodesStore = useNodesStore()
        nodesStore.update()
    }
}

function processKey(e) {
    if (e.type == 'keydown' && !e.repeat) {
        if ((e.key === 'm' || e.key === 'b') && e.ctrlKey) {
            // Update Nodes Store
            if(!nodesStore) nodesStore = useNodesStore()
            nodesStore.update()
        }
    }
}


const loadColorPalette = async (colorPalette) => {
    if (colorPalette.colors) {
        if (colorPalette.colors.node_slot) {
            Object.assign(app.canvas.default_connection_color_byType, colorPalette.colors.node_slot);
            Object.assign(LGraphCanvas.link_type_colors, colorPalette.colors.node_slot);
        }
        if (colorPalette.colors.litegraph_base) {
            app.canvas.node_title_color = colorPalette.colors.litegraph_base.NODE_TITLE_COLOR;
            app.canvas.default_link_color = colorPalette.colors.litegraph_base.LINK_COLOR;
            for (const key in colorPalette.colors.litegraph_base) {
                if (colorPalette.colors.litegraph_base.hasOwnProperty(key) && LiteGraph.hasOwnProperty(key)) {
                    LiteGraph[key] = colorPalette.colors.litegraph_base[key];
                }
            }
        }
        app.canvas.draw(true, true);
    }
};


const changeNewMenuPosition = app.ui.settings.settingsLookup?.['Comfy.UseNewMenu']
if(changeNewMenuPosition) changeNewMenuPosition.onChange = v => setCrystoolsUI(v)
// crystools monitor
const setCrystoolsUI = (position) =>{
    const crystools = document.getElementById('crystools-root')?.children || null
    if(crystools?.length>0){
        if(!monitor){
            for (let i = 0; i < crystools.length; i++) {
                if (crystools[i].id === 'crystools-monitor-container') {
                    monitor = crystools[i];
                    break;
                }
            }
        }
        if(monitor){
            if(position == 'Disabled'){
                let replace = true
                for (let i = 0; i < crystools.length; i++) {
                    if (crystools[i].id === 'crystools-monitor-container') {
                        replace = false
                        break;
                    }
                }
                document.getElementById('crystools-root').appendChild(monitor)
            }
            else {
                let monitor_div = document.getElementById('comfyui-menu-monitor')
                if(!monitor_div) app.menu.settingsGroup.element.before($el('div',{id:'comfyui-menu-monitor'},monitor))
                else monitor_div.appendChild(monitor)
            }
        }
    }
}