"use client";

import { Avatar, Typography, Button, message, Space, List } from "antd";
import { UserOutlined, DownOutlined, UpOutlined } from "@ant-design/icons";
import { useEffect, useState } from "react";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";
import { ContentListPage } from "@/components/ContentListPage";
import { useWallet } from "@/hooks/useWallet";

const { Text } = Typography;

interface User {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
  bio?: string;
  _count: {
    followers: number;
  };
}

export default function Following() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [following, setFollowing] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedBios, setExpandedBios] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (publicKey) {
      fetchFollowing();
    }
  }, [publicKey]);

  const fetchFollowing = async () => {
    if (!publicKey) return;

    try {
      const response = await fetch(
        `/api/users/${publicKey}/following`
      );
      const data = await response.json();
      setFollowing(data);
    } catch (error) {
      console.error("Error fetching following:", error);
      message.error("Failed to fetch following list");
    } finally {
      setLoading(false);
    }
  };

  const handleUnfollow = async (address: string) => {
    if (!publicKey) return;

    try {
      await api.users.unfollow(publicKey, address);
      message.success("Unfollowed successfully");
      fetchFollowing();
    } catch (error) {
      console.error("Error unfollowing user:", error);
      message.error("Failed to unfollow user");
    }
  };

  const toggleBio = (address: string) => {
    setExpandedBios((prev) => ({
      ...prev,
      [address]: !prev[address],
    }));
  };

  const renderUser = (user: User) => (
    <List.Item>
      <List.Item.Meta
        avatar={
          <Avatar
            icon={<UserOutlined />}
            src={user.avatar_url}
            style={{ cursor: "pointer" }}
            onClick={() => router.push(`/users/${user.wallet_address}`)}
          />
        }
        title={
          <div>
            <a onClick={() => router.push(`/users/${user.wallet_address}`)}>
              {user.display_name ||
                user.username ||
                `${user.wallet_address.slice(
                  0,
                  4
                )}...${user.wallet_address.slice(-4)}`}
            </a>
            <Space style={{ marginLeft: 16, fontSize: "0.9em", color: "#666" }}>
              <Text>{user._count?.followers || 0} Followers</Text>
              <Button
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  handleUnfollow(user.wallet_address);
                }}
                style={{
                  border: "1px solid rgb(207, 217, 222)",
                  borderRadius: "16px",
                  height: "28px",
                  padding: "0 12px",
                  color: "rgb(83, 100, 113)",
                  fontWeight: 400,
                  fontSize: "13px",
                  background: "white",
                }}
              >
                Unfollow
              </Button>
            </Space>
          </div>
        }
        description={
          user.bio && (
            <div>
              <div
                style={{
                  marginTop: 4,
                  position: "relative",
                  maxHeight: expandedBios[user.wallet_address]
                    ? "none"
                    : "44px",
                  overflow: "hidden",
                }}
              >
                {user.bio}
              </div>
              {user.bio.length > 100 && (
                <Button
                  type="link"
                  size="small"
                  onClick={() => toggleBio(user.wallet_address)}
                  style={{ padding: 0, height: "auto", marginTop: 4 }}
                >
                  {expandedBios[user.wallet_address] ? (
                    <Space>
                      <span>Show less</span>
                      <UpOutlined style={{ fontSize: "12px" }} />
                    </Space>
                  ) : (
                    <Space>
                      <span>Show more</span>
                      <DownOutlined style={{ fontSize: "12px" }} />
                    </Space>
                  )}
                </Button>
              )}
            </div>
          )
        }
      />
    </List.Item>
  );

  return (
    <ContentListPage
      title="Following"
      data={following}
      loading={loading}
      emptyMessage="You are not following anyone yet"
      notConnectedMessage="Please connect your wallet to view your following list"
      renderItem={renderUser}
      fetchData={fetchFollowing}
    />
  );
}
