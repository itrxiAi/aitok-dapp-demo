"use client";

import { useEffect, useState } from "react";
import { api, Post as ApiPost } from "@/services/api";
import { Post } from "@/components/Post";
import { ContentListPage } from "@/components/ContentListPage";
import { TikTokFeed } from "@/components/TikTokFeed";
import { useWallet } from "@/hooks/useWallet";
import { SearchOutlined } from "@ant-design/icons";
import Image from "next/image";
import { useRouter } from "next/navigation";

// 顶部导航栏组件
const TopNavigation = ({
  activeTab,
  onTabChange,
  backgroundColor = "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
}: {
  activeTab: string;
  onTabChange: (tab: string) => void;
  backgroundColor?: string;
}) => {
  const tabs = [
    { key: "explore", label: "探索" },
    { key: "following", label: "关注" },
    { key: "recommend", label: "推荐" },
  ];

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        background: backgroundColor,
        zIndex: 1000,
        padding: "12px 16px",
        boxShadow:
          backgroundColor === "transparent"
            ? "none"
            : "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* 内容容器 - 与页面主体保持一致的宽度限制 */}
      <div
        style={{
          maxWidth: 600,
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* 左侧 Logo */}
        <img
          src="/images/logo.png"
          alt="logo"
          style={{ width: "90px", height: "22px" }}
        />

        {/* 中间 Tab 区域 */}
        <div style={{ display: "flex", gap: "12px" }}>
          {tabs.map((tab) => (
            <div
              key={tab.key}
              onClick={() => onTabChange(tab.key)}
              style={{
                position: "relative",
                cursor: "pointer",
                padding: "8px 0",
              }}
            >
              <div
                style={{
                  fontSize: "18px",
                  color: "#fff",
                  fontWeight: activeTab === tab.key ? "bold" : "normal",
                  transition: "all 0.3s ease",
                }}
              >
                {tab.label}
              </div>
              {activeTab === tab.key && (
                <div
                  style={{
                    position: "absolute",
                    bottom: "-4px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "30px",
                    height: "4px",
                    background: "#fff",
                    borderRadius: "2px",
                    transition: "all 0.3s ease",
                  }}
                />
              )}
            </div>
          ))}
        </div>

        {/* 右侧搜索图标 */}
        <SearchOutlined style={{ color: "#fff", fontSize: "22px" }} />
      </div>
    </div>
  );
};

