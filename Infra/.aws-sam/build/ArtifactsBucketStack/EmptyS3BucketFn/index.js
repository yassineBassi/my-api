const https = require("https");
const { URL } = require("url");
const { S3Client, ListObjectVersionsCommand, DeleteObjectsCommand } = require("@aws-sdk/client-s3");

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
            let keyMarker;
            let versionIdMarker;
            do {
                const resp = await s3.send(
                    new ListObjectVersionsCommand({
                        Bucket: bucketName,
                        KeyMarker: keyMarker,
                        VersionIdMarker: versionIdMarker
                    })
                );

                keyMarker = resp.NextKeyMarker;
                versionIdMarker = resp.NextVersionIdMarker;
                
                const objects = [];
                
                if (resp.Versions) {
                    for (const v of resp.Versions) {
                      objects.push({
                        Key: v.Key,
                        VersionId: v.VersionId,
                      });
                    }
                }

                if (resp.DeleteMarkers) {
                    for (const d of resp.DeleteMarkers) {
                      objects.push({
                        Key: d.Key,
                        VersionId: d.VersionId,
                      });
                    }
                }

                if (objects.length > 0) {
                    await s3.send(
                      new DeleteObjectsCommand({
                        Bucket: bucketName,
                        Delete: { Objects: objects },
                      })
                    );
                }
            } while (keyMarker);
        }

        await sendResponse("SUCCESS", event, context);
    } catch (err) {
        console.error(err);
        await sendResponse("FAILED", event, context, { Error: err.message });
        return;
    }
};