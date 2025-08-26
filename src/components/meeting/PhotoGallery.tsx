
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Eye, X } from 'lucide-react';

interface Photo {
  id: string;
  photo_url: string;
  file_name: string;
  created_at: string;
}

interface PhotoGalleryProps {
  meetingId: string;
}

export const PhotoGallery = ({ meetingId }: PhotoGalleryProps) => {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPhotos = async () => {
    try {
      const { data, error } = await supabase
        .from('meeting_photos')
        .select('id, photo_url, file_name, created_at')
        .eq('meeting_id', meetingId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPhotos(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch photos',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deletePhoto = async (photo: Photo) => {
    try {
      // Extract file path from URL
      const urlParts = photo.photo_url.split('/');
      const filePath = urlParts.slice(-2).join('/'); // Gets "meetingId/filename.ext"

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('meeting-photos')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete from database
      const { error: dbError } = await supabase
        .from('meeting_photos')
        .delete()
        .eq('id', photo.id);

      if (dbError) throw dbError;

      setPhotos(photos.filter(p => p.id !== photo.id));
      toast({
        title: 'Photo Deleted',
        description: 'Photo removed successfully.',
      });
    } catch (error: any) {
      toast({
        title: 'Delete Failed',
        description: error.message || 'Failed to delete photo',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchPhotos();
  }, [meetingId]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="aspect-square bg-slate-200 rounded-lg animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-8 text-slate-500">
        <Eye className="w-8 h-8 mx-auto mb-2 text-slate-300" />
        <p>No photos uploaded yet</p>
        <p className="text-xs mt-1">Upload photos to see them here</p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-3">
        {photos.map((photo) => (
          <div key={photo.id} className="relative group">
            <img
              src={photo.photo_url}
              alt={photo.file_name}
              className="w-full aspect-square object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => setSelectedPhoto(photo)}
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={() => setSelectedPhoto(photo)}
                className="h-8 w-8 p-0"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="destructive"
                onClick={() => deletePhoto(photo)}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Photo Preview Dialog */}
      <Dialog open={!!selectedPhoto} onOpenChange={() => setSelectedPhoto(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black border-0">
          <div className="relative">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedPhoto(null)}
              className="absolute top-4 right-4 z-10 bg-black/50 hover:bg-black/70 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
            {selectedPhoto && (
              <img
                src={selectedPhoto.photo_url}
                alt={selectedPhoto.file_name}
                className="w-full h-auto max-h-[80vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
