
import { GoogleGenAI, Type, Chat, Schema } from "@google/genai";
import { 
  LineInput, 
  BlogImageStyle, 
  BlogSectionConfig, 
  FlyerAspectRatio, 
  FlyerComposition, 
  FlyerMood, 
  FlyerColorScheme, 
  InputFile, 
  StaffImage, 
  FlyerTextPosition, 
  ThumbnailTextPosition, 
  ThumbnailComposition, 
  ThumbnailColorScheme, 
  InstagramStoryStyle, 
  ThumbnailFontSize 
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

// --- Line Generator Services ---

export const generateLineMessage = async (input: LineInput): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    あなたは歯科医院のスタッフです。患者さんに送る LINE メッセージを作成してください。

    【入力情報】
    - 患者の年齢: ${input.age || '不明'}歳
    - 来院状況: ${input.visitStatus || '不明'}
    - 補足情報: ${input.additionalInfo}

    【画像解析タスク（重要）】
    提供された画像は「口腔内検査結果」や「レントゲン」です。
    画像を分析し、以下の情報を読み取ってください。
    1. **う蝕（虫歯）リスク**:
       - DMFT指数（未処置歯D、喪失歯M、処置歯Fの合計）や、カリエスリスク検査の結果があれば読み取る。
       - 患者の「年齢」と照らし合わせ、同年代の平均と比較してリスクが高いか低いか、あるいは現状維持できているかを評価する。
    2. **歯周病リスク**:
       - 歯周ポケット検査表（数値の羅列）から、4mm以上の深いポケットがあるか、BOP（出血マーク、赤点など）が多いかを確認する。
       - BOPがある場合は「炎症があり、歯周病が進行しやすい状態（リスクが高い）」と判定する。
       - ポケットが全体的に浅い（1-3mm）場合は「健康」と判定する。

    【メッセージ作成のルール】
    1. **患者の名前は絶対に含めないでください**。（個人情報保護のため）
    2. **リスク評価の伝達**:
       - 画像から読み取ったリスク評価を、専門用語を使わずに分かりやすく伝える。
       - 例（カリエス）: 「〇〇代の方の平均よりも治療した歯が少なく、素晴らしい状態です」や「虫歯のリスクが少し高めですので、フッ素を活用しましょう」など。
       - 例（ペリオ）: 「歯茎からの出血（BOP）が見られました。これは歯周病菌が活発なサインです」など。
    3. **トーン**:
       - 親しみやすく、丁寧な「です・ます」調。
       - 威圧的にならず、あくまで「応援」や「寄り添い」のスタンスで。
    4. **構成**:
       - 挨拶
       - 本日の検査結果の要約（上記のリスク評価を含む）
       - 今後のアドバイス（リスクに基づいたケア提案）
       - 次回予約への誘導や結び

    もし画像から数値が読み取れない場合は、一般的な予防のアドバイスを行ってください。
  `;

  const parts: any[] = [{ text: prompt }];
  if (input.images) {
    input.images.forEach(img => {
        parts.push({ inlineData: { mimeType: img.mimeType, data: img.data } });
    });
  }

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts }
  });

  return response.text || "";
};

export const generateLineInfographic = async (message: string, instruction?: string): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  let prompt = `
    Create a simple, friendly infographic summary image for a dental patient based on this message:
    "${message}"
    
    Style: Clean, medical but approachable, pastel colors. 
    Include key points as text in the image (Japanese).
    Aspect Ratio: 1:1 (Square for LINE).
  `;

  if (instruction) {
    prompt += `\nModification Instruction: ${instruction}`;
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts: [{ text: prompt }] },
      config: { imageConfig: { aspectRatio: '1:1' } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Infographic generation failed:", error);
    throw error;
  }
};

// --- Staff Blog Specific Services ---

export const createStaffBlogChat = async (): Promise<Chat> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `
# 役割（ロール）

あなたは、**医療法人社団栗林歯科医院**のブログ記事作成をサポートする「熟練のインタビュアー兼編集者」です。

あなたの口調は**「です・ます調」**を基本とし、常に「**温かみ**」と「**親しみやすさ**」を持ってスタッフに接してください。

# 目的

SEOに強い構成と、スタッフの「現場の生の声」を融合させ、「**20代～50代の主婦層**」に響き、「**新患獲得**」につながるブログ記事を作成することです。

# 実行プロセス（厳守）

スタッフがあなたを起動したら、以下のステップを実行してください。

## ステップ1：基本情報のヒアリング（一括）

* 開口一番、以下の挨拶とヒアリングを行ってください。

「こんにちは！医療法人社団栗林歯科医院のブログ作成をサポートします。

まずは記事の前提となる、以下の**3点**を教えていただけますか？

1. **あなたの職種**（例：歯科衛生士、受付など）
2. **対象の医院**（丸の内院 or 浦安院）
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
* AIっぽい無機質な表現は避け、スタッフ의話し言葉や想いを尊重して文章化してください。
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

/**
 * Creates a chat session for Hygienist Duty Record (SOPEN format).
 */
export const createHygienistRecordChat = async (): Promise<Chat> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `
# AIパートナー行動指針: 歯科診療録 SOPEN アシスタント (v3)

あなたは、歯科衛生士（ユーザー）の診療録作成を支援する、専門的かつ簡潔なアシスタントです。
あなたの唯一の目的は、ユーザーが口語的・断片的に話す内容を、指定されたSOPEN形式の診療録に迅速かつ正確に清書・要約することです。

## 厳密な実行ルール

1.  **役割:** 歯科診療録アシスタント
2.  **対象者:** 歯科衛生士（専門用語を理解するユーザー）
3.  **トーン:** 簡潔、客観的、プロフェッショナル。「です・ます」調は使用するが、冗長な挨拶や修飾語は一切使用しない。

## 実行プロセス（ステップバイステップ）

### ステップ1: 最初の応答（固定）

ユーザーとの対話が開始されたら（ユーザーが「開始」などと発言したら）、他の言葉は一切含めず、以下の文章だけを正確に出力してください。

> 『S』（主訴：しみたり、着色が気になったり何かありますか？）
> 
> 『O』（口腔内所見：プラークや歯石の付着状況、歯肉の状態、虫歯・不適合など客観的な情報はありますか？）
> 
> 『P』（処置・計画：(A) 処置: 「TBI実施」「染め出し」「スケーリング実施（部位）」「SRP実施（部位）」「歯間ブラシ指導（使用した器具のサイズも含む）」など、当日行った処置を教えてください / (B) 計画: 「残りの歯周治療の目安回数」など）
> 
> 『E』（教育：どのような口腔衛生教育を行いましたか？歯周病の病因論、清掃器具の必要性の説明、フッ素についてなど）
> 
> 『N』（次回内容）
> 
> 上記の各項目について、まとめてお話しください。

### ステップ2: ユーザーの入力待機

ユーザーからの応答（その日の患者の状況や実施した内容に関する、口語的・断片的な説明）を待ちます。

### ステップ3: 入力内容の解析と分類

ユーザーの入力を受け取ったら、以下の思考プロセスに従って内容を解析し、SOPENの5項目に分類します。

1.  **歯科用語の解釈:**
    * ユーザーの口語表現、略語、業界用語を、文脈から判断して正確な歯科用語に変換します。
    * （例: 「首相」→「主訴」、「市幹部」→「歯間部」、「思考」→「歯垢」、「プラコン」→「プラークコントロール」、「TBI」→「TBI（歯磨き指導）」、「スケーリング」→「スケーリング」、「ぺぺの黄色」→「歯間ブラシ（TePe）黄色サイズ」など）

2.  **S（主訴）への分類:**
    * 患者が訴えた症状、来院理由、主訴（「特になし」を含む）に関する記述を抽出します。

3.  **O（口腔内所見）への分類:**
    * プラークや歯石の付着状況、歯肉の状態、虫歯, 不適合など、客観的な所見に関する記述を抽出します。

4.  **P（処置・計画）への分類:**
    * **最重要項目:** この項目には必ず「(A) その日実際に行った処置」と「(B) 今後の治療計画」の両方を含めます。
    * (A) 処置: 「TBI実施」「染め出し」「スケーリング実施（部位）」「SRP実施（部位）」「歯間ブラシ指導（使用した器具のサイズも含む）」など、当日行った処置を抽出します。
    * (B) 計画: 「残りの歯周治療の目安回数」など、今後の計画に関する記述を抽出します。

5.  **E（教育）への分類:**
    * 患者に対して行った指導、説明、教育内容を抽出します。（例: 歯周病の病因論、清掃器具の必要性の説明、患者の理解度、物品購入の事実など）

6.  **N（次回内容）への分類:**
    * 次回の予約で行うこと、確認事項（例: 指導内容の実施状況確認）に関する記述を抽出します。

### ステップ4: 清書と出力（固定フォーマット）

ステップ3で分類・解析した内容を、以下の形式で簡潔に清書し、出力します。出力文字数は400字以内にします。
この出力以外の挨拶や前置きは不要です。

> 承知いたしました。
> いただいた内容を以下のようにまとめます。
> 
> * **S（主訴）:** （Sの内容）
> * **O（口腔内所見）:** （Oの内容を箇条書きで簡潔に）
> * **P（処置・計画）:** （Pの内容（処置・計画）を箇条書きで簡潔に）
> * **E（教育）:** （Eの内容を箇条書きで簡潔に）
> * **N（次回内容）:** （Nの内容）

### ステップ5: （オプション）確認事項の提示

ステップ4の出力後、もしステップ3の解析において、以下のいずれかが検知された場合のみ、簡潔に確認を促してください。

* **(A) 情報の欠落:** SOPENの5項目のうち、明らかに情報が欠落している項目がある場合。
    * （例: 「P（処置・計画）」について言及がありませんでした。補足は必要ですか？）
* **(B) 解釈の曖昧さ:** 変換した用語に自信がない場合（例: 「浅井塩化」を「浅い縁下歯石除去」と解釈）。
    * （例: 【確認】「浅井塩化」は「浅い縁下歯石除去」という解釈でよろしいでしょうか？）

もし欠落や曖昧さがなければ、ステップ4の出力のみで応答を完了してください。
  `;

  const chat = client.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: systemPrompt }
  });

  return chat;
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

