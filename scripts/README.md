# CollabUp Data Generator

This script generates realistic mock data for your CollabUp platform and uploads it to Firebase Firestore. Perfect for testing recommendation and matchmaking systems.

## 📊 Generated Data

- **50 Students** - with skills, interests, college info
- **15 Startups** - with domains, team sizes, funding info
- **20 Faculty** - with research areas, experience, publications
- **25 Mentors** - with expertise, ratings, hourly rates
- **40 Projects** - mixed types (Student, Startup, Research)
- **10 Hackathons** - with prize pools, domains, locations

## 🚀 Quick Start

### Step 1: Install Dependencies
```bash
cd scripts
npm install
```

### Step 2: Get Firebase Service Account Key
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Project Settings** → **Service Accounts**
4. Click **Generate New Private Key**
5. Download the JSON file
6. Rename it to `serviceAccountKey.json`
7. Place it in the **CollabUp root directory** (not in scripts folder)

### Step 3: Run the Script
```bash
npm run generate
```

## 📁 File Structure
```
CollabUp/
├── serviceAccountKey.json    # Your Firebase service account key
├── scripts/
│   ├── generateAndUploadData.js
│   ├── package.json
│   ├── README.md
│   └── generated-data/       # JSON files (created after running)
│       ├── students.json
│       ├── startups.json
│       ├── faculty.json
│       ├── mentors.json
│       ├── projects.json
│       └── hackathons.json
```

## 🔧 Customization

### Modify Data Counts
Edit the function calls in `generateAndUploadAllData()`:
```javascript
const students = generateStudents(50);    // Change 50 to desired count
const startups = generateStartups(15);    // Change 15 to desired count
const faculty = generateFaculty(20);      // Change 20 to desired count
const mentors = generateMentors(25);      // Change 25 to desired count
const projects = generateProjects(40);    // Change 40 to desired count
const hackathons = generateHackathons(10); // Change 10 to desired count
```

### Add New Fields
Edit the generation functions to add new fields:
```javascript
// In generateStudents function
return {
  // ... existing fields
  newField: faker.someData(),
  // ... rest of fields
};
```

### Modify Data Ranges
Change the arrays and ranges in each generation function:
```javascript
const colleges = ['IIT Delhi', 'IIT Bombay', 'IIT Madras']; // Add/remove colleges
const skills = ['React', 'Node.js', 'Python']; // Add/remove skills
```

## 📋 Data Schema

### Students
- `id`, `name`, `email`, `college`, `branch`, `year`
- `skills`, `interests`, `bio`, `location`, `profilePic`
- `cgpa`, `github`, `linkedin`, `phone`
- `createdAt`, `updatedAt`

### Startups
- `id`, `name`, `domain`, `founder`, `email`, `location`
- `description`, `teamSize`, `website`, `foundedYear`
- `funding`, `logo`, `mission`
- `createdAt`, `updatedAt`

### Faculty
- `id`, `name`, `email`, `institute`, `department`
- `researchAreas`, `bio`, `designation`, `experience`
- `publications`, `profilePic`, `website`
- `createdAt`, `updatedAt`

### Mentors
- `id`, `name`, `email`, `expertise`, `experience`, `bio`
- `currentCompany`, `designation`, `hourlyRate`, `rating`
- `totalSessions`, `profilePic`, `linkedin`, `github`
- `availability`, `createdAt`, `updatedAt`

### Projects
- `id`, `title`, `type`, `domain`, `skillsRequired`
- `status`, `description`, `duration`, `teamSize`
- `difficulty`, `createdAt`, `updatedAt`
- Type-specific fields: `startupId`, `facultyId`, `creatorId`

### Hackathons
- `id`, `name`, `date`, `domains`, `teamSize`
- `location`, `description`, `prizePool`
- `registrationDeadline`, `isOnline`, `sponsors`
- `createdAt`, `updatedAt`

## ⚠️ Important Notes

1. **Service Account Key**: Keep your `serviceAccountKey.json` secure and never commit it to version control
2. **Firestore Rules**: Make sure your Firestore security rules allow write access
3. **Batch Limits**: The script uploads in batches of 500 (Firestore limit)
4. **Duplicate IDs**: Each document gets a unique ID to avoid conflicts

## 🐛 Troubleshooting

### "Service account key not found"
- Make sure `serviceAccountKey.json` is in the CollabUp root directory
- Check the file path in the script: `require('../serviceAccountKey.json')`

### "Permission denied"
- Check your Firebase project permissions
- Verify Firestore security rules allow write access

### "Batch write failed"
- Check your internet connection
- Verify Firestore is enabled in your Firebase project

## 🎯 Next Steps

After running the script:
1. Check your Firestore console to verify data upload
2. Use this data to test your recommendation algorithms
3. Build matchmaking systems using the rich data structure
4. Implement search and filtering features

## 📞 Support

If you encounter any issues:
1. Check the console output for error messages
2. Verify your Firebase configuration
3. Ensure all dependencies are installed correctly 