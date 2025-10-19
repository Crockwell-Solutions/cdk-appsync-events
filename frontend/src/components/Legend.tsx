const Legend = () => {
  return (
    <div className="absolute bottom-6 left-6 z-[1000] bg-white/95 p-4 rounded-lg shadow-lg border border-gray-300">
      <h3 className="mb-3 text-sm font-bold text-gray-800">Legend</h3>
      <div className="space-y-2.5">
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#34D399' }} />
          <span className="text-sm text-gray-700 font-medium">Flight Routes</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: '#EF4444' }} />
          <span className="text-sm text-gray-700 font-medium">Airspace Hazards</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'hsl(45, 93%, 47%)' }} />
          <span className="text-sm text-gray-700 font-medium">Bird Activity</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: 'hsl(271, 91%, 65%)' }} />
          <span className="text-sm text-gray-700 font-medium">Drone Activity</span>
        </div>
      </div>
    </div>
  );
};

export default Legend;
