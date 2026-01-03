module.exports = function (api) {
  api.cache(true);
  const plugins = [];
  
  // Удаление console.log в production для уменьшения bundle size
  if (process.env.NODE_ENV === 'production') {
    plugins.push('transform-remove-console');
  }
  
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }],
      "nativewind/babel",
    ],
    plugins,
  };
};

