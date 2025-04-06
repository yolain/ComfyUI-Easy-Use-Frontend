import { THEME_COLOR } from '../index.js'
const VERSION = 112
const bgcolor = "rgba(24,24,27,.9)"
export default {
    ColorPalette: {
      "version": VERSION,
      "id": "obsidian",
      "name": "Obsidian",
      "colors": {
          "node_slot": {
              "CLIP": "#FFD500",
              "CLIP_VISION": "#A8DADC",
              "CLIP_VISION_OUTPUT": "#ad7452",
              "CONDITIONING": "#FFA931",
              "CONTROL_NET": "#6EE7B7",
              "IMAGE": "#64B5F6",
              "LATENT": "#FF9CF9",
              "MASK": "#81C784",
              "MODEL": "#B39DDB",
              "STYLE_MODEL": "#C2FFAE",
              "VAE": "#FF6E6E",
              "TAESD": "#DCC274",
              "PIPE_LINE": "#7737AA",
              "PIPE_LINE_SDXL": "#7737AA",
              "INT": "#29699C",
              "X_Y":  "#38291f",
              "XYPLOT": "#74DA5D",
              "LORA_STACK": "#94dccd",
              "CONTROL_NET_STACK": "#94dccd",
              "FAST_MODEL_LOADER": "#ffd399",
              "SAMPLING": "#60a5fa",
          },
          "litegraph_base": {
              "BACKGROUND_IMAGE": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAQBJREFUeNrs1rEKwjAUhlETUkj3vP9rdmr1Ysammk2w5wdxuLgcMHyptfawuZX4pJSWZTnfnu/lnIe/jNNxHHGNn//HNbbv+4dr6V+11uF527arU7+u63qfa/bnmh8sWLBgwYJlqRf8MEptXPBXJXa37BSl3ixYsGDBMliwFLyCV/DeLIMFCxYsWLBMwSt4Be/NggXLYMGCBUvBK3iNruC9WbBgwYJlsGApeAWv4L1ZBgsWLFiwYJmCV/AK3psFC5bBggULloJX8BpdwXuzYMGCBctgwVLwCl7Be7MMFixYsGDBsu8FH1FaSmExVfAxBa/gvVmwYMGCZbBg/W4vAQYA5tRF9QYlv/QAAAAASUVORK5CYII=",
              "CLEAR_BACKGROUND_COLOR": "#222222",
              "NODE_TITLE_COLOR": "#d4d4d8",
              "NODE_SELECTED_TITLE_COLOR": "#ffffff",
              "NODE_TEXT_SIZE": 14,
              "NODE_TEXT_COLOR": "#ffffff",
              "NODE_SUBTEXT_SIZE": 12,
              "NODE_DEFAULT_COLOR": "#09090b",
              "NODE_DEFAULT_BGCOLOR": "rgba(24,24,27,.9)",
              "NODE_DEFAULT_BOXCOLOR": "rgba(255,255,255,.75)",
              "NODE_DEFAULT_SHAPE": 2,
              "NODE_BOX_OUTLINE_COLOR": THEME_COLOR,
              "NODE_BYPASS_BGCOLOR": "#FF00FF",
              "NODE_ERROR_COLOUR": "#E00",
              "DEFAULT_SHADOW_COLOR": "rgba(0,0,0,0)",
              "DEFAULT_GROUP_FONT": 24,

              "WIDGET_BGCOLOR": "#242427",
              "WIDGET_OUTLINE_COLOR": "#3f3f46",
              "WIDGET_TEXT_COLOR": "#d4d4d8",
              "WIDGET_SECONDARY_TEXT_COLOR": "#d4d4d8",

              "LINK_COLOR": "#9A9",
              "EVENT_LINK_COLOR": "#A86",
              "CONNECTING_LINK_COLOR": "#AFA"
          },
          "comfy_base": {
              "fg-color": "#fff",
              "bg-color": "#09090b",
              "comfy-menu-bg": "rgba(24,24,24,.9)",
              "comfy-input-bg": "#262626",
              "input-text": "#ddd",
              "descrip-text": "#999",
              "drag-text": "#ccc",
              "error-text": "#ff4444",
              "border-color": "#29292c",
              "tr-even-bg-color": "rgba(28,28,28,.9)",
              "tr-odd-bg-color": "rgba(19,19,19,.9)"
          }
      }
    },
    NODE_COLORS:{
        red: { color: "#af3535", bgcolor, groupcolor: "#A88" },
        brown: { color: "#38291f", bgcolor, groupcolor: "#b06634" },
        green: { color: "#346434", bgcolor, groupcolor: "#8A8" },
        blue: { color: "#1f1f48", bgcolor, groupcolor: "#88A" },
        pale_blue: {color: "#006691", bgcolor, groupcolor: "#3f789e"},
        cyan: { color: "#008181", bgcolor, groupcolor: "#8AA" },
        purple: { color: "#422342", bgcolor, groupcolor: "#a1309b" },
        yellow: { color: "#c09430", bgcolor, groupcolor: "#b58b2a" },
        black: { color: "rgba(0,0,0,.8)", bgcolor, groupcolor: "#444" }
    }
}