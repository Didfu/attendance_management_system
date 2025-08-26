
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Calendar, Users, Camera, Download, LogOut, UserCheck } from 'lucide-react';
import { CreateMeetingDialog } from './CreateMeetingDialog';
import { MeetingCard } from './MeetingCard';
import { ExportDialog } from './ExportDialog';
import { ContactsManager } from './ContactsManager';

interface Meeting {
  id: string;
  title: string;
  date: string;
  created_at: string;
  photos_count?: number;
  attendance_count?: number;
}

interface DashboardProps {
  onLogout: () => void;
}

export const Dashboard = ({ onLogout }: DashboardProps) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const { toast } = useToast();

  const fetchMeetings = async () => {
    try {
      const { data, error } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_photos(count),
          attendance(count)
        `)
        .order('date', { ascending: false });

      if (error) throw error;

      const meetingsWithCounts = data.map(meeting => ({
        ...meeting,
        photos_count: meeting.meeting_photos?.[0]?.count || 0,
        attendance_count: meeting.attendance?.[0]?.count || 0,
      }));

      setMeetings(meetingsWithCounts);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch meetings',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    onLogout();
    toast({
      title: 'Signed out',
      description: 'Successfully logged out of admin portal.',
    });
  };

  useEffect(() => {
    fetchMeetings();
  }, []);

  const handleMeetingCreated = () => {
    fetchMeetings();
    setShowCreateDialog(false);
    toast({
      title: 'Meeting Created',
      description: 'New meeting has been successfully created.',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="bg-white/95 backdrop-blur border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Meeting Manager
              </h1>
              
            </div>
            <div className="flex items-center gap-3">
              <Button
                onClick={() => setShowExportDialog(true)}
                variant="outline"
                className="hidden sm:flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export Data
              </Button>
              <Button
                onClick={handleLogout}
                variant="outline"
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline ml-2">Sign Out</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="meetings" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="meetings" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Meetings
            </TabsTrigger>
            <TabsTrigger value="contacts" className="flex items-center gap-2">
              <UserCheck className="w-4 h-4" />
              Contacts
            </TabsTrigger>
          </TabsList>

          <TabsContent value="meetings" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Meetings</p>
                      <p className="text-3xl font-bold">{meetings.length}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>
              
              {/* <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Total Attendance</p>
                      <p className="text-3xl font-bold">
                        {meetings.reduce((sum, m) => sum + (m.attendance_count || 0), 0)}
                      </p>
                    </div>
                    <Users className="w-8 h-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>
              
              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Total Photos</p>
                      <p className="text-3xl font-bold">
                        {meetings.reduce((sum, m) => sum + (m.photos_count || 0), 0)}
                      </p>
                    </div>
                    <Camera className="w-8 h-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card> */}
            </div>

            {/* Meetings Section */}
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-slate-800">Recent Meetings</h2>
              <Button
                onClick={() => setShowCreateDialog(true)}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Meeting
              </Button>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-slate-200 rounded mb-2"></div>
                      <div className="h-3 bg-slate-200 rounded mb-4 w-2/3"></div>
                      <div className="flex gap-2">
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                        <div className="h-6 bg-slate-200 rounded w-16"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : meetings.length === 0 ? (
              <Card className="text-center py-12">
                <CardContent>
                  <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-slate-600 mb-2">No meetings yet</h3>
                  <p className="text-slate-500 mb-6">Create your first meeting to get started</p>
                  <Button onClick={() => setShowCreateDialog(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Meeting
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {meetings.map((meeting) => (
                  <MeetingCard key={meeting.id} meeting={meeting} />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="contacts">
            <ContactsManager />
          </TabsContent>
        </Tabs>
      </main>

      <CreateMeetingDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onMeetingCreated={handleMeetingCreated}
      />

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
      />
    </div>
  );
};
