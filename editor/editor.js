const groups=[
  {name:'Introduction',description:'Your name, positioning and the first impression.',fields:['name','role','location','headline','intro','current']},
  {name:'Perspective',description:'Your story and the principles behind your work.',fields:['aboutTitle','about','vectors']},
  {name:'Expertise',description:'Explain where you can help, with a focused set of skills.',fields:['expertise']},
  {name:'Experience',description:'Add roles and reorder them with the most recent first.',fields:['experience','additionalExperience']},
  {name:'Projects',description:'Add public projects or short previews. Leave a project URL empty when there is no public link yet.',fields:['projects','projectsNote']},
  {name:'Writing',description:'Link to your published articles.',fields:['writing']},
  {name:'Credentials',description:'Education, qualifications and languages.',fields:['education','credentials','languages']},
  {name:'Contact & links',description:'Public contact details, canonical website address and the invitation to get in touch.',fields:['email','linkedin','github','siteUrl','contactTitle','contactText']}
];
const templates={about:'New paragraph',credentials:'New credential',skills:'New skill',tags:'New tag',highlights:'New highlight',vectors:{name:'New principle',description:'Why it matters.'},expertise:{title:'New expertise',description:'Describe the work.',skills:['New skill']},experience:{company:'Company',role:'Your role',period:'Start — end',summary:'Describe your contribution.',highlights:['Your responsibilities'],tags:['Focus']},projects:{name:'New project',subtitle:'A short introduction',status:'In development',description:'Describe the problem and your contribution.',focus:'Area of focus',url:'',linkLabel:'Explore the project'},writing:{title:'New article',topic:'Topic',publication:'Publication',url:'https://example.com/'}};
const labels={siteUrl:'Website URL',aboutTitle:'About heading',contactTitle:'Contact heading',contactText:'Contact invitation',projectsNote:'Note below projects',additionalExperience:'Additional experience',linkLabel:'Link label',current:'Current position',intro:'Introduction',headline:'Main headline'};
const longFields=new Set(['intro','about','headline','aboutTitle','contactTitle','contactText','summary','description','additionalExperience','projectsNote','highlights']);
let profile,revision,token,active=0,dirty=false,saving=false;
const form=document.getElementById('profile-form'), status=document.getElementById('status'), save=document.getElementById('save');
const title=key=>labels[key]||key.replace(/([A-Z])/g,' $1').replace(/^./,c=>c.toUpperCase());
const get=path=>path.reduce((obj,key)=>obj[key],profile);
function set(path,value){const parent=get(path.slice(0,-1));parent[path.at(-1)]=value;markDirty();}
function markDirty(){dirty=true;save.disabled=false;status.removeAttribute('data-error');status.textContent='Unsaved changes. Save to update the preview.';}
function element(tag,text,className){const node=document.createElement(tag);if(text)node.textContent=text;if(className)node.className=className;return node;}
function control(text,label,onClick,disabled=false){const b=element('button',text);b.type='button';b.setAttribute('aria-label',label);b.disabled=disabled;b.addEventListener('click',onClick);return b;}
function field(path,value){
  const key=typeof path.at(-1)==='number'?path.at(-2):path.at(-1);
  if(Array.isArray(value)){
    const wrap=element('section',null,'array-section');
    wrap.append(element('h3',title(key)));
    if(value.every(x=>typeof x==='string'))wrap.classList.add('small-list');
    value.forEach((item,i)=>{
      const box=element('div',null,'item'),head=element('div',null,'item-heading'),actions=element('div',null,'item-actions');
      const label=typeof item==='object'?item.name||item.company||item.title||`Item ${i+1}`:`${title(key)} ${i+1}`;
      head.append(element('strong',label));
      actions.append(control('↑',`Move ${label} up`,()=>{[value[i-1],value[i]]=[value[i],value[i-1]];markDirty();render();},i===0),control('↓',`Move ${label} down`,()=>{[value[i+1],value[i]]=[value[i],value[i+1]];markDirty();render();},i===value.length-1),control('Remove',`Remove ${label}`,()=>{value.splice(i,1);markDirty();render();}));
      head.append(actions);box.append(head);
      if(typeof item==='object'){for(const [k,v]of Object.entries(item))box.append(field([...path,i,k],v));}else box.append(field([...path,i],item));
      wrap.append(box);
    });
    const add=control(`+ Add ${title(key).toLowerCase()} item`,`Add ${title(key).toLowerCase()} item`,()=>{value.push(structuredClone(templates[key]??'New item'));markDirty();render();});add.className='add-item';wrap.append(add);return wrap;
  }
  const label=element('label',null,'field');const fullLabel=path.map(title).join(' / ');
  label.append(element('span',title(key)));
  const input=document.createElement(longFields.has(key)||String(value).length>130?'textarea':'input');
  input.value=value;input.setAttribute('aria-label',fullLabel);input.name=path.join('.');
  if(input.tagName==='INPUT') input.type=key==='email'?'email':(['url','linkedin','github','siteUrl'].includes(key)?'url':'text');
  input.required=key!=='url';
  if(input.tagName==='TEXTAREA')input.rows=Math.min(7,Math.max(2,Math.ceil(String(value).length/65)));
  input.addEventListener('input',()=>set(path,input.value));label.append(input);return label;
}
function render(){
  const group=groups[active];form.replaceChildren(element('h2',group.name),element('p',group.description));
  group.fields.forEach(key=>form.append(field([key],profile[key])));
  document.querySelectorAll('#sections button').forEach((button,i)=>{if(i===active)button.setAttribute('aria-current','page');else button.removeAttribute('aria-current');});
}
groups.forEach((g,i)=>{const button=control(g.name,g.name,()=>{active=i;render();});document.getElementById('sections').append(button);});
form.addEventListener('submit',async event=>{
  event.preventDefault();if(saving)return;saving=true;save.disabled=true;save.textContent='Saving…';
  try{
    const response=await fetch('/api/profile',{method:'POST',headers:{'Content-Type':'application/json','X-Edit-Token':token},body:JSON.stringify({profile,revision})});
    const result=await response.json();if(!response.ok)throw new Error(result.error||'Could not save.');
    revision=result.revision;profile.updated=result.updated;dirty=false;status.removeAttribute('data-error');status.textContent=result.message;
    document.querySelector('iframe').src='/?saved='+Date.now();
  }catch(error){status.textContent=error.message;status.setAttribute('data-error','');save.disabled=false;}
  finally{saving=false;save.textContent='Save changes';}
});
window.addEventListener('beforeunload',event=>{if(dirty){event.preventDefault();event.returnValue='';}});
try{const response=await fetch('/api/profile');if(!response.ok)throw new Error('Start the local editor with npm run edit.');const data=await response.json();({profile,revision,token}=data);render();status.textContent='Ready. Choose a section to edit.';}catch(error){status.textContent=error.message;status.setAttribute('data-error','');}
