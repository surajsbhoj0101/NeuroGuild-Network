import { useState, useEffect } from "react";
import { useAccount } from "wagmi";
import { useParams } from "react-router-dom";

// Icons
const CheckIcon = () => (
  <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);
const LockIcon = () => (
  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
  </svg>
);

// --- Sample Quiz Data (Replace with your API fetch if needed) ---
const quizData = {
  basic: {
    timeLimit: 180,
    passingScore: 2,
    questions: [
      {
        question: "What does 'blockchain' primarily refer to?",
        options: [
          "A type of cryptocurrency",
          "A distributed, immutable ledger",
          "A centralized database",
          "A financial services company"
        ],
        correctAnswer: "A distributed, immutable ledger"
      },
      {
        question: "What is a 'smart contract'?",
        options: [
          "A legal document written by a lawyer",
          "A digital agreement on a website",
          "A program that automatically executes on the blockchain",
          "A new type of AI"
        ],
        correctAnswer: "A program that automatically executes on the blockchain"
      }
    ]
  },
  medium: {
    timeLimit: 300,
    passingScore: 2,
    questions: [
      { question: "Medium Question 1...", options: ["A", "B"], correctAnswer: "A" },
      { question: "Medium Question 2...", options: ["A", "B"], correctAnswer: "B" }
    ]
  },
  advanced: {
    timeLimit: 600,
    passingScore: 2,
    questions: [
      { question: "Advanced Question 1...", options: ["A", "B"], correctAnswer: "A" },
      { question: "Advanced Question 2...", options: ["A", "B"], correctAnswer: "B" }
    ]
  },
  proof: { questions: null }
};

