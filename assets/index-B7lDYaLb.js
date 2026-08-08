import{f as o,h as s,z as a}from"./style-Bt7EpKeo.js";import{p as i}from"./dayjs.min-Kqh5CKV8.js";import{B as u,z as c,u as d}from"./vue-vendor-D1W2UyFa.js";const r={prefix:Math.floor(Math.random()*1e4),current:0},p=Symbol("elIdInjection"),I=()=>u()?c(p,r):r,g=n=>{const e=I();!o&&e===r&&s("IdInjection",`Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);const t=i();return a(()=>d(n)||`${t.value}-id-${e.prefix}-${e.current++}`)};export{I as a,g as u};
