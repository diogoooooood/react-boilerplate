const path = require('path');
const webpack = require('webpack');

const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const TransferWebpackPlugin = require('transfer-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');

const autoprefixer = require('autoprefixer');
const precss = require('precss');

const pkg = require('../package.json');

// 当前是否是开发环境
const __DEV__ = process.env.NODE_ENV === 'development';
// const __DEV__ = false;
// 入口配置文件
const entries = require('./entries.config.js');

// 无需编译文件存放目录
const STATIC_PATH = path.join(__dirname, '../', 'src/static');
// 目标输出
const DIST_PATH = `dist/${process.env.NODE_ENV}`;

// 页面生成插件
const HtmlWebpackPluginOptions = {
    inject: true,
    hash: true, // 开启追加哈希的行为
    minify: {
        removeComments: false,
        collapseWhitespace: false
    }
};

// 插件列表
const plugins = [
    // 兼容老版本Webpack
    new webpack.LoaderOptionsPlugin({
        debug: true,
        progress: true,
    }),
    // 删除生成的文件
    // https://github.com/johnagan/clean-webpack-plugin
    new CleanWebpackPlugin([DIST_PATH], {
        root: path.join(__dirname, '../'),
        verbose: true,
        dry: false,
        exclude: [],
    }),
    // 文件头部说明
    new webpack.BannerPlugin({ banner: `Powered by FE @knowbox version ${pkg.version}`, raw: false, entryOnly: true }),
    // new webpack.optimize.CommonsChunkPlugin(/*name:*/ 'vendor',/*filename:*/ 'js/vendor.js'),
    new webpack.optimize.CommonsChunkPlugin({ name: 'vendor', filename: 'js/vendor.js' }),
    // 分离CSS文件
    new ExtractTextPlugin({
        filename: 'css/[name].style.css',
        disable: false,
        allChunks: true
    }),
    // 移动静态文件
    new TransferWebpackPlugin([{
        from: STATIC_PATH
    }]),
];

// 入口点对象生成
const REACT_HOT_LOADER = ['webpack-hot-middleware/client', 'react-hot-loader/patch'];
const entryConfig = entries.reduce((config, item) => {
    config[item.name] = __DEV__ ? REACT_HOT_LOADER.concat(item.entry) : item.entry;

    plugins.push(new HtmlWebpackPlugin(
        Object.assign(
            {/* new object */}, 
            HtmlWebpackPluginOptions, 
            {
                filename: `${item.name}.html`,
                template: item.template,
                favicon: './src/resources/favicon.png',
                chunks: ['vendor', item.name],
                chunksSortMode: 'auto',
                title: item.title || '这里是标题',
                version: pkg.version, 
                description: item.description,
            }
        )
    ));

    return config;
}, {
    vendor:['mobx', 'mobx-react', 'axios']
}); 

console.info('Entries:');
Object.keys(entryConfig).forEach(key  => console.info(key + '->' + entryConfig[key]));

// less or sass variable configuration
const cssOptions = JSON.stringify({
    modifyVars: {
        'theme-color': 'red'
    }
});

module.exports = {
    entry: entryConfig,
    output: {
        path: path.join(__dirname, '../', DIST_PATH),
        filename: '[name].bundle.js',
        publicPath: '/'
    },
    module: {
        rules: [
            {
                // use babel-loader for *.js or *.jsx files
                test: /\.js[x]?$/,
                //loaders: __DEV__ ? ['react-hot'].concat(['babel']) : ['babel'],
                use: ['babel-loader'],
                // important: exclude files in node_modules
                // otherwise it's going to be really slow!
                exclude: /node_modules|\.lazy\.js/
            },
            {
                // separate files, bundle.js will be minify
                test: /\.lazy\.js$/i,
                use: ['bundle-loader?lazy&name=[name]', 'babel-loader'],
            },
            {
                // use css-loader for *.css files
                test: /\.css$/i,
                use: ExtractTextPlugin.extract({ 
                    fallback: 'style-loader',
                    use: 'css-loader',
                    // publicPath: 'css/'
                }),
                exclude: /node_modules/
            },
            {
                // use less-loader for *.less files
                test: /\.less/i,
                use: ExtractTextPlugin.extract({ 
                    fallback: 'style-loader',
                    use: [
                        'css-loader',
                        'postcss-loader',
                        //`less-loader?${cssOptions}`
                    ],
                    // publicPath: 'css/'
                }),
                exclude: /node_modules/
            },
            {
                // load image file
                test: /\.(jpe?g|png|gif|svg)$/i,
                use: [
                    // &publicPath=&outputPath=
                    'file-loader?hash=sha512&digest=hex&limit=10240&name=img/[name].[ext]?[hash]'
                ]
            },
            {
                // font file
                test: /\.woff(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'url-loader?limit=10000&minetype=application/font-woff' ]
            }, 
            {
                test: /\.woff2(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'url-loader?limit=10000&minetype=application/font-woff' ]
            }, 
            {
                test: /\.ttf(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'url-loader?limit=10000&minetype=application/octet-stream' ]
            }, 
            {
                test: /\.ijmap(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'url-loader?limit=10000&minetype=application/font-woff' ]
            }, 
            {
                test: /\.eot(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'file-loader' ]
            }, 
            {
                test: /\.svg(\?v=\d+\.\d+\.\d+)?$/,
                use: [ 'url-loader?limit=10000&minetype=image/svg+xml' ]
            }
        ]
    },
    resolve: {
        extensions: ['.js', '.jsx'],
        modules: [
            path.join(__dirname, 'src'),
            'node_modules',
        ]
    },
    plugins: plugins,
    
};
