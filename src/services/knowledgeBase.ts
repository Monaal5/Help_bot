
interface KnowledgeEntry {
  id: string;
  question: string;
  answer: string;
  source: string;
  keywords: string[];
}

class KnowledgeBase {
  private entries: KnowledgeEntry[] = [];

  addTextData(text: string, source: string = 'text') {
    // Simple text processing to create Q&A pairs
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 10);
    
    sentences.forEach((sentence, index) => {
      const keywords = this.extractKeywords(sentence);
      if (keywords.length > 0) {
        this.entries.push({
          id: `${source}-${index}`,
          question: sentence.trim(),
          answer: sentence.trim(),
          source,
          keywords
        });
      }
    });
  }

  addFileData(fileName: string, content: string) {
    // Process file content (simplified for demo)
    this.addTextData(content, fileName);
  }

  private extractKeywords(text: string): string[] {
    // Simple keyword extraction
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Remove common stop words
    const stopWords = ['this', 'that', 'with', 'have', 'will', 'from', 'they', 'been', 'than', 'were', 'said', 'each', 'which', 'their', 'time', 'about'];
    return words.filter(word => !stopWords.includes(word));
  }

  searchRelevantResponse(query: string): string | null {
    const queryKeywords = this.extractKeywords(query);
    
    if (queryKeywords.length === 0) return null;

    // Find best matching entry
    let bestMatch: KnowledgeEntry | null = null;
    let bestScore = 0;

    this.entries.forEach(entry => {
      const commonKeywords = entry.keywords.filter(keyword => 
        queryKeywords.some(qk => qk.includes(keyword) || keyword.includes(qk))
      );
      
      const score = commonKeywords.length / Math.max(entry.keywords.length, queryKeywords.length);
      
      if (score > bestScore && score > 0.2) {
        bestScore = score;
        bestMatch = entry;
      }
    });

    return bestMatch ? bestMatch.answer : null;
  }

  getEntriesCount(): number {
    return this.entries.length;
  }
}

export const knowledgeBase = new KnowledgeBase();
