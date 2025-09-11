"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  Card,
  List,
  Avatar,
  Space,
  Button,
  message,
  Modal,
  Input,
  Form,
} from "antd";
import {
  UserOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  StarOutlined,
  StarFilled,
} from "@ant-design/icons";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/services/api";

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
    collects?: Array<{ user_address: string }>;
    comments: any[];
    author: {
      wallet_address: string;
      display_name?: string;
      username?: string;
      avatar_url?: string;
      isFollowing?: boolean;
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
  const [followLoading, setFollowLoading] = useState(false);
  const [isFollowing, setIsFollowing] = useState(
    post.author?.isFollowing || false
  );
  const [form] = Form.useForm();

  // Initialize collects array if it doesn't exist
  if (!post.collects) {
    post.collects = [];
  }

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to the card
    if (!publicKey) {
      message.warning("Please connect your wallet to like posts");
      return;
    }

    try {
      const isLiked = post.likes.some(
        (like) => like.user_address === publicKey.toBase58()
      );

      if (isLiked) {
        await api.posts.unlike(post.id, { user_address: publicKey.toBase58() });
      } else {
        await api.posts.like(post.id, { user_address: publicKey.toBase58() });
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      message.error("Failed to like/unlike post");
    }
  };

  const handleCollect = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent click from bubbling to the card
    if (!publicKey) {
      message.warning("Please connect your wallet to collect posts");
      return;
    }

    try {
      const isCollected = post.collects.some(
        (collect) => collect.user_address === publicKey.toBase58()
      );

      if (isCollected) {
        await api.posts.uncollect(post.id, {
          user_address: publicKey.toBase58(),
        });
      } else {
        await api.posts.collect(post.id, {
          user_address: publicKey.toBase58(),
        });
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error collecting/uncollecting post:", error);
      message.error("Failed to collect/uncollect post");
    }
  };

  const handleUserClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/users/${post.author.wallet_address}`);
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!publicKey) {
      message.error("Please connect your wallet to follow users");
      return;
    }

    try {
      setFollowLoading(true);

      if (!isFollowing) {
        await api.users.follow(
          publicKey.toBase58(),
          post.author.wallet_address
        );
        message.success(
          `You are now following ${
            post.author.display_name || post.author.username || "this user"
          }`
        );
        setIsFollowing(true);
      } else {
        await api.users.unfollow(
          publicKey.toBase58(),
          post.author.wallet_address
        );
        message.success(
          `You have unfollowed ${
            post.author.display_name || post.author.username || "this user"
          }`
        );
        setIsFollowing(false);
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      message.error("Failed to follow/unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleCommentClick = async () => {
    if (!publicKey) {
      message.warning("Please connect your wallet to comment");
      return;
    }

    try {
      const fetchedComments = await api.posts.getComments(post.id);
      setComments(fetchedComments);
      setCommentModalVisible(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      message.error("Failed to fetch comments");
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
      message.success("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      message.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  const isLiked =
    publicKey &&
    post.likes.some((like) => like.user_address === publicKey.toBase58());
  const isCollected =
    publicKey &&
    post.collects.some(
      (collect) => collect.user_address === publicKey.toBase58()
    );

  return (
    <Card
      style={{
        marginBottom: 16,
        cursor: "pointer",
        background: "rgba(0,0,0,0.05)",
        border: "1px solid rgba(255,255,255,0.1)",
        color: "#ffffff",
      }}
      onClick={() => router.push(`/posts/${post.id}`)}
      hoverable
      styles={{ body: { padding: "8px" } }}
    >
      <List.Item
        key={post.id}
        actions={[
          <Space key="actions" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              icon={
                isLiked ? (
                  <HeartFilled style={{ color: "#ff4d4f" }} />
                ) : (
                  <HeartOutlined style={{ color: "#ffffff" }} />
                )
              }
              onClick={handleLike}
              style={{ color: "#ffffff" }}
            >
              {post.likes.length}
            </Button>
            <Button
              type="text"
              icon={<CommentOutlined style={{ color: "#ffffff" }} />}
              onClick={handleCommentClick}
              style={{ color: "#ffffff" }}
            >
              {post.comments.length}
            </Button>
            <Button
              type="text"
              icon={
                isCollected ? (
                  <StarFilled style={{ color: "#faad14" }} />
                ) : (
                  <StarOutlined style={{ color: "#ffffff" }} />
                )
              }
              onClick={handleCollect}
              style={{ color: "#ffffff" }}
            >
              {post.collects.length}
            </Button>
          </Space>,
        ]}
      >
        <List.Item.Meta
          avatar={
            <div style={{ position: "relative" }}>
              <Avatar
                icon={<UserOutlined />}
                src={post.author?.avatar_url}
                style={{ cursor: "pointer" }}
                onClick={handleUserClick}
              />
              {!isFollowing &&
                publicKey &&
                post.author?.wallet_address !== publicKey.toBase58() && (
                  <Button
                    type="primary"
                    size="small"
                    shape="circle"
                    icon={<span>+</span>}
                    onClick={handleFollow}
                    loading={followLoading}
                    style={{
                      position: "absolute",
                      bottom: -8,
                      right: -8,
                      width: "20px",
                      height: "20px",
                      minWidth: "20px",
                      fontSize: "12px",
                      padding: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  />
                )}
            </div>
          }
          title={
            <a onClick={handleUserClick} style={{ color: "#ffffff" }}>
              {post.author?.display_name ||
                post.author?.username ||
                `${post.author?.wallet_address?.slice(0, 4) || ""}...${
                  post.author?.wallet_address?.slice(-4) || ""
                }`}
            </a>
          }
          description={
            <span style={{ color: "#cccccc" }}>
              {new Date(post.created_at).toLocaleString()}
            </span>
          }
        />
        <div style={{ color: "#ffffff" }}>{post.content}</div>
        {post.media_url.length > 0 && (
          <div
            style={{
              marginTop: 16,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              backgroundColor: "#f0f0f0",
              padding: "16px",
              borderRadius: "8px",
            }}
          >
            {post.media_url[0].endsWith(".mp4") ||
            post.media_url[0].endsWith(".mov") ||
            post.media_url[0].endsWith(".m4v") ? (
              <video
                controls
                style={{
                  maxWidth: "100%",
                  maxHeight: "500px",
                  borderRadius: "8px",
                  backgroundColor: "#000",
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
                  maxWidth: "100%",
                  maxHeight: "500px",
                  borderRadius: "8px",
                  objectFit: "contain",
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
        style={{ color: "#ffffff" }}
        styles={{
          content: {
            background: "#161722",
            color: "#ffffff",
          },
          header: {
            background: "#161722",
            color: "#ffffff",
            borderBottom: "1px solid rgba(255,255,255,0.1)",
          },
          body: {
            background: "#161722",
            color: "#ffffff",
          },
        }}
        modalRender={(modal) => (
          <div onClick={(e) => e.stopPropagation()}>{modal}</div>
        )}
      >
        <Form
          form={form}
          onFinish={handleComment}
          onClick={(e) => e.stopPropagation()}
        >
          <Form.Item
            name="content"
            rules={[{ required: true, message: "Please enter a comment" }]}
          >
            <TextArea
              rows={4}
              placeholder="Write a comment..."
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={commentLoading}
              onClick={(e) => e.stopPropagation()}
            >
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
                    style={{ cursor: "pointer" }}
                    onClick={() =>
                      router.push(`/users/${comment.author.wallet_address}`)
                    }
                  />
                }
                title={
                  <a
                    onClick={() =>
                      router.push(`/users/${comment.author.wallet_address}`)
                    }
                    style={{ color: "#ffffff" }}
                  >
                    {comment.author.display_name ||
                      comment.author.username ||
                      `${comment.author.wallet_address.slice(
                        0,
                        4
                      )}...${comment.author.wallet_address.slice(-4)}`}
                  </a>
                }
                description={
                  <>
                    <div style={{ color: "#ffffff" }}>{comment.content}</div>
                    <small style={{ color: "#cccccc" }}>
                      {new Date(comment.created_at).toLocaleString()}
                    </small>
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
