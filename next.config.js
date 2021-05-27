module.exports = {
  reactStrictMode: true,
  env: {
    IPFS: process.env.IPFS === "true" ? "true" : "false",
    COMMIT_SHA:
      process.env.VERCEL_GITHUB_COMMIT_SHA ||
      process.env.GITHUB_SHA ||
      "master",
    BLOCKNATIVE_KEY: "59252a36-bc22-4f85-9f95-86fbebd7fce0",
    WEB3_PROVIDER_HTTPS:
      "https://bsc-dataseed4.binance.org/",
  },
};
