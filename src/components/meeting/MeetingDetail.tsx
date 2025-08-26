
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, Users, Camera } from 'lucide-react';
import { PhotoUpload } from './PhotoUpload';
import { PhotoGallery } from './PhotoGallery';
import { AttendanceManager } from './AttendanceManager';
import { MeetingActions } from './MeetingActions';

interface Meeting {
  id: string;
  title: string;
  date: string;
  created_at: string;
}

export const MeetingDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [meeting, setMeeting] = useState<Meeting | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const { toast } = useToast();

  const fetchMeeting = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('meetings')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setMeeting(data);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch meeting details',
        variant: 'destructive',
      });
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleMeetingUpdated = (updatedMeeting: Meeting) => {
    setMeeting(updatedMeeting);
  };

  useEffect(() => {
    fetchMeeting();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="animate-pulse text-slate-600">Loading meeting details...</div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Meeting not found</h2>
          <Button onClick={() => navigate('/')} variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-bold text-slate-800">{meeting.title}</h1>
                <p className="text-sm text-slate-600 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  {new Date(meeting.date).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
            <MeetingActions meeting={meeting} onMeetingUpdated={handleMeetingUpdated} />
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Photos Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5 text-blue-600" />
                  Meeting Photos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <PhotoUpload meetingId={meeting.id} onPhotoUploaded={handleRefresh} />
                <PhotoGallery meetingId={meeting.id} key={refreshKey} />
              </CardContent>
            </Card>
          </div>

          {/* Attendance Section */}
          <div className="space-y-6">
            <Card className="shadow-lg border-0 bg-white/80 backdrop-blur">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-green-600" />
                  Attendance Management
                </CardTitle>
              </CardHeader>
              <CardContent>
                <AttendanceManager meetingId={meeting.id} />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};
