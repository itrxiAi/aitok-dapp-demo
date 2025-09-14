"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Post as ApiPost } from "@/services/api";
import Image from "next/image";
import { useWallet } from "@solana/wallet-adapter-react";
import { message, Modal, Input, Form } from "antd";
import { api } from "@/services/api";
import { useRouter } from "next/navigation";

const { TextArea } = Input;

interface Comment {
  id: string;
  content: string;
  author: {
    wallet_address: string;
    display_name?: string;
    username?: string;
    avatar_url?: string;
  };
  created_at: string;
}

interface TikTokFeedProps {
  posts: ApiPost[];
  loading: boolean;
  onUpdate: () => void;
  showTopSpacing?: boolean;
  customHeight?: string;
  onPostClick?: (post: ApiPost) => void;
}

export function TikTokFeed({
  posts,
  loading,
  onUpdate,
  showTopSpacing = true,
  customHeight,
  onPostClick,
}: TikTokFeedProps) {
  const { publicKey } = useWallet();
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideListRef = useRef<HTMLDivElement>(null);

  // 关注状态管理
  const [followStates, setFollowStates] = useState<{ [key: string]: boolean }>(
    {}
  );
  const [followLoading, setFollowLoading] = useState<{
    [key: string]: boolean;
  }>({});

  // 评论相关状态
  const [commentModalVisible, setCommentModalVisible] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentLoading, setCommentLoading] = useState(false);
  const [currentPostId, setCurrentPostId] = useState<string | null>(null);
  const [form] = Form.useForm();

  // 滑动状态管理
  const [isDown, setIsDown] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [canSlide, setCanSlide] = useState(false);
  const [needCheck, setNeedCheck] = useState(true);

  // 滑动数据
  const [startPos, setStartPos] = useState({ x: 0, y: 0, time: 0 });
  const [movePos, setMovePos] = useState({ x: 0, y: 0 });
  const [currentOffset, setCurrentOffset] = useState(0);

  const judgeValue = 20; // 判断滑动方向的最小距离

  // 点赞处理函数
  const handleLike = async (e: React.MouseEvent, post: ApiPost) => {
    e.stopPropagation();
    if (!publicKey) {
      message.warning("Please connect your wallet to like posts");
      return;
    }

    try {
      const isLiked = post.likes.some(
        (like) => like.user_address === publicKey.toBase58()
      );

      if (isLiked) {
        await api.posts.unlike(post.id, { user_address: publicKey.toBase58() });
      } else {
        await api.posts.like(post.id, { user_address: publicKey.toBase58() });
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error liking/unliking post:", error);
      message.error("Failed to like/unlike post");
    }
  };

  // 收藏处理函数
  const handleCollect = async (e: React.MouseEvent, post: ApiPost) => {
    e.stopPropagation();
    if (!publicKey) {
      message.warning("Please connect your wallet to collect posts");
      return;
    }

    try {
      const isCollected = (post as any).collects?.some(
        (collect: any) => collect.user_address === publicKey.toBase58()
      );

      if (isCollected) {
        await api.posts.uncollect(post.id, {
          user_address: publicKey.toBase58(),
        });
      } else {
        await api.posts.collect(post.id, {
          user_address: publicKey.toBase58(),
        });
      }

      onUpdate?.();
    } catch (error) {
      console.error("Error collecting/uncollecting post:", error);
      message.error("Failed to collect/uncollect post");
    }
  };

  // 用户点击处理函数
  const handleUserClick = (e: React.MouseEvent, post: ApiPost) => {
    e.stopPropagation();
    router.push(`/users/${post.author.wallet_address}`);
  };

  // 评论点击处理函数
  const handleCommentClick = async (e: React.MouseEvent, post: ApiPost) => {
    e.stopPropagation();
    if (!publicKey) {
      message.warning("Please connect your wallet to comment");
      return;
    }

    try {
      const fetchedComments = await api.posts.getComments(post.id);
      setComments(fetchedComments);
      setCurrentPostId(post.id);
      setCommentModalVisible(true);
    } catch (error) {
      console.error("Error fetching comments:", error);
      message.error("Failed to fetch comments");
    }
  };

  // 评论提交处理函数
  const handleComment = async (values: { content: string }) => {
    if (!publicKey || !currentPostId) return;

    setCommentLoading(true);
    try {
      await api.posts.createComment(currentPostId, {
        content: values.content,
        author_address: publicKey.toBase58(),
      });

      const updatedComments = await api.posts.getComments(currentPostId);
      setComments(updatedComments);
      form.resetFields();
      onUpdate?.();
      message.success("Comment posted successfully");
    } catch (error) {
      console.error("Error posting comment:", error);
      message.error("Failed to post comment");
    } finally {
      setCommentLoading(false);
    }
  };

  // 关注处理函数
  const handleFollow = async (e: React.MouseEvent, post: ApiPost) => {
    e.stopPropagation();

    if (!publicKey) {
      message.error("Please connect your wallet to follow users");
      return;
    }

    const authorAddress = post.author.wallet_address;
    // 使用与显示逻辑相同的状态判断方式
    const localFollowState = followStates[authorAddress];
    const apiFollowState = (post.author as any)?.isFollowing;
    const isCurrentlyFollowing =
      localFollowState !== undefined
        ? localFollowState
        : apiFollowState || false;

    try {
      setFollowLoading((prev) => ({ ...prev, [authorAddress]: true }));

      if (!isCurrentlyFollowing) {
        await api.users.follow(publicKey.toBase58(), authorAddress);
        message.success(
          `You are now following ${
            post.author.display_name || post.author.username || "this user"
          }`
        );
        setFollowStates((prev) => ({ ...prev, [authorAddress]: true }));
      } else {
        await api.users.unfollow(publicKey.toBase58(), authorAddress);
        message.success(
          `You have unfollowed ${
            post.author.display_name || post.author.username || "this user"
          }`
        );
        setFollowStates((prev) => ({ ...prev, [authorAddress]: false }));
      }

      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error("Error following/unfollowing user:", error);
      message.error("Failed to follow/unfollow user");
    } finally {
      setFollowLoading((prev) => ({ ...prev, [authorAddress]: false }));
    }
  };

  // 获取当前偏移量
  const getSlideOffset = useCallback(
    (index: number) => {
      let itemHeight;
      if (customHeight) {
        // 解析自定义高度，如 "calc(100vh - 120px)"
        const match = customHeight.match(/calc\((\d+)vh - (\d+)px\)/);
        if (match) {
          const vh = parseInt(match[1]);
          const px = parseInt(match[2]);
          itemHeight = (vh / 100) * window.innerHeight - px;
        } else {
          itemHeight = window.innerHeight;
        }
      } else {
        itemHeight = showTopSpacing
          ? window.innerHeight - 60
          : window.innerHeight;
      }
      return -index * itemHeight;
    },
    [showTopSpacing, customHeight]
  );

  // 更新滑动位置
  const updateSlidePosition = useCallback(
    (offset: number, useTransition = false) => {
      if (slideListRef.current) {
        slideListRef.current.style.transitionDuration = useTransition
          ? "300ms"
          : "0ms";
        slideListRef.current.style.transform = `translate3d(0, ${offset}px, 0)`;
      }
    },
    []
  );

  // 检查是否可以滑动
  const checkCanSlide = useCallback(
    (moveX: number, moveY: number) => {
      if (needCheck) {
        if (Math.abs(moveX) > judgeValue || Math.abs(moveY) > judgeValue) {
          const angle = (Math.abs(moveX) * 10) / (Math.abs(moveY) * 10);
          const canSlideVertical = angle <= 1; // 上下滑动
          setCanSlide(canSlideVertical);
          setNeedCheck(false);
          return canSlideVertical;
        }
        return false;
      }
      return canSlide;
    },
    [needCheck, canSlide, judgeValue]
  );

  // 检查是否可以继续滑动
  const canNext = useCallback(
    (isNext: boolean) => {
      return !(
        (currentIndex === 0 && !isNext) ||
        (currentIndex === posts.length - 1 && isNext)
      );
    },
    [currentIndex, posts.length]
  );

  // 触摸开始
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (isTransitioning) return;

      const touch = e.touches[0];
      setStartPos({
        x: touch.pageX,
        y: touch.pageY,
        time: Date.now(),
      });
      setIsDown(true);
      setNeedCheck(true);
      setCanSlide(false);
    },
    [isTransitioning]
  );

  // 触摸移动
  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDown || isTransitioning) return;

      const touch = e.touches[0];
      const moveX = touch.pageX - startPos.x;
      const moveY = touch.pageY - startPos.y;

      setMovePos({ x: moveX, y: moveY });

      const canSlideRes = checkCanSlide(moveX, moveY);
      const isNext = moveY < 0; // 向下滑动显示下一个

      if (canSlideRes && canNext(isNext)) {
        e.preventDefault();
        e.stopPropagation();

        // 计算新的偏移量
        const baseOffset = getSlideOffset(currentIndex);
        const newOffset = baseOffset + moveY;
        setCurrentOffset(newOffset);
        updateSlidePosition(newOffset, false);
      }
    },
    [
      isDown,
      isTransitioning,
      startPos,
      checkCanSlide,
      canNext,
      currentIndex,
      getSlideOffset,
      updateSlidePosition,
    ]
  );

  // 触摸结束
  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!isDown || isTransitioning) return;

      const endTime = Date.now();
      const gapTime = endTime - startPos.time;
      const distance = movePos.y;
      let judgeHeight;
      if (customHeight) {
        const match = customHeight.match(/calc\((\d+)vh - (\d+)px\)/);
        if (match) {
          const vh = parseInt(match[1]);
          const px = parseInt(match[2]);
          judgeHeight = (vh / 100) * window.innerHeight - px;
        } else {
          judgeHeight = window.innerHeight;
        }
      } else {
        judgeHeight = showTopSpacing
          ? window.innerHeight - 60
          : window.innerHeight;
      }

      // 判断是否成功滑动
      let shouldSlide = false;
      let isNext = false;

      if (Math.abs(distance) < 20) {
        // 距离太短，不滑动
        shouldSlide = false;
      } else if (Math.abs(distance) > judgeHeight / 3) {
        // 距离足够长，直接滑动
        shouldSlide = true;
        isNext = distance < 0;
      } else if (gapTime < 150) {
        // 时间足够短，滑动
        shouldSlide = true;
        isNext = distance < 0;
      }

      if (shouldSlide && canNext(isNext)) {
        const newIndex = isNext ? currentIndex + 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        setCurrentOffset(getSlideOffset(newIndex));
        updateSlidePosition(getSlideOffset(newIndex), true);
      } else {
        // 回弹到原位置
        setCurrentOffset(getSlideOffset(currentIndex));
        updateSlidePosition(getSlideOffset(currentIndex), true);
      }

      // 重置状态
      setIsDown(false);
      setNeedCheck(true);
      setCanSlide(false);
      setMovePos({ x: 0, y: 0 });
    },
    [
      isDown,
      isTransitioning,
      startPos,
      movePos,
      canNext,
      currentIndex,
      getSlideOffset,
      updateSlidePosition,
    ]
  );

  // 鼠标滚轮支持
  const handleWheel = useCallback(
    (e: React.WheelEvent) => {
      if (isTransitioning || isDown) return;

      e.preventDefault();

      const isNext = e.deltaY > 0;
      if (canNext(isNext)) {
        const newIndex = isNext ? currentIndex + 1 : currentIndex - 1;
        setCurrentIndex(newIndex);
        setCurrentOffset(getSlideOffset(newIndex));
        updateSlidePosition(getSlideOffset(newIndex), true);
      }
    },
    [
      isTransitioning,
      isDown,
      canNext,
      currentIndex,
      getSlideOffset,
      updateSlidePosition,
    ]
  );

  // 键盘支持
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isTransitioning || isDown) return;

      switch (e.key) {
        case "ArrowDown":
        case " ":
          e.preventDefault();
          const nextIndex = currentIndex + 1;
          if (nextIndex < posts.length) {
            setCurrentIndex(nextIndex);
            setCurrentOffset(getSlideOffset(nextIndex));
            updateSlidePosition(getSlideOffset(nextIndex), true);
          }
          break;
        case "ArrowUp":
          e.preventDefault();
          const prevIndex = currentIndex - 1;
          if (prevIndex >= 0) {
            setCurrentIndex(prevIndex);
            setCurrentOffset(getSlideOffset(prevIndex));
            updateSlidePosition(getSlideOffset(prevIndex), true);
          }
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    isTransitioning,
    isDown,
    currentIndex,
    posts.length,
    getSlideOffset,
    updateSlidePosition,
  ]);

  // 初始化滑动位置
  useEffect(() => {
    if (slideListRef.current) {
      const offset = getSlideOffset(currentIndex);
      setCurrentOffset(offset);
      updateSlidePosition(offset, false);
    }
  }, [currentIndex, getSlideOffset, updateSlidePosition]);

  // 监听容器高度变化，重新计算偏移量
  useEffect(() => {
    const handleResize = () => {
      if (slideListRef.current) {
        const offset = getSlideOffset(currentIndex);
        setCurrentOffset(offset);
        updateSlidePosition(offset, false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [currentIndex, getSlideOffset, updateSlidePosition]);

  if (loading) {
    return (
      <div
        style={{
          height:
            customHeight || (showTopSpacing ? "calc(100vh - 60px)" : "100vh"),
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
          height:
            customHeight || (showTopSpacing ? "calc(100vh - 60px)" : "100vh"),
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#000000",
          color: "#ffffff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📱</div>
          <div>暂无推荐内容</div>
        </div>
      </div>
    );
  }

  const currentPost = posts[currentIndex];

  return (
    <div
      ref={containerRef}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{
        height:
          customHeight || (showTopSpacing ? "calc(100vh - 60px)" : "100vh"),
        overflow: "hidden",
        position: "relative",
        background: "#000000",
        cursor: isDown ? "grabbing" : "grab",
        paddingTop: "0px",
      }}
    >
      {/* 滑动容器 */}
      <div
        ref={slideListRef}
        style={{
          width: "100%",
          height: "auto",
          position: "relative",
          transform: `translate3d(0, ${currentOffset}px, 0)`,
        }}
      >
        {posts.map((post, index) => (
          <div
            key={post.id}
            style={{
              height:
                customHeight ||
                (showTopSpacing ? "calc(100vh - 60px)" : "100vh"),
              width: "100%",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "#000000",
              cursor: "pointer",
            }}
            onClick={() => {
              if (onPostClick) {
                onPostClick(post);
              } else {
                router.push(`/posts/${post.id}`);
              }
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
                      autoPlay={true}
                      loop
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
                  fontSize: "48px",
                }}
              ></div>
            )}

            {/* 内容覆盖层 */}
            <div
              style={{
                position: "absolute",
                bottom: "80px",
                left: "20px",
                right: "100px", // 调整右边距，避免与右侧按钮重合
                zIndex: 2,
                color: "#ffffff",
              }}
            >
              {/* 内容文字 */}
              {post.content && (
                <div
                  style={{
                    fontSize: "16px",
                    lineHeight: "1.4",
                    marginBottom: "16px",
                    textShadow: "0 1px 3px rgba(0,0,0,0.5)",
                    maxHeight: "120px",
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: 4,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {post.content}
                </div>
              )}
            </div>

            {/* 右侧操作按钮和用户信息 */}
            <div
              style={{
                position: "absolute",
                right: "20px",
                bottom: "100px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
                zIndex: 2,
                alignItems: "center",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 用户头像和关注按钮 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }}
              >
                {/* 用户头像 */}
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
                    cursor: "pointer",
                  }}
                  onClick={(e) => handleUserClick(e, post)}
                >
                  {post.author?.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt="User avatar"
                      width={44}
                      height={44}
                      style={{
                        borderRadius: "50%",
                        objectFit: "cover",
                      }}
                      unoptimized
                      onError={(e) => {
                        // 如果头像加载失败，显示默认头像
                        e.currentTarget.style.display = "none";
                        const nextElement = e.currentTarget
                          .nextElementSibling as HTMLElement;
                        if (nextElement) {
                          nextElement.style.display = "flex";
                        }
                      }}
                    />
                  ) : null}
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "50%",
                      background: "rgba(255,255,255,0.3)",
                      display: post.author?.avatar_url ? "none" : "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "20px",
                      color: "#ffffff",
                    }}
                  >
                    👤
                  </div>
                </div>

                {/* 关注按钮 */}
                {(() => {
                  const authorAddress = post.author.wallet_address;
                  // 优先使用本地状态，如果本地状态不存在，则使用接口返回的状态
                  const localFollowState = followStates[authorAddress];
                  const apiFollowState = (post.author as any)?.isFollowing;
                  const isCurrentlyFollowing =
                    localFollowState !== undefined
                      ? localFollowState
                      : apiFollowState || false;
                  const isLoading = followLoading[authorAddress] ?? false;
                  const isOwnPost =
                    publicKey &&
                    post.author.wallet_address === publicKey.toBase58();

                  // 按照 Post 组件的逻辑：!isFollowing && publicKey && !isOwnPost
                  if (!isCurrentlyFollowing && publicKey && !isOwnPost) {
                    return (
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "50%",
                          marginTop: "-12px",
                          background: isLoading
                            ? "rgba(255,255,255,0.3)"
                            : "#FF2C55",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          cursor: isLoading ? "not-allowed" : "pointer",
                          fontSize: "16px",
                          color: "#ffffff",
                          fontWeight: "bold",
                          transition: "transform 0.2s ease",
                          opacity: isLoading ? 0.6 : 1,
                        }}
                        onClick={(e) => !isLoading && handleFollow(e, post)}
                        onMouseEnter={(e) => {
                          if (!isLoading) {
                            e.currentTarget.style.transform = "scale(1.1)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "scale(1)";
                        }}
                      >
                        {isLoading ? "..." : "+"}
                      </div>
                    );
                  }
                  return null;
                })()}
              </div>

              {/* 点赞按钮和数量 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  src={
                    publicKey &&
                    post.likes.some(
                      (like) => like.user_address === publicKey.toBase58()
                    )
                      ? "/images/like-s.png"
                      : "/images/like.png"
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                  onClick={(e) => handleLike(e, post)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />
                <div
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {post.likes?.length || 0}
                </div>
              </div>

              {/* 评论按钮和数量 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  src="/images/comment.png"
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                  onClick={(e) => handleCommentClick(e, post)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />

                <div
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {post.comments?.length || 0}
                </div>
              </div>

              {/* 收藏按钮和数量 */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
                }}
              >
                <img
                  src={
                    publicKey &&
                    (post as any).collects?.some(
                      (collect: any) =>
                        collect.user_address === publicKey.toBase58()
                    )
                      ? "/images/mark-s.png"
                      : "/images/mark.png"
                  }
                  style={{
                    width: "30px",
                    height: "30px",
                    cursor: "pointer",
                    transition: "transform 0.2s ease",
                  }}
                  onClick={(e) => handleCollect(e, post)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1)";
                  }}
                />

                <div
                  style={{
                    fontSize: "12px",
                    color: "#ffffff",
                    fontWeight: "bold",
                    textShadow: "0 1px 2px rgba(0,0,0,0.5)",
                  }}
                >
                  {(post as any).collects?.length || 0}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 评论模态框 */}
      <Modal
        title="Comments"
        open={commentModalVisible}
        onCancel={(e) => {
          e.stopPropagation();
          setCommentModalVisible(false);
        }}
        footer={null}
        modalRender={(modal) => (
          <div onClick={(e) => e.stopPropagation()}>{modal}</div>
        )}
      >
        <Form
          form={form}
          onFinish={handleComment}
          onClick={(e) => e.stopPropagation()}
        >
          <Form.Item
            name="content"
            rules={[{ required: true, message: "Please enter a comment" }]}
          >
            <TextArea
              rows={4}
              placeholder="Write a comment..."
              onClick={(e) => e.stopPropagation()}
            />
          </Form.Item>
          <Form.Item>
            <button
              type="submit"
              disabled={commentLoading}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "#1890ff",
                color: "white",
                border: "none",
                padding: "8px 16px",
                borderRadius: "4px",
                cursor: commentLoading ? "not-allowed" : "pointer",
                opacity: commentLoading ? 0.6 : 1,
              }}
            >
              {commentLoading ? "Posting..." : "Post Comment"}
            </button>
          </Form.Item>
        </Form>

        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {comments.map((comment) => (
            <div
              key={comment.id}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: "12px 0",
                borderBottom: "1px solid #f0f0f0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.1)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "8px",
                    fontSize: "16px",
                  }}
                >
                  👤
                </div>
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                    {comment.author.display_name ||
                      comment.author.username ||
                      `${comment.author.wallet_address.slice(
                        0,
                        4
                      )}...${comment.author.wallet_address.slice(-4)}`}
                  </div>
                  <div style={{ fontSize: "12px", color: "#666" }}>
                    {new Date(comment.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: "14px", lineHeight: "1.4" }}>
                {comment.content}
              </div>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
}
