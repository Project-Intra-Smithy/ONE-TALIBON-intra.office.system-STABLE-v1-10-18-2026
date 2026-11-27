/** Browser-rasterized evidence for the actual caption gradient; CSS-only unresolved findings stay retained. */
export async function gradientCaptionReview(page){
    const paint=await page.locator('#qa-rollout-caption').evaluate(node=>{
        const section=node.closest('section'),style=getComputedStyle(section),ink=getComputedStyle(node),rect=section.getBoundingClientRect();
        const canvas=document.createElement('canvas'),ctx=canvas.getContext('2d',{willReadFrequently:true});canvas.width=canvas.height=1;
        const color=value=>{if(!CSS.supports('color',value))throw Error('Unresolved color');ctx.clearRect(0,0,1,1);ctx.fillStyle=value;ctx.fillRect(0,0,1,1);return [...ctx.getImageData(0,0,1,1).data].map((v,i)=>i===3?v/255:v)};
        if(!style.backgroundImage.startsWith('linear-gradient('))throw Error('Unexpected caption gradient');
        let backdrop=[255,255,255];const ancestors=[];for(let p=section;p;p=p.parentElement)ancestors.push(p);
        for(const p of ancestors.reverse()){const s=getComputedStyle(p);if((p!==section&&s.backgroundImage!=='none')||s.filter!=='none'||s.mixBlendMode!=='normal'||Number(s.opacity)!==1)throw Error('Unresolved ancestor paint');const c=color(s.backgroundColor);backdrop=backdrop.map((v,i)=>c[i]*c[3]+v*(1-c[3]));}
        const foreground=color(ink.color);if(foreground[3]!==1||Number(ink.opacity)!==1)throw Error('Unresolved caption ink');
        return {gradient:style.backgroundImage,backdrop,foreground,width:Math.ceil(rect.width),height:Math.ceil(rect.height)};
    });
    const id='qa-caption-gradient-swatch';
    await page.evaluate(({id,paint})=>{const outer=document.createElement('div');outer.id=id;Object.assign(outer.style,{position:'fixed',left:'0',top:'0',width:paint.width+'px',height:paint.height+'px',zIndex:'2147483647',background:`rgb(${paint.backdrop.join(',')})`,pointerEvents:'none'});const inner=document.createElement('div');Object.assign(inner.style,{width:'100%',height:'100%',backgroundImage:paint.gradient});outer.append(inner);document.body.append(outer);},{id,paint});
    let capture;try{capture=await page.locator('#'+id).screenshot();}finally{await page.locator('#'+id).evaluate(node=>node.remove());}
    const bounds=await page.evaluate(async({data,foreground})=>{const image=new Image();image.src=data;await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,canvas.width,canvas.height).data;const lum=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);const f=lum(foreground.slice(0,3));let minimumContrast=21;for(let i=0;i<pixels.length;i+=4){const b=lum([pixels[i],pixels[i+1],pixels[i+2]]);minimumContrast=Math.min(minimumContrast,(Math.max(f,b)+.05)/(Math.min(f,b)+.05));}return {minimumContrast,pixels:canvas.width*canvas.height};},{data:'data:image/png;base64,'+capture.toString('base64'),foreground:paint.foreground});
    return {...paint,...bounds,requiredContrast:4.5,captureBase64:capture.toString('base64'),note:'Actual browser raster of the computed gradient at the original section dimensions over its verified flat ancestor backdrop. Every pixel measured; raw swatch retained separately. Original page capture remains the visual reference.'};
}
