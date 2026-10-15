export const todayStr=()=>{const d=new Date();return dateStr(d)};
export const dateStr=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
export const parseDate=s=>{const [y,m,d]=s.split("-").map(Number);return new Date(y,m-1,d)};
export const addDays=(s,n)=>{const d=parseDate(s);d.setDate(d.getDate()+n);return dateStr(d)};
export const formatDate=(s,style="long")=>parseDate(s).toLocaleDateString(undefined,style==="short"?{month:"short",day:"numeric"}:{month:"long",day:"numeric",year:"numeric"});
export const daysInMonth=(y,m)=>new Date(y,m,0).getDate();
export function periodFor(s,start=1){const d=parseDate(s);let y=d.getFullYear(),m=d.getMonth();if(d.getDate()<start)m--;const from=new Date(y,m,start);const to=new Date(y,m+1,start-1);return {key:`${from.getFullYear()}-${String(from.getMonth()+1).padStart(2,"0")}`,start:dateStr(from),end:dateStr(to),label:start===1?from.toLocaleDateString(undefined,{month:"long",year:"numeric"}):`${formatDate(dateStr(from),"short")} to ${formatDate(dateStr(to),"short")}`}};
export const daysLeft=(s,p)=>Math.max(1,Math.ceil((parseDate(p.end)-parseDate(s))/86400000)+1);
