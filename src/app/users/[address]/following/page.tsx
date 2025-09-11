"use client";

import { useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { Card, List, Button } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import { useRouter } from "next/navigation";
import { UserCard } from "@/components/UserCard";

interface User {
  wallet_address: string;
  display_name?: string;
  username?: string;
  avatar_url?: string;
  _count: {
    posts: number;
    followers: number;
    following: number;
  };
}

export default function FollowingPage() {
  const params = useParams();
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFollowing();
  }, [params.address]);

  const fetchFollowing = async () => {
    try {
      const response = await fetch(`/api/users/${params.address}/following`);
      if (!response.ok) {
        throw new Error("Failed to fetch following");
      }
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching following:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#161722",
        color: "#ffffff",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ marginBottom: 16 }}>
          <Button
            icon={<ArrowLeftOutlined />}
            onClick={() => router.back()}
            style={{
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.3)",
              color: "#ffffff",
            }}
          >
            Back
          </Button>
        </div>

        <Card
          loading={loading}
          style={{
            background: "rgba(0,0,0,0.05)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#ffffff",
          }}
        >
          <List
            dataSource={users}
            renderItem={(user) => <UserCard user={user} />}
          />
        </Card>
      </div>
    </div>
  );
}
