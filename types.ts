
export type GenerationMode = 'STAFF_BLOG' | 'SNS' | 'LINE' | 'MEDICAL_RECORD' | 'GOOGLE_MAP' | 'YOUTUBE_CHAPTER' | 'YOUTUBE_THUMBNAIL' | 'SEMINAR_BANNER' | 'HYGIENIST_RECORD' | 'FLYER' | 'INSTAGRAM_STORY' | 'MEETING_AGENDA';

// Staff Blog Specific Types
export type BlogImageStyle = 'ILLUSTRATION' | 'MANGA_MODERN' | 'MANGA_GEKIGA' | 'MANGA_POP';

export interface BlogSectionConfig {
  header: string;
  sceneDescription: string;
  caption: string;
  imageBase64?: string;
  modificationInstruction?: string;
}

export interface InputFile {
  mimeType: string;
  data: string; // Base64
}

export interface AnalysisInput {
  type: 'pdf' | 'images' | 'text';
  files?: InputFile[];
  text?: string;
}

export type SlideSection = 'Cover' | 'MangaBefore' | 'Objective' | 'Methods' | 'Results' | 'Conclusion' | 'Summary' | 'MangaAfter';

export interface SlideDraft {
    section: SlideSection;
    sectionTitleJP: string;
    content: string;
    citation?: string;
}

export type MangaStyle = 'Shonen' | 'Shojo' | 'Gekiga' | 'Pop';
export type SNSCoverStyle = 'Trust/Business' | 'Women/Soft' | 'Casual/Friendly' | 'Healing/Relaxing' | 'Impact/Attention';

export interface SlideImageResult {
    section: SlideSection;
    image16x9: string; // base64
    image1x1: string; // base64
    variants?: Record<string, { image16x9?: string; image1x1?: string }>;
}

export interface GeneratedSummaries {
    blogPost: string;
    snsPost: string;
}

// Youtube Types
export type ThumbnailTextPosition = 'Top' | 'Middle' | 'Bottom';
export type ThumbnailComposition = 'Rule of thirds' | 'Negative space' | 'Center' | 'Symmetrical' | 'Diagonal';
export type ThumbnailColorScheme = 'Vivid High Contrast' | 'Blue and White' | 'Gold and White' | 'Pastel' | 'Green and Natural' | 'Monochrome';
export type ThumbnailFontSize = 'Large' | 'Medium' | 'Small';

// Flyer Types
export type FlyerAspectRatio = '3:4' | '4:3' | '16:9' | '9:16' | '1:1';
export type FlyerComposition = 'Rule of thirds' | 'Negative space' | 'Center' | 'Symmetrical' | 'Diagonal';
export type FlyerMood = 'Clean' | 'Trustworthy' | 'Warm' | 'Professional' | 'Luxury' | 'Friendly';
export type FlyerColorScheme = 'Blue and White' | 'Pastel' | 'Gold and White' | 'Green and Natural' | 'Monochrome';
export type FlyerTextPosition = 'Header' | 'Top' | 'MiddleBottom';

export interface StaffImage {
    file: InputFile;
    name: string;
    jobTitle: string;
}

// Instagram Story Types
export type InstagramStoryStyle = 'Visibility' | 'Emphasis';
