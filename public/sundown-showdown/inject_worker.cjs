const fs = require('fs');

const htmlPath = 'index.html';
let code = fs.readFileSync(htmlPath, 'utf8');

// Ensure we strip the previous injection cleanly
if (code.includes('// WORKER_INJECTED')) {
    const startIdx = code.indexOf('// WORKER_INJECTED');
    const workerEnd = code.indexOf('throw new Error("Worker spawned successfully. Halting main thread engine execution.");\n    }\n}\n');
    if (workerEnd !== -1) {
        code = code.substring(0, code.lastIndexOf('<script>\n') + 9) + code.substring(workerEnd + 93);
    }
}

const workerInject = `// WORKER_INJECTED
if (typeof window === 'undefined') {
    self.window = self;
    self.innerWidth = 1920;
    self.innerHeight = 1080;
    self.devicePixelRatio = 1;
    self._listeners = {};
    self.addEventListener = (e, cb) => {
        if (!self._listeners[e]) self._listeners[e] = [];
        self._listeners[e].push(cb);
    };
    self.matchMedia = () => ({matches: false});
    
    let _canvas = null;
    let _nextId = 1;
    let _allNodes = [];
    class MockNode {
        constructor(id, tag) {
            this.id = id || ('n_' + _nextId++);
            this.tagName = tag;
            _allNodes.push(this);
            this._classes = new Set();
            this.style = new Proxy({
                setProperty: (k, v) => postMessage({type:'styleProp', id: this.id, k, v})
            }, { 
                get: (o, p) => o[p],
                set: (o, p, v) => { postMessage({type:'style', id: this.id, prop: p, val: v}); o[p]=v; return true; } 
            });
            this.classList = { 
                add: (c)=> { this._classes.add(c); postMessage({type:'classAdd', id: this.id, c}); }, 
                remove: (c)=> { this._classes.delete(c); postMessage({type:'classRemove', id: this.id, c}); }, 
                toggle: (c, f)=> { 
                    let force = f !== undefined ? f : !this._classes.has(c);
                    if (force) this._classes.add(c); else this._classes.delete(c);
                    postMessage({type:'classToggle', id: this.id, c, force}); 
                },
                contains: (c)=>this._classes.has(c)
            };
            this.dataset = {};
            this.children = [];
            this._innerHTML = '';
            this._nodeListeners = {};
        }
        setAttribute(k,v) { 
            if (k.startsWith('data-')) this.dataset[k.substring(5)] = v;
            postMessage({type:'attr', id: this.id, k, v}); 
        }
        removeAttribute(k) { postMessage({type:'removeAttr', id: this.id, k}); }
        appendChild(child) { this.children.push(child); postMessage({type:'append', id: this.id, childId: child.id}); }
        remove() { postMessage({type:'remove', id: this.id}); }
        querySelector(sel) { 
            let c = new MockNode(null, 'div'); 
            postMessage({type:'querySelector', id: this.id, sel, childId: c.id}); 
            return c; 
        }
        querySelectorAll(sel) { 
            let arr = [new MockNode(null, 'b'), new MockNode(null, 'b'), new MockNode(null, 'b'), new MockNode(null, 'b'), new MockNode(null, 'b'), new MockNode(null, 'b')];
            postMessage({type:'querySelectorAll', id: this.id, sel, childIds: arr.map(c=>c.id)});
            return arr; 
        }
        addEventListener(e, cb) { 
            if (!this._nodeListeners[e]) this._nodeListeners[e] = [];
            this._nodeListeners[e].push(cb);
        }
        get innerHTML() { return this._innerHTML; }
        set innerHTML(v) { this._innerHTML = v; postMessage({type:'innerHTML', id: this.id, val: v}); }
        set textContent(v) { postMessage({type:'textContent', id: this.id, val: v}); }
        get className() { return Array.from(this._classes).join(' '); }
        set className(v) { 
            this._classes.clear(); 
            if (v) v.split(' ').forEach(c => c && this._classes.add(c)); 
            postMessage({type:'className', id: this.id, val: v}); 
        }
        get clientWidth() { return 1920; }
        get clientHeight() { return 1080; }
    }
    
    self.document = {
        readyState: 'loading',
        hidden: false,
        createElement: (tag) => {
            if (tag === 'canvas') return new OffscreenCanvas(256, 256);
            let n = new MockNode(null, tag);
            postMessage({type:'create', id: n.id, tag});
            return n;
        },
        getElementById: (id) => {
            if (id === 'game') return _canvas;
            let existing = _allNodes.find(n => n.id === id);
            if (existing) return existing;
            return new MockNode(id, 'div');
        },
        querySelectorAll: (sel) => {
            if (sel.includes('.card')) return _allNodes.filter(n => n._classes.has('card'));
            if (sel.includes('button')) return _allNodes.filter(n => n.tagName === 'button' || n.tagName === 'BUTTON');
            return [];
        },
        querySelector: () => new MockNode(null, 'div'),
        addEventListener: (e, cb) => self.addEventListener(e, cb),
        body: new MockNode('body', 'body')
    };

    self.onmessage = (e) => {
        if (e.data.type === 'init') {
            _canvas = e.data.canvas;
            _canvas.style = self.document.getElementById('game').style;
            self.innerWidth = e.data.w;
            self.innerHeight = e.data.h;
            self.devicePixelRatio = e.data.dpr;
            self.document.readyState = 'complete';
            if (self._listeners['DOMContentLoaded']) self._listeners['DOMContentLoaded'].forEach(cb=>cb());
        } else if (e.data.type === 'event') {
            const ev = e.data.ev;
            const name = e.data.name;
            if (self._listeners[name]) self._listeners[name].forEach(cb => cb(ev));
            if (ev.pathIds) {
                _allNodes.forEach(node => {
                    if (ev.pathIds.includes(node.id) && node._nodeListeners[name]) {
                        node._nodeListeners[name].forEach(cb => cb(ev));
                    }
                });
            }
        } else if (e.data.type === 'eval') {
            try { postMessage({type:'evalResult', reqId: e.data.reqId, res: eval(e.data.code)}); }
            catch(err) { postMessage({type:'evalResult', reqId: e.data.reqId, err: err.toString()}); }
        }
    };
} else {
    if (!window.__workerSpawned) {
        window.__workerSpawned = true;
        const scriptText = document.querySelector('script').textContent;
        const blob = new Blob([scriptText], {type: 'application/javascript'});
        const worker = new Worker(URL.createObjectURL(blob));
        
        window.addEventListener('DOMContentLoaded', () => {
            const canvas = document.getElementById('game');
            const offscreen = canvas.transferControlToOffscreen();
            worker.postMessage({ type: 'init', canvas: offscreen, w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio }, [offscreen]);
            
            const nodes = new Map();
            const getEl = (id) => nodes.get(id) || document.getElementById(id);
            worker.onmessage = (e) => {
                const d = e.data;
                if (d.type === 'create') { nodes.set(d.id, document.createElement(d.tag)); }
                else {
                    const el = getEl(d.id);
                    if (!el) return;
                    if (d.type === 'style') el.style[d.prop] = d.val;
                    else if (d.type === 'styleProp') el.style.setProperty(d.k, d.v);
                    else if (d.type === 'classAdd') el.classList.add(d.c);
                    else if (d.type === 'classRemove') el.classList.remove(d.c);
                    else if (d.type === 'classToggle') el.classList.toggle(d.c, d.f);
                    else if (d.type === 'className') el.className = d.val;
                    else if (d.type === 'append') { let c = getEl(d.childId); if(c) el.appendChild(c); }
                    else if (d.type === 'remove') el.remove();
                    else if (d.type === 'innerHTML') el.innerHTML = d.val;
                    else if (d.type === 'textContent') el.textContent = d.val;
                    else if (d.type === 'attr') el.setAttribute(d.k, d.v);
                    else if (d.type === 'removeAttr') el.removeAttribute(d.k);
                    else if (d.type === 'querySelector') { let c = el.querySelector(d.sel); if(c) nodes.set(d.childId, c); }
                    else if (d.type === 'querySelectorAll') { 
                        const els = Array.from(el.querySelectorAll(d.sel));
                        d.childIds.forEach((cid, idx) => { if (els[idx]) nodes.set(cid, els[idx]); });
                    }
                }
            };
            
            window.__worker = worker;
            window.workerEval = (code) => {
                return new Promise((resolve) => {
                    const reqId = Math.random();
                    const handler = (e) => {
                        if (e.data.type === 'evalResult' && e.data.reqId === reqId) {
                            worker.removeEventListener('message', handler);
                            resolve(e.data.err ? "ERROR: " + e.data.err : e.data.res);
                        }
                    };
                    worker.addEventListener('message', handler);
                    worker.postMessage({type:'eval', reqId, code});
                });
            };
            
            const fw = (name, ev) => {
                let pathIds = [];
                let cur = ev.target;
                while (cur && cur !== document) {
                    if (cur.id) pathIds.push(cur.id);
                    // Match dynamically created nodes by checking if they are in nodes map (by identity)
                    for (let [nid, nel] of nodes.entries()) {
                        if (nel === cur) pathIds.push(nid);
                    }
                    cur = cur.parentNode;
                }
                worker.postMessage({type:'event', name, ev: {
                    pointerId: ev.pointerId, clientX: ev.clientX, clientY: ev.clientY, pointerType: ev.pointerType, button: ev.button,
                    key: ev.key, code: ev.code, pathIds,
                    preventDefault: () => {}
                }});
            };
            ['pointerdown','pointermove','pointerup','click','contextmenu'].forEach(name => window.addEventListener(name, fw));
            ['keydown','keyup'].forEach(name => window.addEventListener(name, fw));
            window.addEventListener('resize', () => fw('resize', {target: document}));
            
            setTimeout(() => {
               const l = document.getElementById('loading');
               if (l) l.classList.add('done');
            }, 500);
        });
        
        throw new Error("Worker spawned successfully. Halting main thread engine execution.");
    }
}
// --- END MULTI-THREADING INJECT ---
`;

code = code.replace('<script>', '<script>\n' + workerInject);
fs.writeFileSync(htmlPath, code);
console.log("Worker architecture injected successfully!");
