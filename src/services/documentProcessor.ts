import { supabase } from '@/integrations/supabase/client';
import * as mammoth from 'mammoth';
import { Document } from 'docx';

export interface ProcessedDocument {
  content: string;
  metadata: {
    pageCount?: number;
    wordCount: number;
    processedAt: string;
  };
}

export class DocumentProcessor {
  private static async processPDF(file: File, chatbotId: string): Promise<ProcessedDocument> {
    try {
      if (!chatbotId) {
        throw new Error('Chatbot ID is required for document processing');
      }

      // Get the current user's ID
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User must be authenticated to upload files');
      }

      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${chatbotId}/${fileName}`;

      console.log('Uploading file to storage:', filePath);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Failed to upload file to storage: ${uploadError.message}`);
      }

      console.log('File uploaded successfully:', uploadData);

      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);

      console.log('Public URL:', publicUrl);

      // Call the Edge Function to process the PDF
      const { data: processData, error: processError } = await supabase.functions
        .invoke('process-pdf', {
          body: { file_url: publicUrl, chatbot_id: chatbotId }
        });

      if (processError) {
        console.error('Process error:', processError);
        throw new Error(`Failed to process PDF through Edge Function: ${processError.message}`);
      }

      if (!processData?.document?.content) {
        throw new Error('No content extracted from PDF');
      }

      return {
        content: processData.document.content,
        metadata: processData.document.metadata
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      throw new Error('Failed to process PDF file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  private static async processDOCX(file: File): Promise<ProcessedDocument> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      
      return {
        content: result.value,
        metadata: {
          wordCount: result.value.split(/\s+/).length,
          processedAt: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error('Error processing DOCX:', error);
      throw new Error('Failed to process DOCX file: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  public static async processDocument(file: File, chatbotId: string): Promise<ProcessedDocument> {
    console.log('Processing document:', file.name, 'for chatbot:', chatbotId);
    
    const fileType = file.type.toLowerCase();
    
    if (fileType === 'application/pdf') {
      return this.processPDF(file, chatbotId);
    } else if (
      fileType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      fileType === 'application/msword'
    ) {
      return this.processDOCX(file);
    } else {
      throw new Error('Unsupported file type: ' + fileType);
    }
  }

  public static chunkContent(content: string, chunkSize: number = 1000): string[] {
    console.log('Chunking content of length:', content.length);
    
    // Split into sentences first
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
      if ((currentChunk + sentence).length > chunkSize) {
        if (currentChunk) {
          chunks.push(currentChunk.trim());
          currentChunk = sentence;
        } else {
          chunks.push(sentence.trim());
        }
      } else {
        currentChunk += (currentChunk ? ' ' : '') + sentence;
      }
    }

    if (currentChunk) {
      chunks.push(currentChunk.trim());
    }

    console.log('Created', chunks.length, 'chunks');
    return chunks;
  }
} 