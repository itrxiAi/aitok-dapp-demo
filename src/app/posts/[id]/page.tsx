"use client";

import { Card, Space, Button, Input, Form, message, Avatar } from "antd";
import {
  UserOutlined,
  HeartOutlined,
  HeartFilled,
  ArrowLeftOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";
import Link from "next/link";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";

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
        throw new Error("Post not found");
      }
      const data = await response.json();
      setPost(data);

      const commentsResponse = await api.posts.getComments(params.id as string);
      setComments(commentsResponse);
    } catch (error) {
      console.error("Error fetching post:", error);
      message.error("Failed to fetch post");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!publicKey || !post) {
      message.warning("Please connect your wallet to like posts");
      return;
    }

    try {
      const isLiked = post.likes.some(
        (like) => like.user_address === publicKey
      );

      if (isLiked) {
        await api.posts.unlike(post.id, { user_address: publicKey });
      } else {
        await api.posts.like(post.id, { user_address: publicKey });
      }

      fetchPost();
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      message.error("Failed to like/unlike post");
    }
  };

  const handleComment = async (values: { content: string }) => {
    if (!publicKey || !post) {
      message.warning("Please connect your wallet to comment");
      return;
    }

    setCommentLoading(true);
    try {
      await api.posts.createComment(post.id, {
        content: values.content,
        author_address: publicKey,
      });

      const updatedComments = await api.posts.getComments(post.id);
      setComments(updatedComments);
      form.resetFields();
      message.success("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      message.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>⏳</div>
          <div>加载中...</div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>❌</div>
          <div>帖子未找到</div>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{
              marginTop: "20px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff",
            }}
          >
            返回
          </Button>
        </div>
      </div>
    );
  }

  const isLiked =
    publicKey &&
    post.likes.some((like) => like.user_address === publicKey);

  return (
    <div style={{ minHeight: "100vh", background: "#000000" }}>
      {/* 全屏媒体内容 */}
      <div
        style={{
          height: "100vh",
          position: "relative",
          background: "#000000",
        }}
      >
        {post.media_url && post.media_url.length > 0 ? (
          (() => {
            const mediaUrl = post.media_url[0];
            const isVideo = mediaUrl.match(/\.(mp4|mov|m4v|webm|ogg)$/i);

            if (isVideo) {
              return (
                <video
                  src={mediaUrl}
                  autoPlay={false}
                  loop
                  muted
                  playsInline
                  controls
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              );
            } else {
              return (
                <Image
                  src={mediaUrl}
                  alt="Post content"
                  fill
                  style={{
                    objectFit: "cover",
                  }}
                  unoptimized
                  onError={() => {
                    console.log("Image load error");
                  }}
                />
              );
            }
          })()
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              background: "#000000",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              fontSize: "24px",
            }}
          >
            📱
          </div>
        )}

        {/* 顶部返回按钮 */}
        <div
          style={{
            position: "absolute",
            top: "20px",
            left: "20px",
            zIndex: 10,
          }}
        >
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{
              background: "rgba(0,0,0,0.6)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff",
              backdropFilter: "blur(10px)",
            }}
          >
            返回
          </Button>
        </div>

        {/* 右侧操作按钮和用户信息 - 参考 TikTokFeed 布局 */}
        <div
          style={{
            position: "absolute",
            right: "20px",
            bottom: "100px",
            display: "flex",
            flexDirection: "column",
            gap: "20px",
            zIndex: 10,
            alignItems: "center",
          }}
        >
          {/* 用户头像 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "50%",
                background: "rgba(255,255,255,0.2)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                border: "2px solid rgba(255,255,255,0.3)",
                cursor: "pointer",
              }}
              onClick={() =>
                router.push(`/users/${post.author.wallet_address}`)
              }
            >
              {post.author?.avatar_url ? (
                <Image
                  src={post.author.avatar_url}
                  alt="User avatar"
                  width={44}
                  height={44}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                  unoptimized
                />
              ) : (
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "50%",
                    background: "rgba(255,255,255,0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "20px",
                    color: "#ffffff",
                  }}
                >
                  👤
                </div>
              )}
            </div>
          </div>

          {/* 点赞按钮和数量 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "4px",
            }}
          >
            <img
              src={isLiked ? "/images/like-s.png" : "/images/like.png"}
              style={{
                width: "30px",
                height: "30px",
                cursor: "pointer",
                transition: "transform 0.2s ease",
              }}
              onClick={handleLike}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "scale(1.1)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "scale(1)";
              }}
            />
            <div
              style={{
                fontSize: "12px",
                color: "#ffffff",
                fontWeight: "bold",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {post.likes?.length || 0}
            </div>
          </div>
        </div>

        {/* 底部内容区域 - 参考 TikTokFeed 布局 */}
        <div
          style={{
            position: "absolute",
            bottom: "80px",
            left: "20px",
            right: "100px", // 调整右边距，避免与右侧按钮重合
            zIndex: 10,
            color: "#ffffff",
          }}
        >
          {/* 用户信息 - 上下布局 */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              marginBottom: "12px",
            }}
          >
            <div
              style={{
                fontSize: "18px",
                fontWeight: "bold",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
              }}
            >
              <Link
                href={`/users/${post.author.wallet_address}`}
                style={{ color: "#ffffff", textDecoration: "none" }}
              >
                {post.author.display_name ||
                  post.author.username ||
                  `${post.author.wallet_address.slice(
                    0,
                    4
                  )}...${post.author.wallet_address.slice(-4)}`}
              </Link>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#cccccc",
                textShadow: "0 1px 2px rgba(0,0,0,0.5)",
              }}
            >
              {new Date(post.created_at).toLocaleString()}
            </div>
          </div>

          {/* 文字内容 */}
          {post.content && (
            <div
              style={{
                fontSize: "16px",
                lineHeight: "1.4",
                marginBottom: "16px",
                textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                maxHeight: "120px",
                overflow: "hidden",
                display: "-webkit-box",
                WebkitLineClamp: 4,
                WebkitBoxOrient: "vertical",
              }}
            >
              {post.content}
            </div>
          )}
        </div>
      </div>

      {/* 评论区域 - 在媒体下方，可以正常滚动查看 */}
      <div
        style={{
          background: "#161722",
          color: "#ffffff",
          padding: "20px 0",
        }}
      >
        <div style={{ maxWidth: 600, margin: "0 auto", padding: "0 20px" }}>
          <h3 style={{ color: "#ffffff", marginBottom: "20px" }}>评论</h3>

          <Form
            form={form}
            onFinish={handleComment}
            style={{ marginBottom: "20px" }}
          >
            <Form.Item
              name="content"
              rules={[{ required: true, message: "请输入评论内容" }]}
            >
              <TextArea
                rows={4}
                placeholder="写下你的评论..."
                style={{
                  background: "rgba(255,255,255,0.1)",
                  border: "1px solid rgba(255,255,255,0.3)",
                  color: "#ffffff",
                }}
              />
            </Form.Item>
            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={commentLoading}
                style={{
                  background: "#1677ff",
                  border: "none",
                }}
              >
                发布评论
              </Button>
            </Form.Item>
          </Form>

          {comments.map((comment) => (
            <div
              key={comment.id}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                padding: "16px 0",
                borderBottom: "1px solid rgba(255,255,255,0.1)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                <Avatar
                  size={32}
                  icon={<UserOutlined />}
                  src={comment.author.avatar_url}
                />
                <div style={{ flex: 1 }}>
                  <div>
                    <Link
                      href={`/users/${comment.author.wallet_address}`}
                      style={{
                        color: "#ffffff",
                        textDecoration: "none",
                        fontWeight: "bold",
                      }}
                    >
                      {comment.author.display_name ||
                        comment.author.username ||
                        `${comment.author.wallet_address.slice(
                          0,
                          4
                        )}...${comment.author.wallet_address.slice(-4)}`}
                    </Link>
                  </div>
                  <div style={{ color: "#cccccc", fontSize: "12px" }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ color: "#ffffff", marginLeft: "44px" }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
