export default {
  dest: 'bundle.js',
  format: 'es',
  entry: 'src/index.js',
  external: ['listr', 'isomorphic-fetch', 'aws-sdk', 'shelljs', 'path', 'fs']
};
