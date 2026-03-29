const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'background/service-worker': './src/background/service-worker.ts',
    'content/content-script': './src/content/content-script.ts',
    'popup/popup': './src/popup/popup.ts',
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  plugins: [
    new CopyPlugin({
      patterns: [
        { from: 'src/manifest.json', to: '.' },
        { from: 'src/popup/popup.html', to: 'popup/' },
        { from: 'src/popup/popup.css', to: 'popup/' },
        { from: 'src/icons', to: 'icons' },
      ],
    }),
  ],
  optimization: {
    minimize: false,
  },
  devtool: 'source-map',
};
