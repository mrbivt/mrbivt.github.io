const path = require('path');
const Dotenv = require('dotenv-webpack');

module.exports = {
    mode: 'development', // hoặc 'production'
    entry: './src/index.js',
    output: {
        filename: 'bundle.js',
        path: path.resolve(__dirname, 'dist'), // Thay đổi nếu cần
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /node_modules/,
                use: {
                    loader: 'babel-loader', // Nếu bạn đang sử dụng Babel
                },
            },
        ],
    },
    plugins: [
        new Dotenv() // Thêm dòng này để sử dụng dotenv-webpack
    ],
    resolve: {
        extensions: ['.js'],
    },
};
