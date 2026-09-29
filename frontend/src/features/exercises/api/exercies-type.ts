export interface GetExercisesParams {
  page?: number;
  page_size?: number;
  search?: string;
  muscle_group_id?: string;
  equipment_id?: string;
  difficulty?: "beginner" | "intermediate" | "advanced" | null;
  sort?: "name_fa" | "name_en" | "created_at" | null;
  direction?: "asc" | "desc";
}

export interface Exercise {
  id: string;
  name_fa: string;
  name_en: string;
  description_fa: string;
  description_en: string;
  equipment: {
    id: string;
    name_fa: string;
    name_en: string;
  };
  difficulty: string;
  image_key: string;
  video_key: string;
  primary_muscles: [
    {
      id: string;
      name_fa: string;
      name_en: string;
    },
  ];
  secondary_muscles: [
    {
      id: string;
      name_fa: string;
      name_en: string;
    },
  ];
  created_at: string;
  updated_at: string;
}

export interface GetExercisesResponse {
  items: Exercise[];
  page: number;
  page_size: number;
  total: number;
  pages: number;
}

export interface MuscleGroup {
  id: string;
  name_fa: string;
  name_en: string;
}
