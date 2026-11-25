import assert from 'node:assert/strict';

/** Exercises existing server contracts using only synthetic records in the guarded disposable runtime. */
export async function planningCrud(page,context,origin,interactions) {
    const suffix=Date.now().toString(36),planCode=`QA-PLAN-${suffix}`,mapCode=`QA-MAP-${suffix}`;
    const props=async path=>{const response=await context.request.get(origin+path,{headers:{'X-Inertia':'true',Accept:'text/html'}});assert.equal(response.status(),200);return (await response.json()).props;};
    const save=async (name)=>{const form=page.getByRole('dialog');await form.getByRole('button',{name,exact:true}).click();await form.waitFor({state:'hidden'});};
    const remove=async title=>{
        await page.getByRole('button',{name:`Delete ${title}`,exact:true}).click();
        const confirmation=page.getByRole('dialog',{name:`Delete ${title}?`,exact:true});
        await confirmation.getByRole('button',{name:'Delete record',exact:true}).click();
        await confirmation.waitFor({state:'hidden'});
        await page.waitForLoadState('networkidle');
    };
    await page.setViewportSize({width:1440,height:900});
    await page.goto(origin+'/development-plans');
    await page.getByRole('button',{name:'New Plan Record',exact:true}).click();
    let form=page.getByRole('dialog');
    await form.getByLabel('Plan Code & Period',{exact:true}).fill(planCode);
    await form.getByLabel('Official Plan Title',{exact:true}).fill('Synthetic canonical plan');
    await form.getByLabel('Document Control Ref.',{exact:true}).fill(planCode);
    await form.getByLabel('Lifecycle Status',{exact:true}).selectOption('Draft');
    await save('Create plan');
    let plan=(await props('/development-plans')).plans.find(record=>record.code===planCode);
    assert.ok(plan?.dbId,'Created plan must have a real database identifier');
    await page.getByRole('button',{name:`View details for ${planCode}`,exact:true}).click();
    await page.getByRole('button',{name:'Edit Plan',exact:true}).click();
    form=page.getByRole('dialog');
    assert.equal(await form.getByLabel('Plan Code & Period',{exact:true}).isDisabled(),true);
    await form.getByLabel('Official Plan Title',{exact:true}).fill('Synthetic canonical plan revised');
    await save('Save plan changes');
    assert.equal((await props('/development-plans')).plans.find(record=>record.code===planCode).title,'Synthetic canonical plan revised');
    await page.getByRole('button',{name:`View details for ${planCode}`,exact:true}).click();
    await remove(planCode);
    assert.equal((await props('/development-plans')).plans.some(record=>record.code===planCode),false);
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'','Nested deletion dialog must release its scroll lock');
    interactions.push({role:'department_head',label:'real-plan-create-edit-delete',immutableCode:true});

    await page.goto(origin+'/ppas');
    await page.getByRole('button',{name:'Register PPA Entry',exact:true}).click();
    form=page.getByRole('dialog');
    await form.getByLabel('Program / Project / Activity Title',{exact:true}).fill(`Synthetic PPA ${suffix}`);
    await form.getByLabel('Related Development Plan Reference',{exact:true}).fill('Synthetic test reference');
    await save('Save PPA');
    const ppa=(await props('/ppas')).ppaRecords.find(record=>record.title===`Synthetic PPA ${suffix}`);
    assert.ok(ppa?.dbId);
    await page.locator(`[data-ppa-trigger="${ppa.id}"]:visible`).click();
    await page.getByRole('button',{name:'Edit PPA',exact:true}).click();
    form=page.getByRole('dialog');
    await form.getByLabel('Program / Project / Activity Title',{exact:true}).fill(`Synthetic PPA revised ${suffix}`);
    await save('Save changes');
    assert.equal((await props('/ppas')).ppaRecords.find(record=>record.id===ppa.id).title,`Synthetic PPA revised ${suffix}`);
    await page.locator(`[data-ppa-trigger="${ppa.id}"]:visible`).click();
    await remove(ppa.id);
    assert.equal((await props('/ppas')).ppaRecords.some(record=>record.id===ppa.id),false);
    interactions.push({role:'department_head',label:'real-ppa-create-edit-delete'});

    await page.goto(origin+'/planning-maps');
    await page.getByRole('button',{name:'Register Map Plate',exact:true}).click();
    form=page.getByRole('dialog');
    await form.getByLabel('Map Code',{exact:true}).fill(mapCode);
    await form.getByLabel('Map Title',{exact:true}).fill('Synthetic reference map');
    await form.getByLabel('Linked Plan Reference',{exact:true}).fill('Synthetic test reference');
    await form.getByRole('radio',{name:/Draft/}).check();
    await save('Save Planning Map');
    assert.ok((await props('/planning-maps')).planningMaps.find(record=>record.code===mapCode)?.dbId);
    await page.getByRole('button',{name:'Edit Synthetic reference map',exact:true}).click();
    form=page.getByRole('dialog');
    await form.getByLabel('Map Title',{exact:true}).fill('Synthetic reference map revised');
    await save('Save Map Changes');
    assert.equal((await props('/planning-maps')).planningMaps.find(record=>record.code===mapCode).title,'Synthetic reference map revised');
    await remove(mapCode);
    assert.equal((await props('/planning-maps')).planningMaps.some(record=>record.code===mapCode),false);
    interactions.push({role:'department_head',label:'real-map-create-edit-delete'});
}
