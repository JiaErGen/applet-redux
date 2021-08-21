const path = require('path');

module.exports = {
  entry: './src/index.js',
  mode: 'production',
  output: {
    clean: true,
    path: path.resolve(__dirname, 'dist'),
    filename: 'index.js',
    library: 'applet-redux',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              [
                '@babel/preset-env',
                {
                  targets: {
                    chrome: "58",
                  },
                }
              ],
            ],
          },
        }
      },
    ]
  }
};
