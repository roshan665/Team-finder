-- Hackathon Team Formation System Schema

-- Students Table (Admin Controlled)
-- This table stores students who are pre-authorized to register.
CREATE TABLE students (
    enrollment_no VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    course VARCHAR(50) NOT NULL,
    branch VARCHAR(50) NOT NULL,
    institute_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users Table
-- Stores registered students and admins.
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    enrollment_no VARCHAR(50) UNIQUE REFERENCES students(enrollment_no),
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(20) DEFAULT 'user', -- 'user' or 'admin'
    has_completed_profile BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    trust_score INTEGER DEFAULT 70,
    github_username VARCHAR(100),
    bio TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hackathons Table
CREATE TABLE hackathons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(200) NOT NULL,
    description TEXT,
    event_date DATE NOT NULL,
    deadline TIMESTAMP NOT NULL,
    location VARCHAR(200),
    max_team_size INTEGER DEFAULT 4,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'closed', 'upcoming', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams Table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(100) NOT NULL,
    description TEXT,
    leader_id UUID REFERENCES users(id),
    hackathon_id UUID REFERENCES hackathons(id),
    status VARCHAR(20) DEFAULT 'recruiting', -- 'recruiting', 'full', 'completed'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team Members Table (Join Requests)
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES teams(id),
    user_id UUID REFERENCES users(id),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'accepted', 'rejected'
    message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(team_id, user_id)
);

-- Organizations Table
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    domain VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications Table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(20) NOT NULL, -- 'request', 'acceptance', 'system'
    read BOOLEAN DEFAULT FALSE,
    link TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
