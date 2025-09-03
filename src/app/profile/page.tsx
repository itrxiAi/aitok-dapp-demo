'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Avatar, Typography, List, Button, Form, Input, message, Space, Upload, Switch } from 'antd';
import { UserOutlined, EditOutlined, HeartOutlined, HeartFilled, CommentOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import type { RcFile, UploadProps } from 'antd/es/upload';
import type { UploadFile } from 'antd/es/upload/interface';
import { useRouter } from 'next/navigation';

const { Title, Text } = Typography;
const { TextArea } = Input;

interface UserProfile {
  wallet_address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  gender?: 'MALE' | 'FEMALE';
  avatar_url?: string;
  avatar_real_url?: string;
  posts: any[];
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

const getBase64 = (img: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener('load', () => resolve(reader.result as string));
    reader.addEventListener('error', reject);
    reader.readAsDataURL(img);
  });

export default function Profile() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [realImageUrl, setRealImageUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (publicKey) {
      fetchProfile();
    }
  }, [publicKey]);

  const fetchProfile = async () => {
    if (!publicKey) return;

    try {
      const userAddress = publicKey.toBase58();
      const data = await api.users.getProfile(userAddress, userAddress);
      setProfile(data);
      setImageUrl(data?.avatar_url);
      setRealImageUrl(data?.avatar_real_url);
    } catch (error) {
      console.error('Error fetching profile:', error);
      message.error('Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('You can only upload image files!');
      return false;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('Image must smaller than 2MB!');
      return false;
    }
    return true;
  };

  const handleUpload: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }

    if (info.file.status === 'done') {
      try {
        // Get the preview
        const base64Url = await getBase64(info.file.originFileObj as RcFile);
        setImageUrl(base64Url);
        
        // Get the uploaded file URL from the response
        const uploadedUrl = info.file.response.url;
        form.setFieldValue('avatar_url', uploadedUrl);
        
        setUploading(false);
      } catch (error) {
        console.error('Error processing image:', error);
        message.error('Failed to process image');
        setUploading(false);
      }
    }
  };

  const handleRealUpload: UploadProps['onChange'] = async (info) => {
    if (info.file.status === 'uploading') {
      setUploading(true);
      return;
    }

    if (info.file.status === 'done') {
      try {
        // Get the uploaded file URL from the response
        const uploadedUrl = info.file.response.url;
        console.log('Real portrait URL:', uploadedUrl);
        setRealImageUrl(uploadedUrl);
        form.setFieldValue('avatar_real_url', uploadedUrl);
        console.log('Form values after setting real portrait:', form.getFieldsValue());
        
        setUploading(false);
      } catch (error) {
        console.error('Error processing image:', error);
        message.error('Failed to process image');
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async (values: any) => {
    if (!publicKey) return;

    try {
      console.log('Updating profile with values:', values);
      await api.users.updateProfile(publicKey.toBase58(), values);
      message.success('Profile updated successfully');
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    }
  };

  const handleLike = async (postId: string) => {
    if (!publicKey) return;

    try {
      const post = profile?.posts.find(p => p.id === postId);
      const isLiked = post?.likes.some(like => like.user_address === publicKey.toBase58());

      if (isLiked) {
        await api.posts.unlike(postId, { user_address: publicKey.toBase58() });
      } else {
        await api.posts.like(postId, { user_address: publicKey.toBase58() });
      }

      fetchProfile();
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      message.error('Failed to like/unlike post');
    }
  };

  if (!publicKey) {
    return (
      <Card>
        <Title level={2}>Profile</Title>
        <p>Please connect your wallet to view your profile</p>
      </Card>
    );
  }

  if (loading) {
    return <Card loading={true} />;
  }

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const shortenedAddress = `${publicKey.toBase58().slice(0, 4)}...${publicKey.toBase58().slice(-4)}`;

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card styles={{ body: { padding: '12px' } }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Space align="start" size="large">
            <Avatar 
              size={64} 
              icon={<UserOutlined />} 
              src={profile?.avatar_url}
            />
            <div>
              <Title level={3} style={{ margin: 0, marginBottom: 8 }}>
                <Space align="center">
                  {profile?.display_name || profile?.username || shortenedAddress}
                  <Button 
                    type="text"
                    icon={<EditOutlined style={{ color: '#1677ff' }} />} 
                    onClick={() => {
                      form.setFieldsValue({
                        username: profile?.username,
                        display_name: profile?.display_name,
                        bio: profile?.bio,
                        gender: profile?.gender,
                        avatar_url: profile?.avatar_url,
                        avatar_real_url: profile?.avatar_real_url,
                      });
                      setEditing(true);
                    }}
                    style={{ 
                      border: 'none', 
                      padding: '4px',
                      height: 'auto',
                      marginLeft: '4px'
                    }}
                  />
                </Space>
              </Title>
              <Text type="secondary">{publicKey.toBase58()}</Text>
              {profile?.bio && <p>{profile.bio}</p>}
              <Space size="large">
                <Text strong>{profile?.posts?.length || 0} Posts</Text>
                <Text strong>{profile?._count.followers || 0} Followers</Text>
                <Text onClick={() => router.push(`/users/${publicKey?.toBase58()}/following`)} style={{ cursor: 'pointer', fontWeight: 'bold' }}>
                  {profile?._count.following || 0} Following
                </Text>
              </Space>
            </div>
          </Space>
        </div>
      </Card>

      {editing && (
        <Card styles={{ body: { padding: '12px' } }}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdateProfile}
          >
            <Space size="large">
              <Form.Item label="Portrait">
                <Upload
                  name="file"
                  listType="picture-card"
                  showUploadList={false}
                  action="/api/upload"
                  beforeUpload={beforeUpload}
                  onChange={handleUpload}
                >
                  {imageUrl ? (
                    <img 
                      src={imageUrl} 
                      alt="Portrait" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>

              <Form.Item label="Avatar">
                <Upload
                  name="file"
                  listType="picture-card"
                  showUploadList={false}
                  action="/api/upload"
                  beforeUpload={beforeUpload}
                  onChange={handleRealUpload}
                >
                  {realImageUrl ? (
                    <img 
                      src={realImageUrl} 
                      alt="Avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  ) : (
                    uploadButton
                  )}
                </Upload>
              </Form.Item>
            </Space>

            <Form.Item
              name="gender"
              label="Gender"
              valuePropName="checked"
              getValueFromEvent={(checked: boolean) => checked ? 'MALE' : 'FEMALE'}
              getValueProps={(value: string) => ({ checked: value === 'MALE' })}
            >
              <Switch
                checkedChildren="Male"
                unCheckedChildren="Female"
                style={{ backgroundColor: undefined }}
                className={form.getFieldValue('gender') === 'MALE' ? '' : 'female-switch'}
              />
            </Form.Item>

            <Form.Item
              name="username"
              label="Username"
              rules={[{ required: true, message: 'Please enter a username' }]}
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="display_name"
              label="Display Name"
            >
              <Input />
            </Form.Item>

            <Form.Item
              name="bio"
              label="Bio"
            >
              <TextArea rows={3} />
            </Form.Item>

            <Form.Item name="avatar_url" hidden>
              <Input />
            </Form.Item>

            <Form.Item name="avatar_real_url" hidden>
              <Input />
            </Form.Item>

            <Form.Item>
              <Space>
                <Button type="primary" htmlType="submit">
                  Save Profile
                </Button>
                <Button onClick={() => setEditing(false)}>
                  Cancel
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      )}

      <style jsx global>{`
        .female-switch.ant-switch:not(.ant-switch-checked) {
          background-color: #ff69b4 !important;
        }
      `}</style>

      <Card styles={{ body: { padding: '12px' } }}>
        <Title level={4} style={{ margin: 0, marginBottom: 12 }}>Your Posts</Title>
        <List
          itemLayout="vertical"
          dataSource={profile?.posts || []}
          style={{ marginTop: 8 }}
          renderItem={(post) => {
            const isLiked = post.likes.some(like => like.user_address === publicKey.toBase58());
            
            return (
              <Card 
                style={{ marginBottom: 8, cursor: 'pointer' }}
                onClick={() => router.push(`/posts/${post.id}`)}
                styles={{ body: { padding: '12px' } }}
              >
                <List.Item
                  key={post.id}
                  style={{ padding: 0 }}
                  actions={[
                    <Space key="actions" onClick={(e) => e.stopPropagation()}>
                      <Button 
                        type="text" 
                        icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
                        onClick={() => handleLike(post.id)}
                      >
                        {post.likes.length}
                      </Button>
                      <Button 
                        type="text" 
                        icon={<CommentOutlined />}
                        onClick={() => router.push(`/posts/${post.id}#comments`)}
                      >
                        {post.comments.length}
                      </Button>
                    </Space>
                  ]}
                >
                  <List.Item.Meta
                    avatar={<Avatar icon={<UserOutlined />} src={profile.avatar_url} />}
                    title={profile.display_name || profile.username || shortenedAddress}
                    description={new Date(post.created_at).toLocaleString()}
                  />
                  {post.content}
                  {post.media_url && post.media_url.length > 0 && (
                    <div style={{ 
                      marginTop: 8,
                      display: 'flex',
                      justifyContent: 'center',
                      alignItems: 'center',
                      backgroundColor: '#f0f0f0',
                      padding: '16px',
                      borderRadius: '8px'
                    }}>
                      {post.media_url[0].toLowerCase().endsWith('.mp4') || 
                        post.media_url[0].toLowerCase().endsWith('.mov') || 
                        post.media_url[0].toLowerCase().endsWith('.m4v') ? (
                        <div onClick={(e) => e.stopPropagation()}>
                          <video 
                            controls 
                            style={{ 
                              maxWidth: '100%',
                              maxHeight: '500px',
                              borderRadius: '8px',
                              backgroundColor: '#000'
                            }}
                          >
                            <source src={post.media_url[0]} type="video/mp4" />
                            Your browser does not support the video tag.
                          </video>
                        </div>
                      ) : (
                        <img
                          src={post.media_url[0]}
                          alt="Post media"
                          style={{ 
                            maxWidth: '100%',
                            maxHeight: '500px',
                            borderRadius: '8px',
                            objectFit: 'contain'
                          }}
                        />
                      )}
                    </div>
                  )}
                </List.Item>
              </Card>
            );
          }}
        />
      </Card>
    </div>
  );
}
