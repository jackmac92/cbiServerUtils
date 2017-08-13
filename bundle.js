'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Listr = _interopDefault(require('listr'));
var fetch = _interopDefault(require('isomorphic-fetch'));
var boto = _interopDefault(require('aws-sdk'));
var shell = require('shelljs');
var shell__default = _interopDefault(shell);
var path = _interopDefault(require('path'));
var fs = _interopDefault(require('fs'));

const CBI_ENV_LOCATION = 'http://s3.amazonaws.com/cbi-wiki/cbi-env.json';

var getAwsConfig = () =>
  fetch(CBI_ENV_LOCATION, {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  })
    .then(res => res.json())
    .catch(err => {
      console.log('FAILED TO GET AWS CONFIG');
      throw err;
    });

var getServerIps = (cfg, env, boxType) =>
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

const getFileFromServer = (
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
    shell.exec(
      `${cmd.join(' ')}`,
      { async: true },
      (code, res, err) => (code === 0 ? resolve(res) : reject(err))
    )
  );
};

const s3 = new boto.S3();

const downloadScreenshot = (Key, tmpDir = 0) =>
  new Promise((resolve, reject) =>
    s3.getObject(
      {
        Bucket: 'cbi-test-screenshots',
        Key
      },
      (err, res) => {
        if (err) reject(err);
        tmpDir = tmpDir || path.join(__dirname, './');
        const filePath = path.join(tmpDir, Key);
        fs.writeFileSync(filePath, res.Body);
        resolve(filePath);
      }
    )
  );

const downloadS3Task = {
  title: 'Download Test Screenshots',
  task: ctx =>
    new Listr(
      ctx.awsScreenshotKeys.map(k => ({
        title: `Downloading ${k}`,
        task: () => downloadScreenshot(k)
      })),
      { concurrent: true }
    )
};

// const cmd = `ssh ${ip} "test -e ${picPath}"`;
const serverTestCall = (ip, serverTest) =>
  new Promise((resolve, reject) => {
    const cmd = `ssh ${ip} "${serverTest}"`;
    shell__default.exec(cmd, { silent: true }, code => {
      code === 0 ? resolve(ip) : reject();
    });
  });

const checkServer = (ip, serverTest) =>
  serverTestCall(ip, serverTest).catch(x => {});

const pickServer = (ips, serverTest) =>
  Promise.any(ips.map(ip => checkServer(ip, serverTest)));

const determineCorrectServer$$1 = (env, boxType, serverTest) =>
  getServersByRole(env, boxType).then(
    ips => (ips.length === 1 ? ips[0] : pickServer(ips, serverTest))
  );

const listrTask = {
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

const getServersByRole = (env, boxType) =>
  getAwsConfig().then(cfg => getServerIps(cfg, env, boxType));

const getManyServers = (envs, servers) =>
  getAwsConfig().then(cfg =>
    Promise.all(
      envs.reduce(
        (accum, env) => [
          ...accum,
          ...servers
            .map(server => getServerIps(cfg, env, server).catch(() => null))
            .filter(a => a !== null)
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

exports.listrTask = listrTask;
exports.getServersByRole = getServersByRole;
exports.getManyServers = getManyServers;
exports.getAwsConfig = getAwsConfig;
exports.getServerIps = getServerIps;
exports.getFileFromServer = getFileFromServer;
exports.downloadS3Task = downloadS3Task;
exports.determineCorrectServer = determineCorrectServer$$1;
