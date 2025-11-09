import { HttpStatus, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk'
import { PutObjectRequest } from "aws-sdk/clients/s3";
import { randomUUID } from "crypto";
import { Result } from "src/interfaces/result.interface";

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_ACCESS_KEY_SECRET,
      region: process.env.AWS_REGION,
    });
  }

  async getFiles(bucket: string, prefix: string): Promise<string[]> {
    const params = {
      Bucket: bucket,
      Prefix: prefix,
    };

    try {
      const data = await this.s3.listObjectsV2(params).promise();
      const fileNames = data.Contents.map((file) => file.Key.replace(prefix, '')).filter(fileName => fileName !== '');
      return fileNames;
    } catch (error) {
      console.error('Error listing files from S3:', error);
      throw error;
    }
  }

  async uploadFile(key: string, file: Express.Multer.File): Promise<Result<string>> {
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${randomUUID()}.${fileExtension}`;

    const params: PutObjectRequest = {
      Bucket: process.env.AWS_BUCKET,
      Key: `${key}/${fileName}`,
      Body: file.buffer,
      ContentType: file.mimetype
    };

    try {
      const data = await this.s3.upload(params).promise();
      return {
        status: HttpStatus.OK,
        message: "File uploaded successfully",
        data: fileName,
      }
    } catch (error) {
      console.error(error);
      return {
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
        message: "Failed uploading file"
      };
    }


  }
}
