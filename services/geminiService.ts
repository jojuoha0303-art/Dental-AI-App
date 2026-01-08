
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { 
  BlogImageStyle, 
  BlogSectionConfig, 
  InputFile,
  ThumbnailTextPosition,
  ThumbnailFontSize,
  ThumbnailComposition,
  ThumbnailColorScheme,
  FlyerAspectRatio,
  FlyerTextPosition,
  StaffImage,
  FlyerComposition,
  FlyerMood,
  FlyerColorScheme,
  InstagramStoryStyle
} from "../types";

/**
 * Ensures the user has selected a paid API key for Veo/Image capabilities
 */
export const ensureApiKeySelected = async (): Promise<boolean> => {
  if (window.aistudio && window.aistudio.hasSelectedApiKey) {
    const hasKey = await window.aistudio.hasSelectedApiKey();
    if (!hasKey && window.aistudio.openSelectKey) {
      await window.aistudio.openSelectKey();
      return true; 
    }
    return hasKey;
  }
  return true; // Fallback for dev environments without the wrapper
};

// --- Staff Blog Specific Services ---

export const createStaffBlogChat = async (): Promise<Chat> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `
# 役割（ロール）

あなたは、**歯科医院**のブログ記事作成をサポートする「熟練のインタビュアー兼編集者」です。

あなたの口調は**「です・ます調」**を基本とし、常に「**温かみ**」と「**親しみやすさ**」を持ってスタッフに接してください。

# 目的

SEOに強い構成と、スタッフの「現場の生の声」を融合させ、「**20代～50代の主婦層**」に響き、「**新患獲得**」につながるブログ記事を作成することです。

# 実行プロセス（厳守）

スタッフがあなたを起動したら、以下のステップを実行してください。

## ステップ1：基本情報のヒアリング（一括）

* 開口一番、以下の挨拶とヒアリングを行ってください。

「こんにちは！歯科医院ブログ作成をサポートします。
いつも患者様のためにありがとうございます。今日は一緒に素敵な記事を作りましょう！

まずは記事の前提となる、以下の**3点**を教えていただけますか？

1. **あなたの職種**（例：歯科衛生士、受付など）
2. **医院名**（〇〇歯科クリニックなど）
3. **今回のテーマ**（例：ホワイトニング、インプラントなど）」

## ステップ2：構成案の作成と合意

* スタッフから3点の情報が得られたら、即座にターゲット（主婦層メイン）に合わせた「SEO構成案（H2, H3）」を作成し提示します。
* 「この構成で進めてよろしいですか？（修正があれば仰ってください）」と確認します。

## ステップ3：【高速執筆モード】インタビュー＆執筆

* 構成の合意が取れたら、**最初の見出し（H2）**に関する質問を投げかけます。
* **ここからは以下のループを繰り返してください：**

    1. スタッフの回答を受け取る。
    2. 回答内容を元に、その見出し部分の**本文（温かみのある文章）を作成して表示**する。
    3. **（ユーザーの確認を待たず、即座に）**「では、続いて次の見出し『～』についてお伺いします」と切り出し、**次の質問**を投げかける。
    
    ※ これを繰り返すことで、スタッフは回答するだけで次々と記事が出来上がっていく体験を提供してください。
    ※ 質問は、スタッフの【職種】ならではの視点（患者様とのエピソードや、個人の想い）を引き出す内容にしてください。事実確認（～とは何ですか？）はAIが補完し、スタッフには聞きません。

## ステップ4：最終仕上げ

* 全ての見出しの執筆が終わったら、記事全体を結合して表示します。
* 最後に「タイトル案（5個）」「ディスクリプション」「署名（例：歯科衛生士 〇〇）」を提案して終了します。

# 禁止事項・フォーマット指定

* **【重要】出力する記事本文には、「#」（ハッシュタグや見出し記号）や「*」（アスタリスクによる太字）などのMarkdown記号は一切使用しないでください。**
* 見出しは【】で囲むなど、記号を使わずに表現してください。
* 1つの回答ごとに「これでいいですか？」と毎回確認を求めないでください。執筆した文章を見せたら、すぐに次の質問へ移ってください。
* AIっぽい無機質な表現は避け、スタッフの話し言葉や想いを尊重して文章化してください。
  `;

  const chat = client.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: systemPrompt }
  });

  return chat;
};

