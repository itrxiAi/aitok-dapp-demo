'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Space, Button, Input, Form, message, Avatar } from 'antd';
import { UserOutlined, HeartOutlined, HeartFilled, ArrowLeftOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/services/api';
import Link from 'next/link';

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

interface Post {
  id: string;
  content: string;
  media_url: string[];
  created_at: string;
  likes: Array<{ user_address: string }>;
  comments: Comment[];
  author: {
    wallet_address: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
}

export default function PostPage() {
  const { publicKey } = useWallet();
  const params = useParams();
  const router = useRouter();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchPost();
  }, [params.id]);

  const fetchPost = async () => {
    try {
      const response = await fetch(`/api/posts/${params.id}`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      const data = await response.json();
      setPost(data);

      const commentsResponse = await api.posts.getComments(params.id as string);
      setComments(commentsResponse);
    } catch (error) {
      console.error('Error fetching post:', error);
      message.error('Failed to fetch post');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!publicKey || !post) {
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

      fetchPost();
    } catch (error) {
      console.error('Error liking/unliking post:', error);
      message.error('Failed to like/unlike post');
    }
  };

  const handleComment = async (values: { content: string }) => {
    if (!publicKey || !post) {
      message.warning('Please connect your wallet to comment');
      return;
    }

    setCommentLoading(true);
    try {
      await api.posts.createComment(post.id, {
        content: values.content,
        author_address: publicKey.toBase58(),
      });

      const updatedComments = await api.posts.getComments(post.id);
      setComments(updatedComments);
      form.resetFields();
      message.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      message.error('Failed to post comment');
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!post) {
    return (
      <Card>
        <h1>Post not found</h1>
        <Button icon={<ArrowLeftOutlined />} onClick={() => router.back()}>Back</Button>
      </Card>
    );
  }

  const isLiked = publicKey && post.likes.some(like => like.user_address === publicKey.toBase58());

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <div style={{ marginBottom: 16 }}>
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        >
          Back
        </Button>
      </div>

      <Card>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
            <Avatar
              size={40}
              icon={<UserOutlined />}
              src={post.author.avatar_url}
            />

            <div style={{ flex: 1 }}>
              <div>
                <Link href={`/users/${post.author.wallet_address}`}
                  style={{ color: 'black', textDecoration: 'none' }}
                >
                  {post.author.display_name || post.author.username || `${post.author.wallet_address.slice(0, 4)}...${post.author.wallet_address.slice(-4)}`}
                </Link>
              </div>
              <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{new Date(post.created_at).toLocaleString()}</div>
            </div>
          </div>

          <div>{post.content}</div>

          {post.media_url && post.media_url.length > 0 && (
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

          <div>
            <Button
              type="text"
              icon={isLiked ? <HeartFilled style={{ color: '#ff4d4f' }} /> : <HeartOutlined />}
              onClick={handleLike}
            >
              {post.likes.length}
            </Button>
          </div>
        </div>
      </Card>

      <Card style={{ marginTop: 16 }}>
        <Form form={form} onFinish={handleComment}>
          <Form.Item name="content" rules={[{ required: true, message: 'Please enter a comment' }]}>
            <TextArea rows={4} placeholder="Write a comment..." />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={commentLoading}>
              Post Comment
            </Button>
          </Form.Item>
        </Form>

        {comments.map((comment) => (
          <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '16px 0', borderBottom: '1px solid #ccc' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px' }}>
              <Avatar
                size={40}
                icon={<UserOutlined />}
                src={comment.author.avatar_url}
              />
              <div style={{ flex: 1 }}>
                <div>
                  <Link href={`/users/${comment.author.wallet_address}`} style={{ color: 'black', textDecoration: 'none' }}>
                    {comment.author.display_name || comment.author.username || `${comment.author.wallet_address.slice(0, 4)}...${comment.author.wallet_address.slice(-4)}`}
                  </Link>
                </div>
                <div style={{ color: 'rgba(0, 0, 0, 0.45)' }}>{new Date(comment.created_at).toLocaleString()}</div>
              </div>
            </div>
            <div>{comment.content}</div>
          </div>
        ))}
      </Card>
    </div>
  );
}
