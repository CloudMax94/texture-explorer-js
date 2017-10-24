import webpack from 'webpack'
import path from 'path'
import merge from 'webpack-merge'
import baseConfig from './webpack.config.base.dev'

const port = process.env.PORT || 1212
const publicPath = `http://localhost:${port}`

export default merge.smart(baseConfig, {
  entry: {
    te: [
      'babel-polyfill',
      'react-hot-loader/patch',
      path.join(__dirname, 'src/boot.js')
    ]
  },
  output: {
    publicPath: publicPath + '/',
    path: path.join(__dirname, 'dist/browser')
  },
  devServer: {
    port,
    publicPath,
    contentBase: path.join(__dirname, 'src/static')
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.browser': true
    })
  ],
  resolve: {
    alias: {
      electron: path.resolve(__dirname, 'src/lib/shims/electron'),
      fs: path.resolve(__dirname, 'src/lib/shims/fs')
    }
  }
})
