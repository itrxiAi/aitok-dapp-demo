"use client";

import { useWallet } from "@/hooks/useWallet";
import dynamic from "next/dynamic";
import {
  Card,
  Avatar,
  Typography,
  List,
  Button,
  Form,
  Input,
  message,
  Space,
  Upload,
  Switch,
  Tabs,
  Spin,
} from "antd";
import {
  UserOutlined,
  EditOutlined,
  HeartOutlined,
  HeartFilled,
  CommentOutlined,
  LoadingOutlined,
  PlusOutlined,
  UserAddOutlined,
  ShareAltOutlined,
  UserAddOutlined as AddUserOutlined,
} from "@ant-design/icons";
import { Post } from "@/components/Post";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import type { RcFile, UploadProps } from "antd/es/upload";
import type { UploadFile } from "antd/es/upload/interface";
import { useRouter } from "next/navigation";
import { AddFriendsModal } from "@/components/AddFriendsModal";
import { useAuth } from "@/hooks/useAuth";
import Image from "next/image";

const BscWalletButton = dynamic(
  () => import("@/components/BscWalletButton"),
  { ssr: false }
);

const { Title, Text } = Typography;
const { TextArea } = Input;

// 自定义钱包按钮组件
const CustomWalletButton = () => {
  const { publicKey, disconnect, connect, isLoading } = useWallet();
  const { walletAddress, user } = useAuth();

  const handleClick = async () => {
    console.log("Wallet action...");

    if (publicKey) {
      // If connected, disconnect
      await disconnect();
      console.log("Disconnected");
    } else {
      // If not connected, connect
      try {
        console.log("Connecting...");
        await connect();
        console.log("Connected");
      } catch (error) {
        console.error("Connection error:", error);
      }
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        style={{
          padding: "8px 16px",
          background: "#fff",
          borderRadius: "20px",
          border: "1px solid #e6e6e6",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          cursor: "pointer",
          width: "200px",
          minWidth: "200px",
          maxWidth: "200px",
        }}
      >
        <Avatar
          size={32}
          src={user?.avatar_url}
          icon={!user?.avatar_url && <UserOutlined />}
          style={{
            backgroundColor: user?.avatar_url ? undefined : "#4F46E5",
            objectFit: "cover",
            flexShrink: 0,
          }}
        />
        <Text
          style={{
            color: "#000",
            flexGrow: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {user?.display_name ||
            (walletAddress
              ? `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`
              : "Connect Wallet")}
        </Text>
      </div>
      {/* Show loading state when connecting */}
      {isLoading && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            background: "rgba(0, 0, 0, 0.7)",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            zIndex: 1000,
          }}
        >
          Connecting...
        </div>
      )}
    </>
  );
};

interface UserProfile {
  wallet_address: string;
  username?: string;
  display_name?: string;
  bio?: string;
  gender?: "MALE" | "FEMALE";
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
    reader.addEventListener("load", () => resolve(reader.result as string));
    reader.addEventListener("error", reject);
    reader.readAsDataURL(img);
  });

// 顶部导航栏组件
const TopNavigation = ({
  onConnect,
  onDisconnect,
  isConnected,
}: {
  onConnect: () => void;
  onDisconnect: () => void;
  isConnected: boolean;
}) => {
  return (
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
        justifyContent: "flex-end",
        maxWidth: 600,
        margin: "0 auto",
      }}
    >
      {/* 右侧连接/断开按钮 */}
      <Button
        onClick={() => {
          console.log('TopNavigation button clicked!');
          console.log('isConnected:', isConnected);
          if (isConnected) {
            console.log('Calling onDisconnect...');
            onDisconnect();
          } else {
            console.log('Calling onConnect...');
            onConnect();
          }
        }}
        style={{
          background: "linear-gradient(135deg, #00F2EA 0%, #EE3190 100%)",
          border: "none",
          borderRadius: "10px",
          color: "#fff",
          fontWeight: "bold",
          height: "32px",
          width: "124px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "4px",
        }}
      >
        <img
          src="/images/wallet.png"
          alt=""
          style={{
            width: "16px",
            height: "16px",
          }}
        />
        <span>{isConnected ? "Disconnect" : "Connect"}</span>
      </Button>
    </div>
  );
};

// 内容网格组件
const ContentGrid = ({
  posts,
  loading,
  router,
}: {
  posts: any[];
  loading: boolean;
  router: any;
}) => {
  if (loading) {
    return (
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
    );
  }

  if (posts.length === 0) {
    return (
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
    );
  }

  return (
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
              const isVideo = mediaUrl.match(/\.(mp4|mov|m4v|webm|ogg)$/i);

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
  );
};

