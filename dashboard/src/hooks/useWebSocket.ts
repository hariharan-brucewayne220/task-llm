import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { WebSocketMessage } from '../types';

interface UseWebSocketReturn {
  socket: Socket | null;
  isConnected: boolean;
  lastMessage: WebSocketMessage | null;
  sendMessage: (type: string, data: any) => void;
}

export const useWebSocket = (url: string = 'http://localhost:5000'): UseWebSocketReturn => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<WebSocketMessage | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const isConnecting = useRef(false);
  const messageCounter = useRef(0);
  const messageQueue = useRef<WebSocketMessage[]>([]);

  useEffect(() => {
    // Prevent multiple connections in React Strict Mode
    if (isConnecting.current || socketRef.current?.connected) {
      return;
    }

    isConnecting.current = true;

    const newSocket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      timeout: 5000
    });

    socketRef.current = newSocket;

    newSocket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setIsConnected(true);
      isConnecting.current = false;
    });

    newSocket.on('disconnect', (reason) => {
      console.log('Disconnected from WebSocket server:', reason);
      setIsConnected(false);
      isConnecting.current = false;
    });

    newSocket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      setIsConnected(false);
      isConnecting.current = false;
    });

    newSocket.on('reconnect', (attemptNumber) => {
      console.log('Reconnected to WebSocket server after', attemptNumber, 'attempts');
      setIsConnected(true);
    });

    newSocket.on('reconnect_error', (error) => {
      console.error('WebSocket reconnection error:', error);
    });

    // Listen for all message types
    const messageTypes = [
      'connected',
      'connection_test', 
      'assessment_started',
      'test_started',
      'test_completed',
      'test_error',
      'assessment_completed'
    ];

    messageTypes.forEach(type => {
      newSocket.on(type, (data) => {
        console.log('WebSocket message received:', type, data);
        messageCounter.current += 1;
        const message = {
          type,
          data,
          timestamp: new Date().toISOString(),
          id: messageCounter.current.toString()
        };
        
        // Dispatch message immediately without delay
        console.log('DISPATCHING message to Dashboard:', message.type, 'ID:', message.id);
        setLastMessage(message);
      });
    });

    // Listen for ANY message type (debugging)
    newSocket.onAny((eventName, ...args) => {
      console.log('ANY WebSocket event:', eventName, args);
    });

    setSocket(newSocket);

    return () => {
      console.log('Cleaning up WebSocket connection');
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
        socketRef.current = null;
      }
      isConnecting.current = false;
      setSocket(null);
      setIsConnected(false);
    };
  }, [url]);

  const sendMessage = useCallback((type: string, data: any) => {
    if (socket && isConnected) {
      socket.emit(type, data);
    } else {
      console.warn('Cannot send message: WebSocket not connected');
    }
  }, [socket, isConnected]);

  return {
    socket,
    isConnected,
    lastMessage,
    sendMessage
  };
};