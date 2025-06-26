
import { Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface CountrySelectorProps {
  currentRegion: 'IN' | 'global';
  detectedCountry: string;
  onRegionChange: (region: 'IN' | 'global') => void;
}

export const CountrySelector = ({ currentRegion, detectedCountry, onRegionChange }: CountrySelectorProps) => {
  return (
    <div className="flex items-center gap-2 text-sm text-blue-200 mb-4 justify-center">
      <Globe className="w-4 h-4" />
      <span>Pricing for:</span>
      <Select 
        value={currentRegion} 
        onValueChange={(value: 'IN' | 'global') => onRegionChange(value)}
      >
        <SelectTrigger className="w-auto min-w-[120px] bg-blue-900/30 border-blue-400/30 text-blue-100">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="IN">🇮🇳 India (INR)</SelectItem>
          <SelectItem value="global">🌍 International (USD)</SelectItem>
        </SelectContent>
      </Select>
      {detectedCountry && (
        <span className="text-xs text-blue-300">
          (Detected: {detectedCountry})
        </span>
      )}
    </div>
  );
};
