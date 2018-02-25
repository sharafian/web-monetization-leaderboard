'use strict'
const webpack = require('webpack')

module.exports = {
  entry: {
    'static/index': './src/index.js'
  },

  output: {
    filename: '[name].js',
    path: __dirname,
    libraryTarget: 'umd'
  },

  module: {
    loaders: [
      {
        test: /\.js$/,
        // exclude: /node_modules/,
        loader: 'babel-loader',
        query: {
          presets: ['es2017', 'es2015'],
          plugins: [['transform-runtime', {
            helpers: false,
            polyfill: false,
            regenerator: true, }]
          ]
        }
      },
    ]
  },

  plugins: [
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
    })
  ],

  node: {
    console: true,
    fs: 'empty',
    net: 'empty',
    tls: 'empty'
  }
}
