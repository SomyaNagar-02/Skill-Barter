import { useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import {
  apiBaseUrl,
  completeSession,
  getChatRequests,
  getConversations,
  getMe,
  getMessages,
  respondToChatRequest,
  startSession,
} from '../api/auth';
import { getToken } from '../utils/auth';

const formatTime = (value) => {
  if (!value) return '';
  return new Intl.DateTimeFormat('en', {
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    day: 'numeric',
  }).format(new Date(value));
};

const partnerIdFromMessage = (message, currentUserId) => {
  const senderId = message.sender?._id || message.sender;
  const recipientId = message.recipient?._id || message.recipient;
  return String(senderId) === String(currentUserId) ? String(recipientId) : String(senderId);
};

function Chat() {
  const [profile, setProfile] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [requests, setRequests] = useState({ incoming: [], outgoing: [] });
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [draft, setDraft] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [activeTab, setActiveTab] = useState('inbox');
  const [error, setError] = useState('');
  const [completeOpen, setCompleteOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const socketRef = useRef(null);
  const bottomRef = useRef(null);

  const token = useMemo(() => getToken(), []);

  const refreshConversations = async () => {
    const response = await getConversations(token);
    setConversations(response.data);
    return response.data;
  };

  const refreshRequests = async () => {
    const response = await getChatRequests(token);
    setRequests(response.data);
  };

  useEffect(() => {
    const loadChat = async () => {
      try {
        const [meResponse, conversationResponse, requestResponse] = await Promise.all([
          getMe(token),
          getConversations(token),
          getChatRequests(token),
        ]);
        setProfile(meResponse.data);
        setConversations(conversationResponse.data);
        setRequests(requestResponse.data);
        if (conversationResponse.data[0]) {
          setSelectedUser(conversationResponse.data[0].user);
        }
      } catch (err) {
        setError('Unable to load chat workspace');
      }
    };

    loadChat();
  }, [token]);

  useEffect(() => {
    if (!token) return undefined;

    const socket = io(apiBaseUrl, { auth: { token } });
    socketRef.current = socket;

    socket.on('chat:message', (message) => {
      setMessages((current) => {
        const exists = current.some((item) => item._id === message._id);
        const belongsToSelected = selectedUser && partnerIdFromMessage(message, profile?._id) === String(selectedUser._id);
        if (exists) return current;
        return belongsToSelected ? [...current, message] : current;
      });
      refreshConversations().catch(() => {});
    });
    socket.on('chat:request', () => refreshRequests().catch(() => {}));
    socket.on('chat:request-updated', () => {
      refreshRequests().catch(() => {});
      refreshConversations().catch(() => {});
    });

    return () => socket.disconnect();
  }, [profile?._id, selectedUser, token]);

  useEffect(() => {
    const loadMessages = async () => {
      if (!selectedUser) {
        setMessages([]);
        return;
      }
      try {
        const response = await getMessages(selectedUser._id, token);
        setMessages(response.data);
      } catch (err) {
        setError('Unable to load messages');
      }
    };

    loadMessages();
  }, [selectedUser, token]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 1500000) {
      setError('Please choose a file under 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: reader.result,
      });
    };
    reader.readAsDataURL(file);
  };

  const sendMessage = async (event) => {
    event.preventDefault();
    if (!selectedUser || (!draft.trim() && !attachment)) return;

    socketRef.current?.emit('chat:send', {
      recipientId: selectedUser._id,
      text: draft.trim(),
      attachment,
    }, (response) => {
      if (!response?.ok) {
        setError(response?.message || 'Unable to send message');
      }
    });
    setDraft('');
    setAttachment(null);
  };

  const handleRequestAction = async (request, action) => {
    try {
      await respondToChatRequest(request._id, action, token);
      await refreshRequests();
      const nextConversations = await refreshConversations();
      if (action === 'accept') {
        const conversation = nextConversations.find((item) => String(item.user._id) === String(request.from._id));
        setSelectedUser(conversation?.user || request.from);
        setActiveTab('inbox');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to update request');
    }
  };

  const startVideoSession = async () => {
    if (!selectedUser) return;
    const meetWindow = window.open('about:blank', '_blank');
    try {
      const response = await startSession({ userId: selectedUser._id }, token);
      if (meetWindow) {
        meetWindow.location.href = response.data.session.meetUrl;
      } else {
        window.location.href = response.data.session.meetUrl;
      }
    } catch (err) {
      meetWindow?.close();
      setError(err.response?.data?.message || 'Unable to start video session');
    }
  };

  const submitCompletion = async (event) => {
    event.preventDefault();
    if (!selectedUser) return;
    try {
      await completeSession({ userId: selectedUser._id, rating }, token);
      const response = await getMe(token);
      setProfile(response.data);
      setCompleteOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to complete session');
    }
  };

  const pendingIncoming = requests.incoming.filter((request) => request.status === 'pending');
  const pendingOutgoing = requests.outgoing.filter((request) => request.status === 'pending');

  return (
    <div className='space-y-6'>
      <section className='panel'>
        <div className='flex flex-col gap-5 md:flex-row md:items-center md:justify-between'>
          <div>
            <p className='section-label'>Workspace</p>
            <h1 className='mt-3 text-3xl font-semibold text-white'>Skill chat</h1>
            <p className='mt-2 section-copy'>Learners spend 100 credits per completed session. Teachers earn 100 credits when a session is completed.</p>
          </div>
          <div className='rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm text-slate-300'>
            Credits: <span className='font-semibold text-white'>{profile?.credits ?? '...'}</span>
          </div>
          <div className='flex rounded-2xl border border-white/10 bg-slate-900 p-1'>
            {['inbox', 'requests'].map((tab) => (
              <button
                key={tab}
                type='button'
                onClick={() => setActiveTab(tab)}
                className={`relative rounded-xl px-4 py-2 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-cyan-400 text-slate-950' : 'text-slate-300 hover:bg-white/5'}`}
              >
                {tab}
                {tab === 'requests' && pendingIncoming.length > 0 && (
                  <span className='absolute -right-2 -top-2 flex h-5 min-w-[1.25rem] items-center justify-center rounded-full bg-rose-500 px-1.5 text-[11px] font-semibold text-white'>
                    {pendingIncoming.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </section>

      {error && <p className='rounded-2xl bg-red-500/10 px-4 py-3 text-sm text-red-200'>{error}</p>}

      <div className='grid min-h-[680px] gap-6 lg:grid-cols-[340px_1fr]'>
        <aside className='panel-compact'>
          {activeTab === 'inbox' ? (
            <div className='space-y-4'>
              <h2 className='section-label'>Conversations</h2>
              {conversations.length ? conversations.map((conversation) => (
                <button
                  key={conversation.user._id}
                  type='button'
                  onClick={() => setSelectedUser(conversation.user)}
                  className={`w-full rounded-2xl p-4 text-left transition ${selectedUser?._id === conversation.user._id ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900/80 text-slate-200 hover:bg-white/10'}`}
                >
                  <div className='flex items-center gap-3'>
                    <div className='flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 font-bold'>
                      {conversation.user.username?.slice(0, 2).toUpperCase() || 'SV'}
                    </div>
                    <div className='min-w-0'>
                      <p className='truncate font-semibold'>{conversation.user.username}</p>
                      <p className='truncate text-sm opacity-75'>{conversation.lastMessage?.text || conversation.lastMessage?.attachment?.name || 'Ready to chat'}</p>
                    </div>
                  </div>
                </button>
              )) : (
                <p className='card-muted text-sm text-slate-400'>No conversations yet. Accept a request to begin.</p>
              )}
            </div>
          ) : (
            <div className='space-y-5'>
              <div>
                <h2 className='section-label'>Pending requests</h2>
                <div className='mt-3 space-y-3'>
                  {pendingIncoming.length ? pendingIncoming.map((request) => (
                    <div key={request._id} className='card-muted'>
                      <p className='font-semibold text-white'>{request.from.username}</p>
                      <p className='mt-1 text-sm text-cyan-100'>{request.skill || 'Skill session'}</p>
                      <p className='mt-2 text-sm text-slate-400'>{request.message || 'No message included.'}</p>
                      <div className='mt-4 grid grid-cols-2 gap-2'>
                        <button type='button' onClick={() => handleRequestAction(request, 'accept')} className='button-primary'>
                          Accept
                        </button>
                        <button type='button' onClick={() => handleRequestAction(request, 'reject')} className='button-secondary'>
                          Reject
                        </button>
                      </div>
                    </div>
                  )) : (
                    <p className='card-muted text-sm text-slate-400'>No pending incoming requests.</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className='section-label'>Sent</h3>
                <div className='mt-3 space-y-3'>
                  {pendingOutgoing.length ? pendingOutgoing.map((request) => (
                    <div key={request._id} className='card-muted text-sm text-slate-300'>
                      <p className='font-semibold text-white'>{request.to.username}</p>
                      <p className='mt-1'>{request.skill || 'Skill session'}</p>
                      <p className='mt-2 text-slate-500'>Waiting for response</p>
                    </div>
                  )) : (
                    <p className='card-muted text-sm text-slate-400'>No outgoing requests waiting.</p>
                  )}
                </div>
              </div>
            </div>
          )}
        </aside>

        <section className='panel flex min-h-[680px] flex-col overflow-hidden'>
          {selectedUser ? (
            <>
              <header className='flex flex-col gap-4 border-b border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between'>
                <div className='flex items-center gap-3'>
                  <div className='flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-400 to-fuchsia-400 font-bold text-slate-950'>
                    {selectedUser.username?.slice(0, 2).toUpperCase() || 'SV'}
                  </div>
                  <div>
                    <h2 className='text-xl font-semibold text-white'>{selectedUser.username}</h2>
                    <p className='text-sm text-slate-500'>{selectedUser.ratings || 0} rating</p>
                  </div>
                </div>
                <div className='flex flex-wrap gap-2'>
                  <button type='button' onClick={startVideoSession} className='button-primary'>
                    Video session
                  </button>
                  <button type='button' onClick={() => setCompleteOpen(true)} className='button-secondary'>
                    Complete
                  </button>
                </div>
              </header>

              <div className='flex-1 overflow-y-auto p-5 space-y-4'>
                {messages.length ? messages.map((message) => {
                  const mine = String(message.sender?._id || message.sender) === String(profile?._id);

                  return (
                    <div key={message._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] rounded-3xl px-4 py-3 sm:max-w-[70%] ${mine ? 'bg-cyan-400 text-slate-950' : 'bg-slate-900 text-slate-100'}`}>
                        <p className='text-xs font-semibold opacity-70'>{mine ? 'You' : message.sender?.username}</p>
                        {message.text && <p className='mt-1 whitespace-pre-wrap break-words'>{message.text}</p>}
                        {message.meetingUrl && (
                          <a href={message.meetingUrl} target='_blank' rel='noreferrer' className='mt-2 block break-all text-sm font-semibold underline'>
                            {message.meetingUrl}
                          </a>
                        )}
                        {message.attachment?.dataUrl && (
                          <a href={message.attachment.dataUrl} download={message.attachment.name} className='mt-2 block rounded-2xl bg-white/15 px-3 py-2 text-sm font-semibold'>
                            {message.attachment.name}
                          </a>
                        )}
                        <p className='mt-2 text-right text-[11px] opacity-60'>{formatTime(message.createdAt)}</p>
                      </div>
                    </div>
                  );
                }) : (
                  <div className='flex h-full items-center justify-center text-center text-slate-500'>
                    Send the first message to start this skill trade.
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              <form onSubmit={sendMessage} className='border-t border-white/10 p-4'>
                {attachment && (
                  <div className='mb-3 flex items-center justify-between gap-3 rounded-2xl bg-slate-900 px-4 py-3 text-sm text-slate-200'>
                    <span className='truncate'>{attachment.name}</span>
                    <button type='button' onClick={() => setAttachment(null)} className='text-slate-400 hover:text-white'>Remove</button>
                  </div>
                )}
                <div className='flex flex-col gap-3 sm:flex-row'>
                  <label className='cursor-pointer rounded-2xl border border-white/10 px-4 py-3 text-center text-sm font-semibold text-slate-200 hover:bg-white/5'>
                    File
                    <input type='file' onChange={handleFileChange} className='hidden' />
                  </label>
                  <input
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder='Write a message'
                    className='input-field'
                  />
                  <button className='button-primary'>
                    Send
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className='flex flex-1 items-center justify-center p-8 text-center text-slate-500'>
              Select a conversation or accept a request to open chat.
            </div>
          )}
        </section>
      </div>

      {completeOpen && (
        <div className='dialog-overlay'>
          <form onSubmit={submitCompletion} className='w-full max-w-md panel'>
            <div className='flex items-start justify-between gap-4'>
              <div>
                <p className='section-label text-cyan-200'>Complete session</p>
                <h2 className='mt-2 text-2xl font-semibold text-white'>Rate {selectedUser?.username}</h2>
                <p className='mt-2 section-copy'>Completion transfers 100 credits from learner to teacher.</p>
              </div>
              <button type='button' onClick={() => setCompleteOpen(false)} className='rounded-full border border-white/10 px-3 py-2 text-sm text-slate-300 hover:bg-white/5'>
                Close
              </button>
            </div>
            <label className='mt-5 block'>
              <span className='text-sm text-slate-300'>Rating</span>
              <input
                type='range'
                min='1'
                max='5'
                value={rating}
                onChange={(event) => setRating(Number(event.target.value))}
                className='mt-4 w-full accent-cyan-400'
              />
            </label>
            <p className='mt-3 text-center text-4xl font-semibold text-white'>{rating}/5</p>
            <button className='button-primary w-full mt-5'>
              Complete session
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

export default Chat;
