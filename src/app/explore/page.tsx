'use client';

import { useWallet } from '@/hooks/useWallet';
import { Input, Tabs, List, Card, message } from 'antd';
import { useEffect, useState } from 'react';
import { api } from '@/services/api';
import { Post } from '@/components/Post';
import { UserCard } from '@/components/UserCard';
import debounce from 'lodash/debounce';

const { Search } = Input;

type TabKey = 'all' | 'users' | 'posts';

export default function Explore() {
  const { publicKey } = useWallet();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setPosts([]);
      return;
    }

    setLoading(true);
    try {
      const url = new URL('/api/search', window.location.origin);
      url.searchParams.set('q', query);
      if (publicKey) {
        // BSC addresses are already strings, no need for toBase58()
        url.searchParams.set('requestingUserAddress', publicKey);
      }
      const response = await fetch(url);
      const data = await response.json();
      setUsers(data.users);
      setPosts(data.posts);
    } catch (error) {
      console.error('Error searching:', error);
      message.error('Failed to search');
    } finally {
      setLoading(false);
    }
  };

  const debouncedSearch = debounce(handleSearch, 300);

  useEffect(() => {
    debouncedSearch(searchQuery);
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery]);

  const handleTabChange = (key: string) => {
    setActiveTab(key as TabKey);
  };

  const renderResults = () => {
    if (!searchQuery.trim()) {
      return (
        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#666' }}>
          <p>Enter a search term to find users and posts</p>
        </div>
      );
    }

    switch (activeTab) {
      case 'users':
        return (
          <List
            dataSource={users}
            renderItem={(user) => (
              <UserCard key={user.wallet_address} user={user} />
            )}
          />
        );
      case 'posts':
        return (
          <List
            dataSource={posts}
            renderItem={(post) => (
              <Post key={post.id} post={post} onUpdate={() => handleSearch(searchQuery)} />
            )}
          />
        );
      default:
        return (
          <>
            {users.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '16px 0' }}>Users</h2>
                <List
                  dataSource={users.slice(0, 3)}
                  renderItem={(user) => (
                    <UserCard key={user.wallet_address} user={user} />
                  )}
                />
              </div>
            )}
            {posts.length > 0 && (
              <div style={{ marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 600, margin: '16px 0' }}>Posts</h2>
                <List
                  dataSource={posts}
                  renderItem={(post) => (
                    <Post key={post.id} post={post} onUpdate={() => handleSearch(searchQuery)} />
                  )}
                />
              </div>
            )}
          </>
        );
    }
  };

  return (
    <div>
      <div style={{ 
        position: 'sticky',
        top: 0,
        background: 'white',
        zIndex: 100,
        padding: '12px 16px',
        borderBottom: '1px solid #e8e8e8'
      }}>
        <Search
          placeholder="Search users and posts..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          loading={loading}
          style={{ marginBottom: '16px' }}
          allowClear
        />
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          items={[
            { key: 'all', label: 'All' },
            { key: 'users', label: 'Users' },
            { key: 'posts', label: 'Posts' },
          ]}
        />
      </div>
      <div style={{ padding: '16px' }}>
        {renderResults()}
      </div>
    </div>
  );
}
