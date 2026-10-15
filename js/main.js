import {getState,update,replace,subscribe} from "./store.js";
import {makeId} from "./models.js";
import {formatMoney,evaluateExpression} from "./money.js";
import {todayStr,periodFor,formatDate,addDays} from "./dates.js";
import {spent,budgetStatus,safeToSpendToday} from "./budgets.js";

const app=document.querySelector("#app");let route=location.hash.slice(1)||"/";let modal=null;
const el=(tag,props={},...children)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(props)){if(k==="class")n.className=v;else if(k==="text")n.textContent=v;else if(k.startsWith("on"))n.addEventListener(k.slice(2).toLowerCase(),v);else n.setAttribute(k,v)}const append=child=>{if(Array.isArray(child)){child.forEach(append);return}n.append(child&&child.nodeType?child:document.createTextNode(child==null?"":child))};children.forEach(append);return n};
const state=()=>getState();const period=()=>periodFor(todayStr(),state().settings.monthStartDay);const cat=id=>state().categories.find(c=>c.id===id);const account=id=>state().accounts.find(a=>a.id===id);
function money(v){return formatMoney(v,{currency:state().settings.currency})}
function accountBalance(id){const s=state(),today=todayStr();return s.accounts.find(a=>a.id===id)?.openingBalance+s.transactions.filter(t=>t.date<=today&&(t.accountId===id||t.toAccountId===id)).reduce((total,t)=>{if(t.type==="income"&&t.accountId===id)return total+t.amount;if(t.type==="expense"&&t.accountId===id)return total-t.amount;if(t.type==="transfer")return total+(t.toAccountId===id?t.amount:t.accountId===id?-t.amount:0);return total},0)}
function button(text,fn,cls="btn"){return el("button",{class:`${cls}`,type:"button",onclick:fn,text})}
function navButton(label,path){return el("button",{class:`tab ${route===path?"active":""}`,onclick:()=>{location.hash=path},text:label})}
function budgetFor(categoryId){return state().budgets.find(b=>b.categoryId===categoryId)}
function budgetBar(limit,value){const status=budgetStatus(limit,value),bar=el("i");bar.style.setProperty("width",`${Math.min(100,status.percent)}%`);if(status.status==="over")bar.style.setProperty("background","var(--red)");return el("div",{class:"stack"},el("div",{class:"progress"},bar),el("div",{class:"row"},el("span",{class:"muted",text:`${status.percent}% used`}),el("span",{class:status.status==="over"?"negative":"muted",text:status.status==="over"?`Over by ${money(Math.abs(status.remaining))}`:`${money(Math.max(0,status.remaining))} left`})))}
function transactionRow(t){
  const c=cat(t.categoryId),to=account(t.toAccountId),from=account(t.accountId);
  const name=t.type==="transfer"?`Transfer to ${to?to.name:"account"}`:c?c.name:"Uncategorized";
  const amount=t.type==="income"?t.amount:-t.amount;
  return el("div",{class:"transaction row",role:"button",tabindex:"0",onclick:()=>openTransaction(t)},
    el("div",{class:"icon",text:c&&c.icon?c.icon.slice(0,1).toUpperCase():"T"}),
    el("div",{class:"transaction-main stack"},
      el("strong",{class:"truncate",text:name}),
      el("span",{class:"muted truncate",text:t.note||(from?from.name:"")})
    ),
    el("strong",{class:`money ${amount>=0?"positive":"negative"}`,text:`${amount>=0?"+":""}${money(amount)}`})
  );
}
function layout(content,title){const nav=[["Home","/"],["Activity","/transactions"],["Stats","/stats"],["Budgets","/budgets"],["Accounts","/accounts"],["Settings","/settings"]];return el("div",{class:"shell"},el("aside",{class:"sidebar"},el("div",{class:"brand",text:"Purrse"}),el("nav",{},...nav.map(([l,p])=>navButton(l,p)),button("+ Add transaction",()=>openTransaction(), "btn primary"))),el("main",{class:"main"},el("header",{class:"topbar"},el("div",{class:"brand",text:"Purrse"}),button("+ Add",()=>openTransaction(),"btn primary")),el("div",{class:"tabs"},...nav.slice(0,3).map(([l,p])=>navButton(l,p))),content),el("nav",{class:"bottom-nav"},navButton("Home","/"),navButton("Activity","/transactions"),button("+",()=>openTransaction(),"fab"),navButton("Stats","/stats"),navButton("More","/settings")))}
function dashboard(){const p=period(),s=state(),items=s.transactions.filter(t=>t.date>=p.start&&t.date<=p.end),income=items.filter(t=>t.type==="income").reduce((n,t)=>n+t.amount,0),expense=items.filter(t=>t.type==="expense").reduce((n,t)=>n+t.amount,0),net=s.accounts.reduce((n,a)=>n+accountBalance(a.id),0),overall=budgetFor(null),overallSpent=spent(s.transactions,null,p);return layout(el("div",{},el("h1",{text:"Good morning"}),el("p",{class:"muted",text:p.label}),el("section",{class:"card hero"},el("div",{class:"row"},el("div",{},el("span",{class:"badge",text:"Cat check"}),el("p",{class:"muted",text:expense?"Spending looks calm. Suspiciously calm.":"No entries yet. The cat is on snack break."})),el("div",{class:"cat",text:"~"})),el("div",{class:"hero-balance money",text:money(net)}),el("div",{class:"row"},el("div",{},el("span",{class:"muted",text:"Income"}),el("strong",{class:"positive money",text:money(income)})),el("div",{},el("span",{class:"muted",text:"Expense"}),el("strong",{class:"negative money",text:money(expense)})))),el("section",{class:"card stack"},el("div",{class:"row"},el("h2",{text:"Budget"}),button("Manage",()=>location.hash="/budgets","btn")),overall?el("div",{},budgetBar(overall.amount,overallSpent),el("p",{class:"muted",text:`Safe to spend today: ${money(safeToSpendToday(s.transactions,overall.amount,p,todayStr()))}`})):el("p",{class:"muted",text:"No budget set yet. The cat has no spreadsheet to wave around."}),!overall&&button("Set a budget",()=>openBudget(),"btn primary")),el("section",{class:"section-title"},el("h2",{text:"Accounts"}),button("Manage",()=>location.hash="/accounts","btn")),el("div",{class:"horizontal"},...s.accounts.filter(a=>!a.archived).map(a=>el("div",{class:"account-chip stack"},el("strong",{text:a.name}),el("span",{class:"money",text:money(accountBalance(a.id))})))),el("section",{class:"section-title"},el("h2",{text:"Recent activity"}),button("See all",()=>location.hash="/transactions","btn")),el("section",{class:"card"},items.slice(-6).reverse().length?items.slice(-6).reverse().map(transactionRow):el("div",{class:"empty"},el("div",{class:"cat",text:"o"}),el("p",{class:"muted",text:"Your money story starts with one entry."}),button("Add transaction",()=>openTransaction(),"btn primary")))));} 
function transactions(){let q="";const render=()=>{const s=state(),list=s.transactions.filter(t=>{const c=cat(t.categoryId);return !q||[t.note,c&&c.name,money(t.amount)].some(v=>String(v||"").toLowerCase().includes(q.toLowerCase()))}).sort((a,b)=>b.date.localeCompare(a.date));return layout(el("div",{},el("div",{class:"row"},el("div",{},el("h1",{text:"Activity"}),el("p",{class:"muted",text:`${list.length} transactions`})),button("+ Add",()=>openTransaction(),"btn primary")),el("input",{class:"input",placeholder:"Search notes, categories, amounts",type:"search",oninput:e=>{q=e.target.value;app.replaceChildren(render())}}),el("section",{class:"card"},list.length?list.map(transactionRow):el("div",{class:"empty"},el("div",{class:"cat",text:"o"}),el("p",{class:"muted",text:"No matching transactions."})))))};return render()}
function accounts(){
  const s=state();
  const rows=s.accounts.map(a=>el("div",{class:"transaction row"},
    el("div",{class:"transaction-main stack"},el("strong",{text:a.name}),el("span",{class:"muted",text:a.type})),
    el("strong",{class:"money",text:money(a.openingBalance)}),
    button("Edit",()=>openAccount(a),"btn")
  ));
  return layout(el("div",{},
    el("div",{class:"row"},el("h1",{text:"Accounts"}),button("+ Add account",()=>openAccount(),"btn primary")),
    el("section",{class:"card"},...rows)
  ));
}
function budgets(){
  const s=state(),p=period(),overall=budgetFor(null);
  const rows=s.categories.filter(c=>c.type==="expense"&&!c.archived).map(c=>{
    const b=budgetFor(c.id);
    return el("div",{class:"transaction stack"},
      el("div",{class:"row"},el("strong",{text:c.name}),b?button("Edit",()=>openBudget(b),"btn"):button("Add",()=>openBudget(null,c.id),"btn")),
      b?budgetBar(b.amount,spent(s.transactions,c.id,p)):el("span",{class:"muted",text:"No limit set"})
    );
  });
  return layout(el("div",{},
    el("div",{class:"row"},el("div",{},el("h1",{text:"Budgets"}),el("p",{class:"muted",text:p.label})),button("+ Add budget",()=>openBudget(),"btn primary")),
    el("section",{class:"card stack"},el("div",{class:"row"},el("h2",{text:"Overall"}),overall?button("Edit",()=>openBudget(overall),"btn"):button("Add",()=>openBudget(),"btn")),overall?budgetBar(overall.amount,spent(s.transactions,null,p)):el("p",{class:"muted",text:"Set an overall limit to see safe to spend."})),
    el("section",{class:"card stack"},el("h2",{text:"Category budgets"}),...rows)
  ));
}
function settings(){const s=state();return layout(el("div",{},el("h1",{text:"Settings"}),el("p",{class:"muted",text:"Everything stays in this browser."}),el("section",{class:"card stack"},el("h2",{text:"General"}),el("label",{class:"field"},el("span",{text:"Currency"}),el("select",{class:"input",value:s.settings.currency,onchange:e=>update(x=>x.settings.currency=e.target.value)},...["INR","USD","EUR","GBP","JPY"].map(c=>el("option",{value:c,text:c})))),el("label",{class:"field"},el("span",{text:"Month starts on"}),el("input",{class:"input",type:"number",min:"1",max:"28",value:s.settings.monthStartDay,onchange:e=>update(x=>x.settings.monthStartDay=Math.min(28,Math.max(1,Number(e.target.value)||1)))}))),el("section",{class:"card actions"},button("Export backup",exportJson,"btn"),button("Import backup",importJson,"btn"),button("Load sample data",sampleData,"btn"),button("Reset everything",()=>{if(confirm("Type DELETE in the next prompt to reset everything.")){const answer=prompt("Type DELETE");if(answer&&answer.toUpperCase()==="DELETE"){localStorage.removeItem("purrse_v1");location.reload()}}},"btn danger"))))}
function stats(){const s=state(),p=period(),items=s.transactions.filter(t=>t.date>=p.start&&t.date<=p.end),groups=new Map();items.filter(t=>t.type==="expense").forEach(t=>groups.set(t.categoryId,(groups.get(t.categoryId)||0)+t.amount));const max=Math.max(...groups.values(),1);const bars=Array.from(groups.entries()).sort((a,b)=>b[1]-a[1]).slice(0,5).map(([id,v])=>{const bar=el("i");bar.style.setProperty("width",`${Math.min(100,v/max*100)}%`);const category=cat(id);return el("div",{class:"stack"},el("div",{class:"row"},el("span",{text:category?category.name:"Other"}),el("strong",{class:"money",text:money(v)})),el("div",{class:"progress"},bar))});return layout(el("div",{},el("h1",{text:"Stats"}),el("p",{class:"muted",text:p.label}),el("div",{class:"grid stats-grid"},el("div",{class:"card stack"},el("span",{class:"muted",text:"Income"}),el("strong",{class:"positive money",text:money(items.filter(t=>t.type==="income").reduce((n,t)=>n+t.amount,0))})),el("div",{class:"card stack"},el("span",{class:"muted",text:"Expense"}),el("strong",{class:"negative money",text:money(items.filter(t=>t.type==="expense").reduce((n,t)=>n+t.amount,0))}))),el("h2",{class:"section-title",text:"Top categories"}),el("section",{class:"card stack"},...bars)))}
function render(){const view=route==="/transactions"?transactions():route==="/accounts"?accounts():route==="/settings"?settings():route==="/stats"?stats():route==="/budgets"?budgets():dashboard();app.replaceChildren(view);if(!state().settings.onboarded)openOnboarding()}
function openOnboarding(){if(modal)return;const name=el("input",{class:"input",placeholder:"Your first account",value:"Cash"});showModal("Welcome to Purrse",el("div",{class:"stack"},el("p",{class:"muted",text:"Money tracking with a cat that has opinions. Your data stays on this device."}),el("label",{class:"field"},el("span",{text:"Account name"}),name),button("Start tracking",()=>{update(s=>{s.accounts[0].name=name.value.trim()||"Cash";s.settings.onboarded=true});closeModal()},"btn primary")))}
function showModal(title,body){modal=el("div",{class:"modal-backdrop",onclick:e=>{if(e.target===modal)closeModal()}},el("div",{class:"modal",role:"dialog","aria-modal":"true"},el("div",{class:"row"},el("h2",{text:title}),button("Close",closeModal,"btn")),body));document.body.append(modal)}
function closeModal(){if(modal)modal.remove();modal=null}
function openAccount(a){const name=el("input",{class:"input",value:a?a.name:""}),opening=el("input",{class:"input",type:"number",value:a&&a.openingBalance?a.openingBalance/100:0});showModal(a?"Edit account":"Add account",el("div",{class:"stack"},el("label",{class:"field"},el("span",{text:"Name"}),name),el("label",{class:"field"},el("span",{text:"Opening balance"}),opening),button("Save",()=>{if(!name.value.trim())return;update(s=>{if(a){a.name=name.value.trim();a.openingBalance=Math.round(Number(opening.value||0)*100)}else s.accounts.push({id:makeId(),name:name.value.trim(),type:"other",openingBalance:Math.round(Number(opening.value||0)*100),archived:false})});closeModal()},"btn primary")))}
function openBudget(existing,categoryId=null){const categories=[{id:null,name:"Overall"},...state().categories.filter(c=>c.type==="expense"&&!c.archived)],selected=el("select",{class:"input"},...categories.map(c=>el("option",{value:c.id===null?"":c.id,text:c.name}))),amount=el("input",{class:"input",type:"number",min:"0.01",step:"0.01",placeholder:"0.00",value:existing?existing.amount/100:""});selected.value=existing&&existing.categoryId!==null?existing.categoryId:categoryId||"";showModal(existing?"Edit budget":"Add budget",el("div",{class:"stack"},el("label",{class:"field"},el("span",{text:"Budget"}),selected),el("label",{class:"field"},el("span",{text:"Monthly limit"}),amount),el("div",{class:"actions"},existing&&button("Delete",()=>{update(s=>{s.budgets=s.budgets.filter(b=>b!==existing)});closeModal()},"btn danger"),button("Save",()=>{const value=Number(amount.value);if(!Number.isFinite(value)||value<=0)return;update(s=>{const category=selected.value||null;const found=existing||s.budgets.find(b=>b.categoryId===category);if(found)found.amount=Math.round(value*100);else s.budgets.push({id:makeId(),categoryId:category,amount:Math.round(value*100)})});closeModal()},"btn primary"))))}
function openTransaction(t){
  const activeAccounts=state().accounts.filter(a=>!a.archived);
  const type=el("select",{class:"input"},...["expense","income","transfer"].map(v=>el("option",{value:v,text:v[0].toUpperCase()+v.slice(1)})));
  if(t)type.value=t.type;
  const amount=el("input",{class:"input",inputmode:"decimal",placeholder:"0.00",value:t?String(t.amount/100):""});
  const date=el("input",{class:"input",type:"date",value:t?t.date:todayStr()});
  const note=el("input",{class:"input",maxlength:"200",placeholder:"Optional note",value:t?t.note:""});
  const accountSelect=el("select",{class:"input"},...activeAccounts.map(a=>el("option",{value:a.id,text:a.name})));
  const toAccountSelect=el("select",{class:"input"},...activeAccounts.map(a=>el("option",{value:a.id,text:a.name})));
  const categorySelect=el("select",{class:"input"});
  if(t){accountSelect.value=t.accountId;if(t.toAccountId)toAccountSelect.value=t.toAccountId}
  if(t&&t.categoryId)categorySelect.value=t.categoryId;
  const category=el("label",{class:"field"},el("span",{text:"Category"}),categorySelect);
  const destination=el("label",{class:"field"},el("span",{text:"To account"}),toAccountSelect);
  const error=el("div",{class:"error"});
  const syncFields=()=>{
    const isTransfer=type.value==="transfer";
    const options=state().categories.filter(c=>c.type===type.value&&!c.archived);
    categorySelect.replaceChildren(...options.map(c=>el("option",{value:c.id,text:c.name})));
    category.hidden=isTransfer;
    categorySelect.disabled=isTransfer;
    destination.hidden=!isTransfer;
    toAccountSelect.disabled=!isTransfer;
    if(t&&t.categoryId&&!isTransfer)categorySelect.value=t.categoryId;
  };
  type.addEventListener("change",syncFields);
  syncFields();
  showModal(t?"Edit transaction":"Add transaction",el("form",{class:"stack",onsubmit:e=>{
    e.preventDefault();
    const result=evaluateExpression(amount.value);
    if(result===null||result<=0||result>999999999.99){error.textContent="Enter a valid amount.";return}
    if(type.value==="transfer"&&accountSelect.value===toAccountSelect.value){error.textContent="Choose two different accounts for a transfer.";return}
    update(s=>{
      const selected=s.categories.find(c=>c.type===type.value&&!c.archived);
      const data={type:type.value,amount:Math.round(result*100),date:date.value,accountId:accountSelect.value,categoryId:type.value==="transfer"?null:(categorySelect.value||(selected?selected.id:null)),toAccountId:type.value==="transfer"?toAccountSelect.value:null,note:note.value.trim(),tags:t&&t.tags?t.tags:[],createdAt:t?t.createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};
      if(t)Object.assign(t,data);else s.transactions.push({id:makeId(),...data});
    });
    closeModal();
  }},el("label",{class:"field"},el("span",{text:"Type"}),type),el("label",{class:"field"},el("span",{text:"Amount"}),amount),error,el("label",{class:"field"},el("span",{text:"Account"}),accountSelect),category,destination,el("label",{class:"field"},el("span",{text:"Date"}),date),el("label",{class:"field"},el("span",{text:"Note"}),note),el("div",{class:"actions"},t&&button("Delete",()=>{if(confirm("Delete this transaction?")){update(s=>{s.transactions=s.transactions.filter(item=>item!==t)});closeModal()}},"btn danger"),button("Cancel",closeModal,"btn"),el("button",{class:"btn primary",type:"submit",text:"Save"}))));
}
function exportJson(){const blob=new Blob([JSON.stringify({app:"purrse",version:1,exportedAt:new Date().toISOString(),data:state()},null,2)],{type:"application/json"}),a=el("a",{href:URL.createObjectURL(blob),download:`purrse-backup-${todayStr()}.json`});a.click();URL.revokeObjectURL(a.href);update(s=>s.settings.lastBackupAt=new Date().toISOString())}
function importJson(){
  const input=el("input",{type:"file",accept:"application/json,.json"});
  input.addEventListener("change",async()=>{
    const file=input.files&&input.files[0];
    if(!file)return;
    if(file.size>5*1024*1024){showToast("That backup is too large.");return}
    try{
      const payload=JSON.parse(await file.text()),incoming=payload&&payload.data;
      if(payload.app!=="purrse"||payload.version>1||!incoming||!Array.isArray(incoming.transactions)||!Array.isArray(incoming.accounts)||!Array.isArray(incoming.categories))throw new Error("This is not a valid Purrse backup.");
      const mode=prompt(`Backup found: ${incoming.transactions.length} transactions. Type MERGE or REPLACE.`);
      if(!mode)return;
      if(mode.toUpperCase()==="REPLACE"){replace(incoming);showToast("Backup restored.");return}
      if(mode.toUpperCase()!=="MERGE"){showToast("Import cancelled.");return}
      update(current=>{
        for(const key of ["accounts","categories","transactions","budgets"]){
          const existing=new Set((current[key]||[]).map(item=>item.id));
          for(const item of incoming[key]||[])if(item&&item.id&&!existing.has(item.id))current[key].push(item);
        }
        current.settings={...current.settings,...(incoming.settings||{})};
      });
      showToast("Backup merged.");
    }catch(error){showToast(error.message||"Could not import that backup.");}
  });
  input.click();
}
function sampleData(){update(s=>{const a=s.accounts[0],food=s.categories.find(c=>c.name==="Food"&&c.type==="expense"),salary=s.categories.find(c=>c.name==="Salary");s.transactions.push({id:makeId(),type:"income",amount:150000,date:todayStr(),accountId:a.id,categoryId:salary.id,note:"Monthly salary",tags:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()},{id:makeId(),type:"expense",amount:4500,date:addDays(todayStr(),-1),accountId:a.id,categoryId:food.id,note:"Lunch",tags:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()})})}
window.addEventListener("hashchange",()=>{route=location.hash.slice(1)||"/";render()});subscribe(e=>{if(e.type==="change")render();if(e.type==="storage-error")showToast("Storage is full. Export a backup now.")});function showToast(text){const t=el("div",{class:"toast",text});document.body.append(t);setTimeout(()=>t.remove(),4000)}render();
