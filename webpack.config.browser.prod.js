import path from 'path'
import merge from 'webpack-merge'
import baseConfig from './webpack.config.base.prod'

export default merge.smart(baseConfig, {
  entry: {
    te: [
      'babel-polyfill',
      './src/boot.js'
    ]
  },
  output: {
    path: path.join(__dirname, 'release/browser')
  }
})
