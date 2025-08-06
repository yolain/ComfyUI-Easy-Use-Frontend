export default {
    pipe:{
        category:'Easy Pipe',
        nodes:['easy pipeIn', 'easy pipeOut','easy pipeEdit', 'easy pipeEditPrompt','easy pipeBatchIndex'],
        input:{
            "pipe":"pipe"
        },
        output:{
            "pipe":"pipe"
        },
        widget:{
            "optional_positive":"optional_positive",
            "optional_negative":"optional_negative",
        }
    },
    loaders: {
        category: 'Easy Loaders',
        nodes: ['easy fullLoader', 'easy a1111Loader', 'easy comfyLoader', 'easy kolorsLoader', 'easy hunyuanDiTLoader', 'easy pixArtLoader', 'easy fluxLoader'],
        input: {
            "optional_lora_stack": "optional_lora_stack",
            "optional_controlnet_stack": "optional_controlnet_stack",
            "positive": "positive",
            "negative": "negative"
        },
        output: {
            "pipe": "pipe",
            "model": "model",
            "vae": "vae",
            "clip": null,
            "positive": null,
            "negative": null,
            "latent": null,
        },
        widget:{
            "ckpt_name": "ckpt_name",
            "vae_name": "vae_name",
            "clip_skip": "clip_skip",
            "lora_name": "lora_name",
            "resolution": "resolution",
            "empty_latent_width": "empty_latent_width",
            "empty_latent_height": "empty_latent_height",
            "positive": "positive",
            "negative": "negative",
            "batch_size": "batch_size",
            "a1111_prompt_style": "a1111_prompt_style"
        }
    },
    preSampling: {
        category: 'Easy PreSampling',
        nodes: ['easy preSampling', 'easy preSamplingAdvanced', 'easy preSamplingDynamicCFG', 'easy preSamplingNoiseIn', 'easy preSamplingCustom', 'easy preSamplingLayerDiffusion', 'easy fullkSampler'],
        input: {
            "pipe": "pipe",
            "image_to_latent": "image_to_latent",
            "latent": "latent"
        },
        output:{
            "pipe": "pipe"
        },
        widget:{
            "steps": "steps",
            "cfg": "cfg",
            "cfg_scale_min": "cfg",
            "sampler_name": "sampler_name",
            "scheduler": "scheduler",
            "denoise": "denoise",
            "seed_num": "seed_num",
            "seed": "seed"
        }
    },
    samplers: {
        category: 'Custom Sampler',
        nodes: ['KSamplerSelect', 'SamplerEulerAncestral', 'SamplerEulerAncestralCFG++', 'SamplerLMS', 'SamplerDPMPP_3M_SDE', 'SamplerDPMPP_2M_SDE', 'SamplerDPMPP_SDE', 'SamplerDPMAdaptative', 'SamplerLCMUpscale', 'SamplerTCD', 'SamplerTCD EulerA'],
        output:{
            "SAMPLER": "SAMPLER"
        }
    },
    sigmas: {
        category: 'Custom Sigmas',
        nodes: ['BasicScheduler', 'KarrasScheduler', 'ExponentialScheduler', 'PolyexponentialScheduler', 'VPScheduler', 'BetaSamplingScheduler', 'SDTurboScheduler', 'SplitSigmas', 'SplitSigmasDenoise', 'FlipSigmas', 'AlignYourStepsScheduler', 'GITSScheduler'],
        output: {
            "SIGMAS": "SIGMAS"
        }
    },
    kSampler: {
        category: 'Easy kSampler',
        nodes: ['easy kSampler', 'easy kSamplerTiled', 'easy kSamplerCustom', 'easy kSamplerInpainting', 'easy kSamplerDownscaleUnet', 'easy kSamplerLayerDiffusion'],
        input: {
            "pipe": "pipe",
            "model": "model"
        },
        output:{
            "pipe": "pipe",
            "image": "image"
        },
        widget: {
            "image_output": "image_output",
            "save_prefix": "save_prefix",
            "link_id": "link_id"
        },
    },
    controlNet: {
        category: 'Easy ControlNet',
        nodes: ['easy controlnetLoader', 'easy controlnetLoaderADV', 'easy controlnetLoader++', 'easy instantIDApply', 'easy instantIDApplyADV'],
        input: {
            "pipe": "pipe",
            "image": "image",
            "image_kps": "image_kps",
            "control_net": "control_net",
            "positive": "positive",
            "negative": "negative",
            "mask": "mask"
        },
        output: {
            "pipe": "pipe",
            "positive": "positive",
            "negative": "negative"
        },
        widget:{
            "control_net_name": "control_net_name",
            "strength": ["strength", "cn_strength"],
            "scale_soft_weights": ["scale_soft_weights", "cn_soft_weights"],
            "cn_strength": ["strength", "cn_strength"],
            "cn_soft_weights": ["scale_soft_weights", "cn_soft_weights"],
        }
    },
    adapter: {
        category: 'Easy Adapter',
        nodes: ['easy ipadapterApply', 'easy ipadapterApplyADV', 'easy ipadapterApplyFaceIDKolors', 'easy ipadapterStyleComposition', 'easy ipadapterApplyFromParams', 'easy pulIDApply', 'easy pulIDApplyADV'],
        input:{
            "model": "model",
            "image": "image",
            "image_style": "image",
            "attn_mask": "attn_mask",
            "optional_ipadapter": "optional_ipadapter"
        },
        output: {
            "model": "model",
            "tiles": "tiles",
            "masks": "masks",
            "ipadapter": "ipadapter"
        },
        widget: {
            "preset": "preset",
            "lora_strength": "lora_strength",
            "provider": "provider",
            "weight": "weight",
            "weight_faceidv2": "weight_faceidv2",
            "start_at": "start_at",
            "end_at": "end_at",
            "cache_mode": "cache_mode",
            "use_tiled": "use_tiled",
            "insightface": "insightface",
            "pulid_file": "pulid_file"
        }
    },
    positive: {
        category: 'Easy Positive',
        nodes: ['easy positive', 'easy wildcards'],
        input:{},
        output:{
            "text": "positive",
            "positive": "text"
        },
        widget: {
            "text": "positive",
            "positive": "text"
        },
    },
    loadImage: {
        category: 'Easy LoadImage',
        nodes: ['easy loadImageBase64', 'LoadImage', 'LoadImageMask'],
        input: {
            "pipe": "pipe",
            "image": "image",
            "mask": "mask"
        },
        output:{
            "IMAGE": "IMAGE",
            "MASK": "MASK"
        },
        widget: {
            "image": "image",
            "base64_data": "base64_data",
            "channel": "channel"
        },
    },
    saveImage:{
        category:'Save/Preview Image',
        nodes:['SaveImage', 'PreviewImage'],
    },
    inPaint: {
        category: 'Easy Inpaint',
        nodes: ['easy applyBrushNet', 'easy applyPowerPaint', 'easy applyInpaint'],
        input:{},
        output: {
            "pipe": "pipe",
        },
        widget: {
            "dtype": "dtype",
            "fitting": "fitting",
            "function": "function",
            "scale": "scale",
            "start_at": "start_at",
            "end_at": "end_at"
        },
    },
    // showAnything
    showAny:{
        category: 'Show Anything',
        nodes:['easy showAnything', 'Preview Any'],
        input:{
            "anything":"anything",
        },
        output:{
            "output":"output",
        },
    },
    saveText:{
        category: 'Save Text',
        nodes:['easy saveText',],
        input:{
            "image":"image",
            "text": "text",
            "output_file_path": "output_file_path",
            "file_name": "file_name",
            "file_extension": "file_extension",
            "overwrite": "overwrite"
        },
        output:{
            "text":"text",
            "image":"image"
        },
        widget: {
            "image":"image",
            "text": "text",
            "output_file_path": "output_file_path",
            "file_name": "file_name",
            "file_extension": "file_extension",
            "overwrite": "overwrite"
        }
    },
    // LLM Party
    persona:{
        category: 'LLM Party Persona',
        nodes:['load_persona','classify_persona','classify_persona_plus','custom_persona','translate_persona','flux_persona'],
        input:{
            "file_content":"file_content",
        },
        output:{
            "system_prompt":"system_prompt",
        },
        widget:{
            "is_enable":"is_enable",
        }
    },
    llmModelLoader:{
        category: 'LLM Model Loader',
        nodes:['LLM_api_loader','genai_api_loader','LLM_local_loader'],
        output:{
            "model":"model",
        }
    },
    llmModelChain:{
        category: 'LLM Model Chain',
        nodes:['LLM', 'LLM_local'],
        input:{
            "model":"model",
            "image":"images",
            "images":"image",
            "extra_parameters":"extra_parameters",
            "system_prompt_input":"system_prompt_input",
            "user_prompt_input":"user_prompt_input",
            "tools":"tools",
            "file_content":"file_content",
        },
        output:{
            "assistant_response":"assistant_response",
            "history":"history",
            "tool":"tool",
            "image":"image"
        },
        widget:{
            "system_prompt":"system_prompt",
            "user_prompt": "user_prompt",
            "temperature": "temperature",
            "is_memory": "is_memory",
            "is_tools_in_sys_prompt": "is_tools_in_sys_prompt",
            "max_length": "max_length",
            "main_brain": "main_brain",
            "conversation_rounds": "conversation_rounds",
            "history_record": "history_record",
            "is_enable": "is_enable",
        }
    },
    // mask
    maskModify:{
        category: 'Mask Modify',
        nodes:['CropMask','ThresholdMask','GrowMask','FeatherMask','LayerMask: MaskGrain','LayerMask: MaskEdgeUltraDetail','LayerMask: MaskEdgeUltraDetail V2'],
        input:{
            "mask":"mask",
        },
        output:{
            "MASK":"MASK",
            "mask":"mask",
            "image":"image"
        },
    },
    maskModifyWAS:{
        category: 'Mask Modify (WAS)',
        nodes:['Mask Dilate Region','Mask Gaussian Region'],
        input:{
            "masks":"masks",
        },
        output:{
            "MASKS":"MASKS",
        },
    },
    // FastUse
    fast_loaders:{
      category:'Fast Loaders',
      nodes:['fast ckptLoader', 'fast unetLoader'],
      input:{
          "开始加载": "开始加载"
      },
      output:{
          "模型加载器": "模型加载器",
          "MODEL": "MODEL",
          "VAE": "VAE",
          "CLIP": "CLIP"
      }
    },
    fast_inputs:{
        category: 'Fast Inputs',
        nodes:['fast sdInput', 'fast fluxInput', 'fast hiDreamInput', 'fast videoInput', 'fast qwenImageInput'],
        input:{
            "模型加载器": "模型加载器",
            "更多Controlnet": "更多Controlnet",
            "图像": "图像",
            "遮罩": "遮罩",
            "功能节点": "功能节点",
        },
        output:{
            "采样":"采样",
            "正面条件": "正面条件",
            "负面条件": "负面条件",
            "潜空间": "潜空间"
        },
        widget:{
            "Sigmas":"Sigmas",
            "分离Sigmas步数":"分离Sigmas步数",
            "分离降噪":"分离降噪",
            "降噪":"降噪",
            "添加噪声":"添加噪声",
            "seed": "seed",
            "生成数量": "生成数量"
        }
    },
    fast_outputResult:{
        category: 'Fast Outputs',
        nodes:['fast outputResult', 'fast outputResultVideo', 'fast outputLatent'],
        input:{
            "采样":"采样",
            "噪声":"噪声",
            "模型加载器":"模型加载器",
        },
        output:{
            "图像":"图像序列",
            "图像序列":"图像",
            "输出":"输出",
            "降噪输出":"降噪输出",
            "VAE":"VAE",
        },
        widget:{
            "采样预览":"采样预览",
            "VAE解码":"VAE解码",
            "图像输出":"视频输出",
            "视频输出":"图像输出",
            "保存路径":"保存路径",
        }
    },
    fast_loadImage:{
        category: 'Fast LoadImage',
        nodes:['fast loadImage', 'fast loadImageList'],
        output:{
            "图像":"图像",
            "遮罩":"遮罩",
            "文件名": "文件名",
        },
        widget:{
            "模式":"模式",
            "图像":"图像",
            "路径":"路径",
            "最大张数":"最大张数",
            "开始索引":"开始索引",
            "Base64":"Base64",
            "链接":"链接",
        }
    }
}
