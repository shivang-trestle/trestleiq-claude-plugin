import { readFileSync, existsSync, appendFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { stdin, stdout } from 'node:process';
const MARKER = '# trestleiq-claude-plugin';
const VALIDATE_URL = 'https://api.trestleiq.com/1.1/phone-validation?phone=+14155552671';
export function detectShellRc(shell, home) {
    if (shell.endsWith('zsh'))
        return join(home, '.zshrc');
    if (shell.endsWith('bash'))
        return join(home, '.bashrc');
    if (shell.endsWith('fish'))
        return join(home, '.config', 'fish', 'config.fish');
    return join(home, '.profile');
}
export function hasTrestleMarker(content) {
    return content.includes(MARKER);
}
async function validateKey(key) {
    try {
        const res = await fetch(VALIDATE_URL, { headers: { 'x-api-key': key } });
        if (res.ok)
            return 'ok';
        if (res.status === 401 || res.status === 403)
            return 'auth';
        return 'other';
    }
    catch {
        return 'other';
    }
}
async function main() {
    if (process.env.TRESTLE_API_KEY) {
        console.log('TRESTLE_API_KEY already set in environment. Nothing to do.');
        return;
    }
    const rcPath = detectShellRc(process.env.SHELL ?? '/bin/zsh', homedir());
    if (existsSync(rcPath) && hasTrestleMarker(readFileSync(rcPath, 'utf8'))) {
        console.log(`Already configured in ${rcPath}. Restart your shell or 'source ${rcPath}'.`);
        return;
    }
    const rl = createInterface({ input: stdin, output: stdout });
    console.log('Get an API key at https://portal.trestleiq.com/account/api-keys');
    const key = (await rl.question('Paste your Trestle API key: ')).trim();
    rl.close();
    if (!key) {
        console.error('No key entered. Aborting.');
        process.exit(1);
    }
    const result = await validateKey(key);
    if (result === 'auth') {
        console.error('That key was rejected by api.trestleiq.com. Aborting.');
        process.exit(1);
    }
    if (result === 'other') {
        console.error('Could not reach api.trestleiq.com to validate the key. Aborting.');
        process.exit(1);
    }
    appendFileSync(rcPath, `\nexport TRESTLE_API_KEY="${key}" ${MARKER}\n`);
    console.log(`Wrote TRESTLE_API_KEY to ${rcPath}.`);
    console.log(`Run 'source ${rcPath}' (or restart your terminal) then restart Claude Code.`);
}
const isMain = import.meta.url === `file://${process.argv[1]}`;
if (isMain) {
    main().catch((e) => {
        console.error(e);
        process.exit(1);
    });
}
//# sourceMappingURL=setup.js.map