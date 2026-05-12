"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { List, Avatar, Badge, Spin } from "antd";
import { ArrowLeftOutlined } from "@ant-design/icons";
import Image from "next/image";
import { chatStore } from "@/lib/chatStore";

interface Message {
  id: string;
  content?: string;
  mediaUrl?: string;
  messageType: "text" | "image" | "voice";
  createdAt: string;
}

interface UserInfo {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface ConversationItem {
  id: string;
  participant1: string;
  participant2: string;
  lastMessageAt: string;
  otherUser: UserInfo;
  lastMessage: Message | null;
  unreadCount: number;
}

export default function ChatListPage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!publicKey) {
      router.push("/profile");
      return;
    }

    fetchConversations();
  }, [publicKey]);

  const fetchConversations = async () => {
    if (!publicKey) return;

    try {
      // Get conversations from chatStore (loads from localStorage)
      const convs = chatStore.getConversations(publicKey);
      
      // Fetch user info for each conversation
      const conversationsWithUserInfo = await Promise.all(
        convs.map(async (conv) => {
          const otherUserAddress = conv.participant1 === publicKey 
            ? conv.participant2 
            : conv.participant1;
          
          try {
            const userResponse = await fetch(`/api/users/${otherUserAddress}`);
            const otherUser = await userResponse.json();
            
            const messages = chatStore.getMessages(conv.id);
            const lastMessage = messages[messages.length - 1] || null;
            const unreadCount = chatStore.getUnreadCount(conv.id, publicKey);
            
            return {
              ...conv,
              otherUser,
              lastMessage,
              unreadCount
            };
          } catch (error) {
            console.error(`Error fetching user ${otherUserAddress}:`, error);
            return null;
          }
        })
      );
      
      setConversations(conversationsWithUserInfo.filter(c => c !== null) as ConversationItem[]);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLastMessagePreview = (msg: Message | null) => {
    if (!msg) return "暂无消息";
    
    switch (msg.messageType) {
      case "image":
        return "[图片]";
      case "voice":
        return "[语音]";
      default:
        return msg.content || "";
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
          background: "#f5f5f5",
        }}
      >
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div
      style={{
        height: "100vh",
        background: "#f5f5f5",
        maxWidth: "600px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#ffffff",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <ArrowLeftOutlined
          onClick={() => router.back()}
          style={{ fontSize: "18px", cursor: "pointer" }}
        />
        <div style={{ fontSize: "18px", fontWeight: "600" }}>聊天</div>
      </div>

      {/* Conversations List */}
      <div style={{ background: "#ffffff" }}>
        {conversations.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#999",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
            <div>暂无聊天记录</div>
          </div>
        ) : (
          <List
            dataSource={conversations}
            renderItem={(item) => (
              <List.Item
                onClick={() => router.push(`/chat/${item.otherUser.wallet_address}`)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={item.unreadCount} offset={[-5, 5]}>
                      {item.otherUser.avatar_url ? (
                        <Image
                          src={item.otherUser.avatar_url}
                          alt="avatar"
                          width={48}
                          height={48}
                          style={{ borderRadius: "50%" }}
                          unoptimized
                        />
                      ) : (
                        <Avatar size={48} style={{ background: "#e5e5e5" }}>
                          👤
                        </Avatar>
                      )}
                    </Badge>
                  }
                  title={
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                      }}
                    >
                      <span style={{ fontWeight: "600" }}>
                        {item.otherUser.display_name ||
                          item.otherUser.username ||
                          `${item.otherUser.wallet_address.slice(0, 6)}...`}
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        {new Date(item.lastMessageAt).toLocaleTimeString(
                          "zh-CN",
                          {
                            hour: "2-digit",
                            minute: "2-digit",
                          }
                        )}
                      </span>
                    </div>
                  }
                  description={
                    <div
                      style={{
                        color: "#999",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {getLastMessagePreview(item.lastMessage)}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>
    </div>
  );
}
