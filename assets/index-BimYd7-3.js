import{b as o,d as s,w as a}from"./style-B7s6os18.js";import{m as i}from"./dayjs.min-D0rMPtc7.js";import{B as u,z as c,u as d}from"./vue-vendor-CPL9WsH-.js";const r={prefix:Math.floor(Math.random()*1e4),current:0},I=Symbol("elIdInjection"),p=()=>u()?c(I,r):r,b=n=>{const e=p();!o&&e===r&&s("IdInjection",`Looks like you are using server rendering, you must provide a id provider to ensure the hydration process to be succeed
usage: app.provide(ID_INJECTION_KEY, {
  prefix: number,
  current: number,
})`);const t=i();return a(()=>d(n)||`${t.value}-id-${e.prefix}-${e.current++}`)};export{p as a,b as u};
