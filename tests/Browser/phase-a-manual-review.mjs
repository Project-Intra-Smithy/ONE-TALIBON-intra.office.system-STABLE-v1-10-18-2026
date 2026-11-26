/** Computed paint evidence supplements axe incomplete findings; it is not an OS-native popup or screen-reader audit. */
export async function contrastReview(page,axe){
    return page.evaluate(targets=>{
        const color=value=>{const match=value.match(/[\d.]+/g);return match?[...match.slice(0,3).map(Number),Number(match[3]??1)]:[0,0,0,0];};
        const blend=(a,b)=>a.slice(0,3).map((v,i)=>v*a[3]+b[i]*(1-a[3]));
        const luminance=c=>c.map(v=>v/255).map(v=>v<=0.04045?v/12.92:((v+0.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[0.2126,0.7152,0.0722][i],0);
        return targets.map(selector=>{
            const node=document.querySelector(selector);if(!node)return {selector,unresolved:true};
            const styles=getComputedStyle(node),layers=[],opacityChain=[];for(let parent=node;parent;parent=parent.parentElement){const style=getComputedStyle(parent);layers.unshift(style.backgroundColor);if(Number(style.opacity)!==1)opacityChain.push({tag:parent.tagName,opacity:style.opacity});}
            let background=[255,255,255];for(const layer of layers)background=blend(color(layer),background);
            const ink=blend(color(styles.color),background),a=luminance(ink),b=luminance(background);
            return {selector,tag:node.tagName,text:node.textContent?.trim().slice(0,120),color:styles.color,background,contrastRatio:(Math.max(a,b)+0.05)/(Math.min(a,b)+0.05),fontSize:styles.fontSize,fontWeight:styles.fontWeight,opacityChain,disabled:node.matches(':disabled'),backgroundImage:styles.backgroundImage,note:node.tagName==='SELECT'?'Closed native select computed paint; OS popup rendering requires separate assistive-technology review':null};
        });
    },axe.incomplete.filter(r=>r.id==='color-contrast').flatMap(r=>r.nodes.map(n=>n.target.length===1?n.target[0]:null)).filter(Boolean));
}
