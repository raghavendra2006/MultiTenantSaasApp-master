module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      if (process.env.NODE_ENV === "production") {
        webpackConfig.plugins = webpackConfig.plugins.filter(
          (plugin) => plugin.constructor.name !== "ReactRefreshPlugin"
        );
      }
      return webpackConfig;
    },
  },
};
