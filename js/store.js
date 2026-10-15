import {defaults} from "./models.js";
const KEY="purrse_v1";let state;const listeners=new Set();let timer;
function load(){try{const raw=localStorage.getItem(KEY);state=raw?JSON.parse(raw):defaults()}catch{state=defaults()}return state}
export function getState(){return state||(state=load())}
export function save(){try{localStorage.setItem(KEY,JSON.stringify(state))}catch{listeners.forEach(fn=>fn({type:"storage-error"}))}}
export function update(fn){fn(state);clearTimeout(timer);timer=setTimeout(save,250);listeners.forEach(fn=>fn({type:"change"}))}
export function subscribe(fn){listeners.add(fn);return()=>listeners.delete(fn)}
export function replace(next){state=next;save();listeners.forEach(fn=>fn({type:"change"}))}
window.addEventListener("storage",e=>{if(e.key===KEY&&e.newValue){try{state=JSON.parse(e.newValue);listeners.forEach(fn=>fn({type:"change"}))}catch{}}});
window.addEventListener("pagehide",save);getState();
