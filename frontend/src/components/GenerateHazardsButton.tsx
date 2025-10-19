import { useState } from 'react';
import { Button } from './ui/button';
import { getConfig } from '@/config';
import { toast } from 'sonner';

const GenerateHazardsButton = () => {
  const [loading, setLoading] = useState(false);

  const handleGenerateHazards = async () => {
    const config = getConfig();
    if (!config) {
      toast.error('Configuration not loaded');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${config.restApiUrl}generate-hazards`, {
        method: 'POST',
        headers: {
          'x-api-key': config.restApiKey,
        },
      });

      if (response.ok) {
        toast.success('Hazards generated successfully');
      } else {
        toast.error('Failed to generate hazards');
      }
    } catch (error) {
      toast.error('Error generating hazards');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="absolute top-6 right-6 z-[1000]">
      <Button
        onClick={handleGenerateHazards}
        disabled={loading}
        className="bg-blue-600 hover:bg-blue-700 text-white font-medium shadow-lg"
      >
        {loading ? 'Generating...' : 'Generate Hazards'}
      </Button>
    </div>
  );
};

export default GenerateHazardsButton;
