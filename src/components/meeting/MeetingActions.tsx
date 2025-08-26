
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { Edit2, Trash2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Meeting {
  id: string;
  title: string;
  date: string;
}

interface MeetingActionsProps {
  meeting: Meeting;
  onMeetingUpdated: (meeting: Meeting) => void;
}

export const MeetingActions = ({ meeting, onMeetingUpdated }: MeetingActionsProps) => {
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState(meeting.title);
  const [newDate, setNewDate] = useState(meeting.date);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleRename = async () => {
    if (!newTitle.trim()) {
      toast({
        title: 'Error',
        description: 'Meeting title cannot be empty.',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('meetings')
        .update({ 
          title: newTitle.trim(),
          date: newDate,
          updated_at: new Date().toISOString()
        })
        .eq('id', meeting.id);

      if (error) throw error;

      const updatedMeeting = { ...meeting, title: newTitle.trim(), date: newDate };
      onMeetingUpdated(updatedMeeting);
      setShowRenameDialog(false);
      
      toast({
        title: 'Meeting Updated',
        description: 'Meeting details updated successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message || 'Failed to update meeting',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMeetingPhotos = async () => {
    // Get all photos for this meeting
    const { data: photos, error: fetchError } = await supabase
      .from('meeting_photos')
      .select('photo_url')
      .eq('meeting_id', meeting.id);

    if (fetchError) throw fetchError;

    // Delete photos from storage
    if (photos && photos.length > 0) {
      const filePaths = photos.map(photo => {
        const urlParts = photo.photo_url.split('/');
        return urlParts.slice(-2).join('/'); // Gets "meetingId/filename.ext"
      });

      const { error: storageError } = await supabase.storage
        .from('meeting-photos')
        .remove(filePaths);

      if (storageError) throw storageError;
    }

    // Delete photo records from database
    const { error: dbError } = await supabase
      .from('meeting_photos')
      .delete()
      .eq('meeting_id', meeting.id);

    if (dbError) throw dbError;
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      // Delete photos first
      await deleteMeetingPhotos();

      // Delete attendance records
      const { error: attendanceError } = await supabase
        .from('attendance')
        .delete()
        .eq('meeting_id', meeting.id);

      if (attendanceError) throw attendanceError;

      // Delete the meeting
      const { error: meetingError } = await supabase
        .from('meetings')
        .delete()
        .eq('id', meeting.id);

      if (meetingError) throw meetingError;

      toast({
        title: 'Meeting Deleted',
        description: 'Meeting and all associated data deleted successfully.',
      });

      // Navigate back to dashboard
      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete meeting',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowRenameDialog(true)}
        className="flex items-center gap-2"
      >
        <Edit2 className="w-4 h-4" />
        Edit
      </Button>
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowDeleteDialog(true)}
        className="flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
      >
        <Trash2 className="w-4 h-4" />
        Delete
      </Button>

      {/* Rename Dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Meeting</DialogTitle>
            <DialogDescription>
              Update the meeting title and date.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Meeting Title</Label>
              <Input
                id="edit-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter meeting title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-date">Meeting Date</Label>
              <Input
                id="edit-date"
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowRenameDialog(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleRename}
                disabled={isLoading}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Meeting'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Meeting</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{meeting.title}"? This will permanently delete the meeting, all attendance records, and all photos. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-red-600 hover:bg-red-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Meeting'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
