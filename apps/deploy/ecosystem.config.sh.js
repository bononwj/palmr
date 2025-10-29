module.exports = {
  apps: [
    {
      name: "next-app",
      script: "apps/web/.next/standalone/server.js",
      cwd: "/data/wwwroot/download.yipai360.com",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0",
        HOSTNAME: "0.0.0.0",
        // 关键：通过成都服务器的Nginx反向代理访问Server API（安全）
        // 使用 /api-internal/ 路径，该路径只允许上海服务器IP访问
        API_BASE_URL: "https://download.yipai360.com/api-internal",
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
    {
      name: "server-app",
      script: "apps/server/dist/server.js",
      cwd: "/data/wwwroot/download.yipai360.com",
      env: {
        NODE_ENV: "production",
        PORT: 3333,
        HOST: "0.0.0.0",
        HOSTNAME: "0.0.0.0",
        DATABASE_URL: process.env.DATABASE_URL,
        // 文件同步配置 - 上海服务器不启用
        SYNC_ENABLED: "false",
      },
      instances: 1,
      exec_mode: "cluster",
      watch: false,
      max_memory_restart: "400M",
      error_file: "/var/log/server-app/error.log",
      out_file: "/var/log/server-app/out.log",
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true,
      time: true,
    },
  ],
};
