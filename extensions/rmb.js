const fs = require('fs');
const path = require('path');
const { spawn, exec } = require('child_process');

const isProcessRunning = async processName => {
    return new Promise((resolve, reject) => {
        exec('ps -A', (err, stdout, stderr) => {
            if (err) reject(err);
            resolve(stdout.toLowerCase().indexOf(processName.toLowerCase()) > -1);
        });
    });
};

const killProcess = async processName => {
    return new Promise((resolve, reject) => {
        exec(`pkill -f ${processName}`, err => {
            console.log(err);
            console.log('Killing process:', processName);
            if (err) reject(err);
            resolve(undefined);
        });
    });
};

const log = (msg, channel) => {
    console.log(`[RMB]`, channel ? `[${channel}]` : '', msg);
};

(async () => {
    if (await isProcessRunning('msgbusd')) {
        log('Message bus is running');

        return;
    }

    if (!fs.existsSync('/var/log/rmb')) {
        fs.mkdirSync('/var/log/rmb');
    }

    const out = fs.openSync('/var/log/rmb/out.log', 'a');
    const err = fs.openSync('/var/log/rmb/err.log', 'a');
    let options = ['-twin', process.env.TWIN_ID.toString(), '-log-level', 'debug', '-publish'];
    if (process.env.ENVIRONMENT === 'development') {
        const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'rmb.local.json'), 'utf-8'));
        options = [...options, ...['-localconfig', JSON.stringify(data)]];
    }
    const p = spawn('msgbusd', options, {
        detached: true,
        //stdio: ['ignore', out, err],
    });
    p.stdout.pipe(process.stdout);
    p.unref();
})();
