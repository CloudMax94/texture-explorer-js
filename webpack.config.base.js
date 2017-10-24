import path from 'path'
import webpack from 'webpack'
import fs from 'fs'
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

export default {
  output: {
    filename: '[name].js',
    publicPath: ''
  },
  devtool: '#source-map',
  cache: true,
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            cacheDirectory: true
          }
        }
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      'process.browser': true,
      '__APP_VERSION__': JSON.stringify(pkg.version),
      '__APP_NAME__': JSON.stringify(pkg.productName)
    })
  ],
  resolve: {
    extensions: ['.js', '.jsx'],
    alias: {
      electron: path.resolve(__dirname, 'src/lib/shims/electron'),
      fs: path.resolve(__dirname, 'src/lib/shims/fs')
    }
  }
}
