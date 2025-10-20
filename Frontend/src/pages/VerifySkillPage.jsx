import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from "axios";
import { useAccount } from 'wagmi';
import { Timer } from 'lucide-react';

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };
const robotoStyle = { fontFamily: 'Roboto, sans-serif' };

function VerifySkillPage() {
  const navigate = useNavigate();
  const { isConnected, address } = useAccount();
  const { skill } = useParams();

  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const totalTime = 1200;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  const total = questions.length;
  const progress = ((current + 1) / total) * 100;

  // Fetch Questions
  useEffect(() => {
    let t;
    if (!isConnected) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      t = setTimeout(() => navigate('/'), 1600);
    } else if (address) {
      setNotice(null);
      getQuizQuestions();
    }
    return () => clearTimeout(t);
  }, [isConnected, navigate, address]);

  async function getQuizQuestions() {
    try {
      const response = await axios.post("http://localhost:5000/fetch-questions", {
        address,
        skill,
      });
      if (response.data.success) {
        setQuestions(response.data.questions);
      } else {
        console.log("Next attempt after 24hrs");
      }
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }



  // TIMER: auto-submit after 1200 seconds
  useEffect(() => {
    if (isLoading || isSubmitted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit(); // ✅ Auto submit when time runs out
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitted, questions.length]);

  // ✅ Auto Submit Handler
  const handleAutoSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    try {
      const res = await axios.post("http://localhost:5000/submit-quiz", {
        address,
        skill,
        answers,
        autoSubmitted: true, // optional flag for backend to know it was auto-submitted
      });

      if (res.data.success) {
        setScore(res.data.score || 0);
        setNotice("⏰ Time’s up! Quiz auto-submitted.");
        setRedNotice(false);
      } else {
        setNotice("⚠️ Failed to submit quiz automatically.");
        setRedNotice(true);
      }
    } catch (err) {
      console.error("Auto submit error:", err);
      setNotice("⚠️ Error while submitting automatically.");
      setRedNotice(true);
    }
  };



  const handleAnswerSelect = (index, option) => {
    setAnswers((prev) => ({
      ...prev,
      [index]: option,
    }));
  };

  const nextQuestion = () => {
    if (current < total - 1) {
      setCurrent((prev) => prev + 1);
      setTimeLeft(120); // reset timer for next question
    }
  };

  const prevQuestion = () => {
    if (current > 0) {
      setCurrent((prev) => prev - 1);
      setTimeLeft(120);
    }
  };

  // Submit Quiz
  const handleSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    try {
      const res = await axios.post("http://localhost:5000/submit-quiz", {
        address,
        skill,
        answers,
      });


    } catch (err) {
      console.log(err);
    }
  };



  return (
    <>
      {notice && (
        <div className="fixed top-4 right-4 z-50 animate-pulse">
          <div className={`flex items-center gap-3 text-white px-4 py-2 rounded shadow-lg border ${redNotice ? 'bg-red-600 border-red-700' : 'bg-[#14a19f] border-[#1ecac7]/30'}`}>
            <div className="text-sm">{notice}</div>
            <button
              onClick={() => setNotice(null)}
              className="ml-2 text-xs text-white/90 px-2 py-1 rounded hover:opacity-90 transition-opacity"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      <div className="dark:bg-[#0f111d] pt-6 space-y-4 flex flex-col bg-[#161c32] overflow-hidden relative min-h-screen">
        {/* Background gradients */}
        <div className="pointer-events-none absolute -left-32 -top-32 w-[520px] h-[520px] rounded-full bg-gradient-to-br from-[#122033] via-[#0f2540] to-[#08101a] opacity-40 blur-3xl mix-blend-screen"></div>
        <div className="pointer-events-none absolute right-[-120px] top-48 w-[420px] h-[420px] rounded-full bg-gradient-to-br from-[#142e2b] via-[#112a3f] to-[#0b1320] opacity-30 blur-2xl mix-blend-screen"></div>

        {/* Title */}
        <div className="flex justify-center border-white/10">
          <h1 style={orbitronStyle} className="text-3xl font-extrabold text-white">
            {skill} Skill Verification Quiz
          </h1>
        </div>

        <div className="flex p-4 gap-6 w-full">
          {/* LEFT SECTION */}
          {isLoading ? (
            <div className="w-[65%] flex flex-col space-y-4 min-h-[580px] animate-pulse">
              {/* Header Placeholder */}
              <div className="w-full flex justify-between">
                <div className="h-4 w-32 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded"></div>
                <div className="h-4 w-24 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded"></div>
              </div>

              {/* Progress Bar Placeholder */}
              <div className="w-full bg-[#0f111d] rounded-full h-2 overflow-hidden border border-[#1a2537]">
                <div className="h-full w-[30%] bg-gradient-to-r from-[#14a19f]/30 to-[#1ecac7]/30"></div>
              </div>

              {/* Question Box Skeleton */}
              <div className="dark:bg-[#0f111d] bg-transparent border dark:border-[#1a2537] border-white/10 rounded-xl shadow-md flex flex-col justify-between h-full">
                {/* Header */}
                <div className="flex justify-between items-center w-full px-4 py-2 mb-3">
                  <div className="h-6 w-20 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded-full"></div>
                  <div className="h-6 w-16 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded-full"></div>
                  <div className="h-6 w-20 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded-full"></div>
                </div>

                {/* Question */}
                <div className="px-4 py-2">
                  <div className="h-5 w-[90%] bg-gradient-to-r from-[#14a19f]/15 to-[#1ecac7]/15 rounded mb-2"></div>
                  <div className="h-5 w-[70%] bg-gradient-to-r from-[#14a19f]/15 to-[#1ecac7]/15 rounded"></div>
                </div>

                {/* Options */}
                <div className="mt-4 flex flex-col space-y-3 px-4 pb-6">
                  {[...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-12 w-full rounded-lg bg-gradient-to-r from-[#14a19f]/10 to-[#1ecac7]/10 border dark:border-[#1a2537] border-white/10"
                    ></div>
                  ))}
                </div>

                {/* Buttons */}
                <div className="mt-auto flex justify-between flex-row-reverse px-4 pb-4">
                  <div className="h-10 w-24 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded-md"></div>
                  <div className="h-10 w-24 bg-gradient-to-r from-[#14a19f]/20 to-[#1ecac7]/20 rounded-md"></div>
                </div>
              </div>
            </div>
          ) : isSubmitted ? (
            <div>
              Total Score is 22
            </div>
          ) : (

            <div className="w-[65%] flex flex-col space-y-4 min-h-[580px]">
              {/* Progress */}
              <div style={orbitronStyle} className="w-full text-md font-semibold text-gray-300 flex justify-between">
                <p>Question {current + 1} of {total}</p>
                <p>{Math.round(progress)}% Complete</p>
              </div>

              <div className="w-full dark:bg-[#0a0f1b] bg-[#0f111d] rounded-full h-2 overflow-hidden border border-[#1a2537]">
                <div
                  className="bg-gradient-to-r from-[#14a19f] to-[#1ecac7] h-full transition-all duration-500 relative"
                  style={{ width: `${progress}%` }}
                >
                  <div className="absolute inset-0 bg-[#14a19f]/10 animate-pulse"></div>
                </div>
              </div>

              {/* Question Box */}
              <div
                style={orbitronStyle}
                className="dark:bg-[#0f111d] bg-transparent dark:text-[#e5e5e5] text-white/10 p-4 text-xl font-semibold rounded-xl border dark:border-[#1a2537] border-white/10 shadow-md flex flex-col justify-between h-full"
              >
                {/* Header */}
                <div className="flex justify-between items-center w-full px-4 py-2 mb-3 rounded-xl bg-transparent dark:bg-[#0f111d] border border-[#1a2537]">
                  <span className="bg-gradient-to-r from-[#14a19f] to-[#1ecac7] dark:text-[#081220] text-white font-bold px-3 py-1 rounded-full text-[15px] tracking-wide">
                    {questions[current].points} points
                  </span>
                  <span className="flex items-center gap-2 text-[15px] text-white dark:text-[#1ecac7]">
                    <Timer className="w-5 h-5 text-[#1ecac7]" />
                    <p className="font-semibold">{formatTime(timeLeft)}</p>
                  </span>
                  <span className="px-3 py-1 rounded-md text-[15px] font-semibold bg-[#0a1629] text-white dark:text-[#1ecac7] border dark:border-[#1a2537] border-white/10">
                    {questions[current].difficulty}
                  </span>
                </div>

                {/* Question */}
                <div className="p-2 mt-2">
                  <p className="text-[20px] font-semibold leading-relaxed text-[#cfd9e2]">
                    {questions[current].question}
                  </p>
                </div>

                {/* Options */}
                <div className="mt-4 flex flex-col space-y-3">
                  {questions[current].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(current, opt)}
                      className={`w-full text-left px-4 py-3 rounded-lg transition-all border
              ${answers[current] === opt
                          ? "bg-gradient-to-r from-[#14a19f]/30 to-[#1ecac7]/30 border-[#1ecac7]"
                          : "bg-transparent hover:bg-gradient-to-r hover:from-[#14a19f]/10 hover:to-[#1ecac7]/10 border-white/10 text-[#bfc9d6]"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                {/* Navigation */}
                <div className="mt-6 flex justify-between">
                  {current > 0 && (
                    <button
                      onClick={prevQuestion}
                      className="px-6 py-2 rounded-md border border-[#1a2537] hover:bg-gradient-to-r hover:from-[#14a19f]/10 hover:to-[#1ecac7]/10 transition-all text-[#bfc9d6]"
                    >
                      Previous
                    </button>
                  )}

                  {current < total - 1 ? (
                    <button
                      onClick={nextQuestion}
                      className="ml-auto px-6 py-2 rounded-md bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-[#081220] font-semibold hover:opacity-90 transition-all"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      className="ml-auto px-6 py-2 rounded-md bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-[#081220] font-semibold hover:opacity-90 transition-all"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT SECTION */}
          <div className="w-[30%] bg-transparent dark:bg-[#0f111d] rounded-xl border dark:border-[#1a2537] border-white/10 p-4 space-y-3 min-h-[580px]">
            <h2 style={orbitronStyle} className="text-[#1ecac7] text-lg font-semibold mb-2">
              Progress Overview
            </h2>

            <ul className="text-[#bfc9d6] space-y-2 text-sm">
              <li className="flex justify-between">
                <span>Completed:</span>
                <span className="text-[#1ecac7]">{Object.keys(answers).length} / {total}</span>
              </li>
              <li className="flex justify-between">
                <span>Current Skill:</span>
                <span className="text-[#14a19f]">{skill}</span>
              </li>
              <li className="flex justify-between">
                <span>Level:</span>
                <span className="text-[#1ecac7]">Intermediate</span>
              </li>
            </ul>

            <div className="mt-4 border-t border-[#1a2537] pt-3">
              <p className="text-[#9aa8b6] text-sm">
                Answer all questions correctly to mint your Skill Badge (SBT)!
              </p>
            </div>
          </div>
        </div >
      </div >
    </>
  );
}

export default VerifySkillPage;
