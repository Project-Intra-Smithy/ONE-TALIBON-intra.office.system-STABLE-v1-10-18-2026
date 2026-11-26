import fs from 'node:fs';
import assert from 'node:assert/strict';
import { chromium } from 'playwright';
import { execFileSync } from 'node:child_process';
import { verifyMunicipalTabs } from './municipal-tab-assertions.mjs';
const origin = process.env.PHASE_A_PREVIEW_URL || 'http://127.0.0.1:4174', out = process.env.PHASE_A_CORRECTIVE_OUTPUT || 'storage/app/qa/municipal-corrective';
fs.mkdirSync(out, { recursive: true });
const sourceSha = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(), initialDirty = Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim());
let completed = false;
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 320, height: 900 } }), checks = [];
try {
    for (const width of [320, 768, 1440])
        for (const theme of ['light', 'dark'])
            for (const forcedColors of ['none', 'active']) {
                await page.setViewportSize({ width, height: 900 });
                await page.emulateMedia({ colorScheme: theme, forcedColors, reducedMotion: 'reduce' });
                await page.goto(origin + '/procurement');
                await page.getByRole('tablist', { name: 'Procurement views' }).waitFor();
                checks.push(await verifyMunicipalTabs(page, page.getByRole('tablist', { name: 'Procurement views' })));
                await page.getByRole('tab', { name: 'Overview', exact: true }).click();
                await page.getByRole('button').filter({ hasText: 'PR-2026-014' }).first().click();
                await page.getByRole('dialog').waitFor();
                checks.push(await verifyMunicipalTabs(page, page.getByRole('dialog').getByRole('tablist')));
                await page.keyboard.press('Escape');
                for (const [id, record, group] of [['FUT-02', 'BL-2026-001', null], ['FUT-05', 'BLD-2026-011', 'Building permit case signals'], ['FUT-07', 'CR-2026-041', 'Citizen desk operational summary'], ['FUT-10', 'AST-2026-001', null], ['FUT-12', 'FLT-2026-001', null], ['FUT-15', 'KNW-2026-001', 'Knowledge workspace signals']]) {
                    await page.goto(origin + '/municipal-systems');
                    await page.getByRole('button', { name: /^Open preview for / }).first().waitFor();
                    await page.getByRole('main').getByRole('button').filter({ hasText: id }).first().click();
                    if (group)
                        assert.equal(await page.getByRole('group', { name: group, exact: true }).count(), 1);
                    checks.push({ system: id, ...await verifyMunicipalTabs(page, page.locator('main [role=tablist]').first()) });
                    if (id === 'FUT-05')
                        await page.getByRole('tab', { name: 'Applications', exact: true }).click();
                    await page.getByRole('main').getByRole('button').filter({ hasText: record }).first().click();
                    await page.getByRole('dialog').waitFor();
                    const list = page.getByRole('dialog').getByRole('tablist');
                    if (await list.count())
                        checks.push({ system: id, ...await verifyMunicipalTabs(page, list) });
                    await page.keyboard.press('Escape');
                }
                checks.push({ matrixState: { width, theme, forcedColors }, capture: `municipal-${width}-${theme}-${forcedColors}.png` });
                await page.screenshot({ path: out + `/municipal-${width}-${theme}-${forcedColors}.png`, fullPage: true });
            }
    assert.equal(checks.filter(c => c.panelAssociations).length, 156);
    assert.equal(checks.filter(c => c.matrixState).length, 12);
    completed = true;
}
finally {
    await browser.close();
    fs.writeFileSync(out + '/results.json', JSON.stringify({ sourceSha, sourceWorktreeDirty: initialDirty || Boolean(execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim()) || execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim() !== sourceSha, completed, passed: completed, runtime: 'isolated preview; synthetic fixture data only', checks }, null, 2));
}
