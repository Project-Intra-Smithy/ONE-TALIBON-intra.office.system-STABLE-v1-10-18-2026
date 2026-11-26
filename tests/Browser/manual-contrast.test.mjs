import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {contrastReview,mfaPaintReview} from './phase-a-manual-review.mjs';
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
        await page.setContent('<body style="background:black"><span id="faded" style="color:white;opacity:.5">Faded text</span></body>');
        const faded=await contrastReview(page,{incomplete:[{id:'color-contrast',nodes:[{target:['#faded']}]}]});assert.ok(faded[0].contrastRatio>5&&faded[0].contrastRatio<5.5);
        await page.setContent('<body style="background:white"><div style="background:black;opacity:.5"><span id="group" style="color:white">Group opacity</span></div></body>');
        const group=await contrastReview(page,{incomplete:[{id:'color-contrast',nodes:[{target:['#group']}]}]});assert.ok(group[0].contrastRatio>3.9&&group[0].contrastRatio<4.1);
        await page.setContent('<style>body::before{content:"";background-image:linear-gradient(black,white)}</style><span id="image">Image context</span>');
        const image=await contrastReview(page,{incomplete:[{id:'color-contrast',nodes:[{target:['#image']}]}]});assert.equal(image[0].contrastRatio,null);assert.equal(image[0].unresolvedPaint[0].pseudo,'::before');
        await page.setContent('<div class="mfa-challenge-card" style="background:rgba(0,0,0,.94)"><h1 style="color:white">Heading</h1><input name="code" style="background:black;color:white;border:1px solid #80988a"></div>');
        const bounded=await mfaPaintReview(page);assert.ok(bounded[0].minimumContrast>18);assert.ok(bounded[1].inputBoundaryContrast>3);
        await page.locator('.mfa-challenge-card').evaluate(node=>node.style.background='rgba(255,255,255,.48)');
        const unsafe=await mfaPaintReview(page);assert.equal(unsafe[0].minimumContrast,1);
    }finally{await browser.close();}
});
