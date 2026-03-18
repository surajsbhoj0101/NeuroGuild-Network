import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api.js"
import { useAccount } from 'wagmi';
import { CheckCircle2, Circle, Timer, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import NoticeToast from "../../components/NoticeToast";
import { useAuth } from "../../contexts/AuthContext.jsx";

const orbitronStyle = { fontFamily: 'Orbitron, sans-serif' };

function VerifySkillPage() {
  const navigate = useNavigate();
  const { address } = useAccount();
  const { isAuthentication } = useAuth();
  const { skill } = useParams();
  console.log(skill)
  const [notice, setNotice] = useState(null);
  const [redNotice, setRedNotice] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [current, setCurrent] = useState(0);

  const totalTime = 130;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isPassed, setIsPassed] = useState(false);
  const [quizId, setQuizId] = useState(null);

  const total = questions.length;
  const progress = ((current + 1) / total) * 100;

  const answersRef = useRef({}); // always contains latest answers

  // Fetch Questions
  useEffect(() => {
    let t;
    if (!isAuthentication) {
      setRedNotice(true);
      setNotice("Wallet not connected — redirecting to home...");
      t = setTimeout(() => navigate('/'), 1600);
    } else if (address) {
      setNotice(null);
      getQuizQuestions();
    }
    return () => clearTimeout(t);
  }, [isAuthentication, navigate, address]);

  async function getQuizQuestions() {
  
    try {
      const response = await api.get("/api/freelancer/fetch-questions");

      if (response.data.success) {
        setQuestions(response.data.questions);
        setQuizId(response.data.quizId);
        setIsLoading(false);
      }
    } catch (error) {
      const message = error.response?.data?.message?.trim();
      switch (message) {
        case 'You can attempt this skill only once every 24 hours.':
          setRedNotice(true);
          setNotice(message);
          setTimeout(() => navigate('/'), 2000);
          break;
        case 'You already passed this quiz.':
          setRedNotice(false);
          setNotice('You already passed this quiz — mint your SBT now');
          setIsPassed(true);
          setIsSubmitted(true);
          break;
        default:
          setRedNotice(true);
          setNotice('Something went wrong.');
      }
    }
  }

  // Timer
  useEffect(() => {
    if (isLoading || isSubmitted || questions.length === 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isLoading, isSubmitted, questions.length]);

  const handleAnswerSelect = (index, option) => {
    if (isSubmitted) return; // disable after submit
    const letter = option.trim().charAt(0);
    setAnswers((prev) => {
      const updated = { ...prev, [index]: letter };
      answersRef.current = updated; // update ref immediately
      return updated;
    });
  };

  const handleAutoSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    await submitQuiz(answersRef.current);
  };

  const handleSubmit = async () => {
    if (isSubmitted) return;
    setIsSubmitted(true);

    // Check for unanswered questions
    const unanswered = questions.filter((_, idx) => !answers[idx]);
    if (unanswered.length > 0) {
      setRedNotice(true);
      setNotice(`You have ${unanswered.length} unanswered questions`);
      setIsSubmitted(false);
      return;
    }

    await submitQuiz(answers);
  };

  const submitQuiz = async (finalAnswers) => {
    try {
      const res = await api.post("/api/freelancer/submit-quiz", {
        address,
        skill,
        answers: finalAnswers,
        quizId: quizId
      });

      if (res.data.isPassed && res.data.isWhiteListed) {
        setIsPassed(true);
        setRedNotice(false);
        setNotice(" Congratulations! You passed the quiz and WhiteListed");
      } else {
        setIsPassed(false);
        setRedNotice(true);
        setNotice(" You did not pass the quiz or not able to WhiteListed");
      }
    } catch (err) {
      console.error("Submit error:", err);
      setRedNotice(true);
      setNotice("Error submitting quiz");
    }
  };

  const nextQuestion = () => {
    if (current < total - 1) setCurrent((prev) => prev + 1);
  };

  const prevQuestion = () => {
    if (current > 0) setCurrent((prev) => prev - 1);
  };

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  return (
    <>
      <NoticeToast
        message={notice}
        isError={redNotice}
        onClose={() => setNotice(null)}
      />

      {/* Pass / Fail Overlay */}
      {isSubmitted && isPassed !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-gradient-to-br from-[#0d1620] via-[#0a0f1a] to-[#0d1620] border border-[#14a19f]/30 rounded-2xl p-8 md:p-10 w-full max-w-md mx-4 text-center space-y-6 shadow-2xl shadow-[#14a19f]/20">
            {isPassed ? (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-[#14a19f] to-[#1ecac7] mx-auto">
                  <Award size={32} className="text-[#081220]" />
                </div>
                <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-[#14a19f] to-[#1ecac7]">
                  Congratulations!
                </h2>
                <p className="text-gray-300 text-sm leading-6">
                  You passed the <span className="font-semibold text-[#8ff6f3]">{skill}</span> assessment! Your Skill Badge is now pending council review for SBT issuance.
                </p>
                <button
                  onClick={() => navigate(`/mint-sbt/${skill}`)}
                  className="w-full mt-2 px-6 py-3 bg-gradient-to-r from-[#14a19f] to-[#1ecac7] text-[#081220] font-semibold rounded-lg hover:opacity-90 transition-all"
                >
                  View Mint Status
                </button>
              </>
            ) : (
              <>
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/20 border border-red-500/40 mx-auto">
                  <span className="text-2xl">✕</span>
                </div>
                <h2 className="text-3xl font-bold text-red-400">
                  Assessment Not Passed
                </h2>
                <p className="text-gray-300 text-sm leading-6">
                  You didn't pass the {skill} assessment this time. You can try again after 24 hours. Keep practicing!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="w-full mt-2 px-6 py-3 bg-[#14a19f]/20 border border-[#14a19f]/40 text-[#8ff6f3] font-semibold rounded-lg hover:bg-[#14a19f]/30 transition-all"
                >
                  Return Home
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#0f1724] min-h-screen overflow-x-hidden">
        <div className="border-b border-[#14a19f]/20 bg-gradient-to-r from-[#0b111b] via-[#0f1724] to-[#0b111b] backdrop-blur-sm">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-6">
            <div>
              <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-[#14a19f]/30 bg-[#14a19f]/10 text-[#7df3f0] text-[10px] tracking-wider uppercase mb-2">
                <Award size={12} />
                Skill Assessment
              </div>
              <h1 style={orbitronStyle} className="text-2xl md:text-3xl font-bold text-white">
                {skill} Verification
              </h1>
            </div>
            <div className={`flex items-center gap-2.5 border rounded-lg px-4 py-2.5 ${timeLeft <= 30 ? 'border-red-500/50 bg-red-500/10' : 'border-[#14a19f]/30 bg-[#14a19f]/10'}`}>
              <Timer className={`h-4 w-4 ${timeLeft <= 30 ? 'text-red-400' : 'text-[#1ecac7]'}`} />
              <span className={`text-sm font-semibold ${timeLeft <= 30 ? 'text-red-300' : 'text-white'}`}>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
          {/* LEFT SECTION */}
          {isLoading ? (
            <div className="min-h-[640px] flex-1 animate-pulse space-y-4">
              <div className="flex w-full justify-between">
                <div className="h-5 w-40 bg-white/8 rounded"></div>
                <div className="h-5 w-28 bg-white/8 rounded"></div>
              </div>
              <div className="h-2.5 w-full border border-white/8 bg-white/5 rounded">
                <div className="h-full w-[30%] bg-[#14a19f]/30"></div>
              </div>
              <div className="flex h-full min-h-[560px] flex-col justify-between border border-white/10 bg-[#0d1620] rounded-2xl p-6">
                <div className="mb-4 flex w-full justify-between">
                  <div className="h-6 w-24 bg-white/8 rounded"></div>
                  <div className="h-6 w-20 bg-white/8 rounded"></div>
                </div>
                <div className="px-2 py-3">
                  <div className="mb-3 h-6 w-[85%] bg-white/8 rounded"></div>
                  <div className="h-6 w-[65%] bg-white/8 rounded"></div>
                </div>
                <div className="mt-6 flex flex-col space-y-3 px-2">
                  {[...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-12 w-full border border-white/8 bg-white/5 rounded-lg"
                    />
                  ))}
                </div>
                <div className="mt-auto flex justify-between px-2 pt-6">
                  <div className="h-10 w-28 bg-white/8 rounded"></div>
                  <div className="h-10 w-28 bg-white/8 rounded"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[640px] flex-1 space-y-4">
              <div
                style={orbitronStyle}
                className="flex w-full justify-between text-sm font-semibold text-gray-300"
              >
                <p>
                  Question <span className="text-[#14a19f]">{current + 1}</span> of {total}
                </p>
                <p className="text-[#7df3f0]">{Math.round(progress)}% Complete</p>
              </div>
              <div className="h-2.5 w-full overflow-hidden border border-[#14a19f]/20 bg-[#0b111b] rounded-full">
                <div
                  className="relative h-full bg-gradient-to-r from-[#14a19f] to-[#1ecac7] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div
                style={orbitronStyle}
                className="flex min-h-[560px] flex-col justify-between border border-[#14a19f]/20 bg-gradient-to-br from-[#0d1620] via-[#0a0f1a] to-[#0d1620] rounded-2xl p-6 text-white shadow-lg shadow-[#14a19f]/5"
              >
                <div className="mb-4 flex items-center justify-between border border-[#14a19f]/15 bg-[#14a19f]/5 rounded-lg px-4 py-3">
                  <span className="inline-flex items-center gap-2 bg-gradient-to-r from-[#14a19f] to-[#1ecac7] px-3 py-1.5 text-[12px] font-bold tracking-wide text-[#081220] rounded">
                    🏆 {questions[current].points} points
                  </span>
                  <span className="px-3 py-1.5 text-[12px] font-semibold capitalize bg-[#0b111b] border border-white/10 text-[#8ff6f3] rounded">
                    {questions[current].difficulty}
                  </span>
                </div>

                <div className="mt-2 p-2">
                  <p className="text-[18px] md:text-[20px] font-semibold leading-relaxed text-[#e0e7ff]">
                    {questions[current].question}
                  </p>
                </div>

                <div className="mt-6 flex flex-col space-y-3">
                  {questions[current].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(current, opt)}
                      disabled={isSubmitted}
                      className={`w-full border rounded-lg px-4 py-3.5 text-left text-sm font-medium transition-all ${
                        answers[current] === opt.charAt(0)
                          ? "border-[#14a19f] bg-[#14a19f]/15 text-white shadow-lg shadow-[#14a19f]/20"
                          : "border-white/10 bg-[#0b111b] text-[#bfc9d6] hover:border-[#14a19f]/40 hover:bg-[#14a19f]/8"
                        }`}
                    >
                      <span className="text-[#7df3f0] font-bold mr-2">{opt.charAt(0)}.</span>
                      {opt.slice(1)}
                    </button>
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-between">
                  {current > 0 && (
                    <button
                      onClick={prevQuestion}
                      disabled={isSubmitted}
                      className="flex items-center justify-center gap-2 border border-[#14a19f]/30 bg-[#14a19f]/10 px-5 py-2.5 rounded-lg text-sm font-semibold text-[#8ff6f3] transition-all hover:bg-[#14a19f]/20 disabled:opacity-50"
                    >
                      <ChevronLeft size={16} />
                      Previous
                    </button>
                  )}
                  {current < total - 1 ? (
                    <button
                      onClick={nextQuestion}
                      disabled={isSubmitted}
                      className="flex items-center justify-center gap-2 ml-auto bg-gradient-to-r from-[#14a19f] to-[#1ecac7] px-5 py-2.5 rounded-lg text-sm font-semibold text-[#081220] transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight size={16} />
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitted}
                      className="ml-auto bg-gradient-to-r from-[#14a19f] to-[#1ecac7] px-6 py-2.5 rounded-lg text-sm font-semibold text-[#081220] transition-all hover:opacity-90 disabled:opacity-50"
                    >
                      Submit Quiz
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT SECTION */}
          <div className="hidden w-[340px] shrink-0 border border-[#14a19f]/20 bg-gradient-to-br from-[#0d1620] via-[#0a0f1a] to-[#0d1620] rounded-2xl p-5 lg:flex flex-col shadow-lg shadow-[#14a19f]/5">
            <div className="border-b border-[#14a19f]/15 pb-4">
              <h2 style={orbitronStyle} className="text-sm font-bold text-white">
                Assessment Navigator
              </h2>
              <p className="mt-2 text-xs leading-5 text-gray-400">
                Track answered questions and navigate through the assessment.
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-4 border-b border-[#14a19f]/15 pb-5">
              <div className="bg-[#0b111b] border border-[#14a19f]/10 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 font-bold">Answered</p>
                <p className="mt-2 text-2xl font-bold text-[#14a19f]">
                  {Object.keys(answers).length}/{total}
                </p>
              </div>
              <div className="bg-[#0b111b] border border-[#14a19f]/10 rounded-lg p-3">
                <p className="text-[10px] uppercase tracking-[0.12em] text-gray-500 font-bold">Skill</p>
                <p className="mt-2 text-sm font-bold text-[#8ff6f3] truncate">{skill}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-2 max-h-[360px] overflow-y-auto">
              {questions.map((question, index) => {
                const answered = !!answers[index];
                const active = current === index;

                return (
                  <button
                    key={`${question.question}-${index}`}
                    onClick={() => setCurrent(index)}
                    disabled={isSubmitted}
                    className={`w-full flex items-start gap-3 border rounded-lg px-3 py-3 text-left transition-all ${
                      active
                        ? "border-[#14a19f]/40 bg-[#14a19f]/12 shadow-lg shadow-[#14a19f]/10"
                        : "border-white/8 bg-[#0b111b] hover:border-[#14a19f]/25 hover:bg-[#14a19f]/5"
                    }`}
                  >
                    <div className={`pt-0.5 shrink-0 ${answered ? 'text-[#14a19f]' : 'text-gray-600'}`}>
                      {answered ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white">Q{index + 1}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-4 text-gray-400">
                        {question.question}
                      </p>
                    </div>
                    <span className="text-[11px] font-semibold text-[#7df3f0] shrink-0">{question.points}pt</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border-t border-[#14a19f]/15 pt-3">
              <p className="text-xs leading-5 text-gray-400">
                ✓ Answer all questions before submitting. Council will review your answers for skill verification.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default VerifySkillPage;
