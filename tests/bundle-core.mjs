import ts from 'typescript';
import fs from 'node:fs';
fs.mkdirSync('work',{recursive:true});
for(const name of ['scenario','copilot','snapshot-validation','simulation','session','evidence-store','admin']){
 const code=ts.transpileModule(fs.readFileSync(`lib/${name}.ts`,'utf8'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.ESNext}}).outputText.replace(/from '\.\/(scenario|snapshot-validation)'/g,"from './$1.mjs'");
 fs.writeFileSync(`work/${name}.mjs`,code);
}
fs.writeFileSync('work/core.mjs',"export * from './scenario.mjs';export * from './copilot.mjs';export * from './snapshot-validation.mjs';");
