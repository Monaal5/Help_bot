import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  chatbot_id: string;
  category?: string;
  subcategory?: string;
  keywords: string[] | null;
  source_document_id: string | null;
  embedding: string | null;
  metadata: any;
  created_at: string | null;
  updated_at: string | null;
  is_duplicate?: boolean;
  similarity_score?: number;
}

export interface BulkImportResult {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  subcategory: string | null;
  is_duplicate: boolean;
}

class KnowledgeBase {
  private entries: KnowledgeEntry[] = [];
  private chatbotId: string | null = null;

  async initialize(chatbotId: string) {
    this.chatbotId = chatbotId;
    await this.loadEntries();
  }

  private async loadEntries() {
    if (!this.chatbotId) return;

    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('*')
      .eq('chatbot_id', this.chatbotId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading knowledge entries:', error);
      return;
    }

    this.entries = (data || []).filter(entry => entry.chatbot_id !== null) as KnowledgeEntry[];
  }

  async addEntry(entry: Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>) {
    if (!this.chatbotId) return;

    const { data, error } = await supabase
      .from('knowledge_entries')
      .insert([{ ...entry, chatbot_id: this.chatbotId }])
      .select()
      .single();

    if (error) {
      console.error('Error adding knowledge entry:', error);
      return;
    }

    if (data && data.chatbot_id !== null) {
      this.entries.push(data as KnowledgeEntry);
    }
  }

  async bulkImport(entries: Array<Omit<KnowledgeEntry, 'id' | 'created_at' | 'updated_at'>>): Promise<BulkImportResult[]> {
    if (!this.chatbotId) return [];

    const { data, error } = await supabase
      .rpc('bulk_import_knowledge_entries', {
        entries: entries,
        chatbot_uuid: this.chatbotId
      });

    if (error) {
      console.error('Error bulk importing knowledge entries:', error);
      return [];
    }

    await this.loadEntries(); // Reload entries after bulk import
    return data || [];
  }

  async exportEntries(category?: string, includeDuplicates: boolean = false): Promise<KnowledgeEntry[]> {
    if (!this.chatbotId) return [];

    const { data, error } = await supabase
      .rpc('export_knowledge_entries', {
        chatbot_uuid: this.chatbotId,
        category_filter: category,
        include_duplicates: includeDuplicates
      });

    if (error) {
      console.error('Error exporting knowledge entries:', error);
      return [];
    }

    return data || [];
  }

  async searchEntries(query: string, category?: string): Promise<KnowledgeEntry[]> {
    if (!this.chatbotId) return [];

    let queryBuilder = supabase
      .from('knowledge_entries')
      .select('*')
      .eq('chatbot_id', this.chatbotId);

    if (category) {
      queryBuilder = queryBuilder.eq('category', category);
    }

    const { data, error } = await queryBuilder
      .or(`question.ilike.%${query}%,answer.ilike.%${query}%,keywords.cs.{${query}}`)
      .order('similarity_score', { ascending: false });

    if (error) {
      console.error('Error searching knowledge entries:', error);
      return [];
    }

    return data || [];
  }

  async getCategories(): Promise<{ category: string; subcategories: string[] }[]> {
    if (!this.chatbotId) return [];

    const { data, error } = await supabase
      .from('knowledge_entries')
      .select('category, subcategory')
      .eq('chatbot_id', this.chatbotId)
      .not('category', 'is', null);

    if (error) {
      console.error('Error getting categories:', error);
      return [];
    }

    const categories = new Map<string, Set<string>>();
    data.forEach(entry => {
      if (entry.category) {
        if (!categories.has(entry.category)) {
          categories.set(entry.category, new Set());
        }
        if (entry.subcategory) {
          categories.get(entry.category)?.add(entry.subcategory);
        }
      }
    });

    return Array.from(categories.entries()).map(([category, subcategories]) => ({
      category,
      subcategories: Array.from(subcategories)
    }));
  }

  async addTextData(text: string, sourceDocumentId: string | null = null, category?: string, subcategory?: string) {
    if (!this.chatbotId) return;

    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    for (const sentence of sentences) {
      const keywords = this.extractKeywords(sentence);
      if (keywords.length > 0) {
        await this.addEntry({
          question: sentence.trim(),
          answer: sentence.trim(),
          chatbot_id: this.chatbotId,
          category,
          subcategory,
          keywords,
          source_document_id: sourceDocumentId,
          embedding: null,
          metadata: {}
        });
      }
    }
  }

  async addFileData(fileName: string, content: string, sourceDocumentId: string | null = null) {
    await this.addTextData(content, sourceDocumentId);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - can be enhanced with NLP
    const words = text.toLowerCase().split(/\s+/);
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'with', 'by', 'about']);
    return [...new Set(words.filter(word => 
      word.length > 3 && !stopWords.has(word)
    ))];
  }

  searchRelevantResponse(query: string): KnowledgeEntry | null {
    const queryKeywords = this.extractKeywords(query);
    
    if (queryKeywords.length === 0) return null;

    let bestMatch: KnowledgeEntry | null = null;
    let bestScore = 0;

    for (const entry of this.entries) {
      if (!entry.keywords) continue;
      
      // Calculate keyword match score
      const commonKeywords = entry.keywords.filter(keyword => 
        queryKeywords.some(qk => qk.includes(keyword) || keyword.includes(qk))
      );
      
      const keywordScore = commonKeywords.length / Math.max(entry.keywords.length, queryKeywords.length);
      
      // Calculate text similarity score
      const questionSimilarity = this.calculateSimilarity(query, entry.question);
      const answerSimilarity = this.calculateSimilarity(query, entry.answer);
      const textScore = Math.max(questionSimilarity, answerSimilarity);
      
      // Combine scores with weights
      const finalScore = (keywordScore * 0.4) + (textScore * 0.6);
      
      if (finalScore > bestScore && finalScore > 0.15) { // Lowered threshold from 0.2 to 0.15
        bestScore = finalScore;
        bestMatch = entry;
      }
    }

    return bestMatch;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = str1.toLowerCase().split(/\s+/);
    const words2 = str2.toLowerCase().split(/\s+/);
    
    const set1 = new Set(words1);
    const set2 = new Set(words2);
    
    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  getEntriesCount(): number {
    return this.entries.length;
  }
}

export const knowledgeBase = new KnowledgeBase();
