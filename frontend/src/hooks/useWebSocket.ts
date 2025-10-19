import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseWebSocketProps {
  url: string;
  onMessage: (data: any) => void;
  enabled?: boolean;
}

export const useWebSocket = ({ url, onMessage, enabled = true }: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        ws.current = new WebSocket(url);

        ws.current.onopen = () => {
          setIsConnected(true);
          toast.success('Connected to AppSync Events');
          console.log('WebSocket connected');
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            onMessage(data);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

        ws.current.onerror = (error) => {
          console.error('WebSocket error:', error);
          toast.error('WebSocket connection error');
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          console.log('WebSocket disconnected, attempting to reconnect...');
          
          // Attempt to reconnect after 3 seconds
          reconnectTimeout.current = setTimeout(() => {
            connect();
          }, 3000);
        };
      } catch (error) {
        console.error('Error creating WebSocket:', error);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [url, onMessage, enabled]);

  return { isConnected };
};
