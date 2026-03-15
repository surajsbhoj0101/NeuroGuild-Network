import { useState, useRef, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from "../../utils/api.js"
import { useAccount } from 'wagmi';
import { CheckCircle2, Circle, Timer } from 'lucide-react';
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
      const response = await api.get("http://localhost:5000/api/freelancer/fetch-questions");

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
      const res = await api.post("http://localhost:5000/api/freelancer/submit-quiz", {
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f111d] border border-[#1a2537] rounded-xl p-8 w-[400px] text-center space-y-4 shadow-lg">
            {isPassed ? (
              <>
                <h2 className="text-2xl font-bold text-[#14a19f]"> Congratulations!</h2>
                <p className="text-white/80">
                  You passed the {skill} quiz. Your Skill Badge will be minted by council after review.
                </p>
                <button
                  onClick={() => navigate(`/mint-sbt/${skill}`)}
                  className="mt-4 px-6 py-2 bg-linear-to-r from-[#14a19f] to-[#1ecac7] text-[#081220] font-semibold rounded-md hover:opacity-90 transition-all"
                >
                  View Status
                </button>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-red-600"> Quiz Failed</h2>
                <p className="text-white/80">
                  You didn’t pass the {skill} quiz. Try again later!
                </p>
                <button
                  onClick={() => navigate("/")}
                  className="mt-4 px-6 py-2 bg-linear-to-r from-[#14a19f] to-[#1ecac7] text-[#081220] font-semibold rounded-md hover:opacity-90 transition-all"
                >
                  Go Home
                </button>
              </>
            )}
          </div>
        </div>
      )}

      <div className="bg-[#0f1724] min-h-screen">
        <div className="border-b border-white/8 bg-[#0b111b]">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
            <div>
              <p className="text-[11px] uppercase tracking-[0.18em] text-gray-500">
                Skill Assessment
              </p>
              <h1 style={orbitronStyle} className="mt-1 text-xl font-semibold text-white">
                {skill} Verification Quiz
              </h1>
            </div>
            <div className="flex items-center gap-2 border border-white/10 bg-white/5 px-3 py-2">
              <Timer className="h-4 w-4 text-[#1ecac7]" />
              <span className="text-sm font-medium text-white">{formatTime(timeLeft)}</span>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl gap-4 px-4 py-4 md:px-6">
          {/* LEFT SECTION */}
          {isLoading ? (
            <div className="min-h-[620px] flex-1 animate-pulse space-y-4">
              <div className="flex w-full justify-between">
                <div className="h-4 w-32 bg-white/8"></div>
                <div className="h-4 w-24 bg-white/8"></div>
              </div>
              <div className="h-2 w-full border border-white/8 bg-white/5">
                <div className="h-full w-[30%] bg-[#14a19f]/30"></div>
              </div>
              <div className="flex h-full min-h-[540px] flex-col justify-between border border-white/10 bg-[#101827] p-4">
                <div className="mb-3 flex w-full justify-between">
                  <div className="h-6 w-20 bg-white/8"></div>
                  <div className="h-6 w-16 bg-white/8"></div>
                  <div className="h-6 w-20 bg-white/8"></div>
                </div>
                <div className="px-4 py-2">
                  <div className="mb-2 h-5 w-[90%] bg-white/8"></div>
                  <div className="h-5 w-[70%] bg-white/8"></div>
                </div>
                <div className="mt-4 flex flex-col space-y-3 px-4 pb-6">
                  {[...Array(4)].map((_, idx) => (
                    <div
                      key={idx}
                      className="h-12 w-full border border-white/8 bg-white/5"
                    />
                  ))}
                </div>
                <div className="mt-auto flex justify-between flex-row-reverse px-4 pb-4">
                  <div className="h-10 w-24 bg-white/8"></div>
                  <div className="h-10 w-24 bg-white/8"></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="min-h-[620px] flex-1 space-y-4">
              <div
                style={orbitronStyle}
                className="flex w-full justify-between text-sm font-semibold text-gray-300"
              >
                <p>
                  Question {current + 1} of {total}
                </p>
                <p>{Math.round(progress)}% Complete</p>
              </div>
              <div className="h-2 w-full overflow-hidden border border-white/10 bg-[#0b111b]">
                <div
                  className="relative h-full bg-[#14a19f] transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>

              <div
                style={orbitronStyle}
                className="flex min-h-[540px] flex-col justify-between border border-white/10 bg-[#101827] p-4 text-white"
              >
                <div className="mb-3 flex items-center justify-between border border-white/10 bg-[#0b111b] px-4 py-2">
                  <span className="bg-[#14a19f] px-3 py-1 text-[13px] font-bold tracking-wide text-[#081220]">
                    {questions[current].points} points
                  </span>
                  <span className="px-3 py-1 text-[13px] font-semibold capitalize text-[#8ff6f3]">
                    {questions[current].difficulty}
                  </span>
                </div>

                <div className="mt-1 p-1">
                  <p className="text-[19px] font-semibold leading-relaxed text-[#d7dee8]">
                    {questions[current].question}
                  </p>
                </div>

                <div className="mt-4 flex flex-col space-y-2">
                  {questions[current].options.map((opt, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswerSelect(current, opt)}
                      disabled={isSubmitted}
                      className={`w-full border px-4 py-3 text-left text-sm transition-all ${
                        answers[current] === opt.charAt(0)
                          ? "border-[#14a19f] bg-[#14a19f]/12 text-white"
                          : "border-white/10 bg-[#0b111b] text-[#bfc9d6] hover:border-white/20 hover:bg-white/5"
                        }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>

                <div className="mt-6 flex justify-between">
                  {current > 0 && (
                    <button
                      onClick={prevQuestion}
                      disabled={isSubmitted}
                      className="border border-white/10 px-6 py-2 text-sm text-[#bfc9d6] transition-colors hover:bg-white/5"
                    >
                      Previous
                    </button>
                  )}
                  {current < total - 1 ? (
                    <button
                      onClick={nextQuestion}
                      disabled={isSubmitted}
                      className="ml-auto bg-[#14a19f] px-6 py-2 text-sm font-semibold text-[#081220] transition-colors hover:bg-[#1ecac7]"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleSubmit}
                      disabled={isSubmitted}
                      className="ml-auto bg-[#14a19f] px-6 py-2 text-sm font-semibold text-[#081220] transition-colors hover:bg-[#1ecac7]"
                    >
                      Submit
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* RIGHT SECTION */}
          <div className="hidden w-[320px] shrink-0 border border-white/10 bg-[#101827] p-4 lg:block">
            <div className="border-b border-white/8 pb-3">
              <h2 style={orbitronStyle} className="text-sm font-semibold text-white">
                Assessment Navigator
              </h2>
              <p className="mt-1 text-xs leading-5 text-gray-400">
                Track answered questions and move through the quiz with less guesswork.
              </p>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 border-b border-white/8 pb-4 text-sm text-[#bfc9d6]">
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Completed</p>
                <p className="mt-1 text-lg font-semibold text-white">
                  {Object.keys(answers).length}/{total}
                </p>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-[0.14em] text-gray-500">Skill</p>
                <p className="mt-1 text-sm font-semibold text-[#8ff6f3]">{skill}</p>
              </div>
            </div>

            <div className="mt-4 space-y-2">
              {questions.map((question, index) => {
                const answered = !!answers[index];
                const active = current === index;

                return (
                  <button
                    key={`${question.question}-${index}`}
                    onClick={() => setCurrent(index)}
                    disabled={isSubmitted}
                    className={`grid w-full grid-cols-[18px_1fr_auto] items-start gap-3 border px-3 py-3 text-left transition-colors ${
                      active
                        ? "border-[#14a19f]/40 bg-[#14a19f]/10"
                        : "border-white/8 bg-[#0b111b] hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <div className="pt-0.5 text-[#8ff6f3]">
                      {answered ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    </div>
                    <div>
                      <p className="text-xs font-medium text-white">Question {index + 1}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-gray-400">
                        {question.question}
                      </p>
                    </div>
                    <span className="text-[11px] text-gray-500">{question.points}pt</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 border-t border-white/8 pt-4">
              <p className="text-xs leading-6 text-gray-400">
                Passing this assessment moves your skill into council review for SBT issuance. Answer every question before submitting.
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default VerifySkillPage;
