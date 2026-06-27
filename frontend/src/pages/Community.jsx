import { useEffect, useMemo, useState } from 'react';
import {
  answerCommunityQuestion,
  createCommunityQuestion,
  getCommunityQuestions,
  replyToCommunityAnswer,
  upvoteCommunityAnswer,
} from '../api/auth';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(value));
};

function Community() {
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState([]);
  const [openCreate, setOpenCreate] = useState(false);
  const [expanded, setExpanded] = useState({});
  const [answerDrafts, setAnswerDrafts] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [questionForm, setQuestionForm] = useState({ title: '', body: '', tags: '' });

  const stats = useMemo(() => {
    const answers = questions.reduce((sum, question) => sum + question.answers.length, 0);
    const replies = questions.reduce((sum, question) => (
      sum + question.answers.reduce((answerSum, answer) => answerSum + answer.replies.length, 0)
    ), 0);
    return { questions: questions.length, answers, replies };
  }, [questions]);

  const loadQuestions = async () => {
    const response = await getCommunityQuestions(token);
    setQuestions(response.data);
  };

  useEffect(() => {
    loadQuestions().catch(() => setError('Unable to load community hub'));
  }, [token]);

  const replaceQuestion = (updatedQuestion) => {
    setQuestions((current) => current.map((question) => (
      question._id === updatedQuestion._id ? updatedQuestion : question
    )));
  };

  const submitQuestion = async (event) => {
    event.preventDefault();
    setError('');
    setMessage('');

    try {
      const response = await createCommunityQuestion(questionForm, token);
      setQuestions((current) => [response.data, ...current]);
      setQuestionForm({ title: '', body: '', tags: '' });
      setOpenCreate(false);
      setMessage('Question posted to the hub.');
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to create question');
    }
  };

  const submitAnswer = async (questionId) => {
    const body = answerDrafts[questionId]?.trim();
    if (!body) return;

    try {
      const response = await answerCommunityQuestion(questionId, { body }, token);
      replaceQuestion(response.data);
      setAnswerDrafts({ ...answerDrafts, [questionId]: '' });
      setExpanded({ ...expanded, [questionId]: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add answer');
    }
  };

  const submitReply = async (questionId, answerId) => {
    const body = replyDrafts[answerId]?.trim();
    if (!body) return;

    try {
      const response = await replyToCommunityAnswer(answerId, { body }, token);
      replaceQuestion(response.data);
      setReplyDrafts({ ...replyDrafts, [answerId]: '' });
      setExpanded({ ...expanded, [questionId]: true, [answerId]: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to add reply');
    }
  };

  const toggleUpvote = async (answerId) => {
    try {
      const response = await upvoteCommunityAnswer(answerId, token);
      replaceQuestion(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update upvote');
    }
  };

  return (
    <div className='space-y-8'>
      <section className='panel'>
        <div className='lg:flex lg:items-end lg:justify-between lg:gap-8'>
          <div className='max-w-3xl'>
            <p className='section-label'>Community knowledge hub</p>
            <h1 className='mt-3 section-heading'>Ask sharper questions. Share practical answers.</h1>
            <p className='mt-4 section-copy'>A living Q&A space for lessons, trade ideas, and lightweight mentorship notes from the SkillBarter community.</p>
          </div>
          <button onClick={() => setOpenCreate(true)} className='button-primary mt-4 lg:mt-0'>
            Ask question
          </button>
        </div>
      </section>

      <div className='grid gap-4 sm:grid-cols-3'>
        {[
          ['Questions', stats.questions],
          ['Answers', stats.answers],
          ['Replies', stats.replies],
        ].map(([label, value]) => (
          <div key={label} className='panel-compact'>
            <p className='text-sm text-slate-500'>{label}</p>
            <p className='mt-2 text-3xl font-semibold text-white'>{value}</p>
          </div>
        ))}
      </div>

      {error && <p className='rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200'>{error}</p>}
      {message && <p className='rounded-2xl bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200'>{message}</p>}

      <div className='space-y-5'>
        {questions.length ? questions.map((question) => {
          const questionOpen = expanded[question._id] ?? true;

          return (
            <article key={question._id} className='panel transition hover:border-cyan-300/30'>
              <div className='flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between'>
                <div className='min-w-0'>
                  <div className='flex flex-wrap items-center gap-2 text-xs text-slate-500'>
                    <span>{question.author?.username || 'Community member'}</span>
                    <span>|</span>
                    <span>{formatDate(question.createdAt)}</span>
                  </div>
                  <h2 className='mt-3 text-2xl font-semibold text-white'>{question.title}</h2>
                  <p className='mt-3 whitespace-pre-wrap text-slate-300'>{question.body}</p>
                  <div className='mt-4 flex flex-wrap gap-2'>
                    {question.tags.map((tag) => (
                      <span key={tag} className='chip'>{tag}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => setExpanded({ ...expanded, [question._id]: !questionOpen })} className='button-secondary'>
                  {questionOpen ? 'Collapse' : `${question.answers.length} answers`}
                </button>
              </div>

              {questionOpen && (
                <div className='mt-6 space-y-4'>
                  <div className='card-muted'>
                    <textarea
                      value={answerDrafts[question._id] || ''}
                      onChange={(event) => setAnswerDrafts({ ...answerDrafts, [question._id]: event.target.value })}
                      rows='3'
                      placeholder='Share an answer, resource, or lesson plan...'
                      className='textarea-field'
                    />
                    <div className='mt-3 flex justify-end'>
                      <button onClick={() => submitAnswer(question._id)} className='button-primary'>
                        Add answer
                      </button>
                    </div>
                  </div>

                  {question.answers.length ? question.answers.map((answer) => {
                    const repliesOpen = expanded[answer._id] ?? answer.replies.length <= 2;
                    const upvoted = answer.upvotes.some((upvoteUser) => String(upvoteUser) === String(user?._id));

                    return (
                      <div key={answer._id} className='card-muted'>
                        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
                          <div>
                            <p className='text-sm font-semibold text-white'>{answer.author?.username || 'Member'}</p>
                            <p className='mt-1 text-xs text-slate-500'>{formatDate(answer.createdAt)}</p>
                          </div>
                          <button onClick={() => toggleUpvote(answer._id)} className={`rounded-full px-3 py-2 text-sm font-semibold transition ${upvoted ? 'bg-cyan-400 text-slate-950' : 'bg-white/10 text-slate-200 hover:bg-white/15'}`}>
                            Upvote {answer.upvotes.length}
                          </button>
                        </div>
                        <p className='mt-3 whitespace-pre-wrap text-slate-200'>{answer.body}</p>

                        <div className='mt-4 border-l border-white/10 pl-4'>
                          <button onClick={() => setExpanded({ ...expanded, [answer._id]: !repliesOpen })} className='text-sm font-semibold text-cyan-200 hover:text-cyan-100'>
                            {repliesOpen ? 'Hide replies' : `Show ${answer.replies.length} replies`}
                          </button>
                          {repliesOpen && (
                            <div className='mt-3 space-y-3'>
                              {answer.replies.map((reply) => (
                                <div key={reply._id} className='rounded-2xl bg-slate-950/80 p-3'>
                                  <p className='text-sm font-semibold text-white'>{reply.author?.username || 'Member'}</p>
                                  <p className='mt-1 text-sm text-slate-300'>{reply.body}</p>
                                  <p className='mt-2 text-xs text-slate-600'>{formatDate(reply.createdAt)}</p>
                                </div>
                              ))}
                              <div className='flex flex-col gap-2 sm:flex-row'>
                                <input
                                  value={replyDrafts[answer._id] || ''}
                                  onChange={(event) => setReplyDrafts({ ...replyDrafts, [answer._id]: event.target.value })}
                                  placeholder='Reply to this answer'
                                  className='input-field'
                                />
                                <button onClick={() => submitReply(question._id, answer._id)} className='button-secondary'>
                                  Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }) : (
                    <p className='rounded-2xl bg-slate-900/70 p-4 text-sm text-slate-500'>No answers yet. Be the first to help.</p>
                  )}
                </div>
              )}
            </article>
          );
        }) : (
          <div className='rounded-3xl border border-white/10 bg-slate-950/80 p-8 text-center text-slate-400'>
            No questions yet. Start the knowledge hub with a practical question.
          </div>
        )}
      </div>

      {openCreate && (
        <div className='dialog-overlay'>
          <form onSubmit={submitQuestion} className='w-full max-w-2xl panel'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='section-label text-cyan-200'>New question</p>
                <h2 className='mt-2 text-2xl font-semibold text-white'>Ask the community</h2>
              </div>
              <button type='button' onClick={() => setOpenCreate(false)} className='rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5'>
                Close
              </button>
            </div>
            <label className='mt-5 block'>
              <span className='text-sm text-slate-300'>Title</span>
              <input
                value={questionForm.title}
                onChange={(event) => setQuestionForm({ ...questionForm, title: event.target.value })}
                required
                placeholder='How do I structure a first React lesson?'
                className='input-field mt-2'
              />
            </label>
            <label className='mt-4 block'>
              <span className='text-sm text-slate-300'>Details</span>
              <textarea
                value={questionForm.body}
                onChange={(event) => setQuestionForm({ ...questionForm, body: event.target.value })}
                required
                rows='5'
                className='textarea-field mt-2'
              />
            </label>
            <label className='mt-4 block'>
              <span className='text-sm text-slate-300'>Tags</span>
              <input
                value={questionForm.tags}
                onChange={(event) => setQuestionForm({ ...questionForm, tags: event.target.value })}
                placeholder='React, mentoring, beginner'
                className='input-field mt-2'
              />
            </label>
            <button className='button-primary w-full mt-5'>
              Publish question
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Community;
