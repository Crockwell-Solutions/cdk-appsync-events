import { useState } from 'react';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';

interface WebSocketConfigProps {
  onConnect: (url: string) => void;
}

const WebSocketConfig = ({ onConnect }: WebSocketConfigProps) => {
  const [wsUrl, setWsUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (wsUrl) {
      onConnect(wsUrl);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold text-foreground">Airspace Alerter</h1>
          <p className="text-sm text-muted-foreground">
            Connect to your AppSync Events WebSocket
          </p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ws-url">WebSocket URL</Label>
            <Input
              id="ws-url"
              type="text"
              placeholder="wss://your-appsync-endpoint.com"
              value={wsUrl}
              onChange={(e) => setWsUrl(e.target.value)}
              className="bg-secondary"
            />
            <p className="text-xs text-muted-foreground">
              Enter your AppSync Events WebSocket endpoint URL
            </p>
          </div>
          <Button type="submit" className="w-full" disabled={!wsUrl}>
            Connect
          </Button>
        </form>
      </Card>
    </div>
  );
};

export default WebSocketConfig;
