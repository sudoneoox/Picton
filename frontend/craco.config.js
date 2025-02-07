const path = require("path");
const sass = require("sass");

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Modify entry point
      webpackConfig.entry = "./src/index.js";

      // Configure output
      webpackConfig.output = {
        path: path.resolve(__dirname, "dist"),
        filename: "js/[name].[contenthash].js",
        publicPath: "/",
        clean: true,
      };

      // Add rules for different file types
      webpackConfig.module.rules.push(
        {
          test: /\.scss$/,
          use: [
            "style-loader",
            {
              loader: "css-loader",
              options: {
                modules: {
                  localIdentName: "[name]__[local]--[hash:base64:5]",
                },
              },
            },
            "postcss-loader",
            {
              loader: "sass-loader",
              options: {
                implementation: sass,
              },
            },
          ],
          include: path.resolve(__dirname, "src/styles/_modules"),
        },
        {
          test: /\.(png|svg|jpg|jpeg|gif)$/i,
          type: "asset/resource",
          generator: {
            filename: "assets/images/[name].[hash][ext]",
          },
        },
      );

      // Resolve extensions
      webpackConfig.resolve.extensions = [".js", ".ts", ".scss"];

      return webpackConfig;
    },
    alias: {
      "@": path.resolve(__dirname, "src"),
      "@styles": path.resolve(__dirname, "src/styles"),
      "@js": path.resolve(__dirname, "src/js"),
      "@pages": path.resolve(__dirname, "src/pages"),
    },
  },
  style: {
    postcss: {
      plugins: [require("tailwindcss"), require("autoprefixer")],
    },
  },
  devServer: {
    port: 3000,
    hot: true,
    open: true,
    static: {
      directory: path.join(__dirname, "public"),
      publicPath: "/",
    },
    historyApiFallback: true,
  },
};
