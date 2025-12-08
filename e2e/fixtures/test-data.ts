/**
 * Test data fixtures for E2E tests
 */

export const testUsers = {
  validUser: {
    email: process.env.TEST_USER_EMAIL || 'test@campusmind.com',
    password: process.env.TEST_USER_PASSWORD || 'testpassword123',
    name: 'Test User',
  },
  invalidUser: {
    email: 'invalid@example.com',
    password: 'wrongpassword',
  },
  newUser: {
    email: `newuser-${Date.now()}@example.com`,
    password: 'newpassword123',
    name: 'New Test User',
  },
};

export const testDecks = {
  basicDeck: {
    name: 'E2E Test Deck',
    description: 'Deck created by E2E tests',
    color: '#4F46E5',
  },
  fullDeck: {
    name: 'Complete Test Deck',
    description: 'Deck with cards for testing',
    color: '#10B981',
    cards: [
      { front: 'What is 2 + 2?', back: '4' },
      { front: 'Capital of France?', back: 'Paris' },
      { front: 'H2O is?', back: 'Water' },
      { front: 'Largest planet?', back: 'Jupiter' },
      { front: 'Speed of light?', back: '299,792,458 m/s' },
    ],
  },
};

export const testQuizzes = {
  basicQuiz: {
    title: 'E2E Test Quiz',
    description: 'Quiz created by E2E tests',
    passingScore: 70,
  },
  fullQuiz: {
    title: 'Complete Test Quiz',
    description: 'Quiz with questions for testing',
    passingScore: 60,
    timeLimit: 600, // 10 minutes
    questions: [
      {
        text: 'What is the capital of France?',
        type: 'multiple_choice',
        options: ['London', 'Paris', 'Berlin', 'Madrid'],
        correctAnswer: 1,
      },
      {
        text: 'Which planet is known as the Red Planet?',
        type: 'multiple_choice',
        options: ['Venus', 'Mars', 'Jupiter', 'Saturn'],
        correctAnswer: 1,
      },
      {
        text: 'The Earth is flat.',
        type: 'true_false',
        correctAnswer: false,
      },
      {
        text: 'Explain the water cycle.',
        type: 'essay',
        rubric: 'Should mention evaporation, condensation, precipitation',
      },
    ],
  },
};

export const testSubjects = {
  basicSubject: {
    name: 'E2E Test Subject',
    description: 'Subject for E2E testing',
    color: '#8B5CF6',
  },
};

/**
 * Generate unique test data to avoid conflicts
 */
export function generateUniqueTestData() {
  const timestamp = Date.now();
  return {
    user: {
      email: `e2e-test-${timestamp}@example.com`,
      password: `testpass-${timestamp}`,
      name: `E2E User ${timestamp}`,
    },
    deck: {
      name: `E2E Deck ${timestamp}`,
      description: `Test deck created at ${new Date(timestamp).toISOString()}`,
    },
    quiz: {
      title: `E2E Quiz ${timestamp}`,
      description: `Test quiz created at ${new Date(timestamp).toISOString()}`,
    },
  };
}
