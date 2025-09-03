'use client';

import { Modal, Form, Button, Upload, Space, Divider, message } from 'antd';
import { UploadOutlined, TwitterOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';

interface RagSettingsModalProps {
  open: boolean;
  onClose: () => void;
}

export const RagSettingsModal = ({ open, onClose }: RagSettingsModalProps) => {
  const [form] = Form.useForm();
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  const handleSubmit = async (values: any) => {
    // TODO: Implement backend integration
    console.log('Files:', fileList);
    message.success('Settings updated successfully');
    onClose();
  };

  const handleFileChange = (info: any) => {
    let newFileList = [...info.fileList];
    
    // Limit to 5 files
    newFileList = newFileList.slice(-5);
    
    // Read file contents
    newFileList = newFileList.map(file => {
      if (file.status === 'done') {
        file.url = URL.createObjectURL(file.originFileObj);
      }
      return file;
    });
    
    setFileList(newFileList);
  };

  const handleTwitterConnect = () => {
    // TODO: Implement Twitter OAuth redirect
    window.open('https://twitter.com/i/oauth2/authorize', '_blank');
  };

  return (
    <Modal
      title="Knowledge Base Settings"
      open={open}
      onCancel={onClose}
      footer={null}
      width={600}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleSubmit}
      >
        <Space direction="vertical" style={{ width: '100%' }} size="large">
          {/* File Upload Section */}
          <div>
            <Form.Item
              label="Document Upload"
              help="Upload documents (.txt, .md, .pdf) to build your knowledge base. Maximum 5 files."
            >
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false} // Prevent auto upload
                accept=".txt,.md,.pdf"
                multiple
              >
                <Button icon={<UploadOutlined />}>Upload Documents</Button>
              </Upload>
            </Form.Item>
          </div>

          <Divider />

          {/* Twitter Integration */}
          <div>
            <Form.Item
              label="Twitter Integration"
              help="Connect your Twitter account to include your tweets in your knowledge base"
            >
              <Button 
                icon={<TwitterOutlined />}
                onClick={handleTwitterConnect}
                type="default"
                style={{ 
                  backgroundColor: '#1DA1F2',
                  color: 'white',
                  borderColor: '#1DA1F2'
                }}
              >
                Connect with Twitter
              </Button>
            </Form.Item>
          </div>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Save Changes
              </Button>
              <Button onClick={onClose}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Space>
      </Form>
    </Modal>
  );
};
