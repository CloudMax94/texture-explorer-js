const path = require('path')
const webpack = require('webpack')
const fs = require('fs')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

module.exports = {
  output: {
    path: path.join(__dirname, 'dist/browser'),
    filename: '[name].js',
    publicPath: ''
  },
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
