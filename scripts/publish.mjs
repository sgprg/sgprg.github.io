import { spawnSync } from 'node:child_process';
import { root, build } from './build.mjs';

function run(command,args,capture=false){
  const result=spawnSync(command,args,{cwd:root,encoding:'utf8',stdio:capture?'pipe':'inherit',shell:false});
  if(result.error)throw result.error;
  if(result.status!==0)throw new Error(`${command} ${args[0]} failed. No force push was attempted.`);
  return result.stdout?.trim()??'';
}
try{
  const remote=run('git',['remote','get-url','origin'],true);
  if(!['https://github.com/sgprg/sgprg.github.io.git','https://github.com/sgprg/sgprg.github.io','git@github.com:sgprg/sgprg.github.io.git'].includes(remote))throw new Error('Origin must be the sgprg/sgprg.github.io repository.');
  if(run('git',['branch','--show-current'],true)!=='main')throw new Error('Publish from main after reviewing and merging your changes.');
  if(run('git',['diff','--cached','--name-only'],true))throw new Error('There are already staged changes. Commit or unstage them before publishing profile content.');
  const allowed=['content/profile.json','public/assets/sergey-goncharov.jpg'];
  const changed=run('git',['diff','--name-only'],true).split('\n').filter(Boolean);
  if(changed.some(file=>!allowed.includes(file)))throw new Error('Code or other tracked files have changed. Review and commit them separately before publishing profile content.');
  run('git',['fetch','origin','main']);
  if(Number(run('git',['rev-list','--count','HEAD..origin/main'],true))>0)throw new Error('GitHub has newer commits. Save your work, pull the latest changes, then retry.');
  run(process.execPath,['--test']);
  await build();
  if(changed.length){run('git',['add','--',...changed]);run('git',['commit','-m','Update biography content']);}
  run('git',['push','origin','HEAD:main']);
  console.log('Pushed. GitHub Actions will validate and publish the site.');
  console.log('Deployment status: https://github.com/sgprg/sgprg.github.io/actions');
}catch(error){console.error(error.message);process.exitCode=1;}
