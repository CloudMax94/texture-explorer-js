var path = require('path')
var webpack = require('webpack')

module.exports = {
  entry: {
    boot: './boot.js'
  },
  output: {
    path: path.join(__dirname, 'browser'),
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
      'process.browser': true
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
      electron: path.resolve(__dirname, 'lib/shims/electron'),
      fs: path.resolve(__dirname, 'lib/shims/fs')
    }
  }
}
