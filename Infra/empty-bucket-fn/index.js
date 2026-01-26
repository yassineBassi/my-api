const https = require("https");
const { URL } = require("url");
const { S3Client, ListObjectsV2Command, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

const s3 = new S3Client({});

const sendResponse = async (status, event, context, data = {}) => {
    const responseBody = JSON.stringify({
        Status: status,
        Reason: `See CloudWatch Logs: ${context.logStreamName}`,
        PhysicalResourceId: event.PhysicalResourceId || context.logStreamName,
        StackId: event.StackId,
        RequestId: event.RequestId,
        LogicalResourceId: event.LogicalResourceId,
        Data: data
    });

    const parsedUrl = new URL(event.ResponseURL);

    const options = {
        hostname: parsedUrl.hostname,
        port: 443,
        path: parsedUrl.pathname + parsedUrl.search,
        method: "PUT",
        headers: {
        "Content-Type": "",
        "Content-Length": Buffer.byteLength(responseBody)
        }
    };

    return new Promise((resolve, reject) => {
        const req = https.request(options, res => resolve());
        req.on("error", reject);
        req.write(responseBody);
        req.end();
    });
};

exports.handler = async (event, context) => {
    console.log("EVENT:", JSON.stringify(event, null, 2));

    try {
        const bucketName = event.ResourceProperties.bucket_name;
        console.log(`Emptying bucket: ${bucketName}`);

        if (event.RequestType === "Delete") {
            let token;
            do {
                const listResp = await s3.send(
                new ListObjectsV2Command({
                    Bucket: bucketName,
                    ContinuationToken: token
                })
                );

                token = listResp.NextContinuationToken;

                if (listResp.Contents && listResp.Contents.length > 0) {
                await s3.send(
                    new DeleteObjectsCommand({
                    Bucket: bucketName,
                    Delete: {
                        Objects: listResp.Contents.map(o => ({ Key: o.Key }))
                    }
                    })
                );
                }
            } while (token);
        }

        await sendResponse("SUCCESS", event, context);
    } catch (err) {
        console.error(err);
        await sendResponse("FAILED", event, context, { Error: err.message });
        return;
    }
};