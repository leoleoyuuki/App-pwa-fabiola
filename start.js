import { spawn } from 'child_process';
import os from 'os';

/**
 * Gets the current machine's active local IP address.
 */
function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const networkInterface = interfaces[name];
    if (networkInterface) {
      for (const iface of networkInterface) {
        // Skip over internal (loopback) and non-IPv4 addresses
        if (iface.family === 'IPv4' && !iface.internal) {
          return iface.address;
        }
      }
    }
  }
  return 'localhost';
}

const localIp = getLocalIp();

console.log('\n=============================================================');
console.log(' ✨  FABIOLA PWA - AMBIENTE DE DESENVOLVIMENTO INTEGRADO  ✨ ');
console.log('=============================================================');
console.log(` 📱 PWA do App (Abra no navegador do celular):`);
console.log(`    http://${localIp}:5173/`);
console.log(`\n 📬 Webhook Local (Cole nas configurações de Sync do PWA):`);
console.log(`    http://${localIp}:3000/webhook`);
console.log('=============================================================\n');
console.log('Iniciando o servidor frontend e o receptor de Webhook...\n');

// Spawn the Vite dev server with network host sharing
const viteProcess = spawn('npx', ['vite', '--host'], { 
  shell: true, 
  stdio: 'inherit' 
});

// Spawn the mock webhook node server
const mockProcess = spawn('node', ['mock-server.js'], { 
  shell: true, 
  stdio: 'inherit' 
});

// Ensure both processes are killed if the parent process terminates
const handleExit = () => {
  console.log('\nFinalizando servidores de teste...');
  viteProcess.kill();
  mockProcess.kill();
  process.exit();
};

process.on('SIGINT', handleExit);
process.on('SIGTERM', handleExit);
process.on('exit', handleExit);
