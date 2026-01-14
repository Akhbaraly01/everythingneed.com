import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Bookmark, BookmarkCheck, StickyNote, Clock, 
  Plus, Trash2, Edit2, Save, X, Search 
} from "lucide-react";
import { toast } from "sonner";

interface Note {
  id: string;
  timestamp: number;
  content: string;
  createdAt: Date;
}

interface BookmarkItem {
  id: string;
  timestamp: number;
  title: string;
  createdAt: Date;
}

interface CourseNotesBookmarksProps {
  courseId: string;
  currentTime?: number;
  onSeekToTime?: (time: number) => void;
}

const CourseNotesBookmarks = ({ courseId, currentTime = 0, onSeekToTime }: CourseNotesBookmarksProps) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [bookmarks, setBookmarks] = useState<BookmarkItem[]>([]);
  const [newNote, setNewNote] = useState("");
  const [newBookmarkTitle, setNewBookmarkTitle] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddBookmark, setShowAddBookmark] = useState(false);

  // Load from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`course-notes-${courseId}`);
    const savedBookmarks = localStorage.getItem(`course-bookmarks-${courseId}`);
    
    if (savedNotes) setNotes(JSON.parse(savedNotes));
    if (savedBookmarks) setBookmarks(JSON.parse(savedBookmarks));
  }, [courseId]);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(`course-notes-${courseId}`, JSON.stringify(notes));
  }, [notes, courseId]);

  useEffect(() => {
    localStorage.setItem(`course-bookmarks-${courseId}`, JSON.stringify(bookmarks));
  }, [bookmarks, courseId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const addNote = () => {
    if (!newNote.trim()) return;

    const note: Note = {
      id: Date.now().toString(),
      timestamp: currentTime,
      content: newNote,
      createdAt: new Date(),
    };

    setNotes([...notes, note]);
    setNewNote("");
    toast.success("Note added!");
  };

  const deleteNote = (id: string) => {
    setNotes(notes.filter((n) => n.id !== id));
    toast.success("Note deleted");
  };

  const updateNote = (id: string, content: string) => {
    setNotes(notes.map((n) => (n.id === id ? { ...n, content } : n)));
    setEditingNote(null);
    toast.success("Note updated!");
  };

  const addBookmark = () => {
    if (!newBookmarkTitle.trim()) return;

    const bookmark: BookmarkItem = {
      id: Date.now().toString(),
      timestamp: currentTime,
      title: newBookmarkTitle,
      createdAt: new Date(),
    };

    setBookmarks([...bookmarks, bookmark]);
    setNewBookmarkTitle("");
    setShowAddBookmark(false);
    toast.success("Bookmark added!");
  };

  const deleteBookmark = (id: string) => {
    setBookmarks(bookmarks.filter((b) => b.id !== id));
    toast.success("Bookmark removed");
  };

  const filteredNotes = notes.filter((n) =>
    n.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredBookmarks = bookmarks.filter((b) =>
    b.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Notes & Bookmarks</CardTitle>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 w-36"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="w-full mb-4">
            <TabsTrigger value="notes" className="flex-1 gap-2">
              <StickyNote className="h-4 w-4" />
              Notes ({notes.length})
            </TabsTrigger>
            <TabsTrigger value="bookmarks" className="flex-1 gap-2">
              <Bookmark className="h-4 w-4" />
              Bookmarks ({bookmarks.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="space-y-4">
            {/* Add Note Form */}
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="shrink-0">
                  <Clock className="h-3 w-3 mr-1" />
                  {formatTime(currentTime)}
                </Badge>
                <span className="text-sm text-muted-foreground">Current position</span>
              </div>
              <Textarea
                placeholder="Add a note at this timestamp..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                rows={2}
              />
              <Button onClick={addNote} className="w-full gap-2" size="sm">
                <Plus className="h-4 w-4" />
                Add Note
              </Button>
            </div>

            {/* Notes List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-3">
                {filteredNotes.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No notes yet. Start taking notes!
                  </p>
                ) : (
                  filteredNotes.map((note) => (
                    <Card key={note.id} className="p-3">
                      <div className="flex items-start justify-between mb-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-primary"
                          onClick={() => onSeekToTime?.(note.timestamp)}
                        >
                          <Clock className="h-3 w-3 mr-1" />
                          {formatTime(note.timestamp)}
                        </Button>
                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => setEditingNote(editingNote === note.id ? null : note.id)}
                          >
                            <Edit2 className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 text-destructive"
                            onClick={() => deleteNote(note.id)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      {editingNote === note.id ? (
                        <div className="space-y-2">
                          <Textarea
                            defaultValue={note.content}
                            id={`note-${note.id}`}
                            rows={2}
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => {
                                const textarea = document.getElementById(`note-${note.id}`) as HTMLTextAreaElement;
                                updateNote(note.id, textarea.value);
                              }}
                            >
                              <Save className="h-3 w-3 mr-1" />
                              Save
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setEditingNote(null)}
                            >
                              <X className="h-3 w-3 mr-1" />
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-sm">{note.content}</p>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>

          <TabsContent value="bookmarks" className="space-y-4">
            {/* Add Bookmark */}
            {showAddBookmark ? (
              <div className="space-y-2 p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {formatTime(currentTime)}
                  </Badge>
                </div>
                <Input
                  placeholder="Bookmark title..."
                  value={newBookmarkTitle}
                  onChange={(e) => setNewBookmarkTitle(e.target.value)}
                />
                <div className="flex gap-2">
                  <Button onClick={addBookmark} size="sm" className="flex-1">
                    <BookmarkCheck className="h-4 w-4 mr-1" />
                    Save
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowAddBookmark(false)}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                onClick={() => setShowAddBookmark(true)}
                className="w-full gap-2"
                variant="outline"
              >
                <Plus className="h-4 w-4" />
                Add Bookmark at {formatTime(currentTime)}
              </Button>
            )}

            {/* Bookmarks List */}
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {filteredBookmarks.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No bookmarks yet. Save important moments!
                  </p>
                ) : (
                  filteredBookmarks.map((bookmark) => (
                    <Card
                      key={bookmark.id}
                      className="p-3 hover:bg-muted/50 cursor-pointer transition-colors"
                      onClick={() => onSeekToTime?.(bookmark.timestamp)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                          <div>
                            <p className="font-medium text-sm">{bookmark.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {formatTime(bookmark.timestamp)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6 text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteBookmark(bookmark.id);
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CourseNotesBookmarks;