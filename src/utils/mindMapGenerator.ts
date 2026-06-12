/**
 * Generates an interactive, structured mind map from standard lesson markdown/text content.
 * It parses major headings (H1/H2/H3) as high-level parenting topics, and list bullets or bold phrases as subtopics.
 * It also uses smart fallback keywords if headings are missing or simple.
 */
export interface MindMapNode {
  topic: string;
  subtopics: string[];
}

export function generateMindMapFromContent(content: string, lessonTitle: string): MindMapNode[] {
  if (!content) return [];
  
  const originalLines = content.split('\n');
  const result: MindMapNode[] = [];
  
  let currentTopic: string | null = null;
  let currentSubtopics: string[] = [];
  
  for (let line of originalLines) {
    line = line.trim();
    if (!line) continue;
    
    // Match headers starting with #, ##, or ###
    const headerMatch = line.match(/^(###|##|#)\s+(.*)$/);
    if (headerMatch) {
      // If we have an existing topic with collected subtopics, save it
      if (currentTopic && currentSubtopics.length > 0) {
        result.push({ topic: currentTopic, subtopics: [...currentSubtopics] });
      }
      
      let headerText = headerMatch[2].trim();
      // Remove numbering and decorations like "1.", "2.", "أ.", "ب.", etc.
      headerText = headerText.replace(/^[\d+أبجدهوزحطيكلـ\-\.)\s]+/, '');
      headerText = headerText.replace(/[:：]/g, '').trim();
      
      if (headerText && !headerText.includes(lessonTitle) && headerText !== 'Summary' && headerText !== 'Résumé') {
        currentTopic = headerText;
        currentSubtopics = [];
      }
    } else if (currentTopic !== null) {
      // Match typical markdown list items (*, -, +, or numbered)
      const listItemMatch = line.match(/^[\*\-\+\d+\.\)]\s+(.*)$/);
      if (listItemMatch) {
        let text = listItemMatch[1].trim();
        
        // If it has bold text representing a concept (e.g., **Concept:** Explanation)
        const boldMatch = text.match(/^\*\*(.*?)\*\*(.*)$/);
        if (boldMatch) {
          text = boldMatch[1].trim();
        } else {
          // Take everything before a colon, hyphen, or comma to keep it concise as a node
          text = text.split(/[：::،,.\-]/)[0].trim();
          if (text.length > 35) {
            text = text.substring(0, 32) + '...';
          }
        }
        
        // Clean markup characters
        text = text.replace(/[\*`_#]/g, '').trim();
        
        if (text && text.length > 1 && !currentSubtopics.includes(text) && currentSubtopics.length < 5) {
          currentSubtopics.push(text);
        }
      }
    }
  }
  
  // Push the final topic
  if (currentTopic && currentSubtopics.length > 0) {
    result.push({ topic: currentTopic, subtopics: currentSubtopics });
  }

  // If we collected fewer than 2 topics, let's parse bold concepts as topics or use a themed fallback
  if (result.length < 2) {
    // Collect all bold concept phrases from content
    const boldRegex = /\*\*(.*?)\*\*/g;
    const keywords: string[] = [];
    let match;
    while ((match = boldRegex.exec(content)) !== null) {
      const kw = match[1].replace(/[:：]/g, '').trim();
      if (kw && !keywords.includes(kw) && kw.length > 2 && kw.length < 40) {
        keywords.push(kw);
      }
    }

    if (keywords.length >= 2) {
      // Group keywords into beautiful topics
      const chunkSize = Math.min(4, Math.ceil(keywords.length / 2));
      for (let i = 0; i < keywords.length; i += chunkSize) {
        const sub = keywords.slice(i, i + chunkSize);
        if (sub.length > 0) {
          result.push({
            topic: i === 0 ? "المفاهيم المحورية للدرس" : "الروابط والدلالات الإضافية",
            subtopics: sub
          });
        }
      }
    }
  }

  // Standard elegant curriculum structures based on keywords if we couldn't resolve any
  if (result.length === 0) {
    // Let's create beautifully worded topics matching the Lesson Title
    result.push({
      topic: `التحليل المنهجي لـ "${lessonTitle}"`,
      subtopics: ["شرح وتبسيط العناصر", "المصطلحات والمفاهيم الكبرى", "العلاقات والارتباطات"]
    });
    result.push({
      topic: "البناء المعرفي بالبكالوريا",
      subtopics: ["نماذج الأسئلة المتكررة", "منهجية معالجة الإشكاليات", "الخلاصة والتقييم الذاتي"]
    });
  }
  
  return result;
}
