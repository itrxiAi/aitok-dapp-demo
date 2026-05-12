"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useWallet } from "@/hooks/useWallet";
import { Button, Input, message as antMessage, Spin, Upload } from "antd";
import {
  ArrowLeftOutlined,
  SendOutlined,
  PictureOutlined,
  AudioOutlined,
  SmileOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import Image from "next/image";

interface Message {
  id: string;
  conversationId: string;
  senderAddress: string;
  content?: string;
  mediaUrl?: string;
  messageType: "text" | "image" | "voice";
  isRead: boolean;
  createdAt: string;
}

interface UserInfo {
  wallet_address: string;
  username?: string;
  display_name?: string;
  avatar_url?: string;
}

export default function ChatPage() {
  const { publicKey } = useWallet();
  const params = useParams();
  const router = useRouter();
  const otherUserAddress = params.address as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const [currentUser, setCurrentUser] = useState<UserInfo | null>(null);
  const [conversationId, setConversationId] = useState<string>("");
  const [isRecording, setIsRecording] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!publicKey || !otherUserAddress) {
      router.push("/profile");
      return;
    }
    
    initChat();
  }, [publicKey, otherUserAddress]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const initChat = async () => {
    try {
      let conversation;
      
      // Fetch current user info
      try {
        const currentUserResponse = await fetch(`/api/users/${publicKey}`);
        const currentUserData = await currentUserResponse.json();
        setCurrentUser(currentUserData);
      } catch (error) {
        console.error("Error fetching current user:", error);
      }
      
      // Check if this is a group chat ID (starts with "group_")
      if (otherUserAddress.startsWith("group_")) {
        // Load existing group conversation from API
        const convResponse = await fetch(`/api/chat/conversations?userAddress=${publicKey}`);
        const allConvs = await convResponse.json();
        conversation = allConvs.find((c: any) => c.id === otherUserAddress);
        
        if (!conversation) {
          antMessage.error("群聊不存在");
          router.push("/chats");
          return;
        }
        
        setConversationId(conversation.id);
        // Use otherUser from API response which already has the group name
        setOtherUser(conversation.otherUser || {
          wallet_address: conversation.id,
          display_name: conversation.groupName || "群聊",
        });
      } else {
        // Private chat - create or get conversation via API
        const convResponse = await fetch('/api/chat/conversations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant1: publicKey,
            participant2: otherUserAddress
          })
        });
        conversation = await convResponse.json();
        setConversationId(conversation.id);

        const userResponse = await fetch(`/api/users/${otherUserAddress}`);
        const userData = await userResponse.json();
        setOtherUser(userData);
      }

      // Load messages from API
      const messagesResponse = await fetch(`/api/chat/messages?conversationId=${conversation.id}`);
      const existingMessages = await messagesResponse.json();
      setMessages(existingMessages);

      // Mark messages as read via API
      await fetch('/api/chat/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: conversation.id,
          userAddress: publicKey
        })
      });
    } catch (error) {
      console.error("Error initializing chat:", error);
      antMessage.error("Failed to initialize chat");
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (convId: string) => {
    try {
      const response = await fetch(
        `/api/chat/messages?conversationId=${convId}`
      );
      const data = await response.json();
      setMessages(data);

      await fetch("/api/chat/messages", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: convId,
          userAddress: publicKey,
        }),
      });
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async (
    content?: string,
    mediaUrl?: string,
    messageType: "text" | "image" | "voice" = "text"
  ) => {
    if (!conversationId || !publicKey) return;
    if (!content && !mediaUrl) return;

    setSending(true);
    try {
      // Send message via API
      await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          senderAddress: publicKey,
          content,
          mediaUrl,
          messageType
        })
      });
      
      // Reload messages from API to update UI
      const messagesResponse = await fetch(`/api/chat/messages?conversationId=${conversationId}`);
      const updatedMessages = await messagesResponse.json();
      setMessages(updatedMessages);
      setInputValue("");
    } catch (error) {
      console.error("Error sending message:", error);
      antMessage.error("Failed to send message");
    } finally {
      setSending(false);
    }
  };

  const handleSendText = () => {
    if (inputValue.trim()) {
      sendMessage(inputValue.trim(), undefined, "text");
    }
  };

  const handleImageUpload = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      if (data.url) {
        sendMessage(undefined, data.url, "image");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      antMessage.error("Failed to upload image");
    }

    return false;
  };

  const handleVoiceRecord = () => {
    antMessage.info("语音功能开发中");
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
        height: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        background: "#f5f5f5",
        maxWidth: "600px",
        margin: "0 auto",
        paddingBottom: "env(safe-area-inset-bottom)",
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
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={() => router.back()}
        />
        <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          {otherUser?.avatar_url ? (
            <Image
              src={otherUser.avatar_url}
              alt="avatar"
              width={40}
              height={40}
              style={{ borderRadius: "50%" }}
              unoptimized
            />
          ) : (
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "50%",
                background: "#e5e5e5",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              👤
            </div>
          )}
          <div>
            <div style={{ fontWeight: "600", fontSize: "16px" }}>
              {otherUser?.display_name ||
                otherUser?.username ||
                `${otherUserAddress.slice(0, 6)}...${otherUserAddress.slice(-4)}`}
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
        }}
      >
        {messages.map((msg) => {
          const isMine = msg.senderAddress === publicKey;
          return (
            <div
              key={msg.id}
              style={{
                display: "flex",
                justifyContent: isMine ? "flex-end" : "flex-start",
                alignItems: "flex-end",
                gap: "8px",
              }}
            >
              {!isMine && (
                otherUser?.avatar_url ? (
                  <Image
                    src={otherUser.avatar_url}
                    alt="avatar"
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%" }}
                    unoptimized
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    👤
                  </div>
                )
              )}
              <div
                style={{
                  maxWidth: "70%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMine ? "flex-end" : "flex-start",
                }}
              >
                {msg.messageType === "text" && msg.content && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isMine ? "#95ec69" : "#ffffff",
                      color: "#000000",
                      wordBreak: "break-word",
                    }}
                  >
                    {msg.content}
                  </div>
                )}
                {msg.messageType === "image" && msg.mediaUrl && (
                  <div
                    style={{
                      borderRadius: "8px",
                      overflow: "hidden",
                      maxWidth: "200px",
                    }}
                  >
                    <Image
                      src={msg.mediaUrl}
                      alt="image"
                      width={200}
                      height={200}
                      style={{ objectFit: "cover" }}
                      unoptimized
                    />
                  </div>
                )}
                {msg.messageType === "voice" && msg.mediaUrl && (
                  <div
                    style={{
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isMine ? "#95ec69" : "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <AudioOutlined />
                    <span>语音消息</span>
                  </div>
                )}
                <div
                  style={{
                    fontSize: "11px",
                    color: "#999",
                    marginTop: "4px",
                  }}
                >
                  {new Date(msg.createdAt).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </div>
              </div>
              {isMine && (
                currentUser?.avatar_url ? (
                  <Image
                    src={currentUser.avatar_url}
                    alt="avatar"
                    width={32}
                    height={32}
                    style={{ borderRadius: "50%" }}
                    unoptimized
                  />
                ) : (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "#e5e5e5",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "16px",
                    }}
                  >
                    👤
                  </div>
                )
              )}
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div
        style={{
          background: "#ffffff",
          padding: "12px 16px",
          borderTop: "1px solid #e5e5e5",
        }}
      >
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <Button
            type="text"
            icon={<AudioOutlined />}
            onClick={handleVoiceRecord}
          />
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onPressEnter={handleSendText}
            placeholder="输入消息..."
            style={{ flex: 1 }}
            disabled={sending}
          />
          {inputValue.trim() ? (
            <Button
              type="primary"
              icon={<SendOutlined />}
              onClick={handleSendText}
              loading={sending}
              style={{ background: "#07c160", borderColor: "#07c160" }}
            />
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                style={{ display: "none" }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleImageUpload(file);
                  }
                }}
              />
              <Button
                type="text"
                icon={<PictureOutlined />}
                onClick={() => fileInputRef.current?.click()}
              />
              <Button type="text" icon={<PlusOutlined />} />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
