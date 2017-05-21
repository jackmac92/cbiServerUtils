import shell from 'shelljs';
import { getServersByRole } from './index';

// const cmd = `ssh ${ip} "test -e ${picPath}"`;
export const serverTestCall = (ip, serverTest) =>
  new Promise((resolve, reject) => {
    const cmd = `ssh ${ip} "${serverTest}"`;
    shell.exec(cmd, { silent: true }, code => {
      code === 0 ? resolve(ip) : reject();
    });
  });

const checkServer = (ip, serverTest) =>
  serverTestCall(ip, serverTest).catch(x => {});

const pickServer = (ips, serverTest) =>
  Promise.any(ips.map(ip => checkServer(ip, serverTest)));

export const determineCorrectServer = (env, boxType, serverTest) =>
  getServersByRole(env, boxType).then(
    ips => (ips.length === 1 ? ips[0] : pickServer(ips, serverTest))
  );