export const generateBlogFromPDF = async (pdfFile: InputFile): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
# 役割
あなたは、歯科医院に勤務する明るく親しみやすいスタッフ（歯科衛生士または受付）です。
添付されたPDFの内容を元に、患者様に向けた「スタッフブログ」の記事を作成してください。

# ターゲット読者
- 当院に通院中の患者様
- これから来院を検討している地域の皆様（特に20代〜50代の主婦層）

# 記事の構成とトーン
1. **タイトル**: 読みたくなるキャッチーなタイトル
2. **導入**: 親しみやすい挨拶。
3. **本文**: PDFの内容を、専門用語を使わずに分かりやすく噛み砕いて紹介してください。「〜だそうです！」「〜なんですよ」といった語りかけ口調を交えてください。
4. **結び**: ポジティブな締めくくり。

# ガイドライン
- **口調**: です・ます調。明るく、丁寧で、温かみのある言葉遣い。
- **専門性**: 難しい内容は一般の方にもわかるように例え話などを用いて説明してください。
- **Markdown**: 見出しなどの装飾は控えめに、ブログとしてそのまま使えるテキストにしてください。
  `;

  const parts: any[] = [
    { text: prompt },
    {
        inlineData: {
            mimeType: pdfFile.mimeType,
            data: pdfFile.data
        }
    }
  ];

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts }
    });
    return response.text || "ブログ記事の生成に失敗しました。";
  } catch (error) {
    console.error("Error generating blog from PDF:", error);
    throw error;
  }
};

export const generateBlogScenes = async (fullArticle: string): Promise<BlogSectionConfig[]> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Analyze the following blog post.
    Identify the Main Title (H1) and all Major Headings (H2).
    
    For EACH H2 section (and the Title), propose a visual scene description for an illustration/comic to accompany it.
    
    Output Format (JSON):
    [
      {
        "header": "Title of the section",
        "sceneDescription": "Detailed visual description of the scene in JAPANESE.",
        "caption": "A short, catchy phrase or dialogue line suitable for a comic bubble in JAPANESE."
      },
      ...
    ]
    
    **CRITICAL**: 
    - The "sceneDescription" MUST be written in **JAPANESE**.
    - The "caption" MUST be written in **JAPANESE**.
    
    Blog Content:
    ${fullArticle}
  `;

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            header: { type: Type.STRING },
            sceneDescription: { type: Type.STRING, description: "Must be in Japanese" },
            caption: { type: Type.STRING, description: "Must be in Japanese" }
          },
          required: ['header', 'sceneDescription', 'caption']
        }
      }
    }
  });

  const text = response.text;
  if (!text) return [];
  return JSON.parse(text) as BlogSectionConfig[];
};

