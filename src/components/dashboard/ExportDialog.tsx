
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download, FileText, Image } from 'lucide-react';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ExportDialog = ({ open, onOpenChange }: ExportDialogProps) => {
  const [includePhotos, setIncludePhotos] = useState('without');
  const [isExporting, setIsExporting] = useState(false);
  const { toast } = useToast();

  const exportToCsv = (data: any[], filename: string) => {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => {
          const value = row[header];
          if (value === null || value === undefined) return '';
          if (typeof value === 'string' && (value.includes(',') || value.includes('\n') || value.includes('"'))) {
            return `"${value.replace(/"/g, '""')}"`;
          }
          return value;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      // Fetch all meetings with their attendance
      const { data: meetings, error: meetingsError } = await supabase
        .from('meetings')
        .select(`
          id,
          title,
          date,
          created_at,
          attendance(person_name)
        `)
        .order('date', { ascending: false });

      if (meetingsError) throw meetingsError;

      // Fetch all attendance for separate attendance CSV
      const { data: attendance, error: attendanceError } = await supabase
        .from('attendance')
        .select(`
          *,
          meetings(title, date)
        `)
        .order('timestamp', { ascending: false });

      if (attendanceError) throw attendanceError;

      // Export meetings with attendees - properly formatted
      const meetingsData = meetings?.map(meeting => {
        const attendees = meeting.attendance?.map(a => a.person_name).join('; ') || 'No attendees';
        const meetingDate = new Date(meeting.date).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        const createdDate = new Date(meeting.created_at).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });

        return {
          'Meeting ID': meeting.id,
          'Meeting Title': meeting.title,
          'Meeting Date': meetingDate,
          'Number of Attendees': meeting.attendance?.length || 0,
          'Attendees': attendees,
          'Created Date': createdDate
        };
      }) || [];

      exportToCsv(meetingsData, `meetings_with_attendees_${new Date().toISOString().split('T')[0]}.csv`);

      // Export detailed attendance - properly formatted
      const attendanceData = attendance?.map(record => {
        const meetingDate = record.meetings?.date ? 
          new Date(record.meetings.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          }) : 'Unknown Date';
        
        const checkinTime = new Date(record.timestamp).toLocaleString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });

        return {
          'Meeting Title': record.meetings?.title || 'Unknown Meeting',
          'Meeting Date': meetingDate,
          'Attendee Name': record.person_name,
          'Check-in Time': checkinTime,
          'Attendance ID': record.id
        };
      }) || [];

      exportToCsv(attendanceData, `attendance_details_${new Date().toISOString().split('T')[0]}.csv`);

      // Export photos if requested - properly formatted
      if (includePhotos === 'with') {
        const { data: photos, error: photosError } = await supabase
          .from('meeting_photos')
          .select(`
            id,
            photo_url,
            file_name,
            file_size,
            created_at,
            meetings(title, date)
          `)
          .order('created_at', { ascending: false });

        if (photosError) throw photosError;

        const photosData = photos?.map(photo => {
          const meetingDate = photo.meetings?.date ? 
            new Date(photo.meetings.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Unknown Date';
          
          const uploadTime = new Date(photo.created_at).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });

          return {
            'Meeting Title': photo.meetings?.title || 'Unknown Meeting',
            'Meeting Date': meetingDate,
            'Photo ID': photo.id,
            'Photo URL': photo.photo_url,
            'File Name': photo.file_name,
            'File Size (bytes)': photo.file_size || 0,
            'Upload Time': uploadTime
          };
        }) || [];

        exportToCsv(photosData, `meeting_photos_${new Date().toISOString().split('T')[0]}.csv`);
      }

      toast({
        title: 'Export Complete',
        description: `Data exported successfully ${includePhotos === 'with' ? 'with photos' : 'without photos'}.`,
      });

      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Export Failed',
        description: error.message || 'Failed to export data',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export All Data
          </DialogTitle>
          <DialogDescription>
            Export meetings with attendees, detailed attendance, and photos to CSV format.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <RadioGroup value={includePhotos} onValueChange={setIncludePhotos}>
            <div className="space-y-4">
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="without" id="without-photos" />
                <Label htmlFor="without-photos" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Without Photos</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">Export meetings with attendees and attendance data only (faster)</p>
                </Label>
              </div>
              
              <div className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-slate-50 transition-colors">
                <RadioGroupItem value="with" id="with-photos" />
                <Label htmlFor="with-photos" className="flex-1 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Image className="w-4 h-4 text-purple-600" />
                    <span className="font-medium">With Photos</span>
                  </div>
                  <p className="text-sm text-slate-600 mt-1">Include photo URLs and metadata (recommended for complete backup)</p>
                </Label>
              </div>
            </div>
          </RadioGroup>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isExporting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
            >
              {isExporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Export Data
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
