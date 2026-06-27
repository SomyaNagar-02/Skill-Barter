import { API_URL, authHeaders, client } from './client';

export const signup = (data) => client.post('/auth/signup', data);
export const signin = (data) => client.post('/auth/signin', data);
export const getMe = (token) => client.get('/auth/me', authHeaders(token));
export const updateProfile = (data, token) => client.put('/auth/update', data, authHeaders(token));
export const getMatches = (params, token) => client.get('/match', {
  params,
  ...authHeaders(token),
});
export const sendChatRequest = (data, token) => client.post('/chat/request', data, authHeaders(token));
export const getChatRequests = (token) => client.get('/chat/requests', authHeaders(token));
export const respondToChatRequest = (id, action, token) => client.post(`/chat/request/${id}/${action}`, {}, authHeaders(token));
export const getConversations = (token) => client.get('/chat/conversations', authHeaders(token));
export const getMessages = (userId, token) => client.get(`/chat/${userId}`, authHeaders(token));
export const startSession = (data, token) => client.post('/chat/start-session', data, authHeaders(token));
export const completeSession = (data, token) => client.post('/chat/complete-session', data, authHeaders(token));
export const createCommunityQuestion = (data, token) => client.post('/community/create', data, authHeaders(token));
export const getCommunityQuestions = (token) => client.get('/community/all', authHeaders(token));
export const answerCommunityQuestion = (questionId, data, token) => client.post(`/community/answer/${questionId}`, data, authHeaders(token));
export const replyToCommunityAnswer = (answerId, data, token) => client.post(`/community/reply/${answerId}`, data, authHeaders(token));
export const upvoteCommunityAnswer = (answerId, token) => client.post(`/community/upvote/${answerId}`, {}, authHeaders(token));
export const apiBaseUrl = API_URL;
