import assert from 'node:assert/strict';
import test from 'node:test';
import { groupMapPins } from '../../resources/js/components/maps/groupMapPins.ts';
test('map targets group touching and coincident coordinates without losing record identity',()=>{
    const pins=[{id:'a',x:0,y:0},{id:'b',x:20,y:0},{id:'c',x:65,y:0},{id:'d',x:150,y:0},{id:'e',x:150,y:0}];
    assert.deepEqual(groupMapPins(pins,pin=>pin).map(group=>group.map(pin=>pin.id)),[['a','b','c'],['d','e']]);
    assert.deepEqual(groupMapPins([],pin=>pin),[]);
    assert.equal(groupMapPins([{x:0,y:0},{x:48,y:0}],pin=>pin).length,2);
});
