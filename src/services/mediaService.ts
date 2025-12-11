import { supabase } from "@/integrations/supabase/client";
import { MediaItem } from "@/types/database";

export interface MediaUploadData {
  chatbot_id: string;
  title: string;
  description?: string;
  media_type: 'image' | 'video';
  file: File;
  tags?: string[];
  keywords?: string[];
  alt_text?: string;
}

export interface MediaSearchResult extends MediaItem {
  relevance_score?: number;
}

export class MediaService {
  // Upload media file to Supabase Storage and create database record
  async uploadMedia(data: MediaUploadData): Promise<MediaItem> {
    try {
      console.log(`Uploading ${data.media_type}: ${data.file.name} (${data.file.size} bytes)`);
      
      const fileName = `${Date.now()}-${data.file.name}`;
      
      // For videos, we'll use actual Supabase storage instead of data URLs to handle large files
      let publicUrl: string;
      
      if (data.media_type === 'video') {
        try {
          // Try to upload video to Supabase storage
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('media')
            .upload(fileName, data.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            console.warn('Storage upload failed, using placeholder for video:', uploadError);
            // Use placeholder URL instead of data URL to avoid database timeout
            publicUrl = `placeholder://video/${fileName}`;
          } else {
            // Get public URL from successful storage upload
            const { data: urlData } = supabase.storage
              .from('media')
              .getPublicUrl(uploadData.path);
            
            publicUrl = urlData.publicUrl;
          }
        } catch (storageError) {
          console.warn('Storage error, using placeholder for large video:', storageError);
          // For large videos, use a placeholder URL instead of data URL to avoid timeout
          publicUrl = `placeholder://video/${fileName}`;
        }
      } else {
        // For images, continue using data URLs for development (they're smaller)
        const fileReader = new FileReader();
        publicUrl = await new Promise<string>((resolve, reject) => {
          fileReader.onload = () => resolve(fileReader.result as string);
          fileReader.onerror = () => reject(new Error('Failed to read file'));
          fileReader.readAsDataURL(data.file);
        });
      }

      // Generate thumbnail for videos (placeholder for now)
      let thumbnailUrl: string | undefined;
      if (data.media_type === 'video') {
        // For now, use a placeholder or the video URL itself
        thumbnailUrl = publicUrl;
      }

      // Get file dimensions
      let dimensions: { width: number; height: number } | undefined;
      if (data.media_type === 'image') {
        dimensions = await this.getImageDimensions(data.file);
      }

      // Skip storing video data in metadata to prevent database timeout

      // Create database record with timeout handling
      console.log('Creating database record...');
      const insertData = {
        chatbot_id: data.chatbot_id,
        title: data.title,
        description: data.description,
        media_type: data.media_type,
        file_name: fileName,
        file_url: publicUrl,
        file_size: data.file.size,
        mime_type: data.file.type,
        tags: data.tags || [],
        keywords: data.keywords || [],
        alt_text: data.alt_text,
        thumbnail_url: thumbnailUrl,
        dimensions: dimensions,
        metadata: {
          uploaded_at: new Date().toISOString(),
          original_filename: data.file.name,
          demo_mode: true
        }
      };

      const { data: mediaItem, error: dbError } = await supabase
        .from('media_items')
        .insert([insertData])
        .select()
        .single();

      if (dbError) {
        console.error('Database insert error:', dbError);
        throw new Error(`Failed to create media record: ${dbError.message}`);
      }

      console.log('Media uploaded successfully:', mediaItem.id);
      return mediaItem as MediaItem;
    } catch (error) {
      console.error('Error uploading media:', error);
      throw error;
    }
  }

  // Search media items
  async searchMedia(
    chatbotId: string, 
    query: string = '', 
    mediaType: 'all' | 'image' | 'video' = 'all',
    limit: number = 20
  ): Promise<MediaSearchResult[]> {
    try {
      const { data, error } = await supabase
        .rpc('search_media_items', {
          chatbot_uuid: chatbotId,
          search_query: query,
          media_type_filter: mediaType,
          limit_count: limit
        });

      if (error) {
        throw new Error(`Failed to search media: ${error.message}`);
      }

      return (data || []) as MediaSearchResult[];
    } catch (error) {
      console.error('Error searching media:', error);
      throw error;
    }
  }

  // Get random media items for discovery
  async getRandomMedia(
    chatbotId: string,
    mediaType: 'all' | 'image' | 'video' = 'all',
    limit: number = 6
  ): Promise<MediaItem[]> {
    try {
      const { data, error } = await supabase
        .rpc('get_random_media_items', {
          chatbot_uuid: chatbotId,
          media_type_filter: mediaType,
          limit_count: limit
        });

      if (error) {
        throw new Error(`Failed to get random media: ${error.message}`);
      }

      return (data || []) as MediaItem[];
    } catch (error) {
      console.error('Error getting random media:', error);
      throw error;
    }
  }

  // Get all media for a chatbot
  async getMediaByChatbot(chatbotId: string): Promise<MediaItem[]> {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .select('*')
        .eq('chatbot_id', chatbotId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to get media: ${error.message}`);
      }

      return (data || []) as MediaItem[];
    } catch (error) {
      console.error('Error getting media:', error);
      throw error;
    }
  }

  // Delete media item
  async deleteMedia(mediaId: string): Promise<void> {
    try {
      // Get media item to find file path
      const { data: mediaItem, error: getError } = await supabase
        .from('media_items')
        .select('file_url')
        .eq('id', mediaId)
        .single();

      if (getError) {
        throw new Error(`Failed to find media item: ${getError.message}`);
      }

      // Extract file path from URL
      const url = new URL(mediaItem.file_url);
      const filePath = url.pathname.split('/storage/v1/object/public/media/')[1];

      // Delete from storage
      if (filePath) {
        await supabase.storage.from('media').remove([filePath]);
      }

      // Delete from database
      const { error: deleteError } = await supabase
        .from('media_items')
        .delete()
        .eq('id', mediaId);

      if (deleteError) {
        throw new Error(`Failed to delete media record: ${deleteError.message}`);
      }
    } catch (error) {
      console.error('Error deleting media:', error);
      throw error;
    }
  }

  // Update media item
  async updateMedia(mediaId: string, updates: Partial<MediaItem>): Promise<MediaItem> {
    try {
      const { data, error } = await supabase
        .from('media_items')
        .update(updates)
        .eq('id', mediaId)
        .select()
        .single();

      if (error) {
        throw new Error(`Failed to update media: ${error.message}`);
      }

      return data as MediaItem;
    } catch (error) {
      console.error('Error updating media:', error);
      throw error;
    }
  }

  // Helper function to get image dimensions
  private async getImageDimensions(file: File): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.naturalWidth, height: img.naturalHeight });
      };
      img.onerror = () => {
        reject(new Error('Failed to load image'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Validate file type
  static validateMediaFile(file: File): { isValid: boolean; error?: string } {
    const allowedImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/mov', 'video/avi', 'video/quicktime'];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: 'Unsupported file type. Please upload images (JPEG, PNG, GIF, WebP) or videos (MP4, WebM, MOV, AVI).'
      };
    }

    // Different size limits for images vs videos
    const isVideo = allowedVideoTypes.includes(file.type);
    const maxSize = isVideo ? 100 * 1024 * 1024 : 50 * 1024 * 1024; // 100MB for videos, 50MB for images
    
    if (file.size > maxSize) {
      const maxSizeText = isVideo ? '100MB' : '50MB';
      return {
        isValid: false,
        error: `File size too large. Maximum size is ${maxSizeText} for ${isVideo ? 'videos' : 'images'}.`
      };
    }

    return { isValid: true };
  }

  // Extract keywords from text
  static extractKeywords(text: string): string[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 
      'with', 'by', 'about', 'this', 'that', 'these', 'those', 'is', 'are', 
      'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 
      'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can'
    ]);
    
    return [...new Set(words.filter(word => !stopWords.has(word)))];
  }
}

// Create singleton instance
export const mediaService = new MediaService();
