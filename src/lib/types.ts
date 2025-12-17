export type StoryPage = {
  pageNumber: number;
  text: string;
  imagePrompt: string;
  imageUrl?: string;
};

export type GenerateStoryRequest = {
  subject?: string;
  random?: boolean;
  pages?: number;
  ageRange?: string;
  style?: string;
};

export type GenerateStoryResponse = {
  title: string;
  pages: StoryPage[];
};


