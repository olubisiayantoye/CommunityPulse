/**
 * Export Button Component - CommunityPulse
 */

import { useState } from 'react';
import { adminApi } from '../../lib/api';
import { Button } from '../ui/Button';
import { Download } from 'lucide-react';

export function ExportButton({ filters = {} }) {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format = 'csv') => {
    setExporting(true);
    try {
      const response = await adminApi.export({ format, ...filters });
      
      if (response instanceof Blob) {
        const url = window.URL.createObjectURL(response);
        const a = document.createElement('a');
        a.href = url;
        a.download = `community-pulse-export-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      }
    } catch (err) {
      console.error('Export failed:', err);
      alert('Failed to export data');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative">
      <Button variant="secondary" size="sm" onClick={() => handleExport('csv')} loading={exporting}>
        <Download className="w-4 h-4 mr-2" />
        Export CSV
      </Button>
    </div>
  );
}