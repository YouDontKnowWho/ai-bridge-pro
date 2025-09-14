const path = require('path');

class EmitIndexHtmlPlugin {
  apply(compiler){
    compiler.hooks.thisCompilation.tap('EmitIndexHtmlPlugin', (compilation)=>{
      compilation.hooks.processAssets.tap({
        name: 'EmitIndexHtmlPlugin',
        stage: compiler.webpack.Compilation.PROCESS_ASSETS_STAGE_ADDITIONS
      }, ()=>{
        const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>AI Bridge Pro</title>
  <style>
    body { font-family: sans-serif; margin: 0; color: #ddd; }
    .panel { padding: 8px; }
    .row { display: flex; gap: 8px; align-items: center; }
    textarea { width: 100%; height: 90px; }
    .tabs { display: flex; gap: 8px; margin-bottom: 8px; }
    .tab { padding: 6px 10px; border: 1px solid #444; cursor: pointer; }
    .tab.active { background: #333; }
    .scroll { overflow: auto; max-height: 380px; border: 1px solid #333; padding: 6px; }
    .badge { font-size: 12px; background:#444; padding:2px 6px; border-radius: 4px; }
    .list-item { border-bottom:1px dotted #444; padding: 6px 0; }
  </style>
</head>
<body>
  <div id="root">Loading…</div>
  <script src="bundle.js"></script>
</body>
</html>`;
        const { RawSource } = compiler.webpack.sources;
        compilation.emitAsset('index.html', new RawSource(html));
      });
    });
  }
}

module.exports = {
  entry: './src/index.tsx',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  devtool: 'source-map',
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@core': path.resolve(__dirname, 'src/core/'),
      '@ui': path.resolve(__dirname, 'src/ui/')
    }
  },
  module: {
    rules: [{ test: /.tsx?$/, use: 'ts-loader', exclude: /node_modules/ }]
  },
  plugins: [ new EmitIndexHtmlPlugin() ]
};