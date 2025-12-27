import boto3
from botocore.client import Config
from botocore.exceptions import ClientError
from typing import BinaryIO, Optional
import logging
from pathlib import Path

from app.core.config import settings

logger = logging.getLogger(__name__)


class StorageService:
    
    def __init__(self):
        self.session = boto3.session.Session()
        self.s3_client = self.session.client(
            service_name='s3',
            endpoint_url=settings.yandex_storage_endpoint,
            aws_access_key_id=settings.yandex_storage_access_key,
            aws_secret_access_key=settings.yandex_storage_secret_key,
            region_name=settings.yandex_storage_region,
            config=Config(signature_version='s3v4')
        )
        self.bucket_name = settings.yandex_storage_bucket_name
        logger.info(f"StorageService initialized with bucket: {self.bucket_name}")
        
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket '{self.bucket_name}' exists")
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', '')
            if error_code == '404':
                logger.warning(f"Bucket '{self.bucket_name}' does not exist. Creating...")
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Bucket '{self.bucket_name}' created successfully")
                    
                    try:
                        self.s3_client.put_bucket_acl(
                            Bucket=self.bucket_name,
                            ACL='public-read'
                        )
                        logger.info(f"Bucket '{self.bucket_name}' set to public-read")
                    except Exception as acl_error:
                        logger.warning(f"Could not set bucket ACL (you may need to do this manually): {acl_error}")
                        
                except ClientError as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
                    logger.error(f"Please create bucket '{self.bucket_name}' manually in Yandex Cloud Console")
                    logger.error(f"Instructions: https://cloud.yandex.ru/docs/storage/operations/buckets/create")
            else:
                logger.error(f"Error checking bucket: {e}")
    
    def upload_file(
        self, 
        file_content: bytes, 
        object_name: str,
        content_type: Optional[str] = None
    ) -> str:
        try:
            extra_args = {}
            if content_type:
                extra_args['ContentType'] = content_type
            
            extra_args['ACL'] = 'public-read'
            
            self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=object_name,
                Body=file_content,
                **extra_args
            )
            
            file_url = f"{settings.yandex_storage_endpoint}/{self.bucket_name}/{object_name}"
            logger.info(f"File uploaded successfully: {object_name}")
            return file_url
            
        except ClientError as e:
            logger.error(f"Error uploading file to storage: {e}")
            error_msg = str(e)
            if 'NoSuchBucket' in error_msg:
                logger.error(f"❌ Bucket '{self.bucket_name}' does not exist!")
                logger.error(f"Please create it manually in Yandex Cloud Console:")
                logger.error(f"1. Go to https://console.cloud.yandex.ru/folders/{settings.yandex_storage_region}/storage")
                logger.error(f"2. Click 'Create bucket'")
                logger.error(f"3. Name it: {self.bucket_name}")
                logger.error(f"4. Enable 'Public access' for reading objects")
            raise Exception(f"Failed to upload file: {str(e)}")
    
    def download_file(self, object_name: str) -> bytes:

        try:
            response = self.s3_client.get_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
            return response['Body'].read()
            
        except ClientError as e:
            logger.error(f"Error downloading file from storage: {e}")
            raise Exception(f"Failed to download file: {str(e)}")
    
    def delete_file(self, object_name: str) -> bool:
        try:
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
            logger.info(f"File deleted successfully: {object_name}")
            return True
            
        except ClientError as e:
            logger.error(f"Error deleting file from storage: {e}")
            return False
    
    def file_exists(self, object_name: str) -> bool:
        try:
            self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=object_name
            )
            return True
        except ClientError:
            return False
    
    def get_file_url(self, object_name: str) -> str:
        return f"{settings.yandex_storage_endpoint}/{self.bucket_name}/{object_name}"
    
    def generate_presigned_url(
        self, 
        object_name: str, 
        expiration: int = 3600
    ) -> str:

        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={
                    'Bucket': self.bucket_name,
                    'Key': object_name
                },
                ExpiresIn=expiration
            )
            return url
        except ClientError as e:
            logger.error(f"Error generating presigned URL: {e}")
            raise Exception(f"Failed to generate URL: {str(e)}")


storage_service = StorageService()
