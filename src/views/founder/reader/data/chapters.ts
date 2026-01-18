/**
 * CLRS Chapter Data
 * Introduction to Algorithms, 4th Edition
 */

export interface CLRSChapter {
  id: string;
  number: number;
  title: string;
  part: number;
  partTitle: string;
  sections: CLRSSection[];
  exercises: number;    // Count of exercises
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedHours: number;
  keyTopics: string[];
}

export interface CLRSSection {
  id: string;
  number: string;
  title: string;
}

export const CLRS_CHAPTERS: CLRSChapter[] = [
  // Part I: Foundations
  {
    id: 'clrs_ch1',
    number: 1,
    title: 'The Role of Algorithms in Computing',
    part: 1,
    partTitle: 'Foundations',
    sections: [
      { id: 'clrs_1.1', number: '1.1', title: 'Algorithms' },
      { id: 'clrs_1.2', number: '1.2', title: 'Algorithms as a technology' }
    ],
    exercises: 6,
    difficulty: 'beginner',
    estimatedHours: 2,
    keyTopics: ['What is an algorithm', 'Efficiency', 'Technology']
  },
  {
    id: 'clrs_ch2',
    number: 2,
    title: 'Getting Started',
    part: 1,
    partTitle: 'Foundations',
    sections: [
      { id: 'clrs_2.1', number: '2.1', title: 'Insertion sort' },
      { id: 'clrs_2.2', number: '2.2', title: 'Analyzing algorithms' },
      { id: 'clrs_2.3', number: '2.3', title: 'Designing algorithms' }
    ],
    exercises: 12,
    difficulty: 'beginner',
    estimatedHours: 4,
    keyTopics: ['Insertion sort', 'Loop invariants', 'Merge sort', 'Divide and conquer']
  },
  {
    id: 'clrs_ch3',
    number: 3,
    title: 'Characterizing Running Times',
    part: 1,
    partTitle: 'Foundations',
    sections: [
      { id: 'clrs_3.1', number: '3.1', title: 'O-notation, Ω-notation, and Θ-notation' },
      { id: 'clrs_3.2', number: '3.2', title: 'Asymptotic notation: formal definitions' },
      { id: 'clrs_3.3', number: '3.3', title: 'Standard notations and common functions' }
    ],
    exercises: 10,
    difficulty: 'intermediate',
    estimatedHours: 5,
    keyTopics: ['Big-O', 'Big-Omega', 'Big-Theta', 'Asymptotic analysis']
  },
  {
    id: 'clrs_ch4',
    number: 4,
    title: 'Divide-and-Conquer',
    part: 1,
    partTitle: 'Foundations',
    sections: [
      { id: 'clrs_4.1', number: '4.1', title: 'Multiplying square matrices' },
      { id: 'clrs_4.2', number: '4.2', title: 'Strassen\'s algorithm' },
      { id: 'clrs_4.3', number: '4.3', title: 'Substitution method' },
      { id: 'clrs_4.4', number: '4.4', title: 'Recursion-tree method' },
      { id: 'clrs_4.5', number: '4.5', title: 'Master method' }
    ],
    exercises: 18,
    difficulty: 'intermediate',
    estimatedHours: 8,
    keyTopics: ['Divide and conquer', 'Strassen', 'Recurrences', 'Master theorem']
  },
  {
    id: 'clrs_ch5',
    number: 5,
    title: 'Probabilistic Analysis and Randomized Algorithms',
    part: 1,
    partTitle: 'Foundations',
    sections: [
      { id: 'clrs_5.1', number: '5.1', title: 'Hiring problem' },
      { id: 'clrs_5.2', number: '5.2', title: 'Indicator random variables' },
      { id: 'clrs_5.3', number: '5.3', title: 'Randomized algorithms' }
    ],
    exercises: 10,
    difficulty: 'intermediate',
    estimatedHours: 4,
    keyTopics: ['Probability', 'Expected value', 'Randomization']
  },

  // Part II: Sorting and Order Statistics
  {
    id: 'clrs_ch6',
    number: 6,
    title: 'Heapsort',
    part: 2,
    partTitle: 'Sorting and Order Statistics',
    sections: [
      { id: 'clrs_6.1', number: '6.1', title: 'Heaps' },
      { id: 'clrs_6.2', number: '6.2', title: 'Maintaining the heap property' },
      { id: 'clrs_6.3', number: '6.3', title: 'Building a heap' },
      { id: 'clrs_6.4', number: '6.4', title: 'The heapsort algorithm' },
      { id: 'clrs_6.5', number: '6.5', title: 'Priority queues' }
    ],
    exercises: 15,
    difficulty: 'intermediate',
    estimatedHours: 5,
    keyTopics: ['Binary heap', 'Heapsort', 'Priority queue']
  },
  {
    id: 'clrs_ch7',
    number: 7,
    title: 'Quicksort',
    part: 2,
    partTitle: 'Sorting and Order Statistics',
    sections: [
      { id: 'clrs_7.1', number: '7.1', title: 'Description of quicksort' },
      { id: 'clrs_7.2', number: '7.2', title: 'Performance of quicksort' },
      { id: 'clrs_7.3', number: '7.3', title: 'Randomized quicksort' },
      { id: 'clrs_7.4', number: '7.4', title: 'Analysis of quicksort' }
    ],
    exercises: 12,
    difficulty: 'intermediate',
    estimatedHours: 5,
    keyTopics: ['Quicksort', 'Partitioning', 'Randomized quicksort']
  },
  {
    id: 'clrs_ch8',
    number: 8,
    title: 'Sorting in Linear Time',
    part: 2,
    partTitle: 'Sorting and Order Statistics',
    sections: [
      { id: 'clrs_8.1', number: '8.1', title: 'Lower bounds for sorting' },
      { id: 'clrs_8.2', number: '8.2', title: 'Counting sort' },
      { id: 'clrs_8.3', number: '8.3', title: 'Radix sort' },
      { id: 'clrs_8.4', number: '8.4', title: 'Bucket sort' }
    ],
    exercises: 10,
    difficulty: 'intermediate',
    estimatedHours: 4,
    keyTopics: ['Lower bounds', 'Counting sort', 'Radix sort', 'Bucket sort']
  },
  {
    id: 'clrs_ch9',
    number: 9,
    title: 'Medians and Order Statistics',
    part: 2,
    partTitle: 'Sorting and Order Statistics',
    sections: [
      { id: 'clrs_9.1', number: '9.1', title: 'Minimum and maximum' },
      { id: 'clrs_9.2', number: '9.2', title: 'Selection in expected linear time' },
      { id: 'clrs_9.3', number: '9.3', title: 'Selection in worst-case linear time' }
    ],
    exercises: 8,
    difficulty: 'advanced',
    estimatedHours: 4,
    keyTopics: ['Selection', 'Median', 'Order statistics']
  }
];

// Group chapters by part
export const CLRS_PARTS = [
  {
    number: 1,
    title: 'Foundations',
    chapters: CLRS_CHAPTERS.filter(ch => ch.part === 1)
  },
  {
    number: 2,
    title: 'Sorting and Order Statistics',
    chapters: CLRS_CHAPTERS.filter(ch => ch.part === 2)
  }
];

// Helper to get chapter by ID
export function getChapterById(id: string): CLRSChapter | undefined {
  return CLRS_CHAPTERS.find(ch => ch.id === id);
}

// Helper to get next chapter
export function getNextChapter(currentId: string): CLRSChapter | undefined {
  const idx = CLRS_CHAPTERS.findIndex(ch => ch.id === currentId);
  return idx >= 0 && idx < CLRS_CHAPTERS.length - 1 ? CLRS_CHAPTERS[idx + 1] : undefined;
}

// Helper to get prev chapter
export function getPrevChapter(currentId: string): CLRSChapter | undefined {
  const idx = CLRS_CHAPTERS.findIndex(ch => ch.id === currentId);
  return idx > 0 ? CLRS_CHAPTERS[idx - 1] : undefined;
}

