export default {
  dest: 'bundle.js',
  format: 'cjs',
  entry: 'src/index.js',
  external: ['listr', 'isomorphic-fetch', 'aws-sdk', 'shelljs', 'path', 'fs']
};
