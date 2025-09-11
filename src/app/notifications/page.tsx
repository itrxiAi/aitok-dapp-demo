"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import {
  List,
  Typography,
  Card,
  Space,
  Avatar,
  Button,
  Empty,
  Badge,
  Input,
} from "antd";
import { useEffect, useState } from "react";
import { api, Notification, NotificationType } from "@/services/api";
import { useRouter } from "next/navigation";
import { UserOutlined, CheckOutlined, SearchOutlined } from "@ant-design/icons";
import Image from "next/image";

const { Text, Title } = Typography;

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
        消息
      </div>

      {/* 右侧搜索图标 */}
      <SearchOutlined style={{ color: "#fff", fontSize: "22px" }} />
    </div>
  );
};

// 生成几何头像的函数
const generateGeometricAvatar = (name: string, size: number = 40) => {
  const colors = [
    ["#1e3a8a", "#10b981"], // 深蓝+绿色
    ["#dc2626", "#f97316", "#1e3a8a"], // 红+橙+深蓝
    ["#166534", "#1e3a8a"], // 深绿+深蓝
    ["#fbbf24"], // 黄色
    ["#1e3a8a", "#3b82f6"], // 深蓝+浅蓝
  ];

  const colorSet = colors[name.length % colors.length];
  const pattern = name.length % 3; // 0: 复杂几何, 1: 四象限, 2: 网格

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: `linear-gradient(45deg, ${colorSet.join(", ")})`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        fontWeight: "bold",
        color: "#fff",
        textShadow: "0 1px 2px rgba(0,0,0,0.5)",
      }}
    >
      {name.charAt(0).toUpperCase()}
    </div>
  );
};

export default function Notifications() {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    total: 0,
    offset: 0,
    limit: 20,
  });
  const [searchText, setSearchText] = useState("");

  useEffect(() => {
    fetchNotifications();
  }, [publicKey]);

  const fetchNotifications = async () => {
    if (!publicKey) {
      setNotifications([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await api.notifications.list(publicKey.toBase58(), {
        limit: pagination.limit,
        offset: pagination.offset,
        includeRead: true,
      });
      setNotifications(response.data);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark notification as read
    if (!notification.is_read) {
      try {
        await api.notifications.markAsRead(notification.id);
        // Update the notification in the local state
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, is_read: true } : n
          )
        );
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    }

    // Navigate based on notification type
    switch (notification.type) {
      case NotificationType.FOLLOW:
        router.push(`/users/${notification.sender_address}`);
        break;
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
        if (notification.post_id) {
          router.push(`/posts/${notification.post_id}`);
        }
        break;
      case NotificationType.MESSAGE:
        // For messages, we could navigate to a chat/conversation view
        router.push(`/messages?user=${notification.sender_address}`);
        break;
      default:
        // Default action if type is not recognized
        break;
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!publicKey) return;

    try {
      await Promise.all(
        notifications
          .filter((n) => !n.is_read)
          .map((n) => api.notifications.markAsRead(n.id))
      );

      // Update all notifications in local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleClearAll = async () => {
    if (!publicKey) return;

    try {
      await api.notifications.deleteAll(publicKey.toBase58());
      setNotifications([]);
      setPagination((prev) => ({ ...prev, total: 0 }));
    } catch (error) {
      console.error("Error clearing notifications:", error);
    }
  };

  // 过滤通知
  const filteredNotifications = notifications.filter((notification) => {
    if (!searchText) return true;
    const senderName =
      notification.sender?.display_name ||
      notification.sender?.username ||
      notification.sender_address ||
      "";
    const content = notification.formatted_text || notification.text || "";
    return (
      senderName.toLowerCase().includes(searchText.toLowerCase()) ||
      content.toLowerCase().includes(searchText.toLowerCase())
    );
  });

  if (!publicKey) {
    return (
      <div style={{ height: "100vh", background: "#000000", color: "#ffffff" }}>
        <div
          style={{
            height: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Empty
            description="Connect your wallet to see notifications"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            style={{ color: "#ffffff" }}
          />
        </div>
      </div>
    );
  }

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div
      style={{ minHeight: "100vh", background: "#000000", color: "#ffffff" }}
    >
      {/* 搜索栏 */}
      <div
        style={{
          padding: "16px 16px 16px 16px",
          background: "#000000",
        }}
      >
        <Input
          placeholder="Search"
          prefix={<SearchOutlined style={{ color: "#666" }} />}
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{
            background: "#ffffff",
            borderRadius: "20px",
            height: "40px",
            border: "none",
          }}
        />
      </div>

      {/* 消息列表 */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "0 16px",
          background: "#000000",
        }}
      >
        {loading ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px 0",
              color: "#ffffff",
            }}
          >
            Loading...
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              padding: "40px 0",
              color: "#ffffff",
            }}
          >
            <Empty description="No notifications yet" />
          </div>
        ) : (
          <div>
            {filteredNotifications.map((notification) => {
              const senderName =
                notification.sender?.display_name ||
                notification.sender?.username ||
                (notification.sender_address
                  ? `${notification.sender_address.slice(
                      0,
                      4
                    )}...${notification.sender_address.slice(-4)}`
                  : "Unknown");
              const content =
                notification.formatted_text || notification.text || "";
              const time = new Date(notification.created_at);
              const now = new Date();
              const isToday = time.toDateString() === now.toDateString();
              const isYesterday =
                new Date(now.getTime() - 24 * 60 * 60 * 1000).toDateString() ===
                time.toDateString();

              let timeText = "";
              if (isToday) {
                timeText = time.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  hour12: true,
                });
              } else if (isYesterday) {
                timeText = "Yesterday";
              } else {
                timeText = time.toLocaleDateString("en-US", {
                  month: "2-digit",
                  day: "2-digit",
                  year: "2-digit",
                });
              }

              return (
                <div
                  key={notification.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: "12px 0",
                    borderBottom: "1px solid #333",
                    cursor: "pointer",
                    backgroundColor: notification.is_read
                      ? "transparent"
                      : "rgba(24, 144, 255, 0.1)",
                  }}
                  onClick={() => handleNotificationClick(notification)}
                >
                  {/* 头像 */}
                  <div style={{ marginRight: "12px" }}>
                    {notification.sender?.avatar_url ? (
                      <Image
                        src={notification.sender.avatar_url}
                        alt="Avatar"
                        width={40}
                        height={40}
                        style={{
                          borderRadius: "50%",
                          objectFit: "cover",
                        }}
                        unoptimized
                      />
                    ) : (
                      generateGeometricAvatar(senderName, 40)
                    )}
                  </div>

                  {/* 内容区域 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        marginBottom: "4px",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "bold",
                          color: "#ffffff",
                          fontSize: "16px",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                          whiteSpace: "nowrap",
                          flex: 1,
                        }}
                      >
                        {senderName}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          marginLeft: "8px",
                        }}
                      >
                        {notification.is_read ? (
                          <CheckOutlined
                            style={{ color: "#52c41a", fontSize: "16px" }}
                          />
                        ) : (
                          <div
                            style={{
                              width: "8px",
                              height: "8px",
                              borderRadius: "50%",
                              backgroundColor: "#ff4d4f",
                            }}
                          />
                        )}
                        <div
                          style={{
                            color: "#999",
                            fontSize: "12px",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {timeText}
                        </div>
                      </div>
                    </div>
                    <div
                      style={{
                        color: "#ccc",
                        fontSize: "14px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                        lineHeight: "1.4",
                      }}
                    >
                      {content}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
