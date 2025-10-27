module.exports = {
  apps: [
    {
      name: "next-app", // 应用名称
      script: "apps/web/.next/standalone/server.js", // Next.js standalone 入口文件
      cwd: "/data/wwwroot/download.yipai360.com", // 项目工作目录（改成你的实际路径）
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        HOST: "0.0.0.0", // 避免 IPv6 报错
        HOSTNAME: "0.0.0.0",
      },
      instances: 1, // 或 'max' 开启多核模式
      exec_mode: "cluster", // 使用 cluster 模式
      watch: false, // 不监听变更（生产环境禁用）
      max_memory_restart: "500M", // 超出内存自动重启
      error_file: "/var/log/next-app/error.log", // 错误日志
      out_file: "/var/log/next-app/out.log", // 普通日志
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true, // 程序崩溃后自动重启
      time: true, // 日志前缀带时间戳
    },
    {
      name: "server-app", // 服务端应用名称
      script: "apps/server/dist/server.js", // 服务端入口文件
      cwd: "/data/wwwroot/download.yipai360.com", // 项目工作目录（改成你的实际路径）
      env: {
        NODE_ENV: "production",
        PORT: 3333,
        HOST: "0.0.0.0", // 避免 IPv6 报错
        HOSTNAME: "0.0.0.0",
        DATABASE_URL: `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@localhost:27017/palmr`,
      },
      instances: 1, // 或 'max' 开启多核模式
      exec_mode: "cluster", // 使用 cluster 模式
      watch: false, // 不监听变更（生产环境禁用）
      max_memory_restart: "500M", // 超出内存自动重启
      error_file: "/var/log/server-app/error.log", // 错误日志
      out_file: "/var/log/server-app/out.log", // 普通日志
      log_date_format: "YYYY-MM-DD HH:mm:ss",
      autorestart: true, // 程序崩溃后自动重启
      time: true, // 日志前缀带时间戳
    },
  ],
};
