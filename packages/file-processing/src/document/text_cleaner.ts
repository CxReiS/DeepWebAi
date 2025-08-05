

export interface TextCleaningOptions {
  removeExtraWhitespace?: boolean;
  removeNonPrintable?: boolean;
  normalizeLineBreaks?: boolean;
  removeHeaders?: boolean;
  removeFooters?: boolean;
  preserveFormatting?: boolean;
}

export class TextCleaner {
  /**
   * Clean and normalize text content
   */
  clean(text: string, options: TextCleaningOptions = {}): string {
    let cleanedText = text;

    // Apply default cleaning options
    const defaultOptions: TextCleaningOptions = {
      removeExtraWhitespace: true,
      removeNonPrintable: true,
      normalizeLineBreaks: true,
      removeHeaders: false,
      removeFooters: false,
      preserveFormatting: false,
      ...options
    };

    if (defaultOptions.removeNonPrintable) {
      cleanedText = this.removeNonPrintableCharacters(cleanedText);
    }

    if (defaultOptions.normalizeLineBreaks) {
      cleanedText = this.normalizeLineBreaks(cleanedText);
    }

    if (defaultOptions.removeExtraWhitespace) {
      cleanedText = this.removeExtraWhitespace(cleanedText);
    }

    if (defaultOptions.removeHeaders) {
      cleanedText = this.removeHeaders(cleanedText);
    }

    if (defaultOptions.removeFooters) {
      cleanedText = this.removeFooters(cleanedText);
    }

    if (!defaultOptions.preserveFormatting) {
      cleanedText = this.normalizeFormatting(cleanedText);
    }

    return cleanedText.trim();
  }

  /**
   * Remove non-printable characters
   */
  private removeNonPrintableCharacters(text: string): string {
    // Keep printable ASCII, newlines, tabs, and common Unicode characters
    return text.replace(/[^\x20-\x7E\n\t\u00A0-\uFFFF]/g, '');
  }

  /**
   * Normalize line breaks
   */
  private normalizeLineBreaks(text: string): string {
    return text
      // Convert all line break types to \n
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Remove excessive line breaks
      .replace(/\n{4,}/g, '\n\n\n')
      // Remove trailing spaces on lines
      .replace(/ +\n/g, '\n');
  }

  /**
   * Remove extra whitespace
   */
  private removeExtraWhitespace(text: string): string {
    return text
      // Replace multiple spaces with single space
      .replace(/ {2,}/g, ' ')
      // Replace multiple tabs with single space
      .replace(/\t+/g, ' ')
      // Remove spaces at start/end of lines
      .replace(/^ +| +$/gm, '');
  }

  /**
   * Remove common header patterns
   */
  private removeHeaders(text: string): string {
    return text
      // Remove page numbers at start of line
      .replace(/^Page \d+.*$/gm, '')
      // Remove chapter/section headers (simple pattern)
      .replace(/^(Chapter|Section|Part) \d+.*$/gm, '')
      // Remove repeated headers (lines that appear multiple times)
      .replace(/^(.{1,50})\n(?=.*^\1$)/gm, '');
  }

  /**
   * Remove common footer patterns
   */
  private removeFooters(text: string): string {
    return text
      // Remove page numbers at end of line
      .replace(/.*Page \d+\s*$/gm, '')
      // Remove copyright notices
      .replace(/.*©.*\d{4}.*$/gm, '')
      // Remove URLs in footers
      .replace(/.*https?:\/\/[^\s]+\s*$/gm, '');
  }

  /**
   * Normalize text formatting
   */
  private normalizeFormatting(text: string): string {
    return text
      // Fix hyphenated words broken across lines
      .replace(/(\w+)-\n(\w+)/g, '$1$2')
      // Fix sentences broken across lines
      .replace(/([.!?])\n([A-Z])/g, '$1 $2')
      // Fix words separated by line breaks
      .replace(/(\w+)\n(\w+)/g, '$1 $2')
      // Ensure proper spacing after punctuation
      .replace(/([.!?])([A-Z])/g, '$1 $2')
      // Remove excessive punctuation
      .replace(/[.]{3,}/g, '...')
      .replace(/[!]{2,}/g, '!')
      .replace(/[?]{2,}/g, '?');
  }

  /**
   * Extract key sentences from text
   */
  extractKeySentences(text: string, maxSentences: number = 5): string[] {
    const sentences = this.splitIntoSentences(text);
    
    // Simple scoring based on sentence length and position
    const scoredSentences = sentences.map((sentence, index) => {
      let score = 0;
      
      // Length score (prefer medium-length sentences)
      const wordCount = sentence.split(/\s+/).length;
      if (wordCount >= 10 && wordCount <= 30) score += 2;
      else if (wordCount >= 5 && wordCount <= 50) score += 1;
      
      // Position score (prefer sentences near beginning)
      if (index < sentences.length * 0.2) score += 1;
      
      // Content score (prefer sentences with important words)
      const importantWords = ['important', 'significant', 'key', 'main', 'primary', 'essential'];
      if (importantWords.some(word => sentence.toLowerCase().includes(word))) score += 1;
      
      return { sentence, score, index };
    });

    // Sort by score and return top sentences
    return scoredSentences
      .sort((a, b) => b.score - a.score)
      .slice(0, maxSentences)
      .sort((a, b) => a.index - b.index)
      .map(item => item.sentence);
  }

  /**
   * Split text into sentences
   */
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10); // Filter out very short fragments
  }

  /**
   * Count statistics for text
   */
  getTextStatistics(text: string): {
    characterCount: number;
    wordCount: number;
    sentenceCount: number;
    paragraphCount: number;
    averageWordsPerSentence: number;
  } {
    const characters = text.length;
    const words = text.trim().split(/\s+/).filter(word => word.length > 0);
    const sentences = this.splitIntoSentences(text);
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);

    return {
      characterCount: characters,
      wordCount: words.length,
      sentenceCount: sentences.length,
      paragraphCount: paragraphs.length,
      averageWordsPerSentence: sentences.length > 0 ? words.length / sentences.length : 0
    };
  }
}

export const textCleaner = new TextCleaner();
