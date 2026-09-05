import{w as o,d as s,I as a}from"./style-54Ihx-1X.js";import{n as i}from"./dayjs.min-BKuFKgGz.js";import{A as u,y as c,u as d}from"./vue-vendor-c7x-_rhk.js";const r={prefix:Math.floor(Math.random()*1e4),current:0},I=Symbol("elIdInjection"),p=()=>u()?c(I,r):r,g=n=>{const e=p();!o&&e===r&&s("IdInjection",`Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);const t=i();return a(()=>d(n)||`${t.value}-id-${e.prefix}-${e.current++}`)};export{p as a,g as u};
