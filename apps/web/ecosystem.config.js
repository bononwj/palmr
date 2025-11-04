module.exports = {
  apps: [
    {
      name: "download-app",
      script: "apps/web/.next/standalone/server.js",
      cwd: "/data/wwwroot/download.yipai360.com",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        HOSTNAME: "0.0.0.0",
        API_BASE_URL: "https://download.yipai360.com/api-internal", // 调用到 server
      },
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "400M",
      error_file: "/var/log/next-app/error.log",
      out_file: "/var/log/next-app/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      time: true,
    },
  ],
};
