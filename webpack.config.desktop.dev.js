import path from 'path'
import merge from 'webpack-merge'
import baseConfig from './webpack.config.base.dev'
import { spawn } from 'child_process'

const port = process.env.PORT || 1213
const publicPath = `http://localhost:${port}/dist/desktop`

export default merge.smart(baseConfig, {
  target: 'electron-renderer',
  entry: {
    te: [
      'babel-polyfill',
      'react-hot-loader/patch',
      path.join(__dirname, 'app/index')
    ]
  },
  output: {
    publicPath: publicPath + '/',
    path: path.join(__dirname, 'app/dist/desktop')
  },
  devServer: {
    port,
    publicPath,
    contentBase: path.join(__dirname, 'app/dist/desktop'),
    before () {
      if (process.env.START_HOT) {
        spawn(
          'npm',
          ['run', 'start-hot-desktop'],
          { shell: true, env: process.env, stdio: 'inherit' }
        )
        .on('close', code => process.exit(code))
        .on('error', spawnError => console.error(spawnError))
      }
    }
  },
  resolve: {
    modules: [
      path.join(__dirname, 'app'),
      'node_modules'
    ]
  }
})
