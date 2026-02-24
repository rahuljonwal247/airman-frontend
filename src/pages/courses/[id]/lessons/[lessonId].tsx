import { useRouter } from 'next/router';
import { useQuery, useMutation } from '@tanstack/react-query';
import Layout from '../../../../components/Layout';
import { withAuth } from '../../../../components/withAuth';
import api from '../../../../lib/api';
import toast from 'react-hot-toast';
import { useState } from 'react';
import Link from 'next/link';

function LessonPage() {
  const router = useRouter();
  const { id: courseId, lessonId } = router.query;
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [submitted, setSubmitted] = useState(false);
  const [result, setResult] = useState<any>(null);

  const { data: lessonData, isLoading } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: () => api.get(`/courses/${courseId}/modules/dummy/lessons/${lessonId}`).then(r => r.data.data),
    enabled: !!lessonId && !!courseId,
    retry: false,
  });

  const { data: quizData } = useQuery({
    queryKey: ['quiz', lessonData?.quiz?.id],
    queryFn: () => api.get(`/quizzes/${lessonData?.quiz?.id}`).then(r => r.data.data),
    enabled: !!lessonData?.quiz?.id,
  });

  const submitMutation = useMutation({
    mutationFn: (payload: any) => api.post(`/quizzes/${lessonData?.quiz?.id}/attempts`, payload),
    onSuccess: (res) => {
      setResult(res.data.data);
      setSubmitted(true);
      toast.success(`Quiz submitted! Score: ${res.data.data.score.toFixed(0)}%`);
    },
    onError: (err: any) => toast.error(err?.response?.data?.error?.message || 'Submission failed'),
  });

  const handleSubmitQuiz = () => {
    const answerList = Object.entries(answers).map(([questionId, selectedAnswer]) => ({
      questionId,
      selectedAnswer,
    }));
    submitMutation.mutate({ answers: answerList });
  };

  if (isLoading) return <Layout title="Lesson"><div className="animate-pulse p-8">Loading...</div></Layout>;

  const lesson = lessonData;
  const quiz = quizData;

  return (
    <Layout title={lesson?.title || 'Lesson'}>
      <div className="max-w-3xl mx-auto space-y-6">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Link href={`/courses/${courseId}`} className="hover:text-blue-600">← Back to course</Link>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-2xl">{lesson?.type === 'QUIZ' ? '📝' : '📄'}</span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">{lesson?.title}</h1>
              <span className="text-xs text-slate-400 uppercase">{lesson?.type}</span>
            </div>
          </div>

          {/* Text lesson */}
          {lesson?.type === 'TEXT' && lesson?.content && (
            <div className="prose prose-slate max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
              {lesson.content}
            </div>
          )}

          {/* Quiz */}
          {lesson?.type === 'QUIZ' && quiz && (
            <div className="space-y-6 mt-4">
              {submitted && result ? (
                <div className={`p-4 rounded-lg text-center ${result.score >= 70 ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                  <div className="text-3xl font-bold mb-1" style={{ color: result.score >= 70 ? '#15803d' : '#b45309' }}>
                    {result.score.toFixed(0)}%
                  </div>
                  <div className="text-sm text-slate-600">
                    {result.earnedPoints} of {result.totalPoints} correct
                  </div>
                  {result.score >= 70 ? (
                    <p className="text-green-700 mt-2 font-medium">✅ Passed!</p>
                  ) : (
                    <p className="text-amber-700 mt-2">Review and try again.</p>
                  )}

                  {result.incorrectQuestions?.length > 0 && (
                    <div className="mt-4 text-left space-y-2">
                      <p className="text-sm font-medium text-slate-700">Questions to review:</p>
                      {result.incorrectQuestions.map((q: any) => (
                        <div key={q.questionId} className="text-sm bg-white p-3 rounded border border-amber-100">
                          <p className="font-medium text-slate-700">{q.questionText}</p>
                          <p className="text-red-500 text-xs mt-1">
                            Your answer: {quiz?.questions?.find((qq: any) => qq.id === q.questionId)?.options?.[q.yourAnswer]}
                          </p>
                          <p className="text-green-600 text-xs">
                            Correct: {quiz?.questions?.find((qq: any) => qq.id === q.questionId)?.options?.[q.correctAnswer]}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}

                  <button onClick={() => { setSubmitted(false); setAnswers({}); setResult(null); }} className="btn-secondary mt-4">
                    Retake Quiz
                  </button>
                </div>
              ) : (
                <>
                  {quiz.questions?.map((q: any, i: number) => (
                    <div key={q.id} className="space-y-3">
                      <p className="font-medium text-slate-800">{i + 1}. {q.text}</p>
                      <div className="space-y-2">
                        {q.options?.map((opt: string, idx: number) => (
                          <label key={idx}
                            className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors
                              ${answers[q.id] === idx ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <input
                              type="radio"
                              name={q.id}
                              value={idx}
                              checked={answers[q.id] === idx}
                              onChange={() => setAnswers(a => ({ ...a, [q.id]: idx }))}
                              className="text-blue-600"
                            />
                            <span className="text-sm text-slate-700">{opt}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}

                  {quiz.questions?.length > 0 && (
                    <button
                      onClick={handleSubmitQuiz}
                      disabled={Object.keys(answers).length < quiz.questions?.length || submitMutation.isPending}
                      className="btn-primary w-full"
                    >
                      {submitMutation.isPending ? 'Submitting...' : 'Submit Quiz'}
                    </button>
                  )}

                  {quiz.questions?.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No questions added yet.</p>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

export default withAuth(LessonPage);
