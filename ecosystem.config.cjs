// PM2 sozlamasi: pm2 start ecosystem.config.cjs --env production
module.exports = {
  apps: [
    {
      name: 'kelajak-iqtisodiyoti',
      script: 'src/server.js',
      cwd: './backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '600M',
      time: true,
      error_file: './logs/error.log',
      out_file: './logs/out.log',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
