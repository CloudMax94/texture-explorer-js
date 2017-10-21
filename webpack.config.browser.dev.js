const path = require('path')
const webpack = require('webpack')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

const port = process.env.PORT || 1212
const publicPath = `http://localhost:${port}`

module.exports = merge.smart(baseConfig, {
  entry: {
    te: [
      'babel-polyfill',
      'react-hot-loader/patch',
      path.join(__dirname, 'src/boot.js')
    ]
  },
  output: {
    path: path.join(__dirname, 'dist/browser'),
    filename: '[name].js',
    publicPath: publicPath + '/'
  },
  devtool: 'inline-source-map',
  devServer: {
    port,
    publicPath,
    contentBase: path.join(__dirname, 'dist/browser'),
    hot: true,
    compress: true,
    noInfo: true,
    stats: 'errors-only',
    inline: true,
    lazy: false,
    headers: { 'Access-Control-Allow-Origin': '*' },
    watchOptions: {
      aggregateTimeout: 300,
      poll: 100
    }
  },
  plugins: [
    new webpack.NamedModulesPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"development"'
      }
    }),
    new webpack.HotModuleReplacementPlugin(),
    new webpack.LoaderOptionsPlugin({
      debug: true
    })
  ]
})