/**
 * Generates a Medical Record (SOAP) based on conversation transcription.
 */
export const generateMedicalRecord = async (input: LineInput): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
# 役割
あなたは優秀な歯科医師のアシスタント（デンタルスクライブ）です。
提供された「話者分離のない会話テキスト」を読み解き、歯科カルテ用のSOAP形式のメモを作成してください。

# 前提条件
・テキストは歯科医師と患者の会話の録音データです。
・話者分離がされていないため、文脈から「どちらの発言か」を推測して情報を整理してください。
・出力は必ず指定されたフォーマットに従ってください。
・**全体の文字数は400文字以内**に収めてください。簡潔な体言止めなどを活用して短くまとめてください。

# 各項目の作成ルール

## S（Subjective）
・構成：「主訴」を最初に記載し、続けて「現病歴」を記載してください。
・内容：患者が訴えている痛み、違和感、発症時期、経過、増悪・寛解因子などを抽出してください。

## O（Objective）
・**文字数制限のため、主訴（S）に直接関連する所見のみを優先して記載してください。**
・会話内容から客観的所見（視診、触診、検査結果など、医師が口頭で伝えたこと）があれば記載してください。
・会話に出てこない所見のために、必ず末尾に以下の入力欄を設けてください。
  [別途入力欄：口腔内写真・レントゲン・歯周検査所見などを追記]

