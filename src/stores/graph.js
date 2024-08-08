import { defineStore } from 'pinia'
import cloneDeep from 'lodash/cloneDeep'
export const useGraphStore = defineStore('graphStore',{
    state: _ => ({
        selectors: [],
        selectors_styles:{},
        seg_selectors: [],
        slider_controls: []
    }),

    actions:{
        setSelectors(selectors){
            this.selectors = cloneDeep(selectors)
        },
        setStyles(key, styles){
            if(!this.selectors_styles[key]) this.selectors_styles[key] = styles
        },
        setSegSelectors(selectors){
            this.seg_selectors = cloneDeep(selectors)
        },
        setSliderControls(controls){
            this.slider_controls = cloneDeep(controls)
        }
    }
})