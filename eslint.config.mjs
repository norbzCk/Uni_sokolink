import eslint from '@eslint/js';
import nxPlugin from '@nx/eslint-plugin';
import tseslint from 'typescript-eslint';
const domains=['api-gateway','identity','seller','catalogue','inventory','commerce','payment','fulfilment','notifications'];
export default tseslint.config(
 {ignores:['**/dist/**','**/node_modules/**','**/.nx/**']},eslint.configs.recommended,...tseslint.configs.recommended,
 {files:['**/*.ts','**/*.tsx'],plugins:{'@nx':nxPlugin},languageOptions:{globals:{console:'readonly',document:'readonly',fetch:'readonly',process:'readonly',URL:'readonly'}},rules:{
  '@typescript-eslint/consistent-type-imports':'off','@typescript-eslint/no-explicit-any':'error','@typescript-eslint/no-unused-vars':['error',{argsIgnorePattern:'^_'}],
  '@nx/enforce-module-boundaries':['error',{enforceBuildableLibDependency:true,allow:[],depConstraints:[
   {sourceTag:'scope:shared',onlyDependOnLibsWithTags:['scope:shared']},
   {sourceTag:'scope:web',onlyDependOnLibsWithTags:['scope:web','scope:shared']},
   ...domains.map(scope=>({sourceTag:'scope:'+scope,onlyDependOnLibsWithTags:['scope:'+scope,'scope:shared']})),
  ]}]
 }});