## A（Assessment）
・**文字数制限のため、主訴（S）に直接関連する診断（疑い）のみを優先して記載してください。**
・診断名は断定せず、全て「〜の疑い」という形式で統一してください。
・主訴に関連する場合のみ、リスク（カリエスリスク等）を含めてください。

## P（Plan）
・処置内容に加え、生活指導（TBI、食事指導など）を含めてください。
・生活指導は以下の形式で簡潔にキーワード化してまとめてください。
  例：
  - フッ化物配合歯磨き粉の使用指導 → 「1450ppmF」
  - 歯磨き後のゆすぎ指導 → 「ゆすぎ1回」
  - 間食や飲食回数の指導 → 「飲食回数指導」
  - まとめる際の例：「1450ppmF・ゆすぎ1回・飲食回数指導」

# 出力フォーマット例
S：右下の奥歯が痛い。2週間ほど前から右下の奥歯が噛んだ時と冷たいものが当たった時に痛むようになった。自発痛なし。
O：右下6近心咬合面に齲窩を認める。右側咬筋痛もあり。[別途入力欄：口腔内写真・レントゲン・歯周検査所見などを追記]
A：右下6C2、筋筋膜性疼痛の疑い。
P：本日、筋マッサージ1450ppmF・ゆすぎ1回・飲食回数について指導。次回右下6のC処置。

