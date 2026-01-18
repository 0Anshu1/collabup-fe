package com.princemaurya.collabup000.data

object SampleData {
    
    val students = listOf(
        mapOf(
            "user_id" to "S123",
            "name" to "John Doe",
            "skills" to listOf("Python", "Machine Learning", "TensorFlow"),
            "project" to mapOf(
                "title" to "AI Chatbot",
                "description" to "Intelligent chatbot for customer support using NLP",
                "skills" to listOf("Python", "NLP", "TensorFlow"),
                "domains" to listOf("AI", "Machine Learning")
            ),
            "university" to "MIT",
            "year" to "3rd Year",
            "email" to "john.doe@mit.edu"
        ),
        mapOf(
            "user_id" to "S124",
            "name" to "Sarah Wilson",
            "skills" to listOf("React", "Node.js", "MongoDB"),
            "project" to mapOf(
                "title" to "E-Learning Platform",
                "description" to "Interactive learning platform with real-time collaboration",
                "skills" to listOf("React", "Node.js", "WebRTC"),
                "domains" to listOf("Web Development", "Education")
            ),
            "university" to "Stanford",
            "year" to "4th Year",
            "email" to "sarah.wilson@stanford.edu"
        ),
        mapOf(
            "user_id" to "S125",
            "name" to "Mike Chen",
            "skills" to listOf("Java", "Android", "Kotlin"),
            "project" to mapOf(
                "title" to "Health Tracker App",
                "description" to "Mobile app for tracking fitness and health metrics",
                "skills" to listOf("Android", "Kotlin", "Firebase"),
                "domains" to listOf("Mobile Development", "Healthcare")
            ),
            "university" to "UC Berkeley",
            "year" to "2nd Year",
            "email" to "mike.chen@berkeley.edu"
        )
    )
    
    val mentors = listOf(
        mapOf(
            "user_id" to "M456",
            "name" to "Jane Smith",
            "domains" to listOf("AI", "Data Science", "Machine Learning", "Computer Vision"),
            "skills" to listOf("Python", "TensorFlow", "PyTorch", "Scikit-learn", "OpenCV"),
            "hackathons" to listOf("HackXYZ", "AI Hackathon 2024", "DataFest"),
            "company" to "Google",
            "experience" to "5+ years",
            "email" to "jane.smith@google.com"
        ),
        mapOf(
            "user_id" to "M457",
            "name" to "David Johnson",
            "domains" to listOf("Web Development", "Cloud Computing", "DevOps", "Microservices"),
            "skills" to listOf("React", "AWS", "Docker", "Kubernetes", "Node.js", "TypeScript"),
            "hackathons" to listOf("WebHack", "CloudFest", "DevCon"),
            "company" to "Microsoft",
            "experience" to "7+ years",
            "email" to "david.johnson@microsoft.com"
        ),
        mapOf(
            "user_id" to "M458",
            "name" to "Lisa Wang",
            "domains" to listOf("Mobile Development", "UI/UX", "Cross-platform", "App Architecture"),
            "skills" to listOf("iOS", "Swift", "Figma", "Flutter", "React Native", "Sketch"),
            "hackathons" to listOf("MobileHack", "DesignFest", "AppCon"),
            "company" to "Apple",
            "experience" to "4+ years",
            "email" to "lisa.wang@apple.com"
        ),
        mapOf(
            "user_id" to "M459",
            "name" to "Alex Chen",
            "domains" to listOf("Blockchain", "Cryptocurrency", "DeFi", "Smart Contracts"),
            "skills" to listOf("Solidity", "Ethereum", "Web3.js", "Rust", "Go", "JavaScript"),
            "hackathons" to listOf("BlockchainHack", "CryptoFest", "DeFiCon"),
            "company" to "Coinbase",
            "experience" to "6+ years",
            "email" to "alex.chen@coinbase.com"
        ),
        mapOf(
            "user_id" to "M460",
            "name" to "Sarah Rodriguez",
            "domains" to listOf("Cybersecurity", "Network Security", "Penetration Testing", "Incident Response"),
            "skills" to listOf("Python", "Wireshark", "Metasploit", "Burp Suite", "Nmap", "Linux"),
            "hackathons" to listOf("SecurityHack", "CyberFest", "DefCon"),
            "company" to "CrowdStrike",
            "experience" to "8+ years",
            "email" to "sarah.rodriguez@crowdstrike.com"
        )
    )
    
