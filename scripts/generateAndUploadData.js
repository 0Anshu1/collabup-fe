const { faker } = require('@faker-js/faker');
const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');

// Initialize Firebase Admin SDK
// You'll need to download your service account key from Firebase Console
// Go to Project Settings > Service Accounts > Generate New Private Key
const serviceAccount = require('../serviceAccountKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// English bio templates for students
const studentBioTemplates = [
  "Passionate {year} year student at {college} with expertise in {skills}. Interested in {interests} and always eager to learn new technologies.",
  "Dedicated {year} year {branch} student from {college}. Skilled in {skills} and passionate about {interests}.",
  "Enthusiastic student pursuing {branch} at {college}. Proficient in {skills} and actively involved in {interests}.",
  "Motivated {year} year student with strong foundation in {skills}. Looking for opportunities in {interests}.",
  "Tech-savvy {branch} student from {college}. Experienced in {skills} and passionate about {interests}."
];

// English bio templates for faculty
const facultyBioTemplates = [
  "{designation} at {institute} with {experience} years of experience in {researchAreas}. Published {publications} research papers.",
  "Experienced {designation} specializing in {researchAreas}. Currently working at {institute} with {experience} years of academic experience.",
  "Renowned {designation} at {institute} with expertise in {researchAreas}. Author of {publications} publications.",
  "Leading {designation} in {researchAreas} at {institute}. {experience} years of research and teaching experience.",
  "Distinguished {designation} with {experience} years at {institute}. Research focus on {researchAreas}."
];

// English bio templates for mentors
const mentorBioTemplates = [
  "Senior {designation} at {currentCompany} with {experience} years of experience in {expertise}. Passionate about mentoring and helping others grow.",
  "Experienced professional working as {designation} at {currentCompany}. Expert in {expertise} with {experience} years in the industry.",
  "Tech leader and {designation} at {currentCompany}. Specialized in {expertise} with {experience} years of hands-on experience.",
  "Industry veteran with {experience} years of experience in {expertise}. Currently serving as {designation} at {currentCompany}.",
  "Seasoned professional and {designation} at {currentCompany}. Deep expertise in {expertise} with {experience} years of experience."
];

// English project descriptions
const projectDescriptionTemplates = [
  "A comprehensive {domain} project that leverages {skills} to solve real-world problems. Perfect for students interested in {domain}.",
  "Innovative {domain} solution using cutting-edge {skills}. This project offers hands-on experience in {domain} development.",
  "Advanced {domain} application built with {skills}. Ideal for students looking to gain expertise in {domain} technologies.",
  "Modern {domain} platform developed using {skills}. Provides practical experience in {domain} implementation.",
  "Robust {domain} system utilizing {skills}. Great opportunity to work on meaningful {domain} projects."
];

// Generate Students Data
function generateStudents(count = 50) {
  const colleges = ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad'];
  const branches = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology'];
  const skills = ['React', 'Node.js', 'Python', 'Machine Learning', 'C++', 'Java', 'UI/UX', 'DevOps', 'Blockchain', 'IoT', 'Robotics', 'Data Science', 'Android', 'iOS', 'Flutter'];
  const interests = ['AI/ML', 'Hackathons', 'Startups', 'Research', 'Robotics', 'Web Development', 'Mobile Development', 'Cybersecurity', 'Cloud Computing', 'Open Source'];
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];

  return Array.from({ length: count }, (_, index) => {
    const year = faker.number.int({ min: 1, max: 4 });
    const college = faker.helpers.arrayElement(colleges);
    const branch = faker.helpers.arrayElement(branches);
    const selectedSkills = faker.helpers.arrayElements(skills, { min: 2, max: 5 });
    const selectedInterests = faker.helpers.arrayElements(interests, { min: 1, max: 3 });
    
    // Generate English bio using template
    const bioTemplate = faker.helpers.arrayElement(studentBioTemplates);
    const bio = bioTemplate
      .replace('{year}', year)
      .replace('{college}', college)
      .replace('{branch}', branch)
      .replace('{skills}', selectedSkills.join(', '))
      .replace('{interests}', selectedInterests.join(', '));

    return {
      id: `student_${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      college: college,
      branch: branch,
      year: year,
      skills: selectedSkills,
      interests: selectedInterests,
      bio: bio,
      location: faker.helpers.arrayElement(cities),
      profilePic: faker.image.avatar(),
      cgpa: parseFloat((faker.number.float({ min: 6.0, max: 9.5 })).toFixed(2)),
      github: faker.internet.url({ protocol: 'https' }),
      linkedin: faker.internet.url({ protocol: 'https' }),
      phone: faker.phone.number(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
  });
}

// Generate Startups Data
function generateStartups(count = 15) {
  const domains = ['Healthcare', 'Fintech', 'Edtech', 'Environment', 'AI/ML', 'E-commerce', 'Logistics', 'Real Estate', 'Entertainment', 'Food Tech'];
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Jaipur'];
  const startupDescriptions = [
    "Revolutionary {domain} platform that transforms how people interact with technology.",
    "Innovative {domain} solution designed to address modern challenges in the industry.",
    "Cutting-edge {domain} company focused on creating sustainable and scalable solutions.",
    "Leading {domain} startup that leverages technology to solve real-world problems.",
    "Pioneering {domain} platform that empowers users with advanced capabilities."
  ];

  return Array.from({ length: count }, (_, index) => {
    const domain = faker.helpers.arrayElement(domains);
    const descriptionTemplate = faker.helpers.arrayElement(startupDescriptions);
    const description = descriptionTemplate.replace('{domain}', domain);

    return {
      id: `startup_${String(index + 1).padStart(3, '0')}`,
      name: faker.company.name(),
      domain: domain,
      founder: faker.person.fullName(),
      email: faker.internet.email(),
      location: faker.helpers.arrayElement(cities),
      description: description,
      teamSize: faker.number.int({ min: 5, max: 50 }),
      website: faker.internet.url(),
      foundedYear: faker.number.int({ min: 2018, max: 2024 }),
      funding: faker.helpers.arrayElement(['Bootstrapped', 'Seed', 'Series A', 'Series B']),
      logo: faker.image.url(),
      mission: faker.company.catchPhrase(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
  });
}

// Generate Faculty Data
function generateFaculty(count = 20) {
  const institutes = ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad'];
  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics'];
  const researchAreas = ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Robotics', 'IoT', 'Cybersecurity', 'Blockchain', 'Quantum Computing', 'Biomedical Engineering', 'Renewable Energy', 'Nanotechnology', 'Computer Vision'];

  return Array.from({ length: count }, (_, index) => {
    const institute = faker.helpers.arrayElement(institutes);
    const department = faker.helpers.arrayElement(departments);
    const designation = faker.helpers.arrayElement(['Assistant Professor', 'Associate Professor', 'Professor', 'Head of Department']);
    const experience = faker.number.int({ min: 5, max: 25 });
    const publications = faker.number.int({ min: 10, max: 100 });
    const selectedResearchAreas = faker.helpers.arrayElements(researchAreas, { min: 1, max: 3 });
    
    // Generate English bio using template
    const bioTemplate = faker.helpers.arrayElement(facultyBioTemplates);
    const bio = bioTemplate
      .replace('{designation}', designation)
      .replace('{institute}', institute)
      .replace('{experience}', experience)
      .replace('{researchAreas}', selectedResearchAreas.join(', '))
      .replace('{publications}', publications);

    return {
      id: `faculty_${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      institute: institute,
      department: department,
      researchAreas: selectedResearchAreas,
      bio: bio,
      designation: designation,
      experience: experience,
      publications: publications,
      profilePic: faker.image.avatar(),
      website: faker.internet.url(),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
  });
}

// Generate Mentors Data
function generateMentors(count = 25) {
  const expertise = ['Full Stack Development', 'Mobile Development', 'AI/ML', 'Data Science', 'DevOps', 'UI/UX', 'Product Management', 'Startup Strategy', 'Investment', 'Marketing', 'Sales', 'Operations'];
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Shopify', 'Notion', 'Figma'];

  return Array.from({ length: count }, (_, index) => {
    const currentCompany = faker.helpers.arrayElement(companies);
    const designation = faker.person.jobTitle();
    const experience = faker.number.int({ min: 3, max: 20 });
    const selectedExpertise = faker.helpers.arrayElements(expertise, { min: 2, max: 4 });
    
    // Generate English bio using template
    const bioTemplate = faker.helpers.arrayElement(mentorBioTemplates);
    const bio = bioTemplate
      .replace('{designation}', designation)
      .replace('{currentCompany}', currentCompany)
      .replace('{experience}', experience)
      .replace('{expertise}', selectedExpertise.join(', '));

    return {
      id: `mentor_${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      expertise: selectedExpertise,
      experience: experience,
      bio: bio,
      currentCompany: currentCompany,
      designation: designation,
      hourlyRate: faker.number.int({ min: 1000, max: 5000 }),
      rating: parseFloat((faker.number.float({ min: 3.5, max: 5.0 })).toFixed(1)),
      totalSessions: faker.number.int({ min: 10, max: 100 }),
      profilePic: faker.image.avatar(),
      linkedin: faker.internet.url({ protocol: 'https' }),
      github: faker.internet.url({ protocol: 'https' }),
      availability: faker.helpers.arrayElement(['Available', 'Limited', 'Not Available']),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
  });
}

// Generate Projects Data
function generateProjects(count = 40) {
  const projectTypes = ['Student', 'Startup', 'Research'];
  const domains = ['AI/ML', 'Healthcare', 'Fintech', 'Edtech', 'Environment', 'E-commerce', 'Robotics', 'IoT', 'Cybersecurity', 'Blockchain', 'Data Science', 'Mobile Development'];
  const skills = ['React', 'Node.js', 'Python', 'Machine Learning', 'C++', 'Java', 'UI/UX', 'DevOps', 'Blockchain', 'IoT', 'Robotics', 'Data Science', 'Android', 'iOS', 'Flutter', 'TensorFlow', 'PyTorch', 'Docker', 'AWS', 'MongoDB'];
  const statuses = ['Open', 'In Progress', 'Completed', 'On Hold'];
  const projectTitles = [
    "Smart {domain} Platform",
    "Advanced {domain} System",
    "Intelligent {domain} Solution",
    "Modern {domain} Application",
    "Innovative {domain} Platform",
    "Next-Gen {domain} System",
    "AI-Powered {domain} Tool",
    "Cloud-Based {domain} Solution"
  ];

  return Array.from({ length: count }, (_, index) => {
    const type = faker.helpers.arrayElement(projectTypes);
    const domain = faker.helpers.arrayElement(domains);
    const selectedSkills = faker.helpers.arrayElements(skills, { min: 2, max: 5 });
    
    // Generate English project title and description
    const titleTemplate = faker.helpers.arrayElement(projectTitles);
    const title = titleTemplate.replace('{domain}', domain);
    
    const descriptionTemplate = faker.helpers.arrayElement(projectDescriptionTemplates);
    const description = descriptionTemplate
      .replace('{domain}', domain)
      .replace('{skills}', selectedSkills.join(', '));

    const project = {
      id: `project_${String(index + 1).padStart(3, '0')}`,
      title: title,
      type: type,
      domain: domain,
      skillsRequired: selectedSkills,
      status: faker.helpers.arrayElement(statuses),
      description: description,
      duration: faker.helpers.arrayElement(['1 Month', '2 Months', '3 Months', '6 Months']),
      teamSize: faker.number.int({ min: 2, max: 8 }),
      difficulty: faker.helpers.arrayElement(['Beginner', 'Intermediate', 'Advanced']),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    // Add type-specific fields
    if (type === 'Startup') {
      project.startupId = `startup_${String(faker.number.int({ min: 1, max: 15 })).padStart(3, '0')}`;
      project.compensation = faker.helpers.arrayElement(['Unpaid', 'Stipend', 'Equity', 'Certificate']);
    } else if (type === 'Research') {
      project.facultyId = `faculty_${String(faker.number.int({ min: 1, max: 20 })).padStart(3, '0')}`;
      project.publication = faker.datatype.boolean();
    } else {
      project.creatorId = `student_${String(faker.number.int({ min: 1, max: 50 })).padStart(3, '0')}`;
    }

    return project;
  });
}

// Generate Hackathons Data
function generateHackathons(count = 10) {
  const domains = ['AI/ML', 'Healthcare', 'Fintech', 'Edtech', 'Environment', 'E-commerce', 'Robotics', 'IoT', 'Cybersecurity', 'Blockchain'];
  const cities = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow'];
  const hackathonDescriptions = [
    "Join us for an exciting {domain} hackathon where innovation meets technology.",
    "Build the future of {domain} in this intensive 48-hour coding challenge.",
    "Create groundbreaking {domain} solutions and compete for amazing prizes.",
    "Showcase your {domain} skills in this premier hackathon event.",
    "Collaborate with top developers to solve {domain} challenges."
  ];

  return Array.from({ length: count }, (_, index) => {
    const domain = faker.helpers.arrayElement(domains);
    const descriptionTemplate = faker.helpers.arrayElement(hackathonDescriptions);
    const description = descriptionTemplate.replace('{domain}', domain);

    return {
      id: `hackathon_${String(index + 1).padStart(3, '0')}`,
      name: faker.company.name() + ' Hackathon',
      date: faker.date.future(),
      domains: faker.helpers.arrayElements(domains, { min: 1, max: 3 }),
      teamSize: faker.helpers.arrayElement([2, 3, 4, 5]),
      location: faker.helpers.arrayElement(cities),
      description: description,
      prizePool: faker.number.int({ min: 10000, max: 1000000 }),
      registrationDeadline: faker.date.future(),
      isOnline: faker.datatype.boolean(),
      sponsors: faker.helpers.arrayElements(['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple'], { min: 1, max: 3 }),
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };
  });
}

// Upload data to Firestore
async function uploadCollection(collectionName, data) {
  try {
    console.log(`Starting upload for ${collectionName}...`);
    
    // Upload in batches of 500 (Firestore limit)
    const batchSize = 500;
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = db.batch();
      const batchData = data.slice(i, i + batchSize);
      
      batchData.forEach((doc) => {
        const docRef = db.collection(collectionName).doc(doc.id);
        batch.set(docRef, doc);
      });
      
      await batch.commit();
      console.log(`Uploaded batch ${Math.floor(i / batchSize) + 1} for ${collectionName}`);
    }
    
    console.log(`✅ Successfully uploaded ${data.length} documents to ${collectionName}`);
  } catch (error) {
    console.error(`❌ Error uploading ${collectionName}:`, error);
  }
}

// Main function to generate and upload all data
async function generateAndUploadAllData() {
  console.log('🚀 Starting data generation and upload...\n');

  try {
    // Generate data
    const students = generateStudents(50);
    const startups = generateStartups(15);
    const faculty = generateFaculty(20);
    const mentors = generateMentors(25);
    const projects = generateProjects(40);
    const hackathons = generateHackathons(10);

    // Save generated data to JSON files (optional)
    const dataDir = path.join(__dirname, 'generated-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    fs.writeFileSync(path.join(dataDir, 'students.json'), JSON.stringify(students, null, 2));
    fs.writeFileSync(path.join(dataDir, 'startups.json'), JSON.stringify(startups, null, 2));
    fs.writeFileSync(path.join(dataDir, 'faculty.json'), JSON.stringify(faculty, null, 2));
    fs.writeFileSync(path.join(dataDir, 'mentors.json'), JSON.stringify(mentors, null, 2));
    fs.writeFileSync(path.join(dataDir, 'projects.json'), JSON.stringify(projects, null, 2));
    fs.writeFileSync(path.join(dataDir, 'hackathons.json'), JSON.stringify(hackathons, null, 2));

    console.log('📁 Generated data saved to JSON files\n');

    // Upload to Firestore
    await uploadCollection('students', students);
    await uploadCollection('startups', startups);
    await uploadCollection('faculty', faculty);
    await uploadCollection('mentors', mentors);
    await uploadCollection('projects', projects);
    await uploadCollection('hackathons', hackathons);

    console.log('\n🎉 All data has been successfully generated and uploaded to Firebase!');
    console.log('\n📊 Summary:');
    console.log(`   Students: ${students.length}`);
    console.log(`   Startups: ${startups.length}`);
    console.log(`   Faculty: ${faculty.length}`);
    console.log(`   Mentors: ${mentors.length}`);
    console.log(`   Projects: ${projects.length}`);
    console.log(`   Hackathons: ${hackathons.length}`);

  } catch (error) {
    console.error('❌ Error in data generation/upload:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
generateAndUploadAllData(); 