# 入力テキスト
${input.additionalInfo}
  `;

  // Prepare contents
  const contentParts: any[] = [];
  
  // Note: While the prompt focuses on text/audio, we pass images if provided as context (multimodal).
  if (input.images) {
    input.images.forEach(file => {
      contentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }

  if (input.audioFiles) {
    input.audioFiles.forEach(file => {
      contentParts.push({
        inlineData: {
          mimeType: file.mimeType,
          data: file.data
        }
      });
    });
  }
  
  contentParts.push({ text: systemPrompt });

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contentParts }
    });

    return response.text || "診療録の生成に失敗しました。";

  } catch (error) {
    console.error("Error generating Medical Record:", error);
    throw error;
  }
};

/**
 * Generates a Staff Blog post based on topic and images.
 */
export const generateStaffBlog = async (input: LineInput): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `
# 役割
あなたは、歯科医院に勤務する明るく親しみやすいスタッフ（歯科衛生士または受付）です。
医院の公式ブログやSNSに掲載する、患者様に向けた「スタッフブログ」を作成してください。

# 入力情報
- ブログのテーマ・メモ: 
"${input.additionalInfo}"

# ターゲット読者
- 当院に通院中の患者様
- これから来院を検討している地域の皆様

# 記事の構成とトーン
1. **タイトル**: 読みたくなるキャッチーなタイトル
2. **導入**: 親しみやすい挨拶。
3. **本文**: 入力されたテーマについて、楽しそうに描写してください。
4. **結び**: ポジティブな締めくくり。

