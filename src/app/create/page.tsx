'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Form, Input, Upload, Button, message, Checkbox } from 'antd';
import { InboxOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { api } from '@/services/api';
import { useRouter } from 'next/navigation';

const { TextArea } = Input;
const { Dragger } = Upload;

const ALLOWED_FILE_TYPES = {
  'image/jpeg': true,
  'image/png': true,
  'image/gif': true,
  'video/mp4': true,
  'video/quicktime': true,
  'video/x-m4v': true
};

const FILE_SIZE_LIMITS = {
  image: 2, // 2MB for images
  video: 50 // 50MB for videos
};

export default function CreatePost() {
  const { publicKey } = useWallet();
  const [form] = Form.useForm();
  const [uploading, setUploading] = useState(false);
  const [fileList, setFileList] = useState([]);
  const router = useRouter();

  if (!publicKey) {
    return (
      <Card>
        <h1>Create Post</h1>
        <p>Please connect your wallet to create a post</p>
      </Card>
    );
  }

  const handleSubmit = async (values: any) => {
    try {
      setUploading(true);
      
      // Extract hashtags from content
      const hashtags = values.content.match(/#[a-zA-Z0-9]+/g)?.map((tag: string) => tag.slice(1)) || [];
      
      // Handle file upload
      let mediaUrls: string[] = [];
      if (fileList.length > 0) {
        const file = fileList[0].originFileObj;
        const filename = `${Date.now()}-${file.name}`;
        
        // Create FormData and append file
        const formData = new FormData();
        formData.append('file', file);
        formData.append('filename', filename);
        formData.append('type', file.type.startsWith('video/') ? 'video' : 'image');
        
        // Upload file
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (!uploadResponse.ok) {
          throw new Error('Failed to upload file');
        }
        
        const { url } = await uploadResponse.json();
        mediaUrls = [url];
      }

      // Create post using our API
      await api.posts.create({
        author_address: publicKey.toBase58(),
        content: values.content,
        media_url: mediaUrls,
        tags: hashtags,
        is_unfollow: values.is_unfollow
      });

      message.success('Post created successfully!');
      form.resetFields();
      setFileList([]);
      
      // Navigate back to home page
      router.push('/');
    } catch (error) {
      console.error('Error creating post:', error);
      message.error('Failed to create post');
    } finally {
      setUploading(false);
    }
  };

  const uploadProps = {
    name: 'file',
    multiple: false,
    fileList,
    beforeUpload: (file: File) => {
      // Check if file type is allowed
      if (!ALLOWED_FILE_TYPES[file.type]) {
        message.error('You can only upload images (JPG, PNG, GIF) or videos (MP4, MOV)!');
        return false;
      }

      // Get appropriate size limit based on file type
      const isVideo = file.type.startsWith('video/');
      const sizeLimit = isVideo ? FILE_SIZE_LIMITS.video : FILE_SIZE_LIMITS.image;
      const fileSizeMB = file.size / 1024 / 1024;

      if (fileSizeMB > sizeLimit) {
        message.error(`File must be smaller than ${sizeLimit}MB!`);
        return false;
      }

      return false; // Prevent automatic upload
    },
    onChange(info: any) {
      setFileList(info.fileList.slice(-1));
    },
    onDrop(e: any) {
      console.log('Dropped files', e.dataTransfer.files);
    },
  };

  return (
    <Card title="Create New Post">
      <Form form={form} layout="vertical" onFinish={handleSubmit}>
        <Form.Item
          name="content"
          rules={[{ required: true, message: 'Please enter your post content' }]}
        >
          <TextArea
            rows={4}
            placeholder="What's on your mind? Use #hashtags to add tags!"
            maxLength={280}
            showCount
          />
        </Form.Item>

        <Form.Item name="media">
          <Dragger {...uploadProps}>
            <p className="ant-upload-drag-icon">
              <InboxOutlined />
            </p>
            <p className="ant-upload-text">
              Click or drag file to this area to upload
            </p>
            <p className="ant-upload-hint">
              Support for a single image file (max 2MB) or video file (max 50MB).
            </p>
          </Dragger>
        </Form.Item>

        <Form.Item 
          name="is_unfollow" 
          valuePropName="checked"
          initialValue={false}
        >
          <Checkbox>Make this post visible to unfollowed users</Checkbox>
        </Form.Item>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={uploading} block>
            Create Post
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
}
