# SkillBarter – Skill Exchange Platform

SkillBarter is a full-stack MERN application that connects people who want to **teach** and **learn** skills. Users can create profiles, discover others based on their skills, send session requests, chat in real time, conduct learning sessions, and participate in a community knowledge-sharing hub.

---

## 🚀 Features

### 🔐 Authentication
- User Signup & Login
- JWT-based Authentication
- Protected Routes
- Password Hashing using bcryptjs

### 👤 User Profile
- Create and update profile
- Add bio and personal details
- Manage teach and learn skills
- Credits and ratings system

### 🔍 Skill Matching
- Search users by username or skill
- Skill-based matching
- Sorted results based on ratings and credits

### 💬 Real-Time Chat
- One-to-one messaging using Socket.IO
- Send text messages
- Share attachments
- Share meeting links
- Persistent chat history

### 📚 Session Management
- Send teaching session requests
- Accept or reject requests
- Start video sessions
- Complete sessions with ratings
- Credit-based session access

### 🌍 Community Hub
- Ask questions
- Post answers
- Reply to answers
- Upvote helpful answers

---

# 🛠 Tech Stack

## Frontend
- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- Socket.IO
- bcryptjs

---

# 📂 Project Structure

```
SkillBarter
│
├── frontend
│   ├── src
│   ├── public
│   └── package.json
│
├── backend
│   ├── routes
│   ├── models
│   ├── middleware
│   ├── server.js
│   └── package.json
│
└── README.md
```

---

# 🗄 Database Models

### User
Stores:
- Username
- Email
- Password (hashed)
- Skills
- Teach Skills
- Learn Skills
- Credits
- Ratings

### Message
Stores:
- Sender
- Receiver
- Message
- Attachments
- Meeting Link

### ChatRequest
Stores:
- Sender
- Receiver
- Request Status
- Created At

### Session
Stores:
- Learner
- Teacher
- Meeting Link
- Rating
- Session Status

### CommunityQuestion
Stores:
- Question
- Answers
- Replies
- Upvotes

---

# 🔄 User Workflow

```text
Signup/Login
      ↓
Create Profile
      ↓
Search Users
      ↓
Send Session Request
      ↓
Accept Request
      ↓
Real-Time Chat
      ↓
Start Video Session
      ↓
Complete Session
      ↓
Give Rating
```

---

# 🔐 Authentication Flow

```text
User Login
      ↓
JWT Generated
      ↓
Token Sent to Frontend
      ↓
Stored in Local Storage
      ↓
Authorization Header
      ↓
JWT Middleware Verification
      ↓
Protected API Access
```

---

# 💬 Chat Flow

```text
User Sends Message
        ↓
Socket.IO Event
        ↓
Store in MongoDB
        ↓
Emit to Receiver
        ↓
Real-Time UI Update
```

---

# ⚙ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/SkillBarter.git
```

## Backend

```bash
cd backend
npm install
npm run dev
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 🔑 Environment Variables

## Backend (.env)

```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
CLIENT_URL=http://localhost:5173
```

## Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
```

---

# 📡 API Modules

- Authentication
- Profile
- Skill Matching
- Chat
- Session Management
- Community Hub

---

# 🚀 Future Improvements

- Google Meet API integration
- Cloud storage for attachments
- Push notifications
- Typing indicators
- Online/offline status
- Read receipts
- Recommendation system
- Admin dashboard

---

# 📖 Learning Outcomes

This project helped in understanding:

- Full-stack MERN development
- REST API design
- JWT authentication
- Role-based authorization
- MongoDB schema design
- Real-time communication with Socket.IO
- Protected routing
- State management in React
- Business logic implementation
- Credit-based workflow

---


