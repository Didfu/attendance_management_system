
import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2, Camera } from 'lucide-react';

interface PhotoUploadProps {
  meetingId: string;
  onPhotoUploaded: () => void;
}

export const PhotoUpload = ({ meetingId, onPhotoUploaded }: PhotoUploadProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const compressImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions (max 1920px width/height)
        const maxDimension = 1920;
        let { width, height } = img;

        if (width > height) {
          if (width > maxDimension) {
            height = (height * maxDimension) / width;
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = (width * maxDimension) / height;
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        ctx?.drawImage(img, 0, 0, width, height);
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.7 // 70% quality
        );
      };

      img.src = URL.createObjectURL(file);
    });
  };

  const uploadFileToStorage = async (file: File): Promise<string> => {
    const fileExt = 'jpg'; // Always save as JPG after compression
    const fileName = `${meetingId}/${Date.now()}.${fileExt}`;
    
    const { data, error } = await supabase.storage
      .from('meeting-photos')
      .upload(fileName, file);

    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage
      .from('meeting-photos')
      .getPublicUrl(fileName);

    return publicUrl;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File',
            description: 'Please select only image files.',
            variant: 'destructive',
          });
          continue;
        }

        if (file.size > 10 * 1024 * 1024) { // 10MB limit before compression
          toast({
            title: 'File Too Large',
            description: 'Please select images smaller than 10MB.',
            variant: 'destructive',
          });
          continue;
        }

        // Compress the image
        const compressedFile = await compressImage(file);
        console.log(`Original size: ${file.size}, Compressed size: ${compressedFile.size}`);

        const photoUrl = await uploadFileToStorage(compressedFile);
        
        const { error } = await supabase
          .from('meeting_photos')
          .insert({
            meeting_id: meetingId,
            photo_url: photoUrl,
            file_name: file.name,
            file_size: compressedFile.size,
          });

        if (error) {
          if (error.message.includes('Maximum 3 photos')) {
            toast({
              title: 'Photo Limit Reached',
              description: 'Maximum 3 photos allowed per meeting.',
              variant: 'destructive',
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: 'Photo Uploaded',
            description: `Photo compressed and uploaded successfully. Size reduced from ${Math.round(file.size / 1024)}KB to ${Math.round(compressedFile.size / 1024)}KB.`,
          });
        }
      }

      onPhotoUploaded();
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload photo',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      
      <Button
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
      >
        {isUploading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Compressing & Uploading...
          </>
        ) : (
          <>
            <Camera className="mr-2 h-4 w-4" />
            Upload Photos
          </>
        )}
      </Button>
      
      
    </div>
  );
};
