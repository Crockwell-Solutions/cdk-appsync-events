import { Card } from './ui/card';

const Legend = () => {
  return (
    <Card className="absolute bottom-4 left-4 z-[1000] bg-card/95 p-3 shadow-xl backdrop-blur">
      <h3 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">Legend</h3>
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-alert-route" />
          <span className="text-muted-foreground">Routes</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-alert-airspace" />
          <span className="text-muted-foreground">Hazards</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-alert-bird" />
          <span className="text-muted-foreground">Birds</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-alert-drone" />
          <span className="text-muted-foreground">Drones</span>
        </div>
      </div>
    </Card>
  );
};

export default Legend;
