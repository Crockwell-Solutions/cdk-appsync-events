import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

interface UseWebSocketProps {
  url: string;
  apiKey: string;
  httpDomain: string;
  onMessage: (data: any) => void;
  enabled?: boolean;
}

export const useWebSocket = ({ url, apiKey, httpDomain, onMessage, enabled = true }: UseWebSocketProps) => {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  // construct the protocol header for the connection
  function getAuthProtocol(apiKey: string, httpDomain: string) {
    const header = btoa(JSON.stringify({ 'x-api-key': apiKey, host: httpDomain }))
      .replace(/\+/g, '-') // Convert '+' to '-'
      .replace(/\//g, '_') // Convert '/' to '_'
      .replace(/=+$/, '') // Remove padding `=`
    return `header-${header}`
  }

  useEffect(() => {
    if (!enabled) return;

    const connect = () => {
      try {
        ws.current = new WebSocket(url, ['aws-appsync-event-ws', getAuthProtocol(apiKey, httpDomain)]);

        ws.current.onopen = () => {
          setIsConnected(true);
          toast.success('Connected to Alerts WebSocket');
          console.log('WebSocket connected');

          // Subscribe to the alerts/* channel pattern once the socket is open.
          const subscribePayload = {
            type: 'subscribe',
            id: crypto.randomUUID(),
            channel: '/alerts/*',
            authorization: { 'x-api-key': apiKey, host: httpDomain },
          };

          try {
            ws.current?.send(JSON.stringify(subscribePayload));
            console.log('Sent subscription payload to alerts/*:', subscribePayload);
          } catch (err) {
            console.error('Failed to send subscription payload', err);
          }
        };

        ws.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('WebSocket message received:', data);
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
  }, [url, apiKey, httpDomain, onMessage, enabled]);

  return { isConnected };
};
