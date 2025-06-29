/**
 * WebSocketチャット機能のカスタムフック
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, ChatContext, WebSocketMessage } from '../types/chat';

export const useWebSocketChat = (sessionId: string, context?: ChatContext) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  
  const websocketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const contextUpdateRef = useRef<number>(0);
  const messageIdsRef = useRef<Set<string>>(new Set()); // 重複防止用IDセット

  // WebSocket URL（ポート8000に修正）
  const getWebSocketUrl = () => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'development' ? '8000' : window.location.port; // 5000 → 8000に修正
    return `${protocol}//${host}:${port}/ws/chat/${sessionId}`;
  };

  // ハートビート（接続維持）
  const startHeartbeat = useCallback(() => {
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    
    heartbeatIntervalRef.current = setInterval(() => {
      if (websocketRef.current?.readyState === WebSocket.OPEN) {
        websocketRef.current.send(JSON.stringify({
          type: 'ping',
          timestamp: new Date().toISOString()
        }));
      }
    }, 60000); // 30秒 → 60秒に延長
  }, []);

  // 履歴クリア
  const clearMessages = useCallback(() => {
    setMessages([]);
    messageIdsRef.current.clear(); // IDセットもクリア
  }, []);

  // 重複メッセージの手動削除
  const removeDuplicates = useCallback(() => {
    setMessages(prev => {
      const seen = new Map<string, ChatMessage>();
      const uniqueMessages: ChatMessage[] = [];
      
      // 各メッセージをチェックし、重複を除去
      prev.forEach(msg => {
        const key = `${msg.role}_${msg.content}_${msg.timestamp.substring(0, 16)}`; // 分単位でグループ化
        if (!seen.has(key)) {
          seen.set(key, msg);
          uniqueMessages.push(msg);
        } else {
          console.log('🗑️ 重複メッセージを削除:', msg.content.substring(0, 30));
        }
      });
      
      // IDセットも再構築
      messageIdsRef.current.clear();
      uniqueMessages.forEach(msg => messageIdsRef.current.add(msg.id));
      
      return uniqueMessages;
    });
  }, []);

  // WebSocket接続
  const connect = useCallback(() => {
    try {
      const wsUrl = getWebSocketUrl();
      console.log('🔌 WebSocket接続試行:', wsUrl);
      
      websocketRef.current = new WebSocket(wsUrl);
      
      websocketRef.current.onopen = () => {
        console.log('✅ WebSocket接続成功');
        setIsConnected(true);
        setConnectionError(null);
        startHeartbeat();
        
        // コンテキストがある場合は送信
        if (context) {
          updateContext(context);
        }
      };
      
      websocketRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);
          console.log('📨 受信メッセージ:', data);
          
          switch (data.type) {
            case 'message':
              const newMessage: ChatMessage = {
                id: data.message_id || `assistant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: data.role || 'assistant',
                content: data.content || '',
                timestamp: data.timestamp || new Date().toISOString()
              };
              // 強化された重複チェック
              if (messageIdsRef.current.has(newMessage.id)) {
                console.log('⚠️ 重複メッセージをスキップ (ID):', newMessage.id);
                break;
              }
              
              // 内容ベースの重複チェック（同じ内容が30秒以内に存在）
              const now = Date.now();
              
              setMessages(prev => {
                const recentSimilar = prev.some(msg => 
                  msg.role === newMessage.role && 
                  msg.content === newMessage.content &&
                  now - new Date(msg.timestamp).getTime() < 30000
                );
                
                if (recentSimilar) {
                  console.log('⚠️ 重複メッセージをスキップ (内容):', newMessage.content.substring(0, 50));
                  return prev;
                }
                
                messageIdsRef.current.add(newMessage.id);
                return [...prev, newMessage];
              });
              setIsTyping(false);
              break;
              
            case 'typing':
              setIsTyping(data.is_typing || false);
              break;
              
            case 'system':
              const systemMessage: ChatMessage = {
                id: data.message_id || `system_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                role: 'system',
                content: data.content || '',
                timestamp: data.timestamp || new Date().toISOString()
              };
              // システムメッセージの強化された重複チェック
              if (messageIdsRef.current.has(systemMessage.id)) {
                console.log('⚠️ 重複システムメッセージをスキップ (ID):', systemMessage.id);
                break;
              }
              
              setMessages(prev => {
                // システムメッセージの内容重複チェック（同じ内容のシステムメッセージが既に存在）
                const duplicateSystem = prev.some(msg => 
                  msg.role === 'system' && 
                  msg.content === systemMessage.content
                );
                
                if (duplicateSystem) {
                  console.log('⚠️ 重複システムメッセージをスキップ (内容):', systemMessage.content.substring(0, 30));
                  return prev;
                }
                
                messageIdsRef.current.add(systemMessage.id);
                return [...prev, systemMessage];
              });
              break;
              
            case 'error':
              console.error('💔 チャットエラー:', data.content);
              setConnectionError(data.content || 'エラーが発生しました');
              setIsTyping(false);
              break;
              
            case 'context_updated':
              console.log('📝 コンテキスト更新:', data.content);
              break;
              
            case 'pong':
              // ハートビート応答
              break;
              
            default:
              console.log('🤷 未知のメッセージタイプ:', data.type);
          }
        } catch (error) {
          console.error('❌ メッセージ解析エラー:', error);
        }
      };
      
      websocketRef.current.onclose = (event) => {
        console.log('🔌 WebSocket切断:', event.code, event.reason);
        setIsConnected(false);
        
        // 異常切断の場合のみ再接続を試行（正常切断は除外）
        if (event.code !== 1000 && event.code !== 1001 && event.code !== 1005) {
          console.log('🔄 10秒後に再接続を試行します...');
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 10000); // 5秒 → 10秒に延長
        }
      };
      
      websocketRef.current.onerror = (error) => {
        console.error('❌ WebSocketエラー:', error);
        setConnectionError('接続エラーが発生しました');
      };
      
    } catch (error) {
      console.error('❌ WebSocket接続失敗:', error);
      setConnectionError('接続に失敗しました');
    }
  }, [sessionId, context, startHeartbeat]);

  // WebSocket切断
  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (heartbeatIntervalRef.current) {
      clearInterval(heartbeatIntervalRef.current);
    }
    if (websocketRef.current) {
      websocketRef.current.close(1000, 'User disconnect');
    }
    setIsConnected(false);
  }, []);

  // メッセージ送信
  const sendMessage = useCallback((content: string) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      console.error('❌ WebSocket未接続');
      setConnectionError('接続が切断されています');
      return;
    }

    if (!content.trim()) {
      return;
    }

    try {
      const message: WebSocketMessage = {
        type: 'message',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };

      websocketRef.current.send(JSON.stringify(message));
      
      // ユーザーメッセージを即座に表示（重複チェック付き）
      const userMessage: ChatMessage = {
        id: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        role: 'user',
        content: content.trim(),
        timestamp: new Date().toISOString()
      };
      setMessages(prev => {
        // 同じ内容のメッセージが最近5秒以内に追加されていないかチェック
        const recentDuplicate = prev.slice(-5).some(msg => 
          msg.role === 'user' && 
          msg.content === userMessage.content &&
          Date.now() - new Date(msg.timestamp).getTime() < 5000
        );
        if (recentDuplicate) {
          console.log('⚠️ 重複ユーザーメッセージをスキップ:', userMessage.content);
          return prev;
        }
        messageIdsRef.current.add(userMessage.id);
        return [...prev, userMessage];
      });
      setIsTyping(true);
      
    } catch (error) {
      console.error('❌ メッセージ送信エラー:', error);
      setConnectionError('メッセージの送信に失敗しました');
    }
  }, []);

  // コンテキスト更新
  const updateContext = useCallback((newContext: ChatContext) => {
    if (!websocketRef.current || websocketRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      const message: WebSocketMessage = {
        type: 'context_update',
        context: newContext,
        timestamp: new Date().toISOString()
      };

      websocketRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('❌ コンテキスト更新エラー:', error);
    }
  }, []);

  // 初期接続
  useEffect(() => {
    connect();
    
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  // コンテキスト変更時の更新（頻度制限付き）
  useEffect(() => {
    if (context && isConnected) {
      // 前回の更新から1秒以上経過している場合のみ更新
      const now = Date.now();
      const lastUpdate = contextUpdateRef.current || 0;
      
      if (now - lastUpdate > 1000) {
        updateContext(context);
        contextUpdateRef.current = now;
      }
    }
  }, [context, isConnected, updateContext]);

  return {
    messages,
    isConnected,
    isTyping,
    connectionError,
    sendMessage,
    updateContext,
    clearMessages,
    removeDuplicates, // 重複削除機能を追加
    connect,
    disconnect
  };
};