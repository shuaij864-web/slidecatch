export function sleep(ms){return new Promise((resolve)=>setTimeout(resolve,ms));}
export function humanBytes(value){const bytes=Number(value)||0;if(bytes<1024)return `${bytes} B`;if(bytes<1024**2)return `${(bytes/1024).toFixed(1)} KB`;if(bytes<1024**3)return `${(bytes/1024**2).toFixed(1)} MB`;return `${(bytes/1024**3).toFixed(2)} GB`;}
export function sanitizeFilename(value,fallback='slides'){const clean=String(value||'').replace(/[\\/:*?"<>|\x00-\x1F]/g,'_').replace(/\s+/g,' ').trim().slice(0,120);return clean||fallback;}
export function debounce(fn,wait=100){let timer=null;return(...args)=>{clearTimeout(timer);timer=setTimeout(()=>fn(...args),wait);};}
export function unique(values){return [...new Set((values||[]).filter(Boolean))];}
export function asErrorMessage(error){return error instanceof Error?error.message:String(error||'Unknown error');}
