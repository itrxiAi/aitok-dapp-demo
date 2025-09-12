import { useState, useEffect, useRef } from 'react';
import DailyIframe from '@daily-co/daily-js';
import { Modal } from 'antd';

const apiKey = process.env.NEXT_PUBLIC_TARVAS_API_KEY;

declare global {
  interface Window {
    Daily: typeof DailyIframe;
  }
}

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'other';
  timestamp: Date;
  video_url?: string;
};

type ChatResponse = {
  content: string;
  video_url?: string;
};

type UserChatProps = {
  userAddress: string;
  isOpen?: boolean;
  onClose?: () => void;
};

export const UserChat = ({ userAddress, isOpen = false, onClose }: UserChatProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content: 'Hey there! 👋 . How can I help you today?',
      sender: 'other',
      timestamp: new Date(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversationUrl, setConversationUrl] = useState<string | null>(null);
  const creatingConversationRef = useRef(false);

  const callFrameRef = useRef(null);
  const [callFrame, setCallFrame] = useState(null);

  const createConversation = async () => {
    if (creatingConversationRef.current || conversationUrl) {
      return;
    }
    creatingConversationRef.current = true;
    try {
      const response = await fetch('https://tavusapi.com/v2/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
        body: JSON.stringify({
          replica_id: "ref226fe7e",
          persona_id: "pb8bb46b",
          conversation_name: "A Meeting with Itrix",
          conversational_context: "Itrix is an ai social platform, you are assistant of this platform, you can answer user's question about Itrix, and help user to use Itrix.",
          properties: {
            "language": "chinese"
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to create conversation: ${response.statusText}`);
      }

      const data = await response.json();
      setConversationUrl(data.conversation_url);
      setConversationId(data.conversation_id);
      console.log('Conversation URL:', data.conversation_url);
      //setConversationUrl("https://yuan-hq.daily.co/47k3hVMd8UYAcQ9ngJl9");
      const frame = DailyIframe.createFrame(callFrameRef.current, {
        showLeaveButton: true,
        showFullscreenButton: true,
        showLocalVideo: false,
        startVideoOff: true
      });

      // if (!conversationUrl) {
      //   console.error('No conversation URL available');
      //   return;
      // }

      frame.join({
        url: data.conversation_url
      }).then(() => {
        console.log('Successfully joined the call');
      }).catch((error) => {
        console.error('Error joining call:', error);
      });
      setCallFrame(frame);

    } catch (error) {
      console.error('Error creating conversation:', error);
    } finally {
      creatingConversationRef.current = false;
    }
  };

  const endConversation = async () => {
    if (!conversationId) return;

    try {
      const response = await fetch(`https://tavusapi.com/v2/conversations/${conversationId}/end`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
        },
      });

      if (!response.ok) {
        console.error('Failed to end conversation:', response.statusText);
      } else {
        console.log('Conversation ended successfully');
        setConversationUrl(null);
        setConversationId(null);
      }
    } catch (error) {
      console.error('Error ending conversation:', error);
    }
  };

  useEffect(() => {
    // Only create conversation if userAddress exists and we don't have a conversation URL yet
    if (!creatingConversationRef.current && !conversationUrl && isOpen) {
      createConversation();
    }
  }, [isOpen]);

  // useEffect(() => {
  //   if (conversationUrl) {
      
  //   }
  // }, [conversationUrl]);

  return (
    <Modal
      title="Chat"
      open={isOpen}
      onCancel={async () => {
        setCallFrame(null);
        setConversationUrl(null);
        setConversationId(null);
        await endConversation();
        onClose?.();
      }}
      footer={null}
      width={typeof window !== 'undefined' && window.innerWidth > 768 ? 600 : '90%'}
      style={{ maxWidth: '100%' }}
      styles={{ body: { padding: 0 } }}
    >
      <div>
        <div ref={callFrameRef} style={{ width: '100%', height: '500px' }} />
      </div>
    </Modal>
  );
};
