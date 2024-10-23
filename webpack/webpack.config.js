const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
    mode: 'development', // Hoặc 'production'
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'),
    },
    resolve: {
        fallback: {
            fs: false,
            path: require.resolve('path-browserify'),
            stream: require.resolve('stream-browserify')
        },
        extensions: ['.js'], // Đưa phần này ra khỏi 'resolve.fallback'
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: ['@babel/preset-env'],
                    },
                },
            },
        ],
    },
    plugins: [
        new Dotenv(),
    ],
};
