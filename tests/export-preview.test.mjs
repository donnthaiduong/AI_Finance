import test from 'node:test';
import assert from 'node:assert/strict';
import { exportSection, EXPORT_SECTION_CHARACTERS as size } from '../work/export-preview.mjs';

function roundTrip(text) {
  const count=exportSection(text,0).count;
  const parts=Array.from({length:count},(_,i)=>exportSection(text,i));
  assert.equal(parts.map(p=>p.text).join(''),text);
  for(const p of parts) assert.ok(p.text.length<=size+1);
  return parts;
}
test('small and empty exports retain complete text; page indices are bounded',()=>{
  assert.deepEqual(exportSection('',0),{index:0,count:1,text:''});
  assert.equal(exportSection('{"a":1}',999).text,'{"a":1}');
  const text='a'.repeat(size+10);
  assert.equal(exportSection(text,-1).index,0);
  assert.equal(exportSection(text,Infinity).index,0);
  assert.equal(exportSection(text,999).index,1);
  roundTrip(text);
});
test('UTF-16 sections preserve surrogate pairs at boundaries and byte fidelity',()=>{
  const text='a'.repeat(size-1)+'😀'+'b'.repeat(size-2)+'😀';
  const parts=roundTrip(text);
  for(const p of parts) assert.equal(p.text.isWellFormed(),true);
  assert.deepEqual(Buffer.concat(parts.map(p=>Buffer.from(p.text))),Buffer.from(text));
});
test('32 MiB Unicode export remains recoverable with bounded DOM sections',()=>{
  const text='😀界\n'.repeat(Math.floor(32*1024*1024/8));
  const parts=roundTrip(text);
  assert.deepEqual(Buffer.concat(parts.map(p=>Buffer.from(p.text))),Buffer.from(text));
});
