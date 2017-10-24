import webpack from 'webpack'
import path from 'path'
import merge from 'webpack-merge'
import baseConfig from './webpack.config.base.prod'

export default merge.smart(baseConfig, {
  entry: {
    te: [
      'babel-polyfill',
      path.join(__dirname, 'app/index')
    ]
  },
  output: {
    path: path.join(__dirname, 'release/browser')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.browser': true
    })
  ],
  resolve: {
    alias: {
      electron: path.resolve(__dirname, 'app/shims/electron'),
      fs: path.resolve(__dirname, 'app/shims/fs')
    }
  }
})
