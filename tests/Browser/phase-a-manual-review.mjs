/** Computed paint evidence supplements axe incomplete findings; it is not an OS-native popup or screen-reader audit. */
export async function contrastReview(page,axe){
    return page.evaluate(targets=>{
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});
        const color=value=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);const [r,g,b,a]=context.getImageData(0,0,1,1).data;return [r,g,b,a/255];};
        const over=(a,b)=>{const alpha=a[3]+b[3]*(1-a[3]);return alpha?[...a.slice(0,3).map((v,i)=>(v*a[3]+b[i]*b[3]*(1-a[3]))/alpha),alpha]:[0,0,0,0];};
        const luminance=c=>c.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
        return targets.map(selector=>{
            const node=document.querySelector(selector);if(!node)return {selector,unresolved:true};
            const styles=getComputedStyle(node),opacityChain=[],unresolvedPaint=[];let foreground=color(styles.color),backdrop=[0,0,0,0];
            for(let parent=node;parent;parent=parent.parentElement){
                const style=getComputedStyle(parent),layer=color(style.backgroundColor),opacity=Number(style.opacity);
                foreground=over(foreground,layer);backdrop=over(backdrop,layer);foreground[3]*=opacity;backdrop[3]*=opacity;
                if(opacity!==1)opacityChain.push({tag:parent.tagName,opacity:style.opacity});
                if(style.backgroundImage!=='none'||style.filter!=='none'||style.mixBlendMode!=='normal')unresolvedPaint.push({tag:parent.tagName,backgroundImage:style.backgroundImage,filter:style.filter,mixBlendMode:style.mixBlendMode});
                for(const pseudo of ['::before','::after']){const paint=getComputedStyle(parent,pseudo);if(paint.content!=='none'&&paint.backgroundImage!=='none')unresolvedPaint.push({tag:parent.tagName,pseudo,backgroundImage:paint.backgroundImage});}
            }
            const background=over(backdrop,[255,255,255,1]).slice(0,3),ink=over(foreground,[255,255,255,1]).slice(0,3),a=luminance(ink),b=luminance(background);
            const vector=node instanceof SVGElement;
            const size=parseFloat(styles.fontSize),weight=Number(styles.fontWeight),requiredContrast=size>=24||(size>=18.6667&&weight>=700)?3:4.5;
            return {selector,tag:node.tagName,text:node.textContent?.trim().slice(0,120),color:styles.color,background,paintedInk:ink,contrastRatio:vector||unresolvedPaint.length?null:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),requiredContrast,fontSize:styles.fontSize,fontWeight:styles.fontWeight,opacityChain,unresolvedPaint,disabled:node.matches(':disabled'),backgroundImage:styles.backgroundImage,note:vector?'SVG geometry can paint behind text; DOM background ratio is not a valid paint measurement. Inspect the rendered plate.':unresolvedPaint.length?'Images, filters or blend modes require actual paint review; no CSS-only contrast pass inferred.':node.tagName==='SELECT'?'Closed native select computed paint; OS popup rendering requires separate assistive-technology review':null};
        });
    },axe.incomplete.filter(r=>r.id==='color-contrast').flatMap(r=>r.nodes.map(n=>n.target.length===1?n.target[0]:null)).filter(Boolean));
}

/** Worst-case contrast over every possible photograph behind the translucent MFA card. No text/input values are exported. */
export async function mfaPaintReview(page){
    return page.evaluate(()=>{
        const card=document.querySelector('.mfa-challenge-card');if(!card)return [];
        const canvas=document.createElement('canvas');canvas.width=canvas.height=1;const context=canvas.getContext('2d',{willReadFrequently:true});
        const color=value=>{context.clearRect(0,0,1,1);context.fillStyle=value;context.fillRect(0,0,1,1);const [r,g,b,a]=context.getImageData(0,0,1,1).data;return [r,g,b,a/255];};
        const luminance=c=>c.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
        const range=c=>[c.slice(0,3).map(v=>v*c[3]),c.slice(0,3).map(v=>v*c[3]+255*(1-c[3]))];
        const minimum=(fg,bounds)=>{if(fg[3]!==1)return null;const f=luminance(fg.slice(0,3)),low=luminance(bounds[0]),high=luminance(bounds[1]);if(f>=low&&f<=high)return 1;return Math.min(...[low,high].map(b=>(Math.max(f,b)+.05)/(Math.min(f,b)+.05)));};
        const panel=range(color(getComputedStyle(card).backgroundColor));
        return [...card.querySelectorAll('h1,p,label > span:first-child,input,button,#mfa-code-error,#mfa-recovery-errors > span')].filter(node=>node.tagName==='INPUT'||node.textContent.trim()).map(node=>{
            const style=getComputedStyle(node),bg=color(style.backgroundColor),bounds=panel.map(c=>c.map((v,i)=>bg[i]*bg[3]+v*(1-bg[3]))),size=parseFloat(style.fontSize),weight=Number(style.fontWeight);
            const border=color(style.borderTopColor),borderWidth=parseFloat(style.borderTopWidth);
            return {element:node.tagName+':'+(node.id||node.getAttribute('name')||node.className),color:style.color,background:style.backgroundColor,panelBackground:getComputedStyle(card).backgroundColor,minimumContrast:minimum(color(style.color),bounds),requiredContrast:size>=24||(size>=18.6667&&weight>=700)?3:4.5,disabled:node.matches(':disabled'),opacity:style.opacity,inputBoundaryContrast:node.tagName==='INPUT'&&borderWidth>0?Math.min(minimum(border,panel)??0,minimum(border,bounds)??0):null,note:'Bounds include every RGB photograph beneath the declared card alpha; no background-image inference.'};
        });
    });
}
