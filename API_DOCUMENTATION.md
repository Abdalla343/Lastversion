# School Management System API Documentation

## Overview
This API provides functionality for teachers to manage classes, subjects, and grades, while students can view their own grades.

## Authentication
All protected routes require a Bearer token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## User Roles
- **teacher**: Can create classes, manage students, create subjects, and assign grades
- **student**: Can view their own grades and class information

---

## Authentication Routes

### Register User
**POST** `/api/auth/register`

**Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "teacher" // optional: "teacher" or "student", defaults to "student"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "teacher",
  "token": "jwt-token-here"
}
```

### Login User
**POST** `/api/auth/login`

**Body:**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "id": 1,
  "name": "John Doe",
  "email": "john@example.com",
  "role": "teacher",
  "token": "jwt-token-here"
}
```

### Get Profile
**GET** `/api/auth/profile`
*Requires authentication*

---

## Class Management Routes (Teacher Only)

### Create Class
**POST** `/api/classes`

**Body:**
```json
{
  "name": "Mathematics 101",
  "description": "Basic mathematics course"
}
```

### Get Teacher's Classes
**GET** `/api/classes`
*Returns all classes created by the authenticated teacher*

### Get Specific Class
**GET** `/api/classes/:id`
*Returns class details with students and subjects*

### Get Available Students
**GET** `/api/classes/available-students`
*Returns students who are not enrolled in any class*

### Add Students to Class
**POST** `/api/classes/:id/students`

**Body:**
```json
{
  "studentIds": [1, 2, 3]
}
```

### Remove Student from Class
**DELETE** `/api/classes/:id/students/:studentId`

---

## Subject Management Routes

### Create Subject
**POST** `/api/subjects`
*Teacher only*

**Body:**
```json
{
  "name": "Algebra",
  "description": "Introduction to algebra",
  "classId": 1
}
```

### Get Subjects for Class
**GET** `/api/subjects/class/:classId`

### Get Specific Subject
**GET** `/api/subjects/:id`
*Returns subject details and students (if teacher) or just subject info (if student)*

### Update Subject
**PUT** `/api/subjects/:id`
*Teacher only*

### Delete Subject
**DELETE** `/api/subjects/:id`
*Teacher only*

---

## Grade Management Routes

### Assign Grades
**POST** `/api/grades`
*Teacher only*

**Body:**
```json
{
  "subjectId": 1,
  "grades": [
    {
      "studentId": 1,
      "grade": 85.5,
      "assignment": "Midterm Exam",
      "comments": "Good work!"
    },
    {
      "studentId": 2,
      "grade": 92.0,
      "assignment": "Midterm Exam"
    }
  ]
}
```

### Get All Grades for Subject
**GET** `/api/grades/subject/:subjectId`
*Teacher only*

### Get Student's All Grades
**GET** `/api/grades/my-grades`
*Student only*

### Get Student's Grade for Specific Subject
**GET** `/api/grades/subject/:subjectId/my-grade`
*Student only*

### Update Grade
**PUT** `/api/grades/:id`
*Teacher only*

### Delete Grade
**DELETE** `/api/grades/:id`
*Teacher only*

---

## Key Features Implemented

### ✅ Teacher Features
1. **Create Classes**: Teachers can create classes with names and descriptions
2. **Manage Students**: Teachers can add/remove students from their classes
3. **Student Blocking**: Students can only be enrolled in one class at a time
4. **Create Subjects**: Teachers can create multiple subjects within their classes
5. **Assign Grades**: Teachers can assign grades to students for specific subjects
6. **View All Data**: Teachers can view all students, subjects, and grades in their classes

### ✅ Student Features
1. **View Own Grades**: Students can only see their own grades
2. **Class Access**: Students can view classes they're enrolled in
3. **Subject Access**: Students can view subjects in their classes

### ✅ Security Features
1. **Role-based Access**: Different permissions for teachers vs students
2. **Class Ownership**: Teachers can only manage their own classes
3. **Student Enrollment Validation**: Students must be enrolled in a class to access its data
4. **Grade Privacy**: Students can only see their own grades

---

## Example Workflow

### For Teachers:
1. Register as teacher: `POST /api/auth/register` with `role: "teacher"`
2. Create a class: `POST /api/classes`
3. Get available students: `GET /api/classes/available-students`
4. Add students to class: `POST /api/classes/:id/students`
5. Create subjects: `POST /api/subjects`
6. Assign grades: `POST /api/grades`

### For Students:
1. Register as student: `POST /api/auth/register` with `role: "student"`
2. View their grades: `GET /api/grades/my-grades`
3. View grades for specific subject: `GET /api/grades/subject/:subjectId/my-grade`

---

## Error Handling
All routes return appropriate HTTP status codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request (validation errors)
- `401`: Unauthorized (invalid/missing token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not Found
- `500`: Server Error

Error responses include a `message` field with details about the error.
