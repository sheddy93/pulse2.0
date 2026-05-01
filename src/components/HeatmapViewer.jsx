/**
 * Heatmap Viewer Component
 * ──────────────────────
 * Displays employee location density on map.
 * ✅ Uses react-leaflet
 * ✅ Real-time heatmap
 * ✅ Interactive date range selector
 */

import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { base44 } from '@/api/base44Client';
import { geolocationService } from '@/services/geolocationService';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import 'leaflet/dist/leaflet.css';

export default function HeatmapViewer({ companyId }) {
  const [heatmapData, setHeatmapData] = useState([]);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleGenerateHeatmap = async () => {
    setLoading(true);
    try {
      const data = await geolocationService.generateHeatmap(companyId, {
        start: new Date(startDate),
        end: new Date(endDate),
      });
      setHeatmapData(data);
    } catch (error) {
      console.error('Failed to generate heatmap:', error);
    } finally {
      setLoading(false);
    }
  };

  // Color intensity (red = more employees)
  const getColor = (intensity) => {
    if (intensity > 0.8) return '#ff0000'; // Red
    if (intensity > 0.6) return '#ff6600'; // Orange
    if (intensity > 0.4) return '#ffff00'; // Yellow
    return '#00ff00'; // Green
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 items-end">
        <div>
          <label className="text-sm font-medium text-slate-700">Start Date</label>
          <Input
            type="date"
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
          />
        </div>
        <div>
          <label className="text-sm font-medium text-slate-700">End Date</label>
          <Input
            type="date"
            value={endDate}
            onChange={e => setEndDate(e.target.value)}
          />
        </div>
        <Button
          onClick={handleGenerateHeatmap}
          disabled={loading}
          className="bg-blue-600"
        >
          {loading ? 'Generating...' : 'Generate Heatmap'}
        </Button>
      </div>

      {/* Map */}
      <div className="h-96 rounded-lg overflow-hidden border border-slate-200">
        <MapContainer center={[45.4642, 9.1900]} zoom={10} className="h-full w-full">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Heatmap points */}
          {heatmapData.map((point, idx) => (
            <Marker
              key={idx}
              position={[point.latitude, point.longitude]}
              icon={(() => ({
                className: `heatmap-marker`,
                html: `<div style="background-color: ${getColor(point.intensity)}; width: 30px; height: 30px; border-radius: 50%; opacity: ${point.intensity}; border: 2px solid white;"></div>`,
              }))()} 
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-semibold">{point.count} employees</p>
                  <p className="text-xs text-slate-600">
                    Intensity: {Math.round(point.intensity * 100)}%
                  </p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-4 gap-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-green-500" />
          <span>Low (0-40%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-yellow-400" />
          <span>Medium (40-60%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-orange-500" />
          <span>High (60-80%)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full bg-red-500" />
          <span>Very High (80%+)</span>
        </div>
      </div>
    </div>
  );
}