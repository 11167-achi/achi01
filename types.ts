
export interface ExamScore {
  subject: string;
  weight: string;
}

export interface TcasRound {
  round_name: string;
  isOpen: boolean;
  eligibility: string;
  gpa_requirement: string;
  exam_scores: ExamScore[];
  link?: string;
}

export interface Tutor {
  name: string;
  highlight: string;
  teaching_style: string;
}

export interface RecommendedTutor {
  subject: string;
  tutors: Tutor[];
}

export interface UniversityData {
  rounds: TcasRound[];
  recommended_tutors: RecommendedTutor[];
  tuition_estimate?: string;
}

export interface ChatMessage {
  role: 'user' | 'ai';
  text: string;
}
