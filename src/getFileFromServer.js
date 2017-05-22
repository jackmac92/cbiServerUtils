import { exec } from 'shelljs';

export const getFileFromServer = (
  ip,
  remotePath,
  localDest,
  recursive = false
) => {
  const cmd = ['scp'];
  if (recursive) {
    cmd.push('-r');
  }
  cmd.push(`ubuntu@${ip}:${remotePath}`);
  cmd.push(localDest);
  return new Promise((resolve, reject) =>
    exec(
      `${cmd.join(' ')}`,
      { async: true },
      (code, res, err) => (code === 0 ? resolve(res) : reject(err))
    )
  );
};
