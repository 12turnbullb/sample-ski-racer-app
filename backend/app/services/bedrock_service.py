"""
Amazon Bedrock service for ski form analysis.

This module provides integration with Amazon Bedrock's Claude Sonnet model
to analyze ski videos and images for form feedback.
"""

import boto3
import logging
import os
from typing import Optional
from botocore.exceptions import ClientError

logger = logging.getLogger(__name__)


class BedrockServiceError(Exception):
    """Base exception for Bedrock service errors."""
    pass


class BedrockService:
    """
    Service class for Amazon Bedrock video/image analysis.
    
    Provides methods for analyzing ski videos and images using Claude Sonnet
    via the Bedrock Converse API.
    """
    
    def __init__(self, region_name: str = None):
        """
        Initialize the Bedrock service with AWS credentials.

        Args:
            region_name: AWS region for Bedrock service (default: AWS_REGION env var or us-east-1)
        """
        try:
            aws_profile = os.getenv("AWS_PROFILE", "default")
            aws_region = region_name or os.getenv("AWS_REGION", "us-east-1")
            session = boto3.Session(profile_name=aws_profile, region_name=aws_region)
            self.bedrock_client = session.client(service_name='bedrock-runtime')
            # Model IDs for different media types
            self.claude_model_id = "us.anthropic.claude-sonnet-4-5-20250929-v1:0"  # For images
            self.nova_model_id = "us.amazon.nova-pro-v1:0"  # For videos
        except Exception as e:
            logger.error(f"Failed to initialize Bedrock client: {str(e)}")
            raise BedrockServiceError(f"Failed to initialize Bedrock client: {str(e)}") from e
    
    def analyze_ski_form(
        self,
        file_path: str,
        file_type: str,
        filename: str
    ) -> str:
        """
        Analyze ski form from a video or image file using Claude.
        
        Sends the file to Claude Sonnet via Bedrock Converse API and requests
        detailed feedback on ski positioning and technique.
        
        Args:
            file_path: Path to the video or image file on disk
            file_type: MIME type of the file
            filename: Original filename for context
            
        Returns:
            str: AI-generated analysis of ski form
            
        Raises:
            BedrockServiceError: If analysis fails
        """
        import time
        start_time = time.time()
        
        try:
            # Read file content
            logger.info(f"Reading file: {filename} ({file_type})")
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            file_size_mb = len(file_content) / (1024 * 1024)
            logger.info(f"File size: {file_size_mb:.2f} MB")
            
            # Determine if this is a video or image
            is_video = file_type.startswith('video/')
            is_image = file_type.startswith('image/')
            
            if not is_video and not is_image:
                raise BedrockServiceError(f"Unsupported file type: {file_type}")
            
            # Prepare the prompt for ski form analysis
            prompt_text = """You are an expert ski coach analyzing ski technique and form. 
Please provide detailed feedback on the skier's form in this media.

Format your response in Markdown with clear headings and bullet points:

## Body Position
Analyze stance, balance, and center of gravity

## Edge Control
Evaluate how the skier uses their edges

## Turn Technique
Assess turn initiation, execution, and completion

## Pole Plant
Review timing and effectiveness of pole plants

## Overall Form
Provide an overall assessment and rating (e.g., Beginner/Intermediate/Advanced)

## Specific Improvements
List 3-5 specific actionable improvements as bullet points

Be constructive, specific, and encouraging in your feedback."""
            
            # Build the message content based on file type
            if is_image:
                # For images, use Claude Sonnet
                model_id = self.claude_model_id
                image_format = self._get_image_format(file_type)
                logger.info(f"Preparing image analysis request (format: {image_format})")
                
                message_content = [
                    {"text": prompt_text},
                    {
                        "image": {
                            "format": image_format,
                            "source": {"bytes": file_content}
                        }
                    }
                ]
            else:
                # For videos, use Amazon Nova Pro
                model_id = self.nova_model_id
                video_format = self._get_video_format(file_type)
                logger.info(f"Preparing video analysis request (format: {video_format})")
                logger.info(f"Note: Video analysis may take 30-120 seconds depending on file size")
                
                message_content = [
                    {"text": prompt_text},
                    {
                        "video": {
                            "format": video_format,
                            "source": {"bytes": file_content}
                        }
                    }
                ]
            
            # Prepare the message
            message = {
                "role": "user",
                "content": message_content
            }
            
            messages = [message]
            
            # Call Bedrock Converse API with the appropriate model
            media_type = "video" if is_video else "image"
            model_name = "Amazon Nova Pro" if is_video else "Claude Sonnet 4.5"
            logger.info(f"Sending {media_type} to Bedrock model {model_name} ({model_id})...")
            
            try:
                response = self.bedrock_client.converse(
                    modelId=model_id,
                    messages=messages,
                    inferenceConfig={
                        "temperature": 0.5,
                        "maxTokens": 2048
                    }
                )
            except ClientError as e:
                error_code = e.response.get('Error', {}).get('Code', 'Unknown')
                error_message = e.response.get('Error', {}).get('Message', str(e))
                
                # Provide more helpful error messages
                if error_code == 'ValidationException':
                    if 'video' in error_message.lower() and is_video:
                        raise BedrockServiceError(
                            "Video format not supported. "
                            "Amazon Nova Pro may not be available in your region or account. "
                            "Please check AWS Bedrock console for model access, or try uploading an image instead."
                        )
                    else:
                        raise BedrockServiceError(f"Validation error: {error_message}")
                elif error_code == 'AccessDeniedException':
                    model_name = "Amazon Nova Pro" if is_video else "Claude Sonnet 4.5"
                    raise BedrockServiceError(
                        f"Access denied to {model_name} model. "
                        f"Please ensure your AWS credentials have the 'bedrock:InvokeModel' permission "
                        f"and that you have requested access to {model_name} in the Bedrock console."
                    )
                elif error_code == 'ResourceNotFoundException':
                    model_name = "Amazon Nova Pro" if is_video else "Claude Sonnet 4.5"
                    raise BedrockServiceError(
                        f"{model_name} model not found. "
                        f"This model may not be available in your AWS region. "
                        f"Try using us-east-1 or check the Bedrock console for available models."
                    )
                elif error_code == 'ThrottlingException':
                    raise BedrockServiceError(
                        "Too many requests to Bedrock. Please wait a moment and try again."
                    )
                elif error_code == 'ServiceQuotaExceededException':
                    raise BedrockServiceError(
                        "Service quota exceeded. Your AWS account may have reached its Bedrock usage limit."
                    )
                else:
                    raise BedrockServiceError(f"Bedrock API error ({error_code}): {error_message}")
            
            elapsed_time = time.time() - start_time
            logger.info(f"Bedrock API call completed in {elapsed_time:.1f} seconds")
            
            # Extract the analysis text from response
            output_message = response['output']['message']
            analysis_text = ""
            
            for content in output_message['content']:
                if 'text' in content:
                    analysis_text += content['text']
            
            if not analysis_text:
                raise BedrockServiceError("Bedrock returned an empty response")
            
            # Log token usage
            token_usage = response.get('usage', {})
            logger.info(f"Analysis complete. Input tokens: {token_usage.get('inputTokens', 0)}, "
                       f"Output tokens: {token_usage.get('outputTokens', 0)}, "
                       f"Total time: {elapsed_time:.1f}s")
            
            return analysis_text
            
        except ClientError as e:
            # Already handled above, but catch any that slipped through
            error_message = e.response.get('Error', {}).get('Message', str(e))
            logger.error(f"Bedrock API error: {error_message}")
            raise BedrockServiceError(f"Failed to analyze ski form: {error_message}") from e
        except FileNotFoundError as e:
            logger.error(f"File not found: {file_path}")
            raise BedrockServiceError(f"File not found: {file_path}") from e
        except Exception as e:
            elapsed_time = time.time() - start_time
            logger.error(f"Unexpected error during analysis after {elapsed_time:.1f}s: {str(e)}")
            raise BedrockServiceError(f"Unexpected error during analysis: {str(e)}") from e
    
    def _get_image_format(self, file_type: str) -> str:
        """
        Get the image format string for Bedrock API from MIME type.
        
        Args:
            file_type: MIME type (e.g., 'image/jpeg')
            
        Returns:
            Format string for Bedrock API ('jpeg', 'png', etc.)
        """
        format_map = {
            'image/jpeg': 'jpeg',
            'image/jpg': 'jpeg',
            'image/png': 'png',
            'image/gif': 'gif',
            'image/webp': 'webp'
        }
        return format_map.get(file_type.lower(), 'jpeg')
    
    def _get_video_format(self, file_type: str) -> str:
        """
        Get the video format string for Bedrock API from MIME type.
        
        Args:
            file_type: MIME type (e.g., 'video/mp4')
            
        Returns:
            Format string for Bedrock API ('mp4', 'mov', etc.)
        """
        format_map = {
            'video/mp4': 'mp4',
            'video/quicktime': 'mov',
            'video/x-m4v': 'mp4',
            'video/mpeg': 'mpeg',
            'video/webm': 'webm',
            'video/x-matroska': 'mkv'
        }
        return format_map.get(file_type.lower(), 'mp4')
