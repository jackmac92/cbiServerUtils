import Listr from 'listr';
import getAwsConfig from './awsConfig';
import getServerIps from './getServerIps';

export const listrTask = {
  title: 'Get Server Ips',
  task: ctx =>
    new Listr([
      {
        title: 'Getting AWS Configuration',
        task: ctx =>
          getAwsConfig().then(cfg => {
            ctx.cfg = cfg;
          })
      },
      {
        title: 'Getting Server Ips',
        task: ctx =>
          getServerIps(ctx.cfg, ctx.env, ctx.servers).then(({ ips }) => {
            ctx.serverIps = ips;
          })
      }
    ])
};

export const getServersByRole = (env, boxType) =>
  getAwsConfig().then(cfg => getServerIps(cfg, env, boxType));

const getServerIpsIgnoreErr = (...args) => {
  getServerIps(cfg, env, server).catch(() => null);
};

export const getManyServers = (envs, servers) =>
  getAwsConfig().then(cfg =>
    Promise.all(
      envs.reduce(
        (accum, env) => [
          ...accum,
          ...servers.map(server =>
            getServerIps(cfg, env, server).catch(() => ({
              env,
              server,
              ips: []
            }))
          )
        ],
        []
      )
    )
      .then(allIps =>
        allIps.reduce((accum, { server, env, ips }) => {
          accum[server] = accum[server] || {};
          accum[server][env] = ips;
          return accum;
        }, {})
      )
      .catch(err => console.log(err))
  );
export { getAwsConfig, getServerIps };
export { getFileFromServer } from './getFileFromServer';
export { downloadS3Task } from './downloadS3';
export { determineCorrectServer } from './determineCorrectServer';
