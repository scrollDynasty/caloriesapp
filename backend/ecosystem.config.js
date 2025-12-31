// =============================================================================
// PM2 Ecosystem конфигурация для CaloriesApp Backend
// =============================================================================
// Использование:
//   pm2 start ecosystem.config.js          # Запуск
//   pm2 stop ecosystem.config.js           # Остановка
//   pm2 restart ecosystem.config.js        # Перезапуск
//   pm2 logs caloriesapp-backend          # Логи
//   pm2 monit                              # Мониторинг
//   pm2 save                               # Сохранить для автозапуска
//   pm2 startup                            # Настроить автозапуск при загрузке
// =============================================================================

module.exports = {
  apps: [
    {
      name: 'caloriesapp-backend',
      script: 'venv/bin/uvicorn',
      args: 'app.main:app --host 0.0.0.0 --port 8000 --workers 4 --limit-concurrency 100 --backlog 2048',
      cwd: '/home/scroll/backend',
      interpreter: 'none',
      
      env_file: '.env',
      env: {
        NODE_ENV: 'production',
        PYTHONUNBUFFERED: '1',
        PYTHONDONTWRITEBYTECODE: '1',
        PYTHONOPTIMIZE: '1',
        PYTHONHASHSEED: 'random',
      },
      
      instances: 1,
      exec_mode: 'fork',
      
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M', 
      
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_file: './logs/pm2-combined.log',
      time: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      
      min_uptime: '30s',
      max_restarts: 15,
      restart_delay: 3000,
      
      kill_timeout: 10000,
      wait_ready: true,
      listen_timeout: 15000,
      
      pmx: true,
    }
  ]
};