export const regenerateBlogScene = async (header: string, currentScene: string): Promise<{sceneDescription: string, caption: string}> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Suggest a DIFFERENT visual scene and caption for the blog section titled: "${header}".
    Current idea was: "${currentScene}".
    
    Make the new idea distinct (e.g., different angle, different action, or more metaphorical).
    
    **CRITICAL**: Output MUST be in **JAPANESE**.
    
    Output JSON: { "sceneDescription": "...", "caption": "..." }
  `;
  
  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: prompt }] },
    config: {
        responseMimeType: 'application/json',
        responseSchema: {
            type: Type.OBJECT,
            properties: {
                sceneDescription: { type: Type.STRING },
                caption: { type: Type.STRING }
            }
        }
    }
  });
  
  return JSON.parse(response.text || "{}");
}

export const generateBlogImage = async (
  config: BlogSectionConfig,
  style: BlogImageStyle,
  authorImageBase64: string | null,
  modificationInstruction?: string,
  aspectRatio: '16:9' | '1:1' | '3:4' = '16:9'
): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let stylePrompt = "";
  switch (style) {
    case 'ILLUSTRATION':
      stylePrompt = "Warm, gentle, high-quality digital illustration. Soft colors, clean lines. Suitable for a medical blog for women.";
      break;
    case 'MANGA_MODERN':
      stylePrompt = "Modern Japanese Webtoon/Manga style. Clean lines, bright colors, attractive character design.";
      break;
    case 'MANGA_GEKIGA':
      stylePrompt = "Gekiga style Manga. Serious, detailed hatching, dramatic lighting, realistic proportions.";
      break;
    case 'MANGA_POP':
      stylePrompt = "American Pop Art / Comic style. Bold outlines, halftone dots, vibrant primary colors.";
      break;
  }

  let prompt = `
    Create an image for a dental clinic blog.
    
    Topic/Header: ${config.header}
    Scene Description: ${config.sceneDescription} (Japanese context)
    Caption Text (Visual Context): The image conveys the feeling of "${config.caption}".
    
    Art Style: ${stylePrompt}
    
    TEXT INSTRUCTIONS:
    - If any speech bubbles or text appear in the image, they MUST be in **JAPANESE**.
    - For 'MANGA_POP' (American Comic) style, Sound Effects (SFX) can be in English/Katakana, but dialogue must be Japanese.
  `;

  if (modificationInstruction) {
    prompt += `
    
    **USER MODIFICATION REQUEST (CRITICAL)**:
    The user wants to modify the previous image/idea with this instruction: "${modificationInstruction}".
    **PRIORITIZE this instruction over the original scene description if there is a conflict.**
    `;
  }

  if (authorImageBase64) {
    prompt += `
    COMPOSITING INSTRUCTION:
    - The attached input image is the "Author/Main Character".
    - You MUST include this person in the generated scene.
    - Position them naturally within the scene described.
    - CRITICAL: Maintain the person's facial features to be recognizable, but BLEND them into the selected Art Style (${style}). 
      (e.g., if Manga style, apply the manga filter/style to the person while keeping them recognizable).
    `;
  }

  const parts: any[] = [{ text: prompt }];
  if (authorImageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/png',
        data: authorImageBase64
      }
    });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: aspectRatio } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generating blog image:", error);
    throw error;
  }
};

export const generateFreeformImage = async (
  promptText: string,
  style: BlogImageStyle,
  authorImageBase64: string | null,
  aspectRatio: '16:9' | '1:1' | '3:4' = '16:9'
): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  let stylePrompt = "";
  switch (style) {
    case 'ILLUSTRATION':
      stylePrompt = "Warm, gentle, high-quality digital illustration. Soft colors, clean lines. Suitable for a medical blog for women.";
      break;
    case 'MANGA_MODERN':
      stylePrompt = "Modern Japanese Webtoon/Manga style. Clean lines, bright colors, attractive character design.";
      break;
    case 'MANGA_GEKIGA':
      stylePrompt = "Gekiga style Manga. Serious, detailed hatching, dramatic lighting, realistic proportions.";
      break;
    case 'MANGA_POP':
      stylePrompt = "American Pop Art / Comic style. Bold outlines, halftone dots, vibrant primary colors.";
      break;
  }

  let prompt = `
    Create an image for a dental clinic blog.
    
    Scene Description: ${promptText}
    
    Art Style: ${stylePrompt}
    
    TEXT INSTRUCTIONS:
    - If any speech bubbles or text appear in the image, they MUST be in **JAPANESE**.
  `;

  if (authorImageBase64) {
    prompt += `
    COMPOSITING INSTRUCTION:
    - The attached input image is the "Author/Main Character".
    - You MUST include this person in the generated scene.
    - Position them naturally within the scene described.
    - CRITICAL: Maintain the person's facial features to be recognizable, but BLEND them into the selected Art Style (${style}). 
      (e.g., if Manga style, apply the manga filter/style to the person while keeping them recognizable).
    `;
  }

  const parts: any[] = [{ text: prompt }];
  if (authorImageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/png',
        data: authorImageBase64
      }
    });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: aspectRatio } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generating freeform image:", error);
    throw error;
  }
};

export const generateBlogEyecatch = async (
  articleText: string, 
  title: string,
  titlePos: string,
  subtitle: string,
  subtitlePos: string,
  authorImageBase64: string | null,
  composition: string = 'Rule of thirds',
  mood: string = 'Clean',
  colorScheme: string = 'Blue and White'
): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Summarize atmosphere
  const summaryPrompt = `
    Analyze the following blog post text and describe a visual scene that would be perfect for an "Eyecatch" (Header) image.
    The image should be stylish, sophisticated, and inviting.
    
    Blog Text: "${articleText.substring(0, 5000)}"
    
    Output a concise English description of the scene, mood, and lighting.
  `;
  
  let visualDescription = "A clean, bright dental clinic atmosphere with a welcoming vibe.";
  try {
       const sumResp = await client.models.generateContent({
           model: 'gemini-3-pro-preview',
           contents: { parts: [{ text: summaryPrompt }] }
       });
       if (sumResp.text) visualDescription = sumResp.text;
  } catch(e) { console.error("Eyecatch summary failed", e); }

  // Position Logic
  const titlePrompt = titlePos === 'Top' ? 'Top 1/3 section' : titlePos === 'Bottom' ? 'Bottom 1/3 section' : 'Center';
  const subtitlePrompt = subtitlePos === 'Footer' ? 'Absolute bottom edge (Footer style)' : 'Directly below the Main Title';

  let prompt = `
    Create a STYLISH and SOPHISTICATED "Eyecatch" header image for a blog post.
    
    Visual Context: ${visualDescription}
    
    **TEXT TO RENDER (CRITICAL)**:
    ${title ? `- MAIN TITLE: "${title}"\n      Position: ${titlePrompt}` : ''}
    ${subtitle ? `- SUBTITLE: "${subtitle}"\n      Position: ${subtitlePrompt}` : ''}
    
    Design Specification:
    - Composition: ${composition}
    - Mood/Atmosphere: ${mood}
    - Color Scheme: ${colorScheme}
    - Style: High-quality lifestyle photography or modern flat illustration (matches a clean, professional aesthetic).
    - Aspect Ratio: Wide 16:9.
    
    CRITICAL: This is the main header image. It must look professional and attractive. Ensure text is legible.
  `;

  if (authorImageBase64) {
    prompt += `
    COMPOSITING INSTRUCTION:
    - Incorporate the person from the provided input image into the scene.
    - They should look like the main subject/author of the blog.
    - Ensure they blend naturally with the lighting and style of the background.
    - They should appear friendly and professional.
    `;
  }

  const parts: any[] = [{ text: prompt }];
  if (authorImageBase64) {
    parts.unshift({
      inlineData: {
        mimeType: 'image/png',
        data: authorImageBase64
      }
    });
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: parts },
      config: { imageConfig: { aspectRatio: '16:9' } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image data found");
  } catch (error) {
    console.error("Error generating eyecatch image:", error);
    throw error;
  }
};

// --- New Services for Other Features ---

export const generateLineInfographic = async (message: string, instruction?: string): Promise<string> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create an infographic summarizing the following medical/dental message for a patient.
        Make it clean, easy to read, and professional.
        Use a reassuring and clear design suitable for LINE messaging.
        
        Message: "${message}"
        
        ${instruction ? `Modification Instruction: ${instruction}` : ''}
    `;
    
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: { imageConfig: { aspectRatio: '3:4' } }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        throw new Error("No image data found");
    } catch (e) {
        console.error("Error generating infographic", e);
        throw e;
    }
};

