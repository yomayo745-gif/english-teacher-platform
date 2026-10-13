export type UserRole = 'STUDENT' | 'TEACHER' | 'ADMIN';

export type TaskType =
  | 'PICTURE_DESCRIPTION'
  | 'WRITING'
  | 'VOCABULARY'
  | 'TRANSLATION'
  | 'MULTIPLE_CHOICE'
  | 'TRUE_FALSE'
  | 'FILL_BLANK'
  | 'MATCHING'
  | 'SENTENCE_BUILDER'
  | 'READING'
  | 'LISTENING'
  | 'SPEAKING'
  | 'PHOTO'
  | 'SHORT_ANSWER'
  | 'MIXED';

export type AssignmentStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';

export type StudentHomeworkStatus =
  | 'NEW'
  | 'IN PROGRESS'
  | 'SUBMITTED'
  | 'REVIEWING'
  | 'GRADED'
  | 'LATE'
  | 'MISSED'
  | 'RETURNED';

export interface User {
  id: string;
  telegram_id: number;
  username?: string | null;
  first_name: string;
  last_name?: string | null;
  role: UserRole;
  language_code: string;
  is_active: boolean;
  created_at: string;
  last_seen_at: string;
}

export interface AssignmentQuestion {
  id: string;
  order: number;
  type: TaskType;
  question_text: string;
  description?: string | null;
  passage?: string | null;
  media_url?: string | null;
  media_type?: 'audio' | 'image' | 'doc' | null;
  media_duration?: number | null;
  transcript?: string | null;
  options?: any;
  correct_answer?: any;
  min_words?: number | null;
  max_words?: number | null;
  points: number;
  is_required: boolean;
  saved_answer?: SavedAnswer | null;
}

export interface SavedAnswer {
  id?: string;
  text_answer?: string | null;
  selected_options?: any;
  audio_url?: string | null;
  audio_duration?: number | null;
  file_url?: string | null;
  word_count?: number | null;
  audio_plays_count?: number;
}

export interface Assignment {
  id: string;
  title: string;
  description?: string | null;
  instructions?: string | null;
  type: TaskType;
  difficulty: string;
  points: number;
  estimated_time_minutes: number;
  start_date?: string | null;
  deadline?: string | null;
  allow_late_submission: boolean;
  allow_edit_after_submit: boolean;
  audio_play_limit: number;
  show_transcript: boolean;
  status: AssignmentStatus;
  target_type: 'ALL' | 'GROUP' | 'INDIVIDUAL';
  teacher_name?: string;
  questions_count?: number;
  submissions_count?: number;
  student_status?: StudentHomeworkStatus;
  progress_percent?: number;
  score?: number | null;
  submission_id?: string | null;
}

export interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  student_name?: string;
  student_username?: string;
  assignment_title?: string;
  task_type?: TaskType;
  status: StudentHomeworkStatus;
  is_late: boolean;
  late_by_minutes: number;
  submitted_at?: string | null;
  total_score?: number | null;
  max_score: number;
  teacher_feedback?: string | null;
}

export interface Group {
  id: string;
  name: string;
  description?: string;
  level: string;
  member_count: number;
  created_at: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  link?: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface CategoryProgress {
  category: string;
  score: number;
  total_tasks: number;
}

export interface DashboardStats {
  total_students: number;
  active_assignments: number;
  pending_reviews: number;
  completed_today: number;
  average_score: number;
  completion_rate: number;
  late_submissions: number;
}
