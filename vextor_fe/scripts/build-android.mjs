import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

const apiUrl = (process.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const wsUrl = (process.env.VITE_WS_BASE_URL || '').replace(/\/$/, '');

if (!apiUrl || !wsUrl) {
  console.error('Configura VITE_API_BASE_URL y VITE_WS_BASE_URL antes de generar el APK.');
  console.error('Usa la IP LAN del computador, no localhost (en el teléfono localhost apunta al propio teléfono).');
  process.exit(1);
}
if (/^https?:\/\/(localhost|127\.0\.0\.1)(:|$)/i.test(apiUrl) ||
    /^wss?:\/\/(localhost|127\.0\.0\.1)(:|$)/i.test(wsUrl)) {
  console.error('No uses localhost/127.0.0.1 en el APK. Configura la IP LAN del equipo que ejecuta Docker.');
  process.exit(1);
}

const isWindows = process.platform === 'win32';
const runner = (command, args, cwd = process.cwd()) => {
  const result = spawnSync(command, args, { cwd, stdio: 'inherit', shell: isWindows });
  if (result.status !== 0) process.exit(result.status ?? 1);
};

console.log('Construyendo frontend para Android con:');
console.log('API:', apiUrl);
console.log('WebSocket:', wsUrl);

runner(isWindows ? 'pnpm.cmd' : 'pnpm', ['run', 'build']);
runner(isWindows ? 'npx.cmd' : 'npx', ['cap', 'sync', 'android']);

const androidDir = resolve(process.cwd(), 'android');
const gradleWrapper = resolve(androidDir, isWindows ? 'gradlew.bat' : 'gradlew');
if (!existsSync(gradleWrapper)) {
  console.error('No se encontró el Gradle Wrapper en vextor_fe/android.');
  process.exit(1);
}
runner(isWindows ? 'gradlew.bat' : './gradlew', ['assembleDebug'], androidDir);

console.log('APK generado en android/app/build/outputs/apk/debug/app-debug.apk');
