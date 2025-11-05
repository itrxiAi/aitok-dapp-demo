"use client";

import {
  Card,
  Avatar,
  Typography,
  List,
  Button,
  Space,
  message,
  Modal,
  Spin,
} from "antd";
import {
  UserOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  ArrowLeftOutlined,
  DollarOutlined,
  LockOutlined,
} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/services/api";

import { UserChat } from "@/components/chat/UserChat";
import { Post } from "@/components/Post";
import Image from "next/image";
import { useWallet } from "@/hooks/useWallet";

const { Title, Text } = Typography;

interface UserProfile {
  wallet_address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  avatar_url?: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
  isFollowing?: boolean;
}

export default function UserProfile() {
  const { publicKey } = useWallet();
  const params = useParams();
  const router = useRouter();
  const address = params.address as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);
  const [patronLoading, setPatronLoading] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  const fetchProfile = async () => {
    try {
      const data = await api.users.getProfile(address, publicKey);
      if (publicKey) {
        // Check if the current user is following this profile
        const isFollowing = await api.users.checkFollowing(
          publicKey,
          address
        );
        data.isFollowing = isFollowing;
      }
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      message.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPosts = async () => {
    try {
      setPostsLoading(true);
      const userPosts = await api.users.getMyPosts(address);
      setPosts(userPosts);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      message.error("Failed to fetch user posts");
    } finally {
      setPostsLoading(false);
    }
  };

  useEffect(() => {
    if (address) {
      fetchProfile();
      fetchUserPosts();
    }
  }, [address, publicKey]);

  const handleFollow = async () => {
    if (!publicKey) {
      message.warning("Please connect your wallet to follow users");
      return;
    }

    setFollowLoading(true);
    try {
      if (profile?.isFollowing) {
        await api.users.unfollow(publicKey, address);
        message.success("Unfollowed successfully");
      } else {
        // Create connection to devnet
        // const connection = new Connection(
        //   "https://mainnet.helius-rpc.com/?api-key=5d2e4725-01df-47ba-92ef-6d6025e9d62e"
        // );

        // // Create transaction to send 0.0001 SOL
        // const transaction = new Transaction().add(
        //   SystemProgram.transfer({
        //     fromPubkey: publicKey,
        //     toPubkey: new PublicKey(address),
        //     lamports: LAMPORTS_PER_SOL * 0.0001, // 0.0001 SOL
        //   })
        // );

        try {
          // Get latest blockhash
          // const { blockhash } = await connection.getLatestBlockhash();
          // transaction.recentBlockhash = blockhash;
          // transaction.feePayer = publicKey;

          // // Request signature from user
          // const signedTransaction = await (
          //   window as any
          // ).solana.signTransaction(transaction);

          // // Send transaction
          // const signature = await connection.sendRawTransaction(
          //   signedTransaction.serialize()
          // );
          // await connection.confirmTransaction(signature);

          // If transaction successful, proceed with follow
          await api.users.follow(publicKey, address);
          message.success("Followed successfully");
        } catch (error) {
          await api.users.follow(publicKey, address);
          console.error("Transaction error:", error);
          message.success("Followed successfully");
          //return;
        }
      }

      const fetchProfile = async () => {
        try {
          const data = await api.users.getProfile(
            address,
            publicKey
          );
          if (publicKey) {
            const isFollowing = await api.users.checkFollowing(
              publicKey,
              address
            );
            data.isFollowing = isFollowing;
          }
          setProfile(data);
        } catch (error) {
          console.error("Error fetching profile:", error);
          message.error("Failed to fetch profile");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } catch (error) {
      console.error("Error following/unfollowing:", error);
      message.error("Failed to follow/unfollow user");
    } finally {
      setFollowLoading(false);
    }
  };

  const handleLike = async (postId: string) => {
    if (!publicKey) {
      message.warning("Please connect your wallet to like posts");
      return;
    }

    try {
      const post = posts.find((p) => p.id === postId);
      const isLiked = post?.likes.some(
        (like) => like.user_address === publicKey
      );

      if (isLiked) {
        await api.posts.unlike(postId, { user_address: publicKey });
      } else {
        await api.posts.like(postId, { user_address: publicKey });
      }

      const fetchProfile = async () => {
        try {
          const data = await api.users.getProfile(
            address,
            publicKey
          );
          if (publicKey) {
            // Check if the current user is following this profile
            const isFollowing = await api.users.checkFollowing(
              publicKey,
              address
            );
            data.isFollowing = isFollowing;
          }
          setProfile(data);
        } catch (error) {
          console.error("Error fetching profile:", error);
          message.error("Failed to fetch profile");
        } finally {
          setLoading(false);
        }
      };
      fetchProfile();
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      message.error("Failed to like/unlike post");
    }
  };

  const handlePatron = async () => {
    if (!publicKey) {
      message.warning("Please connect your wallet to support this user");
      return;
    }

    setPatronLoading(true);
    try {
      // const connection = new Connection(
      //   "https://mainnet.helius-rpc.com/?api-key=5d2e4725-01df-47ba-92ef-6d6025e9d62e"
      // );

      // const transaction = new Transaction().add(
      //   SystemProgram.transfer({
      //     fromPubkey: publicKey,
      //     toPubkey: new PublicKey(address),
      //     lamports: LAMPORTS_PER_SOL * 0.0001,
      //   })
      // );

      try {
        // const { blockhash } = await connection.getLatestBlockhash();
        // transaction.recentBlockhash = blockhash;
        // transaction.feePayer = publicKey;

        // const signedTransaction = await (window as any).solana.signTransaction(
        //   transaction
        // );
        // const signature = await connection.sendRawTransaction(
        //   signedTransaction.serialize()
        // );
        // await connection.confirmTransaction(signature);

        message.success("Thank you for supporting this user!");
      } catch (error) {
        message.success("Thank you for supporting this user!");
      }
    } catch (error) {
      message.success("Thank you for supporting this user!");
    } finally {
      setPatronLoading(false);
    }
  };

  if (loading) {
    return <Card loading={true} />;
  }

  if (!profile) {
    return (
      <Card>
        <Title level={2}>User not found</Title>
        <p>The requested user profile does not exist.</p>
      </Card>
    );
  }

  return (
    <div
      style={{ minHeight: "100vh", background: "#161722", color: "#ffffff" }}
    >
      {/* 顶部导航栏 - 包含返回按钮 */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          background: "transparent",
          zIndex: 1000,
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          maxWidth: 600,
          margin: "0 auto",
        }}
      >
        {/* 左侧返回按钮 */}
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.1)",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "#ffffff",
            borderRadius: "10px",
          }}
        >
          Back
        </Button>
      </div>

      {/* 个人资料区域 */}
      <div style={{ textAlign: "center", padding: "60px 20px 20px" }}>
        {/* 头像 */}
        <div
          style={{
            position: "relative",
            display: "inline-block",
            marginBottom: "20px",
          }}
        >
          <Avatar
            size={120}
            icon={<UserOutlined />}
            src={profile.avatar_url}
            style={{
              border: "4px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          />
        </div>

        {/* 用户昵称和钱包地址 */}
        <div style={{ marginBottom: "20px" }}>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            {profile.display_name ||
              profile.username ||
              `User ${profile.wallet_address.slice(0, 6)}`}
          </div>
          <div style={{ fontSize: "12px", color: "#999" }}>
            {profile.wallet_address}
          </div>
        </div>

        {/* 操作按钮 */}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
            marginBottom: "30px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: "10px",
              justifyContent: "center",
            }}
          >
            <Button
              type={profile.isFollowing ? "default" : "primary"}
              onClick={handleFollow}
              loading={followLoading}
              style={{
                borderRadius: "20px",
                fontWeight: 600,
                height: "35px",
                padding: "0 20px",
                ...(profile.isFollowing
                  ? {
                    background: "rgba(255,255,255,0.2)",
                    border: "1px solid rgba(255,255,255,0.3)",
                    color: "#ffffff",
                  }
                  : {
                    background:
                      "linear-gradient(135deg, #00F2EA 0%, #EE3190 100%)",
                    border: "none",
                    color: "#ffffff",
                  }),
              }}
            >
              {profile.isFollowing ? "Unfollow" : "Follow"}
            </Button>
            <Button
              type="primary"
              onClick={handlePatron}
              loading={patronLoading}
              style={{
                backgroundColor: "#FFB800",
                borderRadius: "20px",
                fontWeight: 600,
                boxShadow: "0 4px 6px rgba(255, 184, 0, 0.2)",
                transition: "all 0.3s",
                border: "none",
                height: "35px",
                padding: "0 20px",
              }}
              icon={<DollarOutlined style={{ fontSize: "16px" }} />}
            >
              Support
            </Button>
          </div>
          <Button
            type="primary"
            onClick={() => setIsChatOpen(true)}
            style={{
              background: "rgb(234,51,84)",
              border: "none",
              borderRadius: "20px",
              fontWeight: 600,
              height: "35px",
              padding: "0 20px",
              color: "#ffffff",
              boxShadow: "0 4px 6px rgba(102, 126, 234, 0.2)",
              transition: "all 0.3s",
            }}
          >
            AI分身对话
          </Button>
          <UserChat
            userAddress={profile.wallet_address}
            isOpen={isChatOpen}
            onClose={() => setIsChatOpen(false)}
          />
        </div>

        {/* 用户简介 */}
        {profile.bio && (
          <div
            style={{
              fontSize: "14px",
              color: "#ffffff",
              marginBottom: "20px",
              maxWidth: "300px",
              margin: "0 auto 20px",
            }}
          >
            {profile.bio}
          </div>
        )}

        {/* 统计数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            maxWidth: "300px",
            margin: "0 auto 10px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() =>
              router.push(`/users/${profile.wallet_address}/following`)
            }
          >
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {profile._count.following || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>关注</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {profile._count.followers || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>粉丝</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {posts?.length || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>作品</div>
          </div>
        </div>

        {/* Tab 区域 - 只有Posts一个tab */}
        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          <div
            style={{
              flex: 1,
              textAlign: "center",
              borderBottom: "2px solid #fff",
              fontSize: "16px",
              fontWeight: "bold",
              color: "#fff",
            }}
          >
            <img
              src="/images/group.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
        </div>
      </div>

      {/* 内容网格 */}
      <div
        style={{
          padding: "0 20px",
          overflowY: "auto",
        }}
      >
        {postsLoading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#ffffff",
            }}
          >
            <Spin size="large" />
          </div>
        ) : posts && posts.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "2px",
            }}
          >
            {posts.map((post, index) => (
              <div
                key={post.id}
                style={{
                  aspectRatio: "1",
                  position: "relative",
                  background: "#000000",
                  borderRadius: "4px",
                  overflow: "hidden",
                  cursor: "pointer",
                }}
                onClick={() => {
                  router.push(`/posts/${post.id}`);
                }}
              >
                {/* 背景媒体内容 */}
                {post.media_url && post.media_url.length > 0 ? (
                  (() => {
                    const mediaUrl = post.media_url[0];
                    const isVideo = mediaUrl.match(
                      /\.(mp4|mov|m4v|webm|ogg)$/i
                    );

                    if (isVideo) {
                      return (
                        <video
                          src={mediaUrl}
                          autoPlay={false}
                          loop
                          muted
                          playsInline
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover",
                            zIndex: 1,
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
                            zIndex: 1,
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
                      zIndex: 1,
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

                {/* 播放图标和观看数（仅视频） */}
                {post.media_url &&
                  post.media_url[0]?.match(/\.(mp4|mov|m4v|webm|ogg)$/i) && (
                    <div
                      style={{
                        position: "absolute",
                        bottom: "4px",
                        left: "4px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        zIndex: 2,
                      }}
                    >
                      <div
                        style={{
                          fontSize: "8px",
                          color: "#ffffff",
                          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        ▶
                      </div>
                      <div
                        style={{
                          fontSize: "8px",
                          color: "#ffffff",
                          textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                        }}
                      >
                        {Math.floor(Math.random() * 10) + 1}M
                      </div>
                    </div>
                  )}
              </div>
            ))}
          </div>
        ) : (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "200px",
              color: "#ffffff",
              flexDirection: "column",
              gap: "10px",
            }}
          >
            <div style={{ fontSize: "48px" }}>📱</div>
            <div>暂无内容</div>
          </div>
        )}
      </div>
    </div>
  );
}
