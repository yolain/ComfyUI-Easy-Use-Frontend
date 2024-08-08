export function addPreconnect(href, crossorigin=false){
    const preconnect = document.createElement("link");
    preconnect.rel = 'preconnect'
    preconnect.href = href
    if(crossorigin) preconnect.crossorigin = ''
    document.head.appendChild(preconnect);
}

export function addMeta(name, content) {
    const meta = document.createElement("meta");
    meta.setAttribute("name", name);
    meta.setAttribute('content', content);
    document.head.appendChild(meta);
}

export function addCss(href, base=true, extension_name='ComfyUI-Easy-Use') {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.type = "text/css";
    link.href =  base ? `extensions/${extension_name}/${href}` : href;
    document.head.appendChild(link);
}

export function addScript(src, base=true,extension_name='ComfyUI-Easy-Use') {
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = base ? `extensions/${extension_name}/${src}` : src
    document.head.appendChild(script);
}

export function addStyle(content){
    const style = document.createElement('style');
    style.textContent = content;
    const ref = document.head.getElementsByTagName('style')[0] || null;
    document.head.insertBefore(style, ref);
}