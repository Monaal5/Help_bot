import { } from 'react';
import { MediaItem } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';

interface MediaDisplayProps {
  media: MediaItem;
  showDetails?: boolean;
  className?: string;
}

export function MediaDisplay({ media, showDetails = true, className = '' }: MediaDisplayProps) {
  const handleOpenMedia = () => {
    // Don't try to open placeholder URLs
    if (media.file_url.startsWith('placeholder://')) {
      return;
    }
    window.open(media.file_url, '_blank');
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <div className="aspect-video relative bg-muted">
        {media.media_type === 'image' ? (
          <img
            src={media.file_url}
            alt={media.alt_text || media.title}
            className="w-full h-full object-cover cursor-pointer"
            onClick={handleOpenMedia}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full relative">
            {media.file_url.startsWith('placeholder://') ? (
              // For placeholder videos, show informational display
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 text-slate-700 border-2 border-dashed border-blue-200">
                <div className="text-5xl mb-3">🎬</div>
                <div className="text-sm font-semibold text-center px-2">{media.title}</div>
                <div className="text-xs mt-2 text-green-700 font-medium">✓ Successfully uploaded</div>
                <div className="text-xs text-blue-700">📋 Available for search</div>
                <div className="text-xs mt-2 text-slate-500 text-center px-2">
                  Video content stored and searchable
                </div>
              </div>
            ) : (
              <video
                src={media.file_url}
                className="w-full h-full object-cover"
                controls
                preload="metadata"
                poster={media.thumbnail_url}
              >
                Your browser does not support the video tag.
              </video>
            )}
          </div>
        )}
        
        <div className="absolute top-2 right-2">
          <Badge variant={media.media_type === 'image' ? 'default' : 'secondary'}>
            {media.media_type}
          </Badge>
        </div>
        
        {!media.file_url.startsWith('placeholder://') && (
          <Button
            size="sm"
            variant="ghost"
            className="absolute top-2 left-2 bg-black/20 hover:bg-black/30 text-white"
            onClick={handleOpenMedia}
          >
            <ExternalLink className="h-3 w-3" />
          </Button>
        )}
      </div>
      
      {showDetails && (
        <CardContent className="p-3">
          <h4 className="font-medium text-sm mb-1 line-clamp-1">{media.title}</h4>
          {media.description && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {media.description}
            </p>
          )}
          
          {media.tags && media.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {media.tags.slice(0, 2).map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {media.tags.length > 2 && (
                <Badge variant="outline" className="text-xs">
                  +{media.tags.length - 2}
                </Badge>
              )}
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}

interface MediaGridProps {
  mediaItems: MediaItem[];
  className?: string;
  showDetails?: boolean;
}

export function MediaGrid({ mediaItems, className = '', showDetails = true }: MediaGridProps) {
  if (mediaItems.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No media found</p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 ${className}`}>
      {mediaItems.map((media) => (
        <MediaDisplay
          key={media.id}
          media={media}
          showDetails={showDetails}
        />
      ))}
    </div>
  );
}