export const generateGoogleMapReply = async (reviewerName: string, reviewContent: string, additionalMessage: string): Promise<string> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        You are a dental clinic staff responding to a Google Map review.
        
        Review: "${reviewContent}"
        
        Your Goal:
        1. Thank the reviewer.
        2. Address their points professionally and warmly.
        3. Include this specific message from the staff: "${additionalMessage}"
        4. Invite them (or others) to visit again.
        
        Tone: Professional, Polite, Warm, Japanese Business Etiquette (but friendly).
        Language: Japanese.
    `;
    
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] }
        });
        return response.text || "";
    } catch (e) {
        console.error("Error generating map reply", e);
        throw e;
    }
};

export const generateYoutubeChapter = async (transcription: string): Promise<string> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Analyze the following video transcription.
        Output:
        1. A concise Summary of the video content.
        2. YouTube Chapters (Timestamps and Titles) - Estimate timestamps if real ones aren't available, or just list logical sections.
        3. 10 Relevant Hashtags for YouTube.
        
        Transcription:
        ${transcription}
    `;
    
    try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: { parts: [{ text: prompt }] }
        });
        return response.text || "";
    } catch (e) {
        console.error("Error generating youtube chapter", e);
        throw e;
    }
};

export const generateYoutubeThumbnail = async (
    title: string, 
    titlePos: ThumbnailTextPosition,
    subtitle: string,
    header: string,
    headerSize: ThumbnailFontSize,
    footer: string,
    footerSize: ThumbnailFontSize,
    performerImageBase64: string | null,
    performerName: string | undefined,
    performerNameEn: string | undefined,
    composition: ThumbnailComposition,
    colorScheme: ThumbnailColorScheme
): Promise<string[]> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create a YouTube Thumbnail.
        Title: "${title}" (Position: ${titlePos})
        ${subtitle ? `Subtitle: "${subtitle}" (Position: Below Title)` : ''}
        ${header ? `Header: "${header}" (Size: ${headerSize}, Position: Top Edge)` : ''}
        ${footer ? `Footer: "${footer}" (Size: ${footerSize}, Position: Bottom Edge)` : ''}
        ${performerName ? `Name: "${performerName}" / "${performerNameEn}"` : ''}

        Design:
        - Composition: ${composition}
        - Color Scheme: ${colorScheme}
        - Style: High Impact, Clickable, Professional YouTube Thumbnail. High contrast text.
    `;
    
    const parts: any[] = [{ text: prompt }];
    if (performerImageBase64) {
        parts.unshift({
            inlineData: { mimeType: 'image/png', data: performerImageBase64 }
        });
    }

    try {
        // Generate 3 variations by calling in parallel or loop. Here looping to keep simple.
        const images: string[] = [];
        for (let i = 0; i < 3; i++) {
             const response = await client.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: parts },
                config: { imageConfig: { aspectRatio: '16:9' } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) images.push(part.inlineData.data);
            }
        }
        return images;
    } catch (e) {
        console.error("Error generating youtube thumbnails", e);
        throw e;
    }
};

export const modifyYoutubeThumbnail = async (currentImageBase64: string, instruction: string): Promise<string> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Modify this YouTube thumbnail based on the instruction:
        Instruction: "${instruction}"
        Maintain the text legibility.
    `;
    
    const parts: any[] = [
        { inlineData: { mimeType: 'image/png', data: currentImageBase64 } },
        { text: prompt }
    ];

    try {
         const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: parts },
            config: { imageConfig: { aspectRatio: '16:9' } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        throw new Error("No image data found");
    } catch (e) {
        console.error("Error modifying thumbnail", e);
        throw e;
    }
};

