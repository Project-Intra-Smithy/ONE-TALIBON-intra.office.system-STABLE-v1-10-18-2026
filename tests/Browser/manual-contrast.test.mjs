import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {contrastReview} from './phase-a-manual-review.mjs';
test('manual contrast evidence resolves modern CSS colors and leaves vector paint for visual review',async()=>{
    const browser=await chromium.launch();
    try{
        const page=await browser.newPage();
        await page.setContent('<body style="background:#000"><span id="rgb" style="color:rgb(255,255,255)">RGB</span><span id="modern" style="color:oklch(1 0 0)">Modern CSS</span><svg><rect width="100" height="100" fill="black"/><text id="vector" fill="white">Vector</text></svg></body>');
        const findings=await contrastReview(page,{incomplete:[{id:'color-contrast',nodes:['#rgb','#modern','#vector'].map(target=>({target:[target]}))}]});
        assert.equal(findings[0].contrastRatio,21);
        assert.equal(findings[1].contrastRatio,21);
        assert.equal(findings[2].contrastRatio,null);
        assert.match(findings[2].note,/rendered plate/);
    }finally{await browser.close();}
});
