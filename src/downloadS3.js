import aws from 'aws-sdk';
import path from 'path';
import fs from 'fs';
import Listr from 'listr';

const s3 = new aws.S3();

const downloadScreenshot = (Key, tmpDir = 0) =>
  new Promise((resolve, reject) => {
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
    );
  });

const listrTask = {
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
export default listrTask;