export const generateSeminarBanner = async (
    title: string,
    genre: string,
    date: string,
    location: string,
    name: string,
    nameEn: string,
    photoBase64: string | null,
    bodyText: string,
    aspectRatio: '16:9' | '1:1'
): Promise<string[]> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create a professional seminar/event banner.
        Title: "${title}"
        Genre: "${genre}"
        Date: "${date}"
        Location: "${location}"
        Speaker: "${name}" (${nameEn})
        
        Context/Catchphrase from: "${bodyText}"
        
        Style: Professional, Trustworthy, Medical/Dental Seminar style. Clean typography.
    `;
    
    const parts: any[] = [{ text: prompt }];
    if (photoBase64) {
        parts.unshift({
            inlineData: { mimeType: 'image/png', data: photoBase64 }
        });
    }

    try {
        const images: string[] = [];
        for (let i = 0; i < 3; i++) {
             const response = await client.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: parts },
                config: { imageConfig: { aspectRatio: aspectRatio } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) images.push(part.inlineData.data);
            }
        }
        return images;
    } catch (e) {
        console.error("Error generating seminar banner", e);
        throw e;
    }
};

export const modifySeminarBanner = async (currentImageBase64: string, instruction: string, aspectRatio: '16:9' | '1:1'): Promise<string> => {
     const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
     const prompt = `Modify this banner: ${instruction}`;
     const parts: any[] = [
        { inlineData: { mimeType: 'image/png', data: currentImageBase64 } },
        { text: prompt }
    ];
    try {
         const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: parts },
            config: { imageConfig: { aspectRatio: aspectRatio } }
        });
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) return part.inlineData.data;
        }
        throw new Error("No image data found");
    } catch (e) {
        console.error("Error modifying banner", e);
        throw e;
    }
};

export const createHygienistRecordChat = async (): Promise<Chat> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `
        You are an assistant for dental hygienists creating medical records (SOAP/SOPEN format).
        Listen to the user's verbal input (which might be fragmented) and organize it into a structured record.
        Format: S (Subjective), O (Objective), P (Plan/Procedure), E (Education/Evaluation), N (Next).
        Language: Japanese.
    `;
    return client.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction: systemPrompt }
    });
};

export const generateFlyer = async (
    ratio: FlyerAspectRatio,
    title: string,
    titlePos: FlyerTextPosition,
    subtitle: string,
    subtitlePos: FlyerTextPosition,
    body: string,
    mainInfo: string,
    subInfo: string,
    subInfo2: string,
    tel: string,
    url: string,
    staffImages: StaffImage[],
    landscapeImages: InputFile[],
    desc: string,
    comp: FlyerComposition,
    mood: FlyerMood,
    color: FlyerColorScheme
): Promise<string[]> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    let prompt = `
        Create a flyer for a dental clinic.
        Ratio: ${ratio}
        Title: ${title} (${titlePos})
        Subtitle: ${subtitle} (${subtitlePos})
        Body Points: ${body}
        
        Info:
        Main: ${mainInfo}
        Sub: ${subInfo}
        Date/Time: ${subInfo2}
        Tel: ${tel}
        URL: ${url}
        
        Design:
        Composition: ${comp}
        Mood: ${mood}
        Color: ${color}
        Extra Context: ${desc}
    `;

    // Add staff info text to prompt
    if (staffImages.length > 0) {
        prompt += "\nStaff included: ";
        staffImages.forEach(s => prompt += `${s.jobTitle} ${s.name}, `);
    }
    
    const parts: any[] = [{ text: prompt }];
    
    // Add images (limit to reasonable number to avoid payload size issues, say top 3)
    let imgCount = 0;
    for (const s of staffImages) {
        if(imgCount < 2) {
            parts.unshift({ inlineData: { mimeType: s.file.mimeType, data: s.file.data } });
            imgCount++;
        }
    }
    for (const l of landscapeImages) {
        if(imgCount < 4) {
            parts.unshift({ inlineData: { mimeType: l.mimeType, data: l.data } });
            imgCount++;
        }
    }

    try {
        const images: string[] = [];
        // Generate 1 image per request for now, loop 3 times
        for (let i = 0; i < 3; i++) {
             const response = await client.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: parts },
                config: { imageConfig: { aspectRatio: ratio === '1:1' ? '1:1' : ratio === '16:9' ? '16:9' : ratio === '3:4' ? '3:4' : ratio === '4:3' ? '4:3' : '9:16' } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) images.push(part.inlineData.data);
            }
        }
        return images;
    } catch (e) {
        console.error("Error generating flyer", e);
        throw e;
    }
};

export const generateInstagramStory = async (
    imageBase64: string,
    style: InstagramStoryStyle,
    message: string,
    note: string
): Promise<string[]> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const prompt = `
        Create an Instagram Story image.
        Style: ${style === 'Visibility' ? 'High visibility, clean text' : 'High emphasis, bold design'}
        Message to display: "${message}"
        Note/Context: "${note}"
        aspectRatio: 9:16
    `;
    
    const parts: any[] = [
        { inlineData: { mimeType: 'image/png', data: imageBase64 } },
        { text: prompt }
    ];

    try {
        const images: string[] = [];
        for (let i = 0; i < 3; i++) {
             const response = await client.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: { parts: parts },
                config: { imageConfig: { aspectRatio: '9:16' } }
            });
            for (const part of response.candidates?.[0]?.content?.parts || []) {
                if (part.inlineData) images.push(part.inlineData.data);
            }
        }
        return images;
    } catch (e) {
        console.error("Error generating instagram story", e);
        throw e;
    }
};

export const createMeetingAgendaChat = async (): Promise<Chat> => {
    const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const systemPrompt = `
        You are a strategic meeting facilitator.
        Your goal is to create a structured "Meeting Agenda Sheet" based on the user's input topic.
        
        Process:
        1. Ask clarifying questions to understand the issue, goal, and participants.
        2. Once you have enough info, output a structured Agenda.
        
        Agenda Format:
        1. タイトル (Title)
        2. 背景・現状 (Background)
        3. 目的・ゴール (Goal)
        4. 議論点 (Discussion Points)
        5. 参加者 (Participants)
        6. 時間配分 (Time Allocation)
    `;
    return client.chats.create({
        model: 'gemini-3-pro-preview',
        config: { systemInstruction: systemPrompt }
    });
};
