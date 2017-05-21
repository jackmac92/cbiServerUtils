import { pinkyExec } from '../index';

export default (ip, remotePath, localDest, recursive = false) => {
  const cmd = ['scp'];
  if (recursive) {
    cmd.push('-r');
  }
  cmd.push(`ubuntu@${ip}:${remotePath}`);
  cmd.push(localDest);
  return pinkyExec(`${cmd.join(' ')}`);
};