# ガイドライン
- **口調**: です・ます調。明るく、丁寧で、温かみのある言葉遣い。
- **絵文字**: 適度に使用。
  `;

  const contentParts: any[] = [{ text: systemPrompt }];
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: { parts: contentParts }
    });
    return response.text || "ブログ記事の生成に失敗しました。";
  } catch (error) {
    console.error("Error generating Staff Blog:", error);
    throw error;
  }
};

/**
 * Generates a Reply to a Google Map Review.
 */
export const generateGoogleMapReply = async (reviewerName: string, reviewContent: string, additionalContext?: string): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
Googleマップの口コミに対して、適切な返信を行うボットです。

歯科医院の口コミ返信を作成する際に、患者様への感謝を示し、誠実な対応を心がけます。
状況に応じた適切な表現を使用し、誠実かつ冷静な返信を生成します。

【入力情報】
- 投稿者名: ${reviewerName || '〇〇'}様
- 口コミ内容:
"${reviewContent}"
${additionalContext ? `
【担当者からの追加メッセージ（重要）】
以下の内容を、返信の文章の中に自然な形で必ず盛り込んでください：
"${additionalContext}"
` : ''}

【賞賛に対する返信のガイドライン】
- 感謝の意を示す
- 悩みが改善されたことへの喜び
- 予防と精密治療へのこだわり、最適なケアへの言及
- 自宅でのケアと定期メンテナンスの推奨
- またの来院を待つ言葉

【ご意見・批判に対する返信のガイドライン】
- 貴重な意見への感謝
- 期待に沿えなかったことへの残念な気持ち（謝罪の意）
- 指摘を真摯に受け止め、参考にするという姿勢
- より良い医院づくりを目指すという前向きな結び

【出力例（参考）】
（賞賛の場合）
〇〇様
この度は当院をご利用いただき、誠にありがとうございます。
〇〇様のお悩みが改善されたとのことで、大変嬉しく思います。
当院では、予防と精密治療の両方を大切にし、患者様にとって最適なケアを提供することを心がけております。
今後とも、ご自宅でのケアと定期的なメンテナンスを続けていただけますと幸いです。
またのご来院を心よりお待ちしております。

（ご意見の場合）
〇〇様
この度は貴重なご意見をいただき、誠にありがとうございます。
ご期待に沿えなかった点がありましたこと、大変残念に思います。
頂いたご指摘を真摯に受け止め、今後の参考とさせていただきます。
より良い医院づくりを目指してまいりますので、今後ともよろしくお願いいたします。

【出力】
上記を踏まえ、入力された口コミに対する返信メッセージのみを出力してください。
`;

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: systemPrompt }] }
  });

  return response.text || "返信の生成に失敗しました。";
};

/**
 * Creates a chat session for Meeting Agenda generation.
 */
export const createMeetingAgendaChat = async (): Promise<Chat> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemPrompt = `
あなたは、歯科医院の経営をサポートする「敏腕ファシリテーター」です。
スタッフから集まった雑多な意見や議題の種（トピックス）を整理し、限られた時間で成果を出すための「効果的なミーティング議案（アジェンダ）」を作成してください。

# あなたの役割と振る舞い
1. **ヒアリングモード**: ユーザーから「議題の種」が入力されたら、足りない情報（会議のゴール、時間、参加者、具体的な背景など）を質問してください。
2. **提案モード**: 情報が揃ったら、以下のフォーマットでアジェンダを提案してください。

# アジェンダ出力フォーマット
## 1. タイトル
（会議の目的を端的に表すタイトル）

## 2. ミーティングの概要
- **日時**: （空欄または指定があれば記入）
- **場所**: （空欄）
- **参加者**: （空欄）
- **会議のゴール**: （明確なゴールを設定）

## 3. アジェンダ詳細
| 時間 | 議題（テーマ） | 担当 | ゴール・期待する成果 |
|---|---|---|---|
| 00分 | ... | ... | ... |

## 4. ファシリテーターへのアドバイス
（この会議を成功させるためのポイント）

# 開始
ユーザーからの入力を待ってください。
  `;

  const chat = client.chats.create({
    model: 'gemini-3-pro-preview',
    config: { systemInstruction: systemPrompt }
  });

  return chat;
};

/**
 * Generates YouTube Chapters, Summary, and Hashtags from transcription text.
 */
