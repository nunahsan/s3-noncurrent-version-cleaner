const { exec } = require("child_process");
const fs = require('fs');


const PREFIX = process.env.PREFIX; //surex/production/BTC-USDT/
const FILE_JSON = `${PREFIX.replace(/\//g, '_')}.json`;
const ROWS_PER_PAGE = process.env.ROWS_PER_PAGE || 1000;
const SINGLE_FILE = process.env.SINGLE_FILE || false;
const BUCKET = process.env.BUCKET || 'bucketName';
const PROFILE = process.env.PROFILE || 'profileName';

var totalDeleted = 0;

class S3_CLEANER {
  constructor() {
    this.start();
  }

  async start() {
    let res = await this.getList();
    console.log(res);
    console.log('totalDeleted', totalDeleted);

    if (!res.status) {
      process.exit(0);
    }

    this.sleep(1500);
    this.start();
  }

  getList() {
    return new Promise((resolve, reject) => {
      exec(`aws s3api --profile ${PROFILE} list-object-versions --bucket ${BUCKET} --max-keys ${ROWS_PER_PAGE} --prefix ${PREFIX}`, async (error, stdout, stderr) => {
        if (error) {
          return resolve({ status: false, err: `${error.message}` });
        }

        if (stderr) {
          return resolve({ status: false, err: `${stderr}` });
        }

        let d = JSON.parse(stdout.toString());
        let row = d.Versions;

        let jsonData = {
          Objects: [],
          Quiet: false
        };

        for (var x in row) {
          let versionId = row[x].VersionId;
          let isLatest = row[x].IsLatest;
          let key = row[x].Key;

          // console.log('checking current key:', key, isLatest, versionId);

          if (!SINGLE_FILE) {
            if (key === PREFIX) continue;
          }
          if (isLatest) continue;
          // if (versionId === 'null') continue;

          jsonData.Objects.push({
            Key: key,
            VersionId: versionId
          });
        }

        if (!jsonData.Objects.length) {
          return resolve({ status: false, msg: 'No more data to delete' });
        }
        await this.setJsonToFile(`./${FILE_JSON}`, jsonData);

        let resDel = await this.deleteFile();
        resDel.totalData = jsonData.Objects.length;
        totalDeleted += resDel.totalData;
        resolve(resDel);
      });
    }).then((res) => {
      return res;
    });
  }

  deleteFile(d) {
    let command = `aws s3api --profile ${PROFILE} delete-objects --bucket ${BUCKET} --delete file://${FILE_JSON}`;

    return new Promise((resolve, reject) => {
      exec(command, (error, stdout, stderr) => {
        if (error) {
          return resolve({ status: false, err: `${error.message}` });
        }

        if (stderr) {
          return resolve({ status: false, err: `${stderr}` });
        }

        return resolve({ status: true, msg: stdout.toString() });
      });
    }).then((res) => {
      return res;
    });
  }

  sleep(delay) {
    return new Promise((resolve, reject) => {
      setTimeout(function () {
        resolve(true);
      }, delay);
    });
  }

  setJsonToFile(fname, content) {
    try {
      fs.writeFileSync(fname, JSON.stringify(content));
    } catch (err) {
      console.error(err);
    }
  }

}

new S3_CLEANER();