// 关注用户接口
interface FollowingUser {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

// 探索Feed组件
const ExploreFeed = ({
  posts,
  loading,
  onUpdate,
}: {
  posts: ApiPost[];
  loading: boolean;
  onUpdate: () => void;
}) => {
  const { publicKey } = useWallet();
  const router = useRouter();

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

  if (posts.length === 0) {
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
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>🔍</div>
          <div>暂无探索内容</div>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#000000",
        padding: "60px 2px 0",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "2px",
          padding: "0 14px",
        }}
      >
        {posts.map((post) => (
          <div
            key={post.id}
            style={{
              height: "257px",
              width: "100%",
              position: "relative",
              background: "#000000",
              borderRadius: "8px",
              overflow: "hidden",
              cursor: "pointer",
            }}
            onClick={() => router.push(`/posts/${post.id}`)}
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

            {/* 内容覆盖层 - 显示文字内容 */}
            {post.content && (
              <div
                style={{
                  position: "absolute",
                  bottom: "0",
                  left: "0",
                  right: "0",
                  background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
                  padding: "20px 12px 12px",
                  zIndex: 2,
                  color: "#ffffff",
                }}
              >
                <div
                  style={{
                    fontSize: "12px",
                    lineHeight: "1.3",
                    maxHeight: "60px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: "vertical",
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {post.content}
                </div>
              </div>
            )}

            {/* 用户信息 */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                left: "8px",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                zIndex: 2,
                background: "rgba(0,0,0,0.6)",
                padding: "4px 8px",
                borderRadius: "12px",
                backdropFilter: "blur(4px)",
              }}
            >
              <div
                style={{
                  width: "20px",
                  height: "20px",
                  borderRadius: "50%",
                  background: "rgba(255,255,255,0.3)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  overflow: "hidden",
                }}
              >
                {post.author?.avatar_url ? (
                  <Image
                    src={post.author.avatar_url}
                    alt="User avatar"
                    width={20}
                    height={20}
                    style={{
                      borderRadius: "50%",
                      objectFit: "cover",
                    }}
                    unoptimized
                  />
                ) : (
                  <div
                    style={{
                      fontSize: "10px",
                      color: "#ffffff",
                    }}
                  >
                    👤
                  </div>
                )}
              </div>
              <div
                style={{
                  fontSize: "10px",
                  color: "#ffffff",
                  fontWeight: "500",
                  maxWidth: "60px",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {post.author?.display_name ||
                  post.author?.username ||
                  `${post.author?.wallet_address?.slice(0, 4)}...`}
              </div>
            </div>

            {/* 互动数据 */}
            <div
              style={{
                position: "absolute",
                top: "8px",
                right: "8px",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <div style={{ fontSize: "8px", color: "#ffffff" }}>❤️</div>
                <div
                  style={{
                    fontSize: "8px",
                    color: "#ffffff",
                    fontWeight: "500",
                  }}
                >
                  {post.likes?.length || 0}
                </div>
              </div>
              <div
                style={{
                  background: "rgba(0,0,0,0.6)",
                  padding: "2px 6px",
                  borderRadius: "8px",
                  backdropFilter: "blur(4px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "2px",
                }}
              >
                <div style={{ fontSize: "8px", color: "#ffffff" }}>💬</div>
                <div
                  style={{
                    fontSize: "8px",
                    color: "#ffffff",
                    fontWeight: "500",
                  }}
                >
                  {post.comments?.length || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 关注Feed组件
const FollowingFeed = ({
  posts,
  loading,
  onUpdate,
}: {
  posts: ApiPost[];
  loading: boolean;
  onUpdate: () => void;
}) => {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [followingUsers, setFollowingUsers] = useState<FollowingUser[]>([]);
  const [followingLoading, setFollowingLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      fetchFollowingUsers();
    }
  }, [publicKey]);

  const fetchFollowingUsers = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(
        `/api/users/${publicKey}/following`
      );
      const data = await response.json();
      setFollowingUsers(data);
    } catch (error) {
      console.error("Error fetching following users:", error);
    } finally {
      setFollowingLoading(false);
    }
  };

  return (
    <div style={{ height: "100vh", position: "relative", overflow: "hidden" }}>
      {/* 横向关注列表 - 固定在顶部 */}
      <div
        style={{
          position: "fixed",
          top: "60px",
          left: "0",
          right: "0",
          zIndex: 1000,
          padding: "0 16px",
          background: "rgba(0,0,0,0.8)",
          backdropFilter: "blur(10px)",
        }}
      >
        <div
          style={{
            display: "flex",
            gap: "16px",
            overflowX: "auto",
            padding: "8px 0",
            scrollbarWidth: "none",
            msOverflowStyle: "none",
          }}
        >
          {followingLoading ? (
            <div style={{ color: "#ffffff", padding: "8px" }}>Loading...</div>
          ) : followingUsers.length > 0 ? (
            followingUsers.map((user) => (
              <div
                key={user.wallet_address}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  minWidth: "60px",
                  cursor: "pointer",
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
                    marginBottom: "4px",
                  }}
                >
                  {user.avatar_url ? (
                    <Image
                      src={user.avatar_url}
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
                <div
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    textAlign: "center",
                    maxWidth: "60px",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {user.display_name ||
                    user.username ||
                    `${user.wallet_address.slice(0, 4)}...`}
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: "#ffffff", padding: "8px" }}>
              No following users
            </div>
          )}
        </div>
      </div>

      {/* TikTok样式的Feed内容 */}
      <div
        style={{
          height: "calc(100vh - 120px)",
          marginTop: "120px",
          overflow: "hidden",
        }}
      >
        <TikTokFeed
          posts={posts}
          loading={loading}
          onUpdate={onUpdate}
          showTopSpacing={false}
          customHeight="calc(100vh - 120px)"
          onPostClick={(post) => router.push(`/posts/${post.id}`)}
        />
      </div>
    </div>
  );
};

export default function RecommendPage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("recommend");

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      // For now, we're using the same API as the home page
      // In a real app, this would be a different API endpoint for recommended posts
      const walletAddress = publicKey ? publicKey : undefined;
      const fetchedPosts = await api.posts.list(walletAddress);
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error fetching recommended posts:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderPost = (post: ApiPost) => (
    <Post key={post.id} post={post} onUpdate={fetchPosts} />
  );

  // 根据选中的 tab 渲染不同内容
  const renderTabContent = () => {
    switch (activeTab) {
      case "explore":
        return (
          <ExploreFeed posts={posts} loading={loading} onUpdate={fetchPosts} />
        );
      case "following":
        return (
          <FollowingFeed
            posts={posts}
            loading={loading}
            onUpdate={fetchPosts}
          />
        );
      case "recommend":
      default:
        return (
          <TikTokFeed
            posts={posts}
            loading={loading}
            onUpdate={fetchPosts}
            onPostClick={(post) => router.push(`/posts/${post.id}`)}
          />
        );
    }
  };

  // 根据选中的 tab 确定背景色
  const getBackgroundColor = () => {
    switch (activeTab) {
      case "recommend":
        return "transparent";
      case "explore":
      case "following":
      default:
        return "#000000";
    }
  };

  return (
    <div>
      <TopNavigation
        activeTab={activeTab}
        onTabChange={setActiveTab}
        backgroundColor={getBackgroundColor()}
      />
      {renderTabContent()}
    </div>
  );
}
