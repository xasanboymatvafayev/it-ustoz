
-- O'quvchilar jadvali
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    firstName TEXT,
    lastName TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user', -- 'admin' yoki 'user'
    enrolledCourses TEXT -- JSON array ko'rinishida: ["course_id1", "course_id2"]
);

-- Kurslar jadvali
CREATE TABLE courses (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    subject TEXT, -- Subject enum
    teacher TEXT,
    createdAt INTEGER
);

-- Vazifalar jadvali
CREATE TABLE tasks (
    id TEXT PRIMARY KEY,
    courseId TEXT,
    title TEXT,
    description TEXT,
    order_index INTEGER,
    FOREIGN KEY(courseId) REFERENCES courses(id)
);

-- Yechimlar va Baholar jadvali
CREATE TABLE task_results (
    id TEXT PRIMARY KEY,
    taskId TEXT,
    userId TEXT,
    userName TEXT,
    result TEXT,
    errors TEXT,
    solution TEXT,
    explanation TEXT,
    grade INTEGER, -- AI balli
    adminGrade INTEGER, -- Admin balli
    status TEXT DEFAULT 'pending', -- 'pending' yoki 'reviewed'
    timestamp INTEGER,
    courseId TEXT,
    FOREIGN KEY(taskId) REFERENCES tasks(id),
    FOREIGN KEY(userId) REFERENCES users(id)
);

-- Kursga yozilish so'rovlari
CREATE TABLE enrollment_requests (
    id TEXT PRIMARY KEY,
    userId TEXT,
    userName TEXT,
    courseId TEXT,
    courseTitle TEXT,
    status TEXT DEFAULT 'pending',
    FOREIGN KEY(userId) REFERENCES users(id),
    FOREIGN KEY(courseId) REFERENCES courses(id)
);
