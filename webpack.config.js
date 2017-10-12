var path = require('path')
var webpack = require('webpack')
var fs = require('fs')
var pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

module.exports = {
  entry: {
    te: './src/boot.js'
  },
  output: {
    path: path.join(__dirname, 'dist/browser'),
    filename: '[name].js',
    publicPath: ''
  },
  cache: true,
  watch: true,
  module: {
    rules: [
      {
        test: /\.jsx?$/,
        loader: 'babel-loader',
        exclude: /node_modules/
      }
    ]
  },
  devtool: '#source-map',
  plugins: [
    new webpack.optimize.ModuleConcatenationPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: '"production"'
      },
      'process.browser': true,
      '__APP_VERSION__': JSON.stringify(pkg.version),
      '__APP_NAME__': JSON.stringify(pkg.productName)
    }),
    new webpack.optimize.UglifyJsPlugin({
      sourceMap: true,
      compress: {
        warnings: false
      }
    }),
    new webpack.LoaderOptionsPlugin({
      minimize: true
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