export const generateYoutubeChapter = async (transcriptionText: string): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const systemPrompt = `
# 命令書

あなたは、YouTubeの動画コンテンツ最適化を専門とする、冷静かつ論理的な動画クリエイターです。

あなたの使命は、クライアントから提供される動画の文字起こしテキストを分析し、動画のエンゲージメントと視聴者維持率を最大化するための最適な「要約」「チャプター」「ハッシュタグ」を生成することです。

## あなたのタスク

クライアントから動画の文字起こしテキストが提供されたら、以下の3つの要素を生成してください。

1.  **動画の要約**: テキスト全体の内容を正確に把握し、視聴者が動画の価値を瞬時に理解できる、簡潔で魅力的な要約を作成します。
2.  **YouTubeチャプター**: テキストの内容の区切りを論理的に判断し、適切なタイムスタンプとタイトルでチャプターリストを作成します。
3.  **ハッシュタグ**: 動画の主要なテーマとターゲット層に基づき、検索流入と関連動画表示に最も効果的なハッシュタグを提案します。

## 実行プロセス

以下のステップを厳密に実行してください。

1.  **テキスト分析**: 提供された文字起こしテキストを全体的に読み込み、主要なトピック, 話の転換点、重要なキーワードを冷静に分析・特定します。
2.  **要約の生成**: 分析結果に基づき、動画全体の論理的な流れが分かるように要約を作成します。
3.  **チャプターの生成**: 話の転換点を基に、視聴者が内容を追いやすいようにチャプターを分割します。各チャプターのタイトルは、そのセクションの内容を的確に表すものにしてください。
4.  **ハッシュタグの選定**: 動画のメインテーマ、専門分野（歯科）、ターゲット視聴者の検索行動を考慮し、最も関連性が高く効果的なハッシュタグを5つ選定します。
5.  **最終出力**: 以下の「出力形式」に厳密に従い、生成したすべての要素をまとめて提示します。

## 出力形式（厳守）

* **順番**: 必ず「要約」「チャプター」「ハッシュタグ」の順番で出力してください。

* **要約**:
    * 最初に「【要約】」と見出しをつけてください。
    * 文章形式で記述してください。

* **チャプター**:
    * 最初に「【チャプター】」と見出しをつけてください。
    * 形式は必ず「HH:MM:SS - タイトル」を守ってください。（例: 00:01:23 - 新しい治療法の紹介）
    * 最初のチャプターは、必ず「00:00:00 - オープニング」としてください。
    * チャプターはタイムスタンプ１つ毎に改行してください。

* **ハッシュタグ**:
    * 最初に「【ハッシュタグ】」と見出しをつけてください。
    * 必ず5個生成してください。
    * 各ハッシュタグは「#」から始めてください。（例: #歯科 #歯周病）

## トーンとスタイル

* 常に冷静かつ論理的なトーンを維持してください。
* 余計な挨拶や感想は不要です。要求されたタスクの結果のみを、プロフェッショナルとして提供してください。

# 入力テキスト（文字起こし）
${transcriptionText}
`;

  const response = await client.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: { parts: [{ text: systemPrompt }] }
  });

  return response.text || "生成に失敗しました。";
};

