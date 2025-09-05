'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Avatar, Typography, List, Button, Form, Input, message, Space, Upload, Switch, Tabs } from 'antd';
import { UserOutlined, EditOutlined, HeartOutlined, HeartFilled, CommentOutlined, LoadingOutlined, PlusOutlined } from '@ant-design/icons';
import { Post } from '@/components/Post';
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
  const [activeTab, setActiveTab] = useState('posts');
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [collectedPosts, setCollectedPosts] = useState<any[]>([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [collectedPostsLoading, setCollectedPostsLoading] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [publicKey]);
  
  // Function to fetch user's own posts
  const fetchUserPosts = async () => {
    if (!publicKey) return;
    
    setPostsLoading(true);
    try {
      const userAddress = publicKey.toBase58();
      const data = await api.users.getMyPosts(userAddress);
      setPosts(data);
    } catch (error) {
      console.error('Error fetching user posts:', error);
      message.error('Failed to fetch user posts');
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch liked and collected posts when tab changes
  useEffect(() => {
    if (publicKey) {
      if (activeTab === 'liked' && likedPosts.length === 0 && !likedPostsLoading) {
        fetchLikedPosts();
      } else if (activeTab === 'collected' && collectedPosts.length === 0 && !collectedPostsLoading) {
        fetchCollectedPosts();
      }
    }
  }, [activeTab, publicKey]);
  
  // Function to fetch liked posts
  const fetchLikedPosts = async () => {
    if (!publicKey) return;
    
    setLikedPostsLoading(true);
    try {
      const userAddress = publicKey.toBase58();
      const data = await api.users.getLikedPosts(userAddress);
      setLikedPosts(data);
    } catch (error) {
      console.error('Error fetching liked posts:', error);
      message.error('Failed to fetch liked posts');
    } finally {
      setLikedPostsLoading(false);
    }
  };

  // Function to fetch collected posts
  const fetchCollectedPosts = async () => {
    if (!publicKey) return;
    
    setCollectedPostsLoading(true);
    try {
      const userAddress = publicKey.toBase58();
      const data = await api.users.getCollectedPosts(userAddress);
      setCollectedPosts(data);
    } catch (error) {
      console.error('Error fetching collected posts:', error);
      message.error('Failed to fetch collected posts');
    } finally {
      setCollectedPostsLoading(false);
    }
  };

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
      const post = posts.find(p => p.id === postId);
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
                <Text strong>{posts?.length || 0} Posts</Text>
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
        <Tabs
          activeKey={activeTab}
          onChange={(key) => setActiveTab(key)}
          items={[
            {
              key: 'posts',
              label: 'Your Posts',
              children: (
                postsLoading ? (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <Text type="secondary">Loading posts...</Text>
                  </div>
                ) : posts.length > 0 ? (
                  <List
                    itemLayout="vertical"
                    dataSource={posts}
                    style={{ marginTop: 8 }}
                    renderItem={(post) => (
                      <Post 
                        key={post.id}
                        post={post} 
                        onUpdate={fetchUserPosts}
                      />
                    )}
                  />
                ) : (
                  <div style={{ textAlign: 'center', padding: '16px' }}>
                    <Text type="secondary">You haven't created any posts yet.</Text>
                  </div>
                )
              ),
            },
            {
              key: 'liked',
              label: 'Posts I Liked',
              children: likedPostsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div>Loading...</div>
                </div>
              ) : likedPosts.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={likedPosts}
                  style={{ marginTop: 8 }}
                  renderItem={(post) => (
                    <Post 
                      key={post.id}
                      post={post} 
                      onUpdate={fetchLikedPosts}
                    />
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <Text type="secondary" style={{ display: 'block' }}>No liked posts found</Text>
                </div>
              ),
            },
            {
              key: 'collected',
              label: 'Posts I Collected',
              children: collectedPostsLoading ? (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <div>Loading...</div>
                </div>
              ) : collectedPosts.length > 0 ? (
                <List
                  itemLayout="vertical"
                  dataSource={collectedPosts}
                  style={{ marginTop: 8 }}
                  renderItem={(post) => (
                    <Post 
                      key={post.id}
                      post={post} 
                      onUpdate={fetchCollectedPosts}
                    />
                  )}
                />
              ) : (
                <div style={{ textAlign: 'center', padding: '32px' }}>
                  <Text type="secondary" style={{ display: 'block' }}>No collected posts found</Text>
                </div>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
