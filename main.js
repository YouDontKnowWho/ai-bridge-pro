/* global entrypoints */
(function(){
  function injectStyles(){
    try {
      const css = `body { margin: 0; font-family: system-ui, -apple-system, sans-serif; color: #ddd; }
      .panel { padding: 8px; }
      .row { display: flex; gap: 8px; align-items: center; }
      textarea { width: 100%; height: 90px; }
      .tabs { display: flex; gap: 8px; margin-bottom: 8px; }
      .tab { padding: 6px 10px; border: 1px solid #444; cursor: pointer; }
      .tab.active { background: #333; }
      .scroll { overflow: auto; max-height: 380px; border: 1px solid #333; padding: 6px; }
      .badge { font-size: 12px; background:#444; padding:2px 6px; border-radius: 4px; }
      .list-item { border-bottom:1px dotted #444; padding: 6px 0; }`;
      const s = document.createElement('style'); s.textContent = css; document.head.appendChild(s);
    } catch {}
  }

  function loadBundleOnce(){
    if (document.getElementById('aibp-bundle')) return;
    const script = document.createElement('script');
    script.id = 'aibp-bundle';
    script.src = 'dist/bundle.js';
    document.body.appendChild(script);
  }

  if (typeof entrypoints !== 'undefined' && entrypoints?.setup){
    entrypoints.setup({
      panels: {
        'ai-bridge-pro': {
          create(){
            injectStyles();
            const panel = document.createElement('div');
            panel.style.height = '100%';
            const root = document.createElement('div');
            root.id = 'root';
            root.textContent = 'Loading…';
            root.style.height = '100%';
            panel.appendChild(root);
            loadBundleOnce();
            return panel;
          }
        }
      }
    });
  } else {
    // Fallback: try to mount in regular browser for dev
    injectStyles();
    const root = document.createElement('div'); root.id = 'root'; root.textContent = 'Loading…'; document.body.appendChild(root);
    loadBundleOnce();
  }
})();