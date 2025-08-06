// Utilitaire pour parser les sections d'une page Markdown
export interface ParsedSection {
  id: string;
  title: string;
  level: number;
  anchor: string;
}

export class SectionParser {
  static parseSections(content: string, pageId: string): ParsedSection[] {
    const lines = content.split('\n');
    const sections: ParsedSection[] = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const headerMatch = line.match(/^(#{1,6})\s+(.+)$/);
      
      if (headerMatch) {
        const level = headerMatch[1].length;
        const title = headerMatch[2];
        const anchor = this.createAnchor(title);
        
        sections.push({
          id: `${pageId}-section-${sections.length}`,
          title,
          level,
          anchor
        });
      }
    }
    
    return sections;
  }
  
  static createAnchor(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }
  
  static getPageSections(wikiData: Record<string, any>, pageId: string): ParsedSection[] {
    const pageData = wikiData[pageId];
    if (!pageData || !pageData.content) {
      return [];
    }
    
    return this.parseSections(pageData.content, pageId);
  }
}
