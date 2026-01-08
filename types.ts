
export type GenerationMode = 'LINE' | 'MEDICAL_RECORD' | 'STAFF_BLOG' | 'GOOGLE_MAP_REPLY' | 'YOUTUBE_CONTENT' | 'HYGIENIST_RECORD' | 'FLYER' | 'INSTAGRAM_STORY' | 'MEETING_AGENDA' | 'DASHBOARD';

// Staff Blog Specific Types
export type StaffBlogStep = 'AUTHOR' | 'STYLE' | 'CONTENT' | 'IMAGES';

export type BlogImageStyle = 'ILLUSTRATION' | 'MANGA_MODERN' | 'MANGA_GEKIGA' | 'MANGA_POP';

export interface BlogSectionConfig {
  header: string;
  sceneDescription: string;
  caption: string;
  imageBase64?: string;
  modificationInstruction?: string; // New field for user feedback
}

export interface InputFile {
  mimeType: string;
  data: string; // Base64
}

export interface LineInput {
  age?: string; // Optional for Staff Blog
  visitStatus?: 'first' | 'maintenance' | 'long_time'; // Optional for Staff Blog
  additionalInfo: string;
  images: InputFile[];
  audioFiles?: InputFile[]; // New field for audio data
}

// Flyer Specific Types
export type FlyerAspectRatio = '3:4' | '4:3' | '16:9' | '1:1' | '9:16';
export type FlyerTextPosition = 'Header' | 'Top' | 'MiddleBottom';
export type FlyerComposition = 'Rule of thirds' | 'Negative space' | 'Center' | 'Symmetrical' | 'Diagonal';
export type FlyerMood = 'Clean' | 'Trustworthy' | 'Warm' | 'Professional' | 'Luxury' | 'Friendly';
export type FlyerColorScheme = 'Blue and White' | 'Pastel' | 'Gold and White' | 'Green and Natural' | 'Monochrome';

export interface StaffImage {
  file: InputFile;
  name: string;
  jobTitle: string;
}

// Youtube Thumbnail Specific Types
export type ThumbnailTextPosition = 'Header' | 'Top' | 'Middle' | 'Bottom' | 'Footer';
export type ThumbnailFontSize = 'Large' | 'Medium' | 'Small';
export type ThumbnailComposition = 'Rule of thirds' | 'Negative space' | 'Center' | 'Symmetrical' | 'Diagonal';
export type ThumbnailColorScheme = 'Blue and White' | 'Pastel' | 'Gold and White' | 'Green and Natural' | 'Monochrome' | 'Vivid High Contrast';

// Instagram Story Style
export type InstagramStoryStyle = 'Visibility' | 'Emphasis';

// Analysis & Slide Generation Types
export interface AnalysisInput {
  type: 'pdf' | 'images' | 'text';
  files?: InputFile[];
  text?: string;
}

export type MangaStyle = 'Shonen' | 'Shojo' | 'Gekiga' | 'Pop';

export type SNSCoverStyle = 'Trust/Business' | 'Women/Soft' | 'Casual/Friendly' | 'Healing/Relaxing' | 'Impact/Attention';

export type SlideSection = 'Cover' | 'MangaBefore' | 'Objective' | 'Methods' | 'Results' | 'Conclusion' | 'Summary' | 'MangaAfter';

export interface SlideDraft {
  section: SlideSection;
  sectionTitleJP: string;
  content: string;
  citation?: string; // For Cover
}

export interface SlideImageResult {
  section: SlideSection;
  image16x9?: string;
  image1x1?: string;
  variants?: Record<string, { image16x9?: string; image1x1?: string }>;
}

export interface GeneratedSummaries {
  blogPost: string;
  snsPost: string;
}