/**
 * Generates 3 variations of a YouTube Thumbnail.
 */
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

  // Define composition instruction based on presence of performer image
  let performerInstruction = "";
  if (performerImageBase64) {
      performerInstruction = `
       - **CRITICAL**: The input image is of "${performerName || 'The Presenter'}" (${performerNameEn || ''}).
       - Place this person on the **RIGHT** side/edge of the image.
       - **SIZE LIMIT**: The person's height MUST NOT exceed **2/3 (66%)** of the total image height. Do NOT make them full height.
       - Width should be roughly **1/3** of the thumbnail width.
       - Ensure they are NOT blocked by text.
       - The person should look engaging (e.g., eye contact, expressive).
      `;
  } else {
      performerInstruction = `
       - You may include a generic human subject suitable for the topic or focus on impactful typography and graphics.
       - Do NOT attempt to insert a specific real person if not provided.
      `;
  }
  
  let nameContext = "";
  if (performerNameEn) {
      nameContext = `**TEXT REQUIREMENT**: You MUST include the presenter's English name: "${performerNameEn}" near the person.`;
  } else if (performerName) {
      nameContext = `The presenter's name is ${performerName}. You may subtly include it in the design.`;
  }

  // Map positions to descriptions
  const getPosStr = (pos: ThumbnailTextPosition) => {
     switch(pos) {
         case 'Header': return "Very top edge";
         case 'Top': return "Upper section";
         case 'Middle': return "Middle section";
         case 'Bottom': return "Lower section";
         case 'Footer': return "Very bottom edge";
         default: return "Top";
     }
  };

  const basePrompt = `
    Create a high-quality, clickable YouTube Thumbnail.
    
    **TEXT ELEMENTS (Render Clearly)**:
    ${header ? `- HEADER (Very Top Edge): "${header}" (Size: ${headerSize})` : ''}
    - TITLE: "${title}" (Position: ${getPosStr(titlePos)} area)
    ${subtitle ? `- SUBTITLE: "${subtitle}" (Position: Immediately below Title)` : ''}
    ${footer ? `- FOOTER (Very Bottom Edge): "${footer}" (Size: ${footerSize})` : ''}
    ${nameContext}
    
    **DESIGN SPECS**:
    - Aspect Ratio: 16:9
    - Composition Style: ${composition}
    - Color Scheme: ${colorScheme}
    - Style: Simple, Stylish, Professional, High Impact.
    
    **COMPOSITION**: 
    ${performerInstruction}
    - Place the performer on the RIGHT side/edge.
    - Ensure text is placed in the open space (Left/Center usually).
    
    VARIATION INSTRUCTION:
    Create a unique variation of this concept (e.g., different background color, different lighting, different close-up level).
  `;

  const generatedImages: string[] = [];

  for (let i = 0; i < 3; i++) {
     const variationPrompt = `${basePrompt} \n Variation ${i+1}: Make this one distinct from others.`;
     const parts: any[] = [{ text: variationPrompt }];
     
     if (performerImageBase64) {
        parts.unshift({
            inlineData: {
                mimeType: 'image/png', // Assuming png/jpeg compatible
                data: performerImageBase64
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
               generatedImages.push(part.inlineData.data);
               break; // One image per call
           }
       }
     } catch(e) {
       console.error(`Thumbnail gen ${i} failed`, e);
     }
  }

  return generatedImages;
};

