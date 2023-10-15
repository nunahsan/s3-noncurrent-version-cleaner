# s3-noncurrent-version-cleaner
To remove noncurrent version from aws s3

# setup instruction
```
npm i
```

# prepare aws profile under ~/.aws folder

~/.aws/config file content as below
```
[profile test]
output = json
region = ap-southeast-1
source_profile = test
```

~/.aws/credentials
```
[test]
aws_access_key_id = XXXXXXXX
aws_secret_access_key = XXXXXXXX
```

# sample call to remove noncurrent version starting from given path
```
env PROFILE=<awsProfile> BUCKET=<bucketName> PREFIX=xxx/yyy/ node index.js
```

# sample call to remove noncurrent version of single file:
```
env PROFILE=<awsProfile> BUCKET=<bucketName> SINGLE_FILE=true PREFIX=xxx/yyy/abc.png node index.js
```
