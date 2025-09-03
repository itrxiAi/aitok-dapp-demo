'use client';

import { Card, Upload, Button, Typography, Space, Table, message, Tooltip } from 'antd';
import { UploadOutlined, DeleteOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';
import type { UploadFile } from 'antd/es/upload/interface';
import { useAuth } from '@/hooks/useAuth';
import { api } from '@/services/api';

const { Title } = Typography;

interface UserFile {
  id: string;
  file_name: string;
  file_type: string;
  created_at: string;
}

export default function KnowledgeBasePage() {
  const { walletAddress } = useAuth();
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  const [userFiles, setUserFiles] = useState<UserFile[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch user files on component mount
  useEffect(() => {
    if (walletAddress) {
      fetchUserFiles();
    }
  }, [walletAddress]);

  const fetchUserFiles = async () => {
    try {
      setLoading(true);
      const files = await api.userFiles.list(walletAddress!);
      setUserFiles(files);
    } catch (error) {
      message.error('Failed to fetch files');
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      title: 'File Name',
      dataIndex: 'file_name',
      key: 'file_name',
    },
    {
      title: 'Type',
      dataIndex: 'file_type',
      key: 'file_type',
      render: (text: string) => text.toUpperCase(),
    },
    {
      title: 'Uploaded',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (date: string) => new Date(date).toLocaleDateString(),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: UserFile) => (
        <Space>
          <Tooltip title="Delete">
            <Button 
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
              type="link"
              danger
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  const handleFileChange = (info: any) => {
    setFileList(info.fileList.slice(-5)); // Keep only last 5 files
  };

  const handleUpload = async () => {
    try {
      setLoading(true);
      
      // Store each file name in the database
      for (const file of fileList) {
        const fileType = file.name.split('.').pop()?.toLowerCase() || '';
        await api.userFiles.create({
          userAddress: walletAddress!,
          fileName: file.name,
          fileType: fileType,
        });
      }

      // Clear file list and refresh table
      setFileList([]);
      await fetchUserFiles();
      message.success('Files uploaded successfully');
    } catch (error) {
      message.error('Failed to upload files');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (file: UserFile) => {
    try {
      setLoading(true);
      await api.userFiles.delete(file.id);
      await fetchUserFiles();
      message.success(`${file.file_name} deleted successfully`);
    } catch (error) {
      message.error('Failed to delete file');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '24px' }}>
      <Title level={2}>Knowledge Base</Title>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* File Upload Section */}
        <Card title="Document Upload">
          <Space direction="vertical" style={{ width: '100%' }} size="large">
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept=".txt,.md,.pdf"
                multiple
                showUploadList={false}
              >
                <Button icon={<UploadOutlined />}>Select Documents</Button>
              </Upload>
              <Button 
                type="primary" 
                onClick={handleUpload}
                disabled={fileList.length === 0}
                loading={loading}
              >
                Upload Documents
              </Button>
            </div>
            
            {fileList.length > 0 && (
              <Upload
                fileList={fileList}
                onChange={handleFileChange}
                beforeUpload={() => false}
                accept=".txt,.md,.pdf"
                multiple
                showUploadList={{ showRemoveIcon: true }}
              />
            )}
            
            <div style={{ color: '#666' }}>
              Upload documents (.txt, .md, .pdf) to build your knowledge base. Maximum 5 files.
            </div>
            
            {/* Files Table */}
            <Table 
              columns={columns} 
              dataSource={userFiles}
              loading={loading}
              pagination={false}
              size="middle"
              rowKey="id"
            />
          </Space>
        </Card>
      </Space>
    </div>
  );
}
