import { listrTask as getServerIps } from './';
import { exec } from 'shelljs';
import Listr from 'listr';

const runCmdOnServer = (ip, cmd) =>
  new Promise((resolve, reject) =>
    exec(`ssh ${ip} ${cmd}`, { silent: true }, (code, stdout, stderr) => {
      if (code !== 0) {
        reject(stderr);
      } else {
        resolve(stdout);
      }
    })
  );

const getServerLogs = (ip, term = 1735808) => runCmdOnServer(ip, `ls`);
// runCmdOnServer(ip, `sudo grep -iA2 "${term}" /var/log/upstart/*`);
const searchLogs = {
  title: 'Search server logs',
  task: ctx =>
    new Listr(
      ctx.serverIps.map(ip => ({
        title: `Searching logs on ${ip}`,
        task: ctx =>
          getServerLogs(ip).then(logs => logs && ctx.results.push(logs))
      })),
      { concurrent: true }
    )
};

new Listr()
  .add(getServerIps)
  .add(searchLogs)
  .run({
    env: 'prod',
    servers: 'api',
    results: []
  })
  .then(({ results }) => console.log(results))
  .catch(err => {
    console.log('There was an error');
    console.log(err);
  });

// const spinnerOptions = [
//   'dots', // up to dots12
//   'toggle', // up to toggle13
//   'line', // 2
//   'balloon', //2
//   'boxBounce', // 2
//   'arrow', //3
//   'pipe', 'simpleDots', 'simpleDotsScrolling', 'star', 'star2', 'flip', 'hamburger', 'growVertical', 'growHorizontal', 'noise', 'bounce', 'triangle', 'arc', 'circle', 'squareCorners', 'circleQuarters', 'circleHalves', 'squish', 'bouncingBar', 'bouncingBall', 'smiley', 'monkey', 'hearts', 'clock', 'earth', 'moon', 'runner', 'pong', 'shark', 'dqpb'];
