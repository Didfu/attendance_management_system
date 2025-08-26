
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Camera, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Meeting {
  id: string;
  title: string;
  date: string;
  created_at: string;
  photos_count?: number;
  attendance_count?: number;
}

interface MeetingCardProps {
  meeting: Meeting;
}

export const MeetingCard = ({ meeting }: MeetingCardProps) => {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/meeting/${meeting.id}`);
  };

  return (
    <Card 
      className="cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 group border-0 shadow-md bg-white/80 backdrop-blur"
      onClick={handleClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg font-semibold text-slate-800 group-hover:text-blue-600 transition-colors">
              {meeting.title}
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <Calendar className="w-3 h-3" />
              {new Date(meeting.date).toLocaleDateString('en-US', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </CardDescription>
          </div>
          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-200" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="flex items-center gap-1 text-xs">
            <Users className="w-3 h-3" />
            {meeting.attendance_count || 0} attendees
          </Badge>
          <Badge variant="outline" className="flex items-center gap-1 text-xs">
            <Camera className="w-3 h-3" />
            {meeting.photos_count || 0}/3 photos
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
};
