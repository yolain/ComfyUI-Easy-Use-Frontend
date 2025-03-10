const VERSION = 111
const bgcolor = "#FFFFFF"
export default {
    ColorPalette: {
		"id": "milk_white",
		"name": "Milk White",
		"colors": {
			"node_slot": {
				"CLIP": "#FFA726", // orange
				"CLIP_VISION": "#5C6BC0", // indigo
				"CLIP_VISION_OUTPUT": "#8D6E63", // brown
				"CONDITIONING": "#EF5350", // red
				"CONTROL_NET": "#66BB6A", // green
				"IMAGE": "#42A5F5", // blue
				"LATENT": "#AB47BC", // purple
				"MASK": "#9CCC65", // light green
				"MODEL": "#7E57C2", // deep purple
				"STYLE_MODEL": "#D4E157", // lime
				"VAE": "#FF7043", // deep orange
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
				"BACKGROUND_IMAGE": "data:image/gif;base64,R0lGODlhZABkALMAAAAAAP///+vr6+rq6ujo6Ofn5+bm5uXl5d3d3f///wAAAAAAAAAAAAAAAAAAAAAAACH5BAEAAAkALAAAAABkAGQAAAT/UMhJq7046827HkcoHkYxjgZhnGG6si5LqnIM0/fL4qwwIMAg0CAsEovBIxKhRDaNy2GUOX0KfVFrssrNdpdaqTeKBX+dZ+jYvEaTf+y4W66mC8PUdrE879f9d2mBeoNLfH+IhYBbhIx2jkiHiomQlGKPl4uZe3CaeZifnnijgkESBqipqqusra6vsLGys62SlZO4t7qbuby7CLa+wqGWxL3Gv3jByMOkjc2lw8vOoNSi0czAncXW3Njdx9Pf48/Z4Kbbx+fQ5evZ4u3k1fKR6cn03vHlp7T9/v8A/8Gbp4+gwXoFryXMB2qgwoMMHyKEqA5fxX322FG8tzBcRnMW/zlulPbRncmQGidKjMjyYsOSKEF2FBlJQMCbOHP6c9iSZs+UnGYCdbnSo1CZI5F64kn0p1KnTH02nSoV3dGTV7FFHVqVq1dtWcMmVQZTbNGu72zqXMuW7danVL+6e4t1bEy6MeueBYLXrNO5Ze36jQtWsOG97wIj1vt3St/DjTEORss4nNq2mDP3e7w4r1bFkSET5hy6s2TRlD2/mSxXtSHQhCunXo26NevCpmvD/UU6tuullzULH76q92zdZG/Ltv1a+W+osI/nRmyc+fRi1Xdbh+68+0vv10dH3+77KD/i6IdnX669/frn5Zsjh4/2PXju8+8bzc9/6fj27LFnX11/+IUnXWl7BJfegm79FyB9JOl3oHgSklefgxAC+FmFGpqHIYcCfkhgfCohSKKJVo044YUMttggiBkmp6KFXw1oII24oYhjiDByaKOOHcp3Y5BD/njikSkO+eBREQAAOw==",
				"CLEAR_BACKGROUND_COLOR": "lightgray",
				"NODE_TITLE_COLOR": "#222",
				"NODE_SELECTED_TITLE_COLOR": "#000",
				"NODE_TEXT_SIZE": 14,
				"NODE_TEXT_COLOR": "#444",
				"NODE_SUBTEXT_SIZE": 12,
				"NODE_DEFAULT_COLOR": "#F7F7F7",
				"NODE_DEFAULT_BGCOLOR": "#F5F5F5",
				"NODE_DEFAULT_BOXCOLOR": "#555",
				"NODE_DEFAULT_SHAPE": 2,
				"NODE_BOX_OUTLINE_COLOR": "#000",
				"DEFAULT_SHADOW_COLOR": "rgba(0,0,0,0.1)",
				"DEFAULT_GROUP_FONT": 24,

				"WIDGET_BGCOLOR": "#D4D4D4",
				"WIDGET_OUTLINE_COLOR": "#999",
				"WIDGET_TEXT_COLOR": "#222",
				"WIDGET_SECONDARY_TEXT_COLOR": "#555",

				"LINK_COLOR": "#9A9",
				"EVENT_LINK_COLOR": "#FF9800",
				"CONNECTING_LINK_COLOR": "#222",
			},
			"comfy_base": {
				"fg-color": "#222",
				"bg-color": "#DDD",
				"comfy-menu-bg": "#F5F5F5",
				"comfy-input-bg": "#C9C9C9",
				"input-text": "#222",
				"descrip-text": "#444",
				"drag-text": "#555",
				"error-text": "#F44336",
				"border-color": "#bbb",
				"tr-even-bg-color": "#f9f9f9",
				"tr-odd-bg-color": "#fff",
				"content-bg": "#e0e0e0",
				"content-fg": "#222",
				"content-hover-bg": "#adadad",
				"content-hover-fg": "#222"
			}
		},
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