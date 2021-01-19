const path = require("path");
function resolve(dir) {
  return path.join(__dirname, dir);
}
module.exports = {
  publicPath:'/upload',
  configureWebpack: (config) => {
    config.output.libraryExport = 'default'
    config.module.rules = [
      {
        test: /\.worker\.js$/i,
        use: [
          {
            loader: 'worker-loader',
            options: {
              inline: 'no-fallback',
            },
          }
        ]
      },
      ...config.module.rules
    ]
  },
  chainWebpack: config => {
    config.resolve.alias
      .set("@", resolve("src"))
      .set("assets", resolve("src/assets"))
      .set("components", resolve("src/components"))
  }
};
