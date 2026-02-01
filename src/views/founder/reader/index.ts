// Main course components
export { default } from './CLRSCourse';
export { default as CLRSCourse } from './CLRSCourse';

// New canvas-based course viewer (tldraw)
export { default as CourseViewer } from './CourseViewer';

// Legacy reader (deprecated, kept for reference)
export { default as CLRSReader } from './CLRSReader';

// Hooks
export { default as useLearningItems } from './hooks/useLearningItems';
export type { LearningItem, SM2Quality } from './hooks/useLearningItems';

// Legacy chapter data (deprecated)
export { CLRS_CHAPTERS, CLRS_PARTS, getChapterById } from './data/chapters';
export type { CLRSChapter, CLRSSection } from './data/chapters';

// Course Components
export { default as ModuleNav } from './components/ModuleNav';
export { default as LessonContent } from './components/LessonContent';
export { default as QuizView } from './components/QuizView';
export { default as CourseSelector } from './components/CourseSelector';

