import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Image, Video, Play, Check } from 'lucide-react';
import { mediaService } from '@/services/mediaService';
import { MediaItem } from '@/types/database';

interface MediaSelectorProps {
  chatbotId: string;
  isOpen: boolean;
  onClose: () => void;
  onSelectMedia: (media: MediaItem[]) => void;
}

export function MediaSelector({ chatbotId, isOpen, onClose, onSelectMedia }: MediaSelectorProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedMedia, setSelectedMedia] = useState<MediaItem[]>([]);

  // Get media items
  const { data: mediaItems = [], isLoading } = useQuery({
    queryKey: ['media-search', chatbotId, searchQuery, mediaTypeFilter],
    queryFn: async () => {
      if (searchQuery) {
        return await mediaService.searchMedia(chatbotId, searchQuery, mediaTypeFilter);
      }
      return await mediaService.getRandomMedia(chatbotId, mediaTypeFilter, 12);
    },
    enabled: isOpen && !!chatbotId
  });

  const handleMediaToggle = (media: MediaItem) => {
    setSelectedMedia(prev => {
      const isSelected = prev.some(item => item.id === media.id);
      if (isSelected) {
        return prev.filter(item => item.id !== media.id);
      } else {
        return [...prev, media];
      }
    });
  };

  const handleSendMedia = () => {
    if (selectedMedia.length > 0) {
      onSelectMedia(selectedMedia);
      setSelectedMedia([]);
      onClose();
    }
  };

  const handleClose = () => {
    setSelectedMedia([]);
    setSearchQuery('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Find Product Media</DialogTitle>
          <DialogDescription>
            Ask for any product you want - like "blue chair" or "red sofa" - and I'll find matching images and videos
          </DialogDescription>
        </DialogHeader>

        {/* Search Interface */}
        <div className="space-y-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="What product are you looking for? (e.g., blue chair, wooden table, red sofa)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 text-base"
              autoFocus
            />
          </div>
          
          {searchQuery && (
            <div className="flex gap-2">
              <Select value={mediaTypeFilter} onValueChange={(value: 'all' | 'image' | 'video') => setMediaTypeFilter(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Media</SelectItem>
                  <SelectItem value="image">Images Only</SelectItem>
                  <SelectItem value="video">Videos Only</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {/* Selected Media Count */}
        {selectedMedia.length > 0 && (
          <div className="flex items-center justify-between mb-4 p-3 bg-muted rounded-lg">
            <span className="text-sm font-medium">
              {selectedMedia.length} media item{selectedMedia.length !== 1 ? 's' : ''} selected
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setSelectedMedia([])}
            >
              Clear all
            </Button>
          </div>
        )}

        {/* Media Results */}
        <div className="flex-1 overflow-y-auto">
          {!searchQuery ? (
            <div className="text-center py-12">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium mb-2">Search for Products</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Type what you're looking for in the search box above. For example:
              </p>
              <div className="mt-4 space-y-2 text-sm text-muted-foreground">
                <div className="bg-muted/50 rounded px-3 py-2 inline-block mx-2">"blue chair"</div>
                <div className="bg-muted/50 rounded px-3 py-2 inline-block mx-2">"wooden table"</div>
                <div className="bg-muted/50 rounded px-3 py-2 inline-block mx-2">"red sofa"</div>
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-muted-foreground">Searching for "{searchQuery}"...</p>
            </div>
          ) : mediaItems.length === 0 ? (
            <div className="text-center py-8">
              <div className="mx-auto w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Image className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                No products found for "{searchQuery}". Try different keywords.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {mediaItems.map((media) => {
                const isSelected = selectedMedia.some(item => item.id === media.id);
                return (
                  <div
                    key={media.id}
                    className={`relative cursor-pointer transition-all ${
                      isSelected ? 'ring-2 ring-primary' : 'hover:ring-1 hover:ring-muted-foreground'
                    }`}
                    onClick={() => handleMediaToggle(media)}
                  >
                    <div className="aspect-video relative bg-muted rounded-lg overflow-hidden">
                      {media.media_type === 'image' ? (
                        <img
                          src={media.file_url}
                          alt={media.alt_text || media.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full relative">
                          {media.thumbnail_url ? (
                            <img
                              src={media.thumbnail_url}
                              alt={media.alt_text || media.title}
                              className="w-full h-full object-cover"
                              loading="lazy"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                              <Video className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-black/50 rounded-full p-2">
                              <Play className="h-4 w-4 text-white" />
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-4 w-4" />
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2">
                      <p className="text-xs font-medium truncate">{media.title}</p>
                      {media.tags && media.tags.length > 0 && (
                        <div className="flex gap-1 mt-1">
                          {media.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSendMedia}
            disabled={selectedMedia.length === 0}
          >
            Send {selectedMedia.length > 0 && `(${selectedMedia.length})`}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
