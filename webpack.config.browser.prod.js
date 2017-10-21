const path = require('path')
const webpack = require('webpack')
const UglifyJsPlugin = require('uglifyjs-webpack-plugin')
const merge = require('webpack-merge')
const baseConfig = require('./webpack.config.base')

module.exports = merge.smart(baseConfig, {
  entry: {
    te: [
      'babel-polyfill',
      './src/boot.js'
    ]
  },
  output: {
    path: path.join(__dirname, 'dist/browser'),
    filename: '[name].js',
    publicPath: ''
  },
  devtool: '#source-map',
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      }
    }),
    new UglifyJsPlugin({
      sourceMap: true
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
    })
  ]
})
