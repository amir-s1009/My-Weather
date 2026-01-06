module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins: [
      // ... سایر پلاگین‌ها اگر دارید
      "react-native-reanimated/plugin", // این خط باید آخرین مورد باشد
    ],
  };
};