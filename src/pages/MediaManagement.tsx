import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useUser } from '@clerk/clerk-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Image, Video, Search, Edit, Trash2, Plus, ArrowLeft, Eye } from 'lucide-react';
import { mediaService, MediaUploadData, MediaService } from '@/services/mediaService';
import { MediaItem } from '@/types/database';
import { supabaseChatbotService } from '@/services/supabaseChatbotService';

export default function MediaManagement() {
  const { chatbotId } = useParams<{ chatbotId: string }>();
  const navigate = useNavigate();
  const { user } = useUser();
  const queryClient = useQueryClient();

  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<MediaItem | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [uploadProgress, setUploadProgress] = useState(0);

  // Form state for upload
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    media_type: 'image' as 'image' | 'video',
    file: null as File | null,
    tags: '',
    keywords: '',
    alt_text: ''
  });

  // Get chatbot info
  const { data: chatbot } = useQuery({
    queryKey: ['chatbot', chatbotId],
    queryFn: () => supabaseChatbotService.getChatbotById(chatbotId!),
    enabled: !!chatbotId
  });

  // Get media items
  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['media', chatbotId, searchQuery, mediaTypeFilter],
    queryFn: async () => {
      if (!chatbotId) return [];
      if (searchQuery) {
        return await mediaService.searchMedia(chatbotId, searchQuery, mediaTypeFilter);
      }
      return await mediaService.getMediaByChatbot(chatbotId);
    },
    enabled: !!chatbotId
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (data: MediaUploadData) => {
      setUploadProgress(10);
      const result = await mediaService.uploadMedia(data);
      setUploadProgress(100);
      return result;
    },
    onSuccess: () => {
      toast.success('Media uploaded successfully!');
      setUploadDialogOpen(false);
      resetUploadForm();
      queryClient.invalidateQueries({ queryKey: ['media', chatbotId] });
    },
    onError: (error) => {
      toast.error(`Upload failed: ${error.message}`);
      setUploadProgress(0);
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: mediaService.deleteMedia,
    onSuccess: () => {
      toast.success('Media deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['media', chatbotId] });
    },
    onError: (error) => {
      toast.error(`Delete failed: ${error.message}`);
    }
  });

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<MediaItem> }) =>
      mediaService.updateMedia(id, updates),
    onSuccess: () => {
      toast.success('Media updated successfully!');
      setEditDialogOpen(false);
      setSelectedMedia(null);
      queryClient.invalidateQueries({ queryKey: ['media', chatbotId] });
    },
    onError: (error) => {
      toast.error(`Update failed: ${error.message}`);
    }
  });

  const resetUploadForm = () => {
    setUploadForm({
      title: '',
      description: '',
      media_type: 'image',
      file: null,
      tags: '',
      keywords: '',
      alt_text: ''
    });
    setUploadProgress(0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = MediaService.validateMediaFile(file);
    if (!validation.isValid) {
      toast.error(validation.error);
      return;
    }

    // Auto-detect media type
    const mediaType = file.type.startsWith('image/') ? 'image' : 'video';
    
    setUploadForm(prev => ({
      ...prev,
      file,
      media_type: mediaType,
      title: prev.title || file.name.split('.')[0]
    }));
  };

  const handleUpload = () => {
    if (!uploadForm.file || !chatbotId) return;

    const uploadData: MediaUploadData = {
      chatbot_id: chatbotId,
      title: uploadForm.title,
      description: uploadForm.description || undefined,
      media_type: uploadForm.media_type,
      file: uploadForm.file,
      tags: uploadForm.tags ? uploadForm.tags.split(',').map(tag => tag.trim()) : undefined,
      keywords: uploadForm.keywords ? uploadForm.keywords.split(',').map(kw => kw.trim()) : undefined,
      alt_text: uploadForm.alt_text || undefined
    };

    uploadMutation.mutate(uploadData);
  };

  const handleEdit = (media: MediaItem) => {
    setSelectedMedia(media);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedMedia) return;

    updateMutation.mutate({
      id: selectedMedia.id,
      updates: {
        title: selectedMedia.title,
        description: selectedMedia.description,
        tags: selectedMedia.tags,
        keywords: selectedMedia.keywords,
        alt_text: selectedMedia.alt_text
      }
    });
  };

  const filteredMedia = mediaItems.filter(item => {
    if (mediaTypeFilter !== 'all' && item.media_type !== mediaTypeFilter) return false;
    return true;
  });

  if (!user) {
    return <div>Please sign in to manage media.</div>;
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Media Management</h1>
            <p className="text-muted-foreground">
              Manage images and videos for {chatbot?.name || 'your chatbot'}
            </p>
          </div>
        </div>
        
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Upload Media
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Upload New Media</DialogTitle>
              <DialogDescription>
                Upload images or videos to use in your chatbot responses
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="file">Media File</Label>
                <Input
                  id="file"
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="mt-1"
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Supported: Images (JPEG, PNG, GIF, WebP) and Videos (MP4, WebM, MOV, AVI). Max 50MB.
                </p>
              </div>

              {uploadForm.file && (
                <>
                  <div>
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={uploadForm.title}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="Enter a descriptive title"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      value={uploadForm.description}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder="Describe what this media shows..."
                      className="mt-1"
                      rows={3}
                    />
                  </div>

                  <div>
                    <Label htmlFor="tags">Tags</Label>
                    <Input
                      id="tags"
                      value={uploadForm.tags}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, tags: e.target.value }))}
                      placeholder="product, medical, equipment (comma-separated)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="keywords">Keywords</Label>
                    <Input
                      id="keywords"
                      value={uploadForm.keywords}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, keywords: e.target.value }))}
                      placeholder="stethoscope, diagnosis, treatment (comma-separated)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="alt_text">Alt Text (for accessibility)</Label>
                    <Input
                      id="alt_text"
                      value={uploadForm.alt_text}
                      onChange={(e) => setUploadForm(prev => ({ ...prev, alt_text: e.target.value }))}
                      placeholder="Describe the image for screen readers"
                      className="mt-1"
                    />
                  </div>

                  {uploadProgress > 0 && uploadProgress < 100 && (
                    <div>
                      <Label>Upload Progress</Label>
                      <Progress value={uploadProgress} className="mt-1" />
                    </div>
                  )}

                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setUploadDialogOpen(false);
                        resetUploadForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleUpload}
                      disabled={!uploadForm.title || !uploadForm.file || uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? 'Uploading...' : 'Upload Media'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search and Filter */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search media by title, description, tags, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <Select value={mediaTypeFilter} onValueChange={(value: 'all' | 'image' | 'video') => setMediaTypeFilter(value)}>
          <SelectTrigger className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Media</SelectItem>
            <SelectItem value="image">Images Only</SelectItem>
            <SelectItem value="video">Videos Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Media Grid */}
      {isLoading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading media...</p>
        </div>
      ) : filteredMedia.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4">
            <Image className="h-12 w-12 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No media found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery ? 'No media matches your search criteria.' : 'Upload your first image or video to get started.'}
          </p>
          <Button onClick={() => setUploadDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Upload Media
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredMedia.map((media) => (
            <Card key={media.id} className="overflow-hidden">
              <div className="aspect-video relative bg-muted">
                {media.media_type === 'image' ? (
                  <img
                    src={media.file_url}
                    alt={media.alt_text || media.title}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Video className="h-12 w-12 text-muted-foreground" />
                    {media.thumbnail_url && (
                      <img
                        src={media.thumbnail_url}
                        alt={media.alt_text || media.title}
                        className="absolute inset-0 w-full h-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant={media.media_type === 'image' ? 'default' : 'secondary'}>
                    {media.media_type}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-4">
                <h3 className="font-semibold truncate mb-1">{media.title}</h3>
                {media.description && (
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                    {media.description}
                  </p>
                )}
                
                {media.tags && media.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-2">
                    {media.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {media.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{media.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex justify-between items-center mt-3">
                  <div className="text-xs text-muted-foreground">
                    {new Date(media.created_at).toLocaleDateString()}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => window.open(media.file_url, '_blank')}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(media)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this media?')) {
                          deleteMutation.mutate(media.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Media Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Media</DialogTitle>
            <DialogDescription>
              Update the metadata for this media item
            </DialogDescription>
          </DialogHeader>
          
          {selectedMedia && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-title">Title</Label>
                <Input
                  id="edit-title"
                  value={selectedMedia.title}
                  onChange={(e) => setSelectedMedia(prev => prev ? { ...prev, title: e.target.value } : null)}
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-description">Description</Label>
                <Textarea
                  id="edit-description"
                  value={selectedMedia.description || ''}
                  onChange={(e) => setSelectedMedia(prev => prev ? { ...prev, description: e.target.value } : null)}
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="edit-tags">Tags</Label>
                <Input
                  id="edit-tags"
                  value={selectedMedia.tags?.join(', ') || ''}
                  onChange={(e) => setSelectedMedia(prev => prev ? { 
                    ...prev, 
                    tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                  } : null)}
                  placeholder="product, medical, equipment (comma-separated)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-keywords">Keywords</Label>
                <Input
                  id="edit-keywords"
                  value={selectedMedia.keywords?.join(', ') || ''}
                  onChange={(e) => setSelectedMedia(prev => prev ? { 
                    ...prev, 
                    keywords: e.target.value.split(',').map(kw => kw.trim()).filter(Boolean)
                  } : null)}
                  placeholder="stethoscope, diagnosis, treatment (comma-separated)"
                  className="mt-1"
                />
              </div>

              <div>
                <Label htmlFor="edit-alt-text">Alt Text</Label>
                <Input
                  id="edit-alt-text"
                  value={selectedMedia.alt_text || ''}
                  onChange={(e) => setSelectedMedia(prev => prev ? { ...prev, alt_text: e.target.value } : null)}
                  placeholder="Describe the image for screen readers"
                  className="mt-1"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setEditDialogOpen(false);
                    setSelectedMedia(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Update Media'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