export default function Profile() {
  const { publicKey, connect, disconnect } = useWallet();
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>();
  const [realImageUrl, setRealImageUrl] = useState<string>();
  const [uploading, setUploading] = useState(false);
  const [form] = Form.useForm();
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState<any[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [likedPosts, setLikedPosts] = useState<any[]>([]);
  const [collectedPosts, setCollectedPosts] = useState<any[]>([]);
  const [likedPostsLoading, setLikedPostsLoading] = useState(false);
  const [collectedPostsLoading, setCollectedPostsLoading] = useState(false);
  const [addFriendsModalVisible, setAddFriendsModalVisible] = useState(false);

  useEffect(() => {
    if (publicKey) {
      fetchProfile();
      fetchUserPosts();
    } else {
      // 如果没有连接钱包，直接设置 loading 为 false
      setLoading(false);
    }
  }, [publicKey]);

  // Function to fetch user's own posts
  const fetchUserPosts = async () => {
    if (!publicKey) return;

    setPostsLoading(true);
    try {
      // BSC addresses are already strings, no need for toBase58()
      const userAddress = publicKey;
      const data = await api.users.getMyPosts(userAddress);
      setPosts(data);
    } catch (error) {
      console.error("Error fetching user posts:", error);
      message.error("Failed to fetch user posts");
    } finally {
      setPostsLoading(false);
    }
  };

  // Fetch liked and collected posts when tab changes
  useEffect(() => {
    if (publicKey) {
      if (
        activeTab === "liked" &&
        likedPosts.length === 0 &&
        !likedPostsLoading
      ) {
        fetchLikedPosts();
      } else if (
        activeTab === "collected" &&
        collectedPosts.length === 0 &&
        !collectedPostsLoading
      ) {
        fetchCollectedPosts();
      }
    }
  }, [activeTab, publicKey]);

  // Function to fetch liked posts
  const fetchLikedPosts = async () => {
    if (!publicKey) return;

    setLikedPostsLoading(true);
    try {
      // BSC addresses are already strings, no need for toBase58()
      const userAddress = publicKey;
      const data = await api.users.getLikedPosts(userAddress);
      setLikedPosts(data);
    } catch (error) {
      console.error("Error fetching liked posts:", error);
      message.error("Failed to fetch liked posts");
    } finally {
      setLikedPostsLoading(false);
    }
  };

  // Function to fetch collected posts
  const fetchCollectedPosts = async () => {
    if (!publicKey) return;

    setCollectedPostsLoading(true);
    try {
      // BSC addresses are already strings, no need for toBase58()
      const userAddress = publicKey;
      const data = await api.users.getCollectedPosts(userAddress);
      setCollectedPosts(data);
    } catch (error) {
      console.error("Error fetching collected posts:", error);
      message.error("Failed to fetch collected posts");
    } finally {
      setCollectedPostsLoading(false);
    }
  };

  const fetchProfile = async () => {
    if (!publicKey) return;

    try {
      // BSC addresses are already strings, no need for toBase58()
      const userAddress = publicKey;
      const data = await api.users.getProfile(userAddress);
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
      message.error("Failed to fetch profile");
    } finally {
      setLoading(false);
    }
  };

  const beforeUpload = (file: RcFile) => {
    const isJpgOrPng = file.type === "image/jpeg" || file.type === "image/png";
    if (!isJpgOrPng) {
      message.error("You can only upload JPG/PNG file!");
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error("Image must smaller than 2MB!");
    }
    return isJpgOrPng && isLt2M;
  };

  const handleUpload: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      try {
        const url = info.file.response?.url;
        setImageUrl(url);
        form.setFieldValue("avatar_url", url);
        setUploading(false);
      } catch (error) {
        console.error("Error processing image:", error);
        message.error("Failed to process image");
        setUploading(false);
      }
    }
  };

  const handleRealUpload: UploadProps["onChange"] = (info) => {
    if (info.file.status === "uploading") {
      setUploading(true);
      return;
    }
    if (info.file.status === "done") {
      // Get this url from response in real world.
      try {
        const url = info.file.response?.url;
        setRealImageUrl(url);
        form.setFieldValue("avatar_real_url", url);
        setUploading(false);
      } catch (error) {
        console.error("Error processing image:", error);
        message.error("Failed to process image");
        setUploading(false);
      }
    }
  };

  const handleUpdateProfile = async (values: any) => {
    if (!publicKey) return;

    try {
      console.log("Updating profile with values:", values);
      // BSC addresses are already strings, no need for toBase58()
      await api.users.updateProfile(publicKey, values);
      message.success("Profile updated successfully");
      setEditing(false);
      fetchProfile();
    } catch (error) {
      console.error("Error updating profile:", error);
      message.error("Failed to update profile");
    }
  };

  const handleLike = async (postId: string) => {
    if (!publicKey) return;

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

      fetchProfile();
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      message.error("Failed to like/unlike post");
    }
  };

  // 如果正在加载，显示加载状态
  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#000000",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          color: "#ffffff",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  // 如果没有连接钱包，显示 TikTok 风格的提示页面
  if (!publicKey) {
    return (
      <div
        style={{
          height: "100vh",
          background: "#161722",
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px",
        }}
      >
        {/* 顶部导航栏 */}
        <TopNavigation
          onConnect={() => {
            console.log('Profile (empty state): Calling connect()');
            connect();
          }}
          onDisconnect={() => {
            console.log('Profile (empty state): Calling disconnect()');
            disconnect();
          }}
          isConnected={false}
        />

        {/* 个人资料区域 */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
              fontSize: "60px",
            }}
          >
            👤
          </div>
          <div
            style={{
              fontSize: "24px",
              fontWeight: "bold",
              marginBottom: "8px",
            }}
          >
            用户昵称
          </div>
          <div
            style={{ fontSize: "14px", color: "#999", marginBottom: "20px" }}
          >
            连接钱包查看地址
          </div>
        </div>

        {/* 统计数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            maxWidth: "300px",
            marginBottom: "40px",
          }}
        >
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>0</div>
            <div style={{ fontSize: "12px", color: "#999" }}>关注</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>0</div>
            <div style={{ fontSize: "12px", color: "#999" }}>粉丝</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>0</div>
            <div style={{ fontSize: "12px", color: "#999" }}>获赞量</div>
          </div>
        </div>

        {/* Tab 区域 */}
        <div
          style={{
            display: "flex",
            width: "100%",
            marginBottom: "20px",
          }}
        >
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom: "2px solid #fff",
              fontSize: "16px",
              fontWeight: "bold",
            }}
          >
            <img
              src="/images/group.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom: "1px solid #333",
              fontSize: "16px",
              color: "#999",
            }}
          >
            <img
              src="/images/like.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
          <div
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom: "1px solid #333",
              fontSize: "16px",
              color: "#999",
            }}
          >
            <img
              src="/images/mark.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
        </div>

        {/* 内容网格 */}
        <ContentGrid posts={[]} loading={false} router={router} />

        {/* 隐藏的钱包按钮 */}
        <div style={{ display: "none" }}>
          <BscWalletButton />
        </div>
      </div>
    );
  }

  const uploadButton = (
    <div>
      {uploading ? <LoadingOutlined /> : <PlusOutlined />}
      <div style={{ marginTop: 8 }}>Upload</div>
    </div>
  );

  const shortenedAddress = publicKey
    ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
    : "未连接钱包";

  // 获取当前显示的内容
  const getCurrentPosts = () => {
    switch (activeTab) {
      case "liked":
        return { posts: likedPosts, loading: likedPostsLoading };
      case "collected":
        return { posts: collectedPosts, loading: collectedPostsLoading };
      default:
        return { posts: posts, loading: postsLoading };
    }
  };

  const currentPosts = getCurrentPosts();

  return (
    <div style={{ height: "100vh", background: "#161722", color: "#ffffff" }}>
      {/* 顶部导航栏 */}
      <TopNavigation 
        onConnect={() => {
          console.log('Profile: Calling connect()');
          connect();
        }} 
        onDisconnect={() => {
          console.log('Profile: Calling disconnect()');
          disconnect();
        }} 
        isConnected={!!publicKey} 
      />

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
            src={profile?.avatar_url}
            style={{
              border: "4px solid rgba(255,255,255,0.3)",
              boxShadow: "0 4px 15px rgba(0,0,0,0.2)",
            }}
          />
          {/* 头像右下角的加号 */}
          <div
            style={{
              position: "absolute",
              bottom: "0",
              right: "0",
              width: "32px",
              height: "32px",
              borderRadius: "50%",
              background: "#10b981",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              border: "3px solid #000000",
            }}
            onClick={() => setEditing(true)}
          >
            <PlusOutlined style={{ color: "#fff", fontSize: "16px" }} />
          </div>
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
            {profile?.display_name || profile?.username || "用户昵称"}
          </div>
          <div style={{ fontSize: "14px", color: "#999" }}>
            {publicKey || "钱包地址"}
          </div>
        </div>

        {/* 操作按钮 */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            marginBottom: "30px",
          }}
        >
          <Button
            type="primary"
            icon={<UserAddOutlined />}
            onClick={() => setAddFriendsModalVisible(true)}
            style={{
              background: "rgba(255,255,255,0.2)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              color: "white",
              height: "35px",
              padding: "0 20px",
            }}
          >
            Add Friends
          </Button>
          <Button
            type="default"
            icon={<ShareAltOutlined />}
            onClick={() => {
              const profileUrl = `${
                window.location.origin
              }/users/${publicKey}`;
              navigator.clipboard.writeText(profileUrl);
              message.success("Profile link copied to clipboard!");
            }}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              borderRadius: "20px",
              color: "white",
              height: "35px",
              padding: "0 20px",
            }}
          >
            Share Profile
          </Button>
        </div>

        {/* 统计数据 */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-around",
            width: "100%",
            maxWidth: "300px",
            margin: "0 auto 30px",
          }}
        >
          <div
            style={{
              textAlign: "center",
              cursor: "pointer",
            }}
            onClick={() =>
              router.push(`/users/${publicKey}/following`)
            }
          >
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {profile?._count.following || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>关注</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {profile?._count.followers || 0}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>粉丝</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: "20px", fontWeight: "bold" }}>
              {Math.floor((profile?._count.followers || 0) * 1.3)}
            </div>
            <div style={{ fontSize: "12px", color: "#999" }}>获赞量</div>
          </div>
        </div>

        {/* Tab 区域 */}
        <div
          style={{
            display: "flex",
            width: "100%",
          }}
        >
          <div
            onClick={() => setActiveTab("posts")}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom:
                activeTab === "posts" ? "2px solid #fff" : "1px solid #333",
              fontSize: "16px",
              fontWeight: activeTab === "posts" ? "bold" : "normal",
              color: activeTab === "posts" ? "#fff" : "#999",
              cursor: "pointer",
            }}
          >
            <img
              src="/images/group.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
          <div
            onClick={() => setActiveTab("liked")}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom:
                activeTab === "liked" ? "2px solid #fff" : "1px solid #333",
              fontSize: "16px",
              fontWeight: activeTab === "liked" ? "bold" : "normal",
              color: activeTab === "liked" ? "#fff" : "#999",
              cursor: "pointer",
            }}
          >
            <img
              src="/images/like.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
          <div
            onClick={() => setActiveTab("collected")}
            style={{
              flex: 1,
              textAlign: "center",
              padding: "12px 0",
              borderBottom:
                activeTab === "collected" ? "2px solid #fff" : "1px solid #333",
              fontSize: "16px",
              fontWeight: activeTab === "collected" ? "bold" : "normal",
              color: activeTab === "collected" ? "#fff" : "#999",
              cursor: "pointer",
            }}
          >
            <img
              src="/images/mark.png"
              style={{ width: "26px", height: "26px" }}
              alt=""
            />
          </div>
        </div>
      </div>

      {/* 内容网格 */}
      <ContentGrid
        posts={currentPosts.posts}
        loading={currentPosts.loading}
        router={router}
      />

      {/* 编辑个人资料模态框 */}
      {editing && publicKey && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0,0,0,0.8)",
            zIndex: 2000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <Card
            style={{
              width: "100%",
              maxWidth: "400px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
          >
            <Form form={form} layout="vertical" onFinish={handleUpdateProfile}>
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
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
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
                        style={{
                          width: "100%",
                          height: "100%",
                          objectFit: "cover",
                        }}
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
                getValueFromEvent={(checked: boolean) =>
                  checked ? "MALE" : "FEMALE"
                }
                getValueProps={(value: string) => ({
                  checked: value === "MALE",
                })}
              >
                <Switch
                  checkedChildren="Male"
                  unCheckedChildren="Female"
                  style={{ backgroundColor: undefined }}
                  className={
                    form.getFieldValue("gender") === "MALE"
                      ? ""
                      : "female-switch"
                  }
                />
              </Form.Item>

              <Form.Item
                name="username"
                label="Username"
                rules={[{ required: true, message: "Please enter a username" }]}
              >
                <Input />
              </Form.Item>

              <Form.Item name="display_name" label="Display Name">
                <Input />
              </Form.Item>

              <Form.Item name="bio" label="Bio">
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
                  <Button onClick={() => setEditing(false)}>Cancel</Button>
                </Space>
              </Form.Item>
            </Form>
          </Card>
        </div>
      )}

      {/* 好友模态框 */}
      {publicKey && (
        <AddFriendsModal
          visible={addFriendsModalVisible}
          onClose={() => setAddFriendsModalVisible(false)}
          currentUserAddress={publicKey}
        />
      )}

      <style jsx global>{`
        .female-switch.ant-switch:not(.ant-switch-checked) {
          background-color: #ff69b4 !important;
        }
      `}</style>
    </div>
  );
}
