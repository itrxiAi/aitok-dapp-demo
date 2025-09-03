'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, List, Avatar, Space, Button, message, Modal, Input, Form } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, CommentOutlined } from '@ant-design/icons';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/services/api';

const { TextArea } = Input;

interface Comment {
  id: string;
  content: string;
  author: {
    wallet_address: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface PostProps {
  post: {
    id: string;
    content: string;
    media_url: string[];
    created_at: string;
    likes: Array<{ user_address: string }>;
    comments: any[];
    author: {
      wallet_address: string;
      display_name?: string;
      username?: string;
      avatar_url?: string;
    };
  };
  onUpdate?: () => void;
}

export function Post({ post, onUpdate }: PostProps) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [form] = Form.useForm();

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to the card
    if (!publicKey) {
      message.warning('Please connect your wallet to like posts');
      return;
    }

    try {
      const isLiked = post.likes.some(like => like.user_address === publicKey.toBase58());

      if (isLiked) {
        await api.posts.unlike(post.id, { user_address: publicKey.toBase58() });
      } else {
        await api.posts.like(post.id, { user_address: publicKey.toBase58() });
      }

      onUpdate?.();
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      message.error('Failed to like/unlike post');
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to the card
    router.push(`/users/${post.author.wallet_address}`);
  };

  const handleCommentClick = async () => {
    if (!publicKey) {
      message.warning('Please connect your wallet to comment');
      return;
    }

    try {
      const fetchedComments = await api.posts.getComments(post.id);
      setComments(fetchedComments);
      setCommentModalVisible(true);
    } catch (error) {
      console.error('Error fetching comments:', error);
      message.error('Failed to fetch comments');
    }
  };

  const handleComment = async (values: { content: string }) => {
    if (!publicKey) return;

    setCommentLoading(true);
    try {
      await api.posts.createComment(post.id, {
        content: values.content,
        author_address: publicKey.toBase58(),
      });

      const updatedComments = await api.posts.getComments(post.id);
      setComments(updatedComments);
      form.resetFields();
      onUpdate?.();
      message.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      message.error('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  const isLiked = publicKey && post.likes.some(like => like.user_address === publicKey.toBase58());

  return (
    <Card 
      style={{ marginBottom: 16, cursor: 'pointer' }} 
      onClick={() => router.push(`/posts/${post.id}`)}
      hoverable
      styles={{ body: { padding: '8px' } }}
    >
      <List.Item
        key={post.id}
        actions={[
          <Space key="actions" onClick={e => e.stopPropagation()}>
            <Button 
              type="text" 
              icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={handleLike}
            >
              {post.likes.length}
            </Button>
            <Button 
              type="text" 
              icon={<CommentOutlined />}
              onClick={handleCommentClick}
            >
              {post.comments.length}
            </Button>
          </Space>
        ]}
      >
        <List.Item.Meta
          avatar={
            <Avatar 
              icon={<UserOutlined />} 
              src={post.author.avatar_url}
              style={{ cursor: 'pointer' }}
              onClick={handleUserClick}
            />
          }
          title={
            <a onClick={handleUserClick}>
              {post.author.display_name || post.author.username || `${post.author.wallet_address.slice(0, 4)}...${post.author.wallet_address.slice(-4)}`}
            </a>
          }
          description={new Date(post.created_at).toLocaleString()}
        />
        {post.content}
        {post.media_url.length > 0 && (
          <div style={{ 
            marginTop: 16,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#f0f0f0',
            padding: '16px',
            borderRadius: '8px'
          }}>
            {post.media_url[0].endsWith('.mp4') || post.media_url[0].endsWith('.mov') || post.media_url[0].endsWith('.m4v') ? (
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

      <Modal
        title="Comments"
        open={commentModalVisible}
        onCancel={(e) => {
          e.stopPropagation();
          setCommentModalVisible(false);
        }}
        footer={null}
        modalRender={(modal) => (
          <div onClick={(e) => e.stopPropagation()}>
            {modal}
          </div>
        )}
      >
        <Form form={form} onFinish={handleComment} onClick={(e) => e.stopPropagation()}>
          <Form.Item name="content" rules={[{ required: true, message: 'Please enter a comment' }]}>
            <TextArea rows={4} placeholder="Write a comment..." onClick={(e) => e.stopPropagation()} />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={commentLoading} onClick={(e) => e.stopPropagation()}>
              Post Comment
            </Button>
          </Form.Item>
        </Form>

        <List
          dataSource={comments}
          renderItem={(comment) => (
            <List.Item onClick={(e) => e.stopPropagation()}>
              <List.Item.Meta
                avatar={
                  <Avatar 
                    icon={<UserOutlined />} 
                    src={comment.author.avatar_url}
                    style={{ cursor: 'pointer' }}
                    onClick={() => router.push(`/users/${comment.author.wallet_address}`)}
                  />
                }
                title={
                  <a onClick={() => router.push(`/users/${comment.author.wallet_address}`)}>
                    {comment.author.display_name || comment.author.username || `${comment.author.wallet_address.slice(0, 4)}...${comment.author.wallet_address.slice(-4)}`}
                  </a>
                }
                description={
                  <>
                    <div>{comment.content}</div>
                    <small>{new Date(comment.created_at).toLocaleString()}</small>
                  </>
                }
              />
            </List.Item>
          )}
        />
      </Modal>
    </Card>
  );
}
