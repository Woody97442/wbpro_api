module.exports = {
  apps: [
    {
      name: "wbpro-api",
      script: "npm",
      args: "run start",
      env: {
        PORT: 3666,
      },
    },
  ],
};
