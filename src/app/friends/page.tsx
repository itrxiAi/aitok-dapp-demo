"use client";

import { useEffect, useState } from "react";
import { api, Post as ApiPost } from "@/services/api";
import { TikTokFeed } from "@/components/TikTokFeed";
import { useWallet } from "@solana/wallet-adapter-react";
import { useRouter } from "next/navigation";
import { SearchOutlined } from "@ant-design/icons";

// 顶部导航栏组件
const TopNavigation = () => {
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
        justifyContent: "space-between",
        boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
      }}
    >
      {/* 左侧 Logo */}
      <img
        src="/images/logo.png"
        alt="logo"
        style={{ width: "58px", height: "22px" }}
      />

      {/* 中间标题 */}
      <div
        style={{
          fontSize: "18px",
          color: "#fff",
          fontWeight: "bold",
        }}
      >
        好友
      </div>

      {/* 右侧搜索图标 */}
      <SearchOutlined style={{ color: "#fff", fontSize: "22px" }} />
    </div>
  );
};

export default function Friends() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [posts, setPosts] = useState<ApiPost[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (publicKey) {
      fetchFriendsPosts();
    } else {
      setLoading(false);
    }
  }, [publicKey]);

  const fetchFriendsPosts = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);
      const data = await api.users.getFriendsPosts(publicKey.toBase58());
      setPosts(data);
    } catch (error) {
      console.error("Error fetching friends posts:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <TopNavigation />
      <TikTokFeed
        posts={posts}
        loading={loading}
        onUpdate={fetchFriendsPosts}
        onPostClick={(post) => router.push(`/posts/${post.id}`)}
      />
    </div>
  );
}