// --- Main Component ---
export default function VerifySkillPage() {
  const { skill } = useParams();
  const { isConnected } = useAccount();

  const [notice, setNotice] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState("basic");
  const [completionStatus, setCompletionStatus] = useState({
    basic: false, medium: false, advanced: false, proof: false
  });

  const [quizState, setQuizState] = useState("pending"); // 'pending', 'running', 'submitted'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [score, setScore] = useState(0);

  const orbitronStyle = { fontFamily: "Orbitron, sans-serif" };
  const robotoStyle = { fontFamily: "Roboto, sans-serif" };

  const quizCategories = [
    { id: 'basic', name: 'Basic Quiz', requires: null },
    { id: 'medium', name: 'Medium Quiz', requires: 'basic' },
    { id: 'advanced', name: 'Advanced Quiz', requires: 'medium' },
    { id: 'proof', name: 'Proof of Skill', requires: 'advanced' },
  ];

  useEffect(() => {
    if (!isConnected) {
      setNotice("Wallet not connected — redirecting...");
      const t = setTimeout(() => window.location.href = "/", 1800);
      return () => clearTimeout(t);
    } else setNotice(null);
  }, [isConnected]);

  useEffect(() => {
    if (quizState !== 'running') return;
    if (timeLeft <= 0) return handleSubmit();

    const timer = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(timer);
  }, [quizState, timeLeft]);

  const startQuiz = () => {
    const quiz = quizData[selectedQuiz];
    setQuizState('running');
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTimeLeft(quiz.timeLimit);
    setScore(0);
  };

  const handleAnswerSelect = (option) => {
    setSelectedAnswers({ ...selectedAnswers, [currentQuestionIndex]: option });
  };

  const handleNext = () => {
    if (currentQuestionIndex < quizData[selectedQuiz].questions.length - 1)
      setCurrentQuestionIndex(i => i + 1);
  };

  const handleSubmit = () => {
    const quiz = quizData[selectedQuiz];
    const totalScore = quiz.questions.reduce((acc, q, idx) => {
      return acc + (selectedAnswers[idx] === q.correctAnswer ? 1 : 0);
    }, 0);
    setScore(totalScore);
    setQuizState('submitted');
    setCompletionStatus(prev => ({ ...prev, [selectedQuiz]: true }));
  };

  const formatTime = (s) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;
  const isUnlocked = (category) => !category.requires || completionStatus[category.requires];

  const renderQuiz = () => {
    const quiz = quizData[selectedQuiz];

    if (selectedQuiz === "proof") {
      return (
        <div className="p-8 rounded-3xl shadow-xl bg-white dark:bg-[#0f121e] text-gray-900 dark:text-white">
          <h2 style={orbitronStyle} className="text-4xl font-bold mb-6">Proof of Skill</h2>
          <p style={robotoStyle} className="text-lg mb-4">
            Submit a GitHub repository, deployed dApp, or portfolio link to demonstrate your work.
          </p>
          {/* Upload or form component can go here */}
        </div>
      );
    }

    if (quizState === 'pending') {
      return (
        <div className="p-8 rounded-3xl shadow-xl text-center bg-white dark:bg-[#0f121e] text-gray-900 dark:text-white">
          <h2 style={orbitronStyle} className="text-4xl font-bold mb-6">{skill} - {quizCategories.find(c => c.id === selectedQuiz).name}</h2>
          <p style={robotoStyle} className="text-lg mb-4">
            Time: <span className="font-semibold">{formatTime(quiz.timeLimit)}</span>
          </p>
          <p style={robotoStyle} className="text-lg mb-4">
            Questions: <span className="font-semibold">{quiz.questions.length}</span>
          </p>
          <p style={robotoStyle} className="text-lg mb-6">
            Passing Score: <span className="font-semibold">{quiz.passingScore}</span>
          </p>
          <button onClick={startQuiz} className="bg-[#14a19f] px-14 py-4 text-xl rounded-xl font-semibold hover:opacity-90 transition">
            Start Quiz
          </button>
        </div>
      );
    }

    if (quizState === 'submitted') {
      const passed = score >= quiz.passingScore;
      return (
        <div className="p-8 rounded-3xl shadow-xl text-center bg-white dark:bg-[#0f121e] text-gray-900 dark:text-white">
          <h2 style={orbitronStyle} className="text-4xl font-bold mb-6">Quiz Complete!</h2>
          <p style={robotoStyle} className={`text-3xl mb-6 font-semibold ${passed ? 'text-green-500 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
            Score: {score} / {quiz.questions.length}
          </p>
          {passed ? <p style={robotoStyle} className="text-xl">Congratulations! You passed.</p> :
            <button onClick={startQuiz} className="bg-[#14a19f] px-12 py-3 text-xl rounded-xl mt-4 hover:opacity-90 transition">Retake Quiz</button>
          }
        </div>
      );
    }

    const q = quiz.questions[currentQuestionIndex];
    return (
      <div className="p-8 rounded-3xl shadow-xl space-y-6 bg-white dark:bg-[#0f121e] text-gray-900 dark:text-white">
        <div className="flex justify-between items-center mb-6">
          <h2 style={orbitronStyle} className="text-3xl font-bold">{quizCategories.find(c => c.id === selectedQuiz).name}</h2>
          <div style={orbitronStyle} className="text-3xl font-bold px-6 py-3 rounded-xl bg-gray-200 dark:bg-gray-800 border border-gray-400 dark:border-gray-600">{formatTime(timeLeft)}</div>
        </div>

        <div className="mb-6">
          <p style={robotoStyle} className="text-xl mb-2 font-medium">Question {currentQuestionIndex + 1} / {quiz.questions.length}</p>
          <h3 style={robotoStyle} className="text-2xl md:text-3xl font-semibold">{q.question}</h3>
        </div>

        <div className="space-y-4 mb-6">
          {q.options.map((opt, i) => (
            <button key={i} onClick={() => handleAnswerSelect(opt)}
              className={`w-full text-left p-5 rounded-xl border-2 text-lg md:text-xl transition-all
                ${selectedAnswers[currentQuestionIndex] === opt ? 'bg-[#14a19f] border-[#14a19f] text-white' : 'bg-gray-100 dark:bg-[#0f172a] border-gray-300 dark:border-[#1e293b] hover:border-[#14a19f]'}`}>
              {opt}
            </button>
          ))}
        </div>

        <div className="flex justify-end">
          {currentQuestionIndex < quiz.questions.length - 1 ?
            <button onClick={handleNext} className="bg-[#14a19f] px-8 py-3 rounded-xl text-xl hover:opacity-90 transition">Next</button> :
            <button onClick={handleSubmit} className="bg-green-600 px-8 py-3 rounded-xl text-xl hover:opacity-90 transition">Submit Quiz</button>
          }
        </div>
      </div>
    );
  };

  return (
    <>
      {notice && <div className="fixed top-4 right-4 z-50 px-4 py-2 rounded bg-[#14a19f] text-white">{notice}</div>}
      <div className="min-h-screen p-8 md:p-12 bg-gray-50 dark:bg-[#0f1422] text-gray-900 dark:text-white grid md:grid-cols-4 gap-8">
        {/* Sidebar */}
        <div className="md:col-span-1 p-6 bg-white dark:bg-[#0f121e] rounded-3xl shadow-lg flex flex-col">
          <h1 style={orbitronStyle} className="text-2xl font-bold mb-6 text-center">Skill Verification</h1>
          <ul className="space-y-3 flex-1">
            {quizCategories.map(cat => {
              const unlocked = isUnlocked(cat);
              const completed = completionStatus[cat.id];
              return (
                <li key={cat.id}>
                  <button disabled={!unlocked}
                    onClick={() => setSelectedQuiz(cat.id)}
                    className={`w-full flex justify-between items-center px-4 py-3 rounded-xl font-medium text-left transition
                      ${selectedQuiz === cat.id ? 'bg-[#14a19f] text-white' : 'bg-gray-100 dark:bg-[#0f172a] text-gray-900 dark:text-white'} 
                      ${!unlocked ? 'opacity-50 cursor-not-allowed' : 'hover:bg-[#14a19f] hover:text-white'}`}>
                    <span>{cat.name}</span>
                    {completed ? <CheckIcon /> : (!unlocked ? <LockIcon /> : null)}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
        {/* Main Panel */}
        <div className="md:col-span-3">{renderQuiz()}</div>
      </div>
    </>
  );
}
