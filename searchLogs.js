import { listrTask as getServerIps } from 'cbiServerUtils';
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

const getServerLogs = ip =>
  runCmdOnServer(ip, 'ls').catch(err => console.log('failed cmd', ip));
// runCmdOnServer(ip, 'grep -ri 1735808 /var/log/upstart/*').catch(err =>

new Listr([
  getServerIps,
  {
    title: 'Search server logs',
    task: ctx =>
      Promise.all(ctx.serverIps.map(getServerLogs)).then(results => {
        ctx.results = results;
      })
  }
])
  .run({
    env: 'prod',
    servers: 'api'
  })
  .then(({ results }) => console.log(results));

// getServerIps(['prod'], ['api'])
//   .then(serverMap => Promise.all(serverMap.api.prod.map(getServerLogs)))
//   .then(outputs => {
//     console.log(outputs);
//   });

const spinnerOptions = [
  'dots', // up to dots12
  'line', //2
  'pipe',
  'simpleDots',
  'simpleDotsScrolling',
  'star',
  'star2',
  'flip',
  'hamburger',
  'growVertical',
  'growHorizontal',
  'balloon', //2
  'noise',
  'bounce',
  'boxBounce', // 2
  'triangle',
  'arc',
  'circle',
  'squareCorners',
  'circleQuarters',
  'circleHalves',
  'squish',
  'toggle', // up to toggle13
  'arrow', //3
  'bouncingBar',
  'bouncingBall',
  'smiley',
  'monkey',
  'hearts',
  'clock',
  'earth',
  'moon',
  'runner',
  'pong',
  'shark',
  'dqpb'
];
