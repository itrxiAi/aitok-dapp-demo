"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { List, Avatar, Badge, Spin, Input, Button, Modal, Form, Select, message } from "antd";
import { ArrowLeftOutlined, SearchOutlined, PlusOutlined, UsergroupAddOutlined } from "@ant-design/icons";
import Image from "next/image";

interface UserInfo {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

interface ConversationItem {
  user: UserInfo;
  lastMessage?: {
    content?: string;
    messageType: string;
    createdAt: string;
  };
  unreadCount: number;
  conversationId: string;
}

export default function ChatsPage() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [allUsers, setAllUsers] = useState<UserInfo[]>([]);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [createGroupModalVisible, setCreateGroupModalVisible] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    if (!publicKey) {
      router.push("/profile");
      return;
    }
    
    fetchAllUsers();
  }, [publicKey]);

  const fetchAllUsers = async () => {
    if (!publicKey) return;

    try {
      // 获取所有用户
      const response = await fetch("/api/users");
      const data = await response.json();
      
      // Check if response is successful and data is an array
      if (!response.ok || !Array.isArray(data)) {
        console.error("Failed to fetch users or invalid response:", data);
        setAllUsers([]);
        setConversations([]);
        setLoading(false);
        return;
      }
      
      // 过滤掉当前用户
      const otherUsers = data.filter((u: UserInfo) => u.wallet_address !== publicKey);
      setAllUsers(otherUsers);

      // 获取所有会话（包括私聊和群聊）从 API
      const convResponse = await fetch(`/api/chat/conversations?userAddress=${publicKey}`);
      const conversationsData = await convResponse.json();
      
      const conversationItems: ConversationItem[] = [];

      // API 已经返回了完整的会话信息，直接使用
      for (const conv of conversationsData) {
        conversationItems.push({
          user: conv.otherUser,
          lastMessage: conv.lastMessage,
          unreadCount: conv.unreadCount,
          conversationId: conv.id
        });
      }

      // 添加没有会话的用户
      for (const user of otherUsers) {
        const [addr1, addr2] = [publicKey, user.wallet_address].sort();
        const conversationId = `${addr1}_${addr2}`;
        const hasConversation = conversationItems.some(item => item.conversationId === conversationId);
        
        if (!hasConversation) {
          conversationItems.push({
            user,
            lastMessage: undefined,
            unreadCount: 0,
            conversationId
          });
        }
      }

      // 按最后消息时间排序，有消息的排在前面
      conversationItems.sort((a, b) => {
        if (!a.lastMessage && !b.lastMessage) return 0;
        if (!a.lastMessage) return 1;
        if (!b.lastMessage) return -1;
        return new Date(b.lastMessage.createdAt).getTime() - new Date(a.lastMessage.createdAt).getTime();
      });

      setConversations(conversationItems);
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const getLastMessagePreview = (item: ConversationItem) => {
    if (!item.lastMessage) return "开始聊天";
    
    switch (item.lastMessage.messageType) {
      case "image":
        return "[图片]";
      case "voice":
        return "[语音]";
      default:
        return item.lastMessage.content || "";
    }
  };

  const getLastMessageTime = (item: ConversationItem) => {
    if (!item.lastMessage) return "";
    
    const date = new Date(item.lastMessage.createdAt);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString("zh-CN", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      return date.toLocaleDateString("zh-CN", {
        month: "2-digit",
        day: "2-digit",
      });
    }
  };

  const filteredConversations = conversations.filter(item => {
    if (!searchText) return true;
    const searchLower = searchText.toLowerCase();
    return (
      item.user.display_name?.toLowerCase().includes(searchLower) ||
      item.user.username?.toLowerCase().includes(searchLower) ||
      item.user.wallet_address.toLowerCase().includes(searchLower)
    );
  });

  const handleCreateGroup = async (values: any) => {
    if (!publicKey) return;
    
    const { groupName, members } = values;
    
    try {
      // Create group conversation via API
      const response = await fetch('/api/chat/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          groupName,
          members,
          creator: publicKey
        })
      });
      
      const groupConv = await response.json();
      
      message.success(`群聊"${groupName}"创建成功！`);
      setCreateGroupModalVisible(false);
      form.resetFields();
      
      // Refresh conversations list and wait for it
      await fetchAllUsers();
      
      // Navigate to the new group chat
      router.push(`/chat/${groupConv.id}`);
    } catch (error) {
      console.error('Error creating group:', error);
      message.error('创建群聊失败');
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
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: "#ffffff",
          padding: "12px 16px",
          borderBottom: "1px solid #e5e5e5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
          <ArrowLeftOutlined
            onClick={() => router.back()}
            style={{ fontSize: "18px", cursor: "pointer" }}
          />
          <div style={{ fontSize: "18px", fontWeight: "600", flex: 1 }}>消息</div>
          <Button
            type="text"
            icon={<PlusOutlined />}
            onClick={() => setCreateGroupModalVisible(true)}
            style={{ fontSize: "20px", padding: "4px 8px" }}
          />
        </div>
        
        {/* Search Bar */}
        <Input
          placeholder="搜索"
          prefix={<SearchOutlined style={{ color: "#999" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            borderRadius: "8px",
            background: "#f5f5f5",
            border: "none",
          }}
        />
      </div>

      {/* Conversations List */}
      <div style={{ flex: 1, background: "#ffffff", overflowY: "auto" }}>
        {filteredConversations.length === 0 ? (
          <div
            style={{
              padding: "60px 20px",
              textAlign: "center",
              color: "#999",
            }}
          >
            <div style={{ fontSize: "48px", marginBottom: "16px" }}>💬</div>
            <div>{searchText ? "未找到匹配的用户" : "暂无用户"}</div>
          </div>
        ) : (
          <List
            dataSource={filteredConversations}
            renderItem={(item) => (
              <List.Item
                onClick={() => router.push(`/chat/${item.user.wallet_address}`)}
                style={{
                  padding: "12px 16px",
                  cursor: "pointer",
                  borderBottom: "1px solid #f0f0f0",
                  background: "#ffffff",
                }}
              >
                <List.Item.Meta
                  avatar={
                    <Badge count={item.unreadCount} offset={[-5, 5]}>
                      {item.user.avatar_url ? (
                        <Image
                          src={item.user.avatar_url}
                          alt="avatar"
                          width={48}
                          height={48}
                          style={{ borderRadius: "8px" }}
                          unoptimized
                        />
                      ) : (
                        <Avatar size={48} style={{ background: "#e5e5e5", borderRadius: "8px" }}>
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
                      <span style={{ fontWeight: item.unreadCount > 0 ? "600" : "normal" }}>
                        {item.user.display_name ||
                          item.user.username ||
                          `${item.user.wallet_address.slice(0, 6)}...`}
                      </span>
                      <span style={{ fontSize: "12px", color: "#999" }}>
                        {getLastMessageTime(item)}
                      </span>
                    </div>
                  }
                  description={
                    <div
                      style={{
                        color: item.unreadCount > 0 ? "#000" : "#999",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        fontWeight: item.unreadCount > 0 ? "500" : "normal",
                      }}
                    >
                      {getLastMessagePreview(item)}
                    </div>
                  }
                />
              </List.Item>
            )}
          />
        )}
      </div>

      {/* Create Group Modal */}
      <Modal
        title="创建群聊"
        open={createGroupModalVisible}
        onCancel={() => {
          setCreateGroupModalVisible(false);
          form.resetFields();
        }}
        footer={null}
        width={400}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateGroup}
        >
          <Form.Item
            label="群聊名称"
            name="groupName"
            rules={[{ required: true, message: "请输入群聊名称" }]}
          >
            <Input placeholder="输入群聊名称" />
          </Form.Item>

          <Form.Item
            label="选择成员"
            name="members"
            rules={[{ required: true, message: "请选择至少一个成员" }]}
          >
            <Select
              mode="multiple"
              placeholder="选择群成员"
              style={{ width: "100%" }}
              options={allUsers.map(user => ({
                label: user.display_name || user.username || `${user.wallet_address.slice(0, 6)}...`,
                value: user.wallet_address,
              }))}
            />
          </Form.Item>

          <Form.Item>
            <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
              <Button onClick={() => {
                setCreateGroupModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" style={{ background: "#07c160" }}>
                创建
              </Button>
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}