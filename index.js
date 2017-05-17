import boto from 'aws-sdk';
import fetch from 'isomorphic-fetch';
import Listr from 'listr';

export const getServerIps = (cfg, env, boxType) =>
  new Promise((resolve, reject) => {
    const { searchkey: searchKey, searchvalue: searchVal } = cfg[env][boxType];
    const ec2Params = {
      Filters: [
        { Name: `tag:${searchKey}`, Values: [searchVal] },
        { Name: 'instance-state-name', Values: ['running'] }
      ]
    };
    const ec2 = new boto.EC2({ region: cfg[env].region });
    ec2.describeInstances(ec2Params, (err, data) => {
      if (err) reject(err);
      const ips = data.Reservations.reduce(
        (accum, { Instances }) => [
          ...accum,
          ...Instances.map(
            inst => inst.PublicIpAddress || inst.PrivateIpAddress
          )
        ],
        []
      );

      if (ips.length > 0) {
        resolve({ env, ips, server: boxType });
      } else {
        reject(`Failed to get ${boxType} on ${env}`);
      }
    });
  });

const CBI_ENV_LOCATION = 'http://s3.amazonaws.com/cbi-wiki/cbi-env.json';

const getAwsConfig = () =>
  fetch(CBI_ENV_LOCATION, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  }).then(res => res.json());

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

export const getManyServers = (envs, servers) =>
  getAwsConfig().then(cfg =>
    Promise.all(
      envs.reduce(
        (accum, env) => [
          ...accum,
          ...servers.map(server => getServerIps(cfg, env, server))
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
