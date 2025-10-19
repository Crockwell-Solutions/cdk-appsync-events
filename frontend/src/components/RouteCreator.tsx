import { Button } from './ui/button';
import { Card } from './ui/card';
import { Route, X, Check } from 'lucide-react';

interface RouteCreatorProps {
  isCreating: boolean;
  pointCount: number;
  onStart: () => void;
  onCancel: () => void;
  onSubmit: () => void;
}

const RouteCreator = ({ isCreating, pointCount, onStart, onCancel, onSubmit }: RouteCreatorProps) => {
  if (!isCreating) {
    return (
      <Button
        onClick={onStart}
        className="absolute right-4 top-20 z-[1000] gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
      >
        <Route className="h-4 w-4" />
        Create Route
      </Button>
    );
  }

  return (
    <div className="absolute right-4 top-20 z-[1000] bg-white/95 p-4 rounded-lg shadow-lg border border-gray-300">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <Route className="h-4 w-4 text-gray-800" />
          <span className="text-sm font-bold text-gray-800">Creating Route</span>
        </div>
        <p className="text-sm text-gray-700">
          Click on the map to add points ({pointCount} added)
        </p>
        <div className="flex gap-2">
          <Button
            onClick={onSubmit}
            disabled={pointCount < 2}
            className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium"
            size="sm"
          >
            <Check className="h-4 w-4" />
            Submit
          </Button>
          <Button
            onClick={onCancel}
            variant="outline"
            className="gap-2 border-gray-300 text-gray-700 hover:bg-gray-100"
            size="sm"
          >
            <X className="h-4 w-4" />
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
};

export default RouteCreator;
