import boto from 'aws-sdk';

export default (cfg, env, boxType) =>
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
