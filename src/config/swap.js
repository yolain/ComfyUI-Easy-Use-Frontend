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
        nodes:['easy showAnything', 'easy showAnythingLazy'],
        input:{
            "anything":"anything",
        },
        output:{
            "output":"output",
        },
    },
    // LLM
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
}
