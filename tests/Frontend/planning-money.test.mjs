import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import ts from 'typescript';
const source=readFileSync(new URL('../../resources/js/lib/planningMoney.ts',import.meta.url),'utf8');
const compiled=ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText;
const {planningAmount,planningTotal}=await import('data:text/javascript;base64,'+Buffer.from(compiled).toString('base64'));
test('Planning monetary display preserves exact cents, large amounts, zero and unknown values',()=>{
    assert.equal(planningAmount('9999999999999.99'),'₱9,999,999,999,999.99');
    assert.equal(planningAmount('0.00'),'₱0.00');
    assert.equal(planningAmount(null),'Not supplied');
    assert.equal(planningTotal(['0.10','0.20','']),'₱0.30');
    assert.equal(planningTotal(['','','']),'Not supplied');
    assert.equal(planningTotal(['9999999999999.98','0.01']),'₱9,999,999,999,999.99');
    assert.equal(planningTotal(['9999999999999.99','9999999999999.99']),'₱19,999,999,999,999.98');
    assert.equal(planningAmount('0.001'),'Invalid amount');
    assert.equal(planningTotal(['1e3']),'Invalid amount');
});