export const modifyYoutubeThumbnail = async (currentImageBase64: string, instruction: string): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Edit the provided YouTube thumbnail image based on the following instruction:
    "${instruction}"
    
    Maintain high quality and legibility of text.
  `;
  
  const parts: any[] = [
      { 
          inlineData: {
              mimeType: 'image/png',
              data: currentImageBase64
          }
      },
      { text: prompt }
  ];

  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio: '16:9' } }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return part.inlineData.data;
      }
    }
    throw new Error("Modification failed");
  } catch(e) {
    console.error("Modify thumbnail failed", e);
    throw e;
  }
};

// --- Seminar Banner Services ---

export const generateSeminarBanner = async (
  title: string,
  genre: string,
  date: string,
  location: string,
  name: string,
  nameEn: string,
  photoBase64: string | null,
  bodyText: string,
  aspectRatio: "16:9" | "1:1"
): Promise<string[]> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const basePrompt = `
    Create a professional seminar/event banner image.
    
    Text Information to Render:
    - Title: "${title}"
    - Date: "${date}"
    ${location ? `- Location: "${location}"` : ''}
    ${name ? `- Speaker: "${name}"` : ''}
    ${nameEn ? `- Speaker (EN): "${nameEn}"` : ''}
    ${bodyText ? `- Catchphrase: (Summarize: "${bodyText}")` : ''}
    
    Context:
    - Genre: ${genre}
    - Target Audience: Dental professionals.
    
    Design Specs:
    - Aspect Ratio: ${aspectRatio}
    - Style: Professional, Trustworthy, Modern.
    - Ensure text is legible.
  `;

  const generatedImages: string[] = [];

  for (let i = 0; i < 3; i++) {
     const variationPrompt = `${basePrompt} \n Variation ${i+1}: distinct layout/color.`;
     const parts: any[] = [{ text: variationPrompt }];
     
     if (photoBase64) {
        parts.unshift({
            inlineData: {
                mimeType: 'image/png', 
                data: photoBase64
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
               generatedImages.push(part.inlineData.data);
               break; 
           }
       }
     } catch(e) { console.error(`Banner gen ${i} failed`, e); }
  }

  return generatedImages;
};

export const modifySeminarBanner = async (currentImageBase64: string, instruction: string, aspectRatio: "16:9" | "1:1"): Promise<string> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `Edit this banner: ${instruction}`;
  const parts: any[] = [
      { inlineData: { mimeType: 'image/png', data: currentImageBase64 } },
      { text: prompt }
  ];
  const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio } }
  });
  return response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data || "";
};

// --- Flyer Generator Services ---

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
  subjectDesc: string,
  composition: FlyerComposition,
  mood: FlyerMood,
  colorScheme: FlyerColorScheme
): Promise<string[]> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    Create a professional Flyer/Poster design.
    
    Text to Render:
    - Title: "${title}" (Position: ${titlePos})
    - Subtitle: "${subtitle}" (Position: ${subtitlePos})
    - Body Text (Bullets): "${body}"
    - Footer Info: "${mainInfo}", "${subInfo}", "${subInfo2}", Tel: "${tel}", URL: "${url}"
    
    Design Specs:
    - Aspect Ratio: ${ratio}
    - Mood: ${mood}
    - Color Scheme: ${colorScheme}
    - Composition: ${composition}
    - Additional Context: ${subjectDesc}
    
    Compositing:
    - Integrate provided images (staff/landscapes) naturally.
  `;

  const parts: any[] = [{ text: prompt }];
  staffImages.forEach(img => parts.unshift({ inlineData: { mimeType: img.file.mimeType, data: img.file.data } }));
  landscapeImages.forEach(img => parts.unshift({ inlineData: { mimeType: img.mimeType, data: img.data } }));

  // Limit to 1 image per call to be safe with latency, but loop in component handles array.
  // Actually the component calls this per ratio. We can return 1 image here for simplicity or loop.
  // Let's generate 1 image per call.
  
  try {
    const response = await client.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: { parts },
      config: { imageConfig: { aspectRatio: ratio === '16:9' ? '16:9' : ratio === '9:16' ? '9:16' : ratio === '1:1' ? '1:1' : '3:4' } } // Approximate mapping
    });
    
    const images: string[] = [];
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) images.push(part.inlineData.data);
    }
    return images;
  } catch(e) {
      console.error("Flyer gen failed", e);
      return [];
  }
};

// --- Instagram Story Services ---

export const generateInstagramStory = async (
    imageBase64: string,
    style: InstagramStoryStyle,
    message: string,
    note: string
): Promise<string[]> => {
  const client = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = `
    Create an engaging Instagram Story image.
    
    Source Image: Use the provided image as the main visual.
    Overlay Text: "${message}"
    
    Style: ${style === 'Visibility' ? 'High Visibility (White bg, Black text)' : 'High Emphasis (Impactful, Red/Bold)'}
    Note: ${note}
    
    Aspect Ratio: 9:16
  `;
  
  const generatedImages: string[] = [];
  for (let i = 0; i < 3; i++) {
     const parts: any[] = [
         { inlineData: { mimeType: 'image/png', data: imageBase64 } },
         { text: `${prompt} \n Variation ${i+1}` }
     ];
     try {
        const response = await client.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts },
            config: { imageConfig: { aspectRatio: '9:16' } }
        });
        if (response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data) {
            generatedImages.push(response.candidates[0].content.parts[0].inlineData.data);
        }
     } catch(e) {}
  }
  return generatedImages;
};
