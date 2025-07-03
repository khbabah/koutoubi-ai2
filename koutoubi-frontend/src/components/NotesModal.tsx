import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface NotesModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentId?: string;
  documentTitle?: string;
}

export default function NotesModal({ 
  open, 
  onOpenChange, 
  documentId, 
  documentTitle 
}: NotesModalProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [noteTitle, setNoteTitle] = useState('');
  const [noteContent, setNoteContent] = useState('');

  // Load notes from localStorage
  useEffect(() => {
    if (open && documentId) {
      const savedNotes = localStorage.getItem(`notes-${documentId}`);
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
    }
  }, [open, documentId]);

  // Save notes to localStorage
  const saveNotesToStorage = (updatedNotes: Note[]) => {
    if (documentId) {
      localStorage.setItem(`notes-${documentId}`, JSON.stringify(updatedNotes));
    }
    setNotes(updatedNotes);
  };

  const handleNewNote = () => {
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
    setIsEditing(true);
  };

  const handleSaveNote = () => {
    if (!noteTitle.trim() || !noteContent.trim()) return;

    const now = new Date();
    
    if (selectedNote) {
      // Update existing note
      const updatedNotes = notes.map(note => 
        note.id === selectedNote.id 
          ? { ...note, title: noteTitle, content: noteContent, updatedAt: now }
          : note
      );
      saveNotesToStorage(updatedNotes);
    } else {
      // Create new note
      const newNote: Note = {
        id: Date.now().toString(),
        title: noteTitle,
        content: noteContent,
        createdAt: now,
        updatedAt: now
      };
      saveNotesToStorage([...notes, newNote]);
    }

    setIsEditing(false);
    setSelectedNote(null);
    setNoteTitle('');
    setNoteContent('');
  };

  const handleEditNote = (note: Note) => {
    setSelectedNote(note);
    setNoteTitle(note.title);
    setNoteContent(note.content);
    setIsEditing(true);
  };

  const handleDeleteNote = (noteId: string) => {
    const updatedNotes = notes.filter(note => note.id !== noteId);
    saveNotesToStorage(updatedNotes);
    if (selectedNote?.id === noteId) {
      setSelectedNote(null);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setNoteTitle('');
    setNoteContent('');
    setSelectedNote(null);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Notes</DialogTitle>
          <DialogDescription>
            {documentTitle ? `Notes for: ${documentTitle}` : 'Manage your notes'}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-[500px]">
          {/* Notes List */}
          <div className="space-y-2 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-medium">All Notes ({notes.length})</h3>
              <Button size="sm" onClick={handleNewNote}>
                New Note
              </Button>
            </div>

            {notes.length === 0 ? (
              <Card>
                <CardContent className="pt-6 text-center text-gray-500">
                  No notes yet. Create your first note!
                </CardContent>
              </Card>
            ) : (
              notes.map(note => (
                <Card 
                  key={note.id} 
                  className={`cursor-pointer transition-colors ${
                    selectedNote?.id === note.id ? 'border-blue-500' : ''
                  }`}
                  onClick={() => !isEditing && setSelectedNote(note)}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{note.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 line-clamp-2">
                      {note.content}
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(note.updatedAt)}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>

          {/* Note Editor/Viewer */}
          <div className="border rounded-lg p-4 overflow-y-auto">
            {isEditing ? (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="note-title">Title</Label>
                  <Input
                    id="note-title"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Enter note title..."
                  />
                </div>
                
                <div>
                  <Label htmlFor="note-content">Content</Label>
                  <Textarea
                    id="note-content"
                    value={noteContent}
                    onChange={(e) => setNoteContent(e.target.value)}
                    placeholder="Write your note here..."
                    className="min-h-[300px]"
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={handleSaveNote}>Save</Button>
                  <Button variant="outline" onClick={handleCancel}>Cancel</Button>
                </div>
              </div>
            ) : selectedNote ? (
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold">{selectedNote.title}</h3>
                  <p className="text-sm text-gray-500">
                    Last updated: {formatDate(selectedNote.updatedAt)}
                  </p>
                </div>
                
                <div className="whitespace-pre-wrap text-gray-700">
                  {selectedNote.content}
                </div>

                <div className="flex gap-2">
                  <Button onClick={() => handleEditNote(selectedNote)}>
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    onClick={() => handleDeleteNote(selectedNote.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                Select a note to view or create a new one
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}