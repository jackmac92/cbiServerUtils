import fetch from 'isomorphic-fetch';
const CBI_ENV_LOCATION = 'http://s3.amazonaws.com/cbi-wiki/cbi-env.json';

export default () =>
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
