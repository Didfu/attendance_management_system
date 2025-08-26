
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Plus, Trash2, Users } from 'lucide-react';

interface Contact {
  id: string;
  name: string;
  created_at: string;
}

export const ContactsManager = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [newContactName, setNewContactName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const fetchContacts = async () => {
    try {
      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setContacts(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch contacts',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim()) return;

    setIsAdding(true);
    try {
      const { data, error } = await supabase
        .from('contacts')
        .insert([{ name: newContactName.trim() }])
        .select()
        .single();

      if (error) throw error;

      setContacts([...contacts, data].sort((a, b) => a.name.localeCompare(b.name)));
      setNewContactName('');
      toast({
        title: 'Contact Added',
        description: `${newContactName} added to contacts list.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to add contact',
        variant: 'destructive',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const removeContact = async (contactId: string, contactName: string) => {
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', contactId);

      if (error) throw error;

      setContacts(contacts.filter(c => c.id !== contactId));
      toast({
        title: 'Contact Removed',
        description: `${contactName} removed from contacts list.`,
      });
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to remove contact',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    fetchContacts();
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="w-5 h-5" />
          Manage Contacts
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={addContact} className="flex gap-2">
          <div className="flex-1">
            <Label htmlFor="contact-name" className="sr-only">
              Contact Name
            </Label>
            <Input
              id="contact-name"
              value={newContactName}
              onChange={(e) => setNewContactName(e.target.value)}
              placeholder="Enter contact name"
            />
          </div>
          <Button
            type="submit"
            disabled={isAdding || !newContactName.trim()}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
          >
            {isAdding ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </Button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {isLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-10 bg-slate-100 rounded animate-pulse"></div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <p className="text-slate-500 text-center py-4">No contacts yet</p>
          ) : (
            contacts.map((contact) => (
              <div key={contact.id} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                <span className="font-medium">{contact.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(contact.id, contact.name)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
