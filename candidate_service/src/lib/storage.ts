import { S3Client } from "bun";

const s3Client = new S3Client({
    accessKeyId: process.env.ACCESS_KEY_ID!,
    secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    bucket: "cv",
    endpoint: process.env.ENDPOINT,
    region: process.env.REGION,
});

const BUCKET_NAME = "cv";

export const uploadCV = async (file: File, key: string): Promise<string> => {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        const s3File = s3Client.file(key);

        await s3File.write(buffer, {
            type: "application/pdf"
        });

        const url = s3File.presign({
            expiresIn: 31536000,
        });

        console.log(`✅ CV uploaded to S3: ${url}`);
        return url;
    } catch (error: any) {
        console.error("❌ S3 Upload Error:", error);
        throw new Error(`S3 Upload failed: ${error.message}`);
    }
};

export const getSignedUrl = async (key: string, expiresIn: number = 86400): Promise<string> => {
    try {
        const s3File = s3Client.file(key);
        return s3File.presign({ expiresIn });
    } catch (error: any) {
        console.error("❌ S3 Presign Error:", error);
        throw new Error(`S3 Presign failed: ${error.message}`);
    }
};
