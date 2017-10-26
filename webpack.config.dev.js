import webpack from 'webpack';
import path from 'path';
import ExtractTextPlugin from 'extract-text-webpack-plugin';

export default {
  debug: true,
  devtool: 'cheap-module-eval-source-map', // more info:https://webpack.github.io/docs/build-performance.html#sourcemaps and https://webpack.github.io/docs/configuration.html#devtool
  noInfo: true, // set to false to see a list of every file being bundled.
  entry: [
    'eventsource-polyfill', // necessary for hot reloading with IE
    'webpack-hot-middleware/client',
    './src/index'
  ],
  target: 'web',
  output: {
    path: __dirname + '/dist', // Note: Physical files are only output by the production build task `npm run build`.
    publicPath: '/',
    filename: 'bundle.js'
  },
  devServer: {
    contentBase: './src'
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin()
  ],
  module: {
     preLoaders: [
        { test: /\.json$/, exclude: /node_modules/, loader: 'json'},
    ],
    loaders: [
      //{test: /\.js$/, include: path.join(__dirname, 'src'), loaders: ['babel']},
      {test: /\.js$/, include: path.join(__dirname, 'src'), loaders: ['babel']},
      //{test: /(\.css)$/, loader: ExtractTextPlugin.extract("css?sourceMap")},
      {test: /(\.css)$/, loaders: ['style', 'css?sourceMap']},
      {test: /\.json$/, loaders: ['json-loader']},
      // {test: /(\.css)$/, loaders: ['theme/css', 'css?sourceMap']},
      // {test: /(\.css)$/, loaders: ['assets/css', 'css?sourceMap']},
      { test: /\.svg$/, loader: 'url?limit=65000&mimetype=image/svg+xml&name=public/fonts/[name].[ext]' },
      { test: /\.woff$/, loader: 'url?limit=65000&mimetype=application/font-woff&name=public/fonts/[name].[ext]' },
      { test: /\.woff2$/, loader: 'url?limit=65000&mimetype=application/font-woff2&name=public/fonts/[name].[ext]' },
      { test: /\.[ot]tf$/, loader: 'url?limit=65000&mimetype=application/octet-stream&name=public/fonts/[name].[ext]' },
      { test: /\.eot$/, loader: 'url?limit=65000&mimetype=application/vnd.ms-fontobject&name=public/fonts/[name].[ext]' },
      {test: /\.(png|jpg|gif|jpeg|ttf|.ico)$/, loader: 'url-loader?limit=8192' }
    ]
  }
};
