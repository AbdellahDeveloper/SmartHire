import { S3Client } from "bun";

const s3Client = new S3Client({
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    bucket: process.env.S3_CONTRACTS_BUCKET_NAME || "contracts",
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION || "eu-west-1",
});

export const generateSignedUrl = async (bucket: string, key: string, expiresIn: number = 86400) => {
    return s3Client.file(key).presign({
        expiresIn
    });
};

export const uploadToS3 = async (
    bucket: string,
    key: string,
    body: Buffer,
    contentType: string = "application/pdf"
) => {
    const file = s3Client.file(key);

    await file.write(body, {
        type: contentType
    });

    const url = await generateSignedUrl(bucket, key, 86400);

    return {
        bucket,
        key,
        url
    };
};

export { s3Client };

