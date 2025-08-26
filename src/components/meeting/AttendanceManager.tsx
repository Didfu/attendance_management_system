
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, User, Clock, UserPlus } from 'lucide-react';

interface AttendanceRecord {
  id: string;
  person_name: string;
  timestamp: string;
}

interface Contact {
  id: string;
  name: string;
}

interface AttendanceManagerProps {
  meetingId: string;
}

export const AttendanceManager = ({ meetingId }: AttendanceManagerProps) => {
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [customName, setCustomName] = useState('');
  const [useCustomName, setUseCustomName] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const fetchAttendance = async () => {
    try {
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('meeting_id', meetingId)
        .order('timestamp', { ascending: false });

      if (error) throw error;
      setAttendance(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch attendance',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      console.error('Failed to fetch contacts:', error);
    }
  };

  const addAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const personName = useCustomName ? customName.trim() : 
      contacts.find(c => c.id === selectedContact)?.name || '';
    
    if (!personName) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('attendance')
        .insert([
          {
            meeting_id: meetingId,
            person_name: personName,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setAttendance([data, ...attendance]);
      setSelectedContact('');
      setCustomName('');
      toast({
        title: 'Attendance Added',
        description: `${personName} marked as present.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add attendance',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeAttendance = async (recordId: string, personName: string) => {
    try {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', recordId);

      if (error) throw error;

      setAttendance(attendance.filter(a => a.id !== recordId));
      toast({
        title: 'Attendance Removed',
        description: `${personName} removed from attendance.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove attendance',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchAttendance();
    fetchContacts();
  }, [meetingId]);

  return (
    <div className="space-y-6">
      {/* Add Attendance Form */}
      <form onSubmit={addAttendance} className="space-y-4">
        <div>
          <Label className="text-sm font-medium mb-3 block">
            Add Attendee
          </Label>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={!useCustomName ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomName(false)}
              >
                <User className="w-4 h-4 mr-1" />
                From Contacts
              </Button>
              <Button
                type="button"
                variant={useCustomName ? "default" : "outline"}
                size="sm"
                onClick={() => setUseCustomName(true)}
              >
                <UserPlus className="w-4 h-4 mr-1" />
                Custom Name
              </Button>
            </div>

            <div className="flex gap-2">
              {useCustomName ? (
                <Input
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Enter custom name"
                  className="flex-1"
                />
              ) : (
                <Select value={selectedContact} onValueChange={setSelectedContact}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select from contacts" />
                  </SelectTrigger>
                  <SelectContent>
                    {contacts.map((contact) => (
                      <SelectItem key={contact.id} value={contact.id}>
                        {contact.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              <Button
                type="submit"
                disabled={isAdding || (!useCustomName && !selectedContact) || (useCustomName && !customName.trim())}
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              >
                {isAdding ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      </form>

      {/* Attendance List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-800">
            Attendees
          </h3>
          <Badge variant="outline" className="text-xs">
            <User className="w-3 h-3 mr-1" />
            Total: {attendance.length}
          </Badge>
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse"></div>
            ))}
          </div>
        ) : attendance.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="text-center py-8">
              <User className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No attendees yet</p>
              <p className="text-xs text-slate-400 mt-1">Add attendees to track meeting participation</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {attendance.map((record) => (
              <Card key={record.id} className="border-0 shadow-sm bg-slate-50/50">
                <CardContent className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    
                    <div>
                      <p className="font-medium text-slate-800">{record.person_name}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAttendance(record.id, record.person_name)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
