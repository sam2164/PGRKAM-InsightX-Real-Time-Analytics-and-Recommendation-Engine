InsightX – Analytics & Job Recommendation System

InsightX is an academic full-stack project built to demonstrate a basic analytics system and a job recommendation feature. The project focuses on understanding how user activity can be tracked, stored, and used to generate simple recommendations using basic machine learning logic.

This project is created for learning and demonstration purposes and is not intended for production use.

Features
	•	User authentication and basic account management
	•	Event tracking and storage in database
	•	REST APIs for analytics data
	•	Simple dashboard to visualize user activity
	•	Job recommendation system using basic collaborative filtering logic
	•	Frontend and backend connected using APIs

Tech Stack

Backend
	•	Python
	•	Django
	•	Django REST Framework
	•	SQLite (Database)

Frontend
	•	React
	•	HTML
	•	CSS
	•	JavaScript

Machine Learning
	•	Basic recommendation logic (Collaborative Filtering – simple implementation)

Project Structure :

insightx/
│
├── backend/
│   ├── accounts/        # User authentication logic
│   ├── insightx/        # Core app (models, APIs, analytics, recommender)
│   ├── mlcore/          # ML related logic
│   ├── core/            # Django project settings
│   ├── manage.py
│
├── frontend-web/
│   ├── src/             # React frontend source code
│   ├── package.json

How to run this Project :

Backend Setup
cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

http://127.0.0.1:8000/

Frontend Setup 
cd frontend-web
npm install
npm start

http://localhost:3000/

How the Recommendation System Works (Simple)
	•	The system stores basic user and job interaction data.
	•	A simple collaborative filtering approach is used.
	•	Based on previous interactions and basic similarity logic, jobs are suggested to users.
	•	This is a basic learning implementation, not a production-level ML model.

Purpose of the Project

This project was built as an academic learning project to:
	•	Understand full-stack application development
	•	Learn how frontend and backend communicate using APIs
	•	Learn the basics of analytics systems
	•	Understand how simple recommendation systems work
	•	Gain hands-on experience with Django, React, and basic ML logic

Future Improvements
	•	Better UI and dashboard design
	•	More accurate recommendation logic
	•	Use of a production-level database (e.g., PostgreSQL)
	•	Better charts and visualizations
	•	Improved authentication and security

Acknowledgment

This project was developed as part of an academic / training program to learn full-stack development and basic analytics systems.