    val faculty = listOf(
        mapOf(
            "user_id" to "F789",
            "name" to "Dr. Brown",
            "research_areas" to listOf("NLP", "Computational Linguistics"),
            "project" to mapOf(
                "title" to "Sentiment Analysis Tool",
                "description" to "Advanced sentiment analysis for social media monitoring",
                "skills" to listOf("NLP", "Python", "BERT"),
                "domains" to listOf("NLP", "Machine Learning"),
                "status" to "open"
            ),
            "department" to "Computer Science",
            "university" to "MIT"
        ),
        mapOf(
            "user_id" to "F790",
            "name" to "Dr. Garcia",
            "research_areas" to listOf("Computer Vision", "Deep Learning"),
            "project" to mapOf(
                "title" to "Object Detection System",
                "description" to "Real-time object detection for autonomous vehicles",
                "skills" to listOf("Computer Vision", "PyTorch", "OpenCV"),
                "domains" to listOf("Computer Vision", "AI"),
                "status" to "open"
            ),
            "department" to "Electrical Engineering",
            "university" to "Stanford"
        )
    )
    
    val startups = listOf(
        mapOf(
            "user_id" to "ST101",
            "name" to "TechCorp",
            "project" to mapOf(
                "title" to "ML Engineer",
                "description" to "Build ML models for fintech applications",
                "skills" to listOf("ML", "Python", "TensorFlow"),
                "domains" to listOf("Fintech", "Machine Learning"),
                "type" to "full-time"
            ),
            "industry" to "Fintech",
            "location" to "San Francisco"
        ),
        mapOf(
            "user_id" to "ST102",
            "name" to "HealthTech Solutions",
            "project" to mapOf(
                "title" to "Data Scientist",
                "description" to "Analyze healthcare data for predictive insights",
                "skills" to listOf("Data Science", "Python", "R"),
                "domains" to listOf("Healthcare", "Data Science"),
                "type" to "full-time"
            ),
            "industry" to "Healthcare",
            "location" to "Boston"
        ),
        mapOf(
            "user_id" to "ST103",
            "name" to "EduTech Innovations",
            "project" to mapOf(
                "title" to "Frontend Developer",
                "description" to "Build interactive educational platforms",
                "skills" to listOf("React", "TypeScript", "Node.js"),
                "domains" to listOf("Education", "Web Development"),
                "type" to "full-time"
            ),
            "industry" to "Education",
            "location" to "New York"
        )
    )
    
    val hackathons = listOf(
        mapOf(
            "id" to "H001",
            "title" to "AI Innovation Hackathon",
            "description" to "Build AI-powered solutions for real-world problems",
            "domains" to listOf("AI", "Machine Learning"),
            "skills" to listOf("Python", "Machine Learning", "TensorFlow"),
            "prize" to "$10,000",
            "startDate" to "2024-03-15",
            "endDate" to "2024-03-17",
            "participants" to 150
        ),
        mapOf(
            "id" to "H002",
            "title" to "Web Development Challenge",
            "description" to "Create innovative web applications",
            "domains" to listOf("Web Development", "Full Stack"),
            "skills" to listOf("React", "Node.js", "MongoDB"),
            "prize" to "$5,000",
            "startDate" to "2024-04-01",
            "endDate" to "2024-04-03",
            "participants" to 100
        ),
        mapOf(
            "id" to "H003",
            "title" to "Mobile App Hackathon",
            "description" to "Build mobile apps for social impact",
            "domains" to listOf("Mobile Development", "Cross Platform"),
            "skills" to listOf("Android", "iOS", "Flutter"),
            "prize" to "$7,500",
            "startDate" to "2024-04-15",
            "endDate" to "2024-04-17",
            "participants" to 80
        )
    )
} 