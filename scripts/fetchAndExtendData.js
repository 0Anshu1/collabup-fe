const admin = require('firebase-admin');
const fs = require('fs');
const path = require('path');
const { faker } = require('@faker-js/faker');

// Initialize Firebase Admin SDK
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

// English startup descriptions
const startupDescriptions = [
  "Revolutionary {domain} platform that transforms how people interact with technology.",
  "Innovative {domain} solution designed to address modern challenges in the industry.",
  "Cutting-edge {domain} company focused on creating sustainable and scalable solutions.",
  "Leading {domain} startup that leverages technology to solve real-world problems.",
  "Pioneering {domain} platform that empowers users with advanced capabilities."
];

// Fetch data from Firestore
async function fetchCollectionData(collectionName) {
  try {
    console.log(`Fetching data from ${collectionName}...`);
    const snapshot = await db.collection(collectionName).get();
    const data = [];
    
    snapshot.forEach(doc => {
      const docData = doc.data();
      // Convert Firestore Timestamps to ISO strings for JSON serialization
      const processedData = {};
      Object.keys(docData).forEach(key => {
        if (docData[key] && typeof docData[key].toDate === 'function') {
          processedData[key] = docData[key].toDate().toISOString();
        } else {
          processedData[key] = docData[key];
        }
      });
      processedData.id = doc.id;
      data.push(processedData);
    });
    
    console.log(`✅ Fetched ${data.length} documents from ${collectionName}`);
    return data;
  } catch (error) {
    console.error(`❌ Error fetching ${collectionName}:`, error);
    return [];
  }
}

// Generate additional mock data
function generateAdditionalStudents(count = 30) {
  const colleges = ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'BITS Pilani', 'NIT Trichy', 'NIT Surathkal', 'NIT Warangal'];
  const branches = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Information Technology', 'Electronics & Communication'];
  const skills = ['React', 'Node.js', 'Python', 'Machine Learning', 'C++', 'Java', 'UI/UX', 'DevOps', 'Blockchain', 'IoT', 'Robotics', 'Data Science', 'Android', 'iOS', 'Flutter', 'Django', 'FastAPI', 'MongoDB', 'PostgreSQL', 'Redis'];
  const interests = ['AI/ML', 'Hackathons', 'Startups', 'Research', 'Robotics', 'Web Development', 'Mobile Development', 'Cybersecurity', 'Cloud Computing', 'Open Source', 'Game Development', 'AR/VR'];

  return Array.from({ length: count }, (_, index) => {
    const year = faker.number.int({ min: 1, max: 4 });
    const college = faker.helpers.arrayElement(colleges);
    const branch = faker.helpers.arrayElement(branches);
    const selectedSkills = faker.helpers.arrayElements(skills, { min: 2, max: 6 });
    const selectedInterests = faker.helpers.arrayElements(interests, { min: 1, max: 3 });
    
    const bioTemplate = faker.helpers.arrayElement(studentBioTemplates);
    const bio = bioTemplate
      .replace('{year}', year)
      .replace('{college}', college)
      .replace('{branch}', branch)
      .replace('{skills}', selectedSkills.join(', '))
      .replace('{interests}', selectedInterests.join(', '));

    return {
      id: `student_extra_${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      college: college,
      branch: branch,
      year: year,
      skills: selectedSkills,
      interests: selectedInterests,
      bio: bio,
      location: faker.location.city(),
      profilePic: faker.image.avatar(),
      cgpa: parseFloat((faker.number.float({ min: 6.0, max: 9.5 })).toFixed(2)),
      github: faker.internet.url({ protocol: 'https' }),
      linkedin: faker.internet.url({ protocol: 'https' }),
      phone: faker.phone.number(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function generateAdditionalStartups(count = 20) {
  const domains = ['Healthcare', 'Fintech', 'Edtech', 'Environment', 'AI/ML', 'E-commerce', 'Logistics', 'Real Estate', 'Entertainment', 'Food Tech', 'Cybersecurity', 'Blockchain', 'IoT', 'Clean Energy', 'Biotech'];
  const cities = ['Bangalore', 'Mumbai', 'Delhi', 'Hyderabad', 'Chennai', 'Pune', 'Ahmedabad', 'Jaipur', 'Kolkata', 'Noida', 'Gurgaon', 'Indore'];

  return Array.from({ length: count }, (_, index) => {
    const domain = faker.helpers.arrayElement(domains);
    const descriptionTemplate = faker.helpers.arrayElement(startupDescriptions);
    const description = descriptionTemplate.replace('{domain}', domain);

    return {
      id: `startup_extra_${String(index + 1).padStart(3, '0')}`,
      name: faker.company.name(),
      domain: domain,
      founder: faker.person.fullName(),
      email: faker.internet.email(),
      location: faker.helpers.arrayElement(cities),
      description: description,
      teamSize: faker.number.int({ min: 5, max: 100 }),
      website: faker.internet.url(),
      foundedYear: faker.number.int({ min: 2018, max: 2024 }),
      funding: faker.helpers.arrayElement(['Bootstrapped', 'Seed', 'Series A', 'Series B', 'Series C']),
      logo: faker.image.url(),
      mission: faker.company.catchPhrase(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function generateAdditionalFaculty(count = 15) {
  const institutes = ['IIT Delhi', 'IIT Bombay', 'IIT Madras', 'IIT Kanpur', 'IIT Kharagpur', 'IIT Roorkee', 'IIT Guwahati', 'IIT Hyderabad', 'BITS Pilani', 'NIT Trichy', 'NIT Surathkal', 'NIT Warangal', 'IIIT Hyderabad', 'IISc Bangalore'];
  const departments = ['Computer Science', 'Electrical Engineering', 'Mechanical Engineering', 'Civil Engineering', 'Chemical Engineering', 'Biotechnology', 'Mathematics', 'Physics', 'Chemistry', 'Economics', 'Architecture'];
  const researchAreas = ['Artificial Intelligence', 'Machine Learning', 'Data Science', 'Robotics', 'IoT', 'Cybersecurity', 'Blockchain', 'Quantum Computing', 'Biomedical Engineering', 'Renewable Energy', 'Nanotechnology', 'Computer Vision', 'Natural Language Processing', 'Computer Networks', 'VLSI Design'];

  return Array.from({ length: count }, (_, index) => {
    const institute = faker.helpers.arrayElement(institutes);
    const department = faker.helpers.arrayElement(departments);
    const designation = faker.helpers.arrayElement(['Assistant Professor', 'Associate Professor', 'Professor', 'Head of Department', 'Dean']);
    const experience = faker.number.int({ min: 5, max: 30 });
    const publications = faker.number.int({ min: 10, max: 150 });
    const selectedResearchAreas = faker.helpers.arrayElements(researchAreas, { min: 1, max: 4 });
    
    const bioTemplate = faker.helpers.arrayElement(facultyBioTemplates);
    const bio = bioTemplate
      .replace('{designation}', designation)
      .replace('{institute}', institute)
      .replace('{experience}', experience)
      .replace('{researchAreas}', selectedResearchAreas.join(', '))
      .replace('{publications}', publications);

    return {
      id: `faculty_extra_${String(index + 1).padStart(3, '0')}`,
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
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

function generateAdditionalMentors(count = 20) {
  const expertise = ['Full Stack Development', 'Mobile Development', 'AI/ML', 'Data Science', 'DevOps', 'UI/UX', 'Product Management', 'Startup Strategy', 'Investment', 'Marketing', 'Sales', 'Operations', 'Cybersecurity', 'Cloud Computing', 'Blockchain', 'IoT', 'Robotics'];
  const companies = ['Google', 'Microsoft', 'Amazon', 'Meta', 'Apple', 'Netflix', 'Uber', 'Airbnb', 'Stripe', 'Shopify', 'Notion', 'Figma', 'Adobe', 'Salesforce', 'Oracle', 'IBM', 'Intel', 'NVIDIA', 'Tesla', 'SpaceX'];

  return Array.from({ length: count }, (_, index) => {
    const currentCompany = faker.helpers.arrayElement(companies);
    const designation = faker.person.jobTitle();
    const experience = faker.number.int({ min: 3, max: 25 });
    const selectedExpertise = faker.helpers.arrayElements(expertise, { min: 2, max: 5 });
    
    const bioTemplate = faker.helpers.arrayElement(mentorBioTemplates);
    const bio = bioTemplate
      .replace('{designation}', designation)
      .replace('{currentCompany}', currentCompany)
      .replace('{experience}', experience)
      .replace('{expertise}', selectedExpertise.join(', '));

    return {
      id: `mentor_extra_${String(index + 1).padStart(3, '0')}`,
      name: faker.person.fullName(),
      email: faker.internet.email(),
      expertise: selectedExpertise,
      experience: experience,
      bio: bio,
      currentCompany: currentCompany,
      designation: designation,
      hourlyRate: faker.number.int({ min: 1000, max: 8000 }),
      rating: parseFloat((faker.number.float({ min: 3.5, max: 5.0 })).toFixed(1)),
      totalSessions: faker.number.int({ min: 10, max: 200 }),
      profilePic: faker.image.avatar(),
      linkedin: faker.internet.url({ protocol: 'https' }),
      github: faker.internet.url({ protocol: 'https' }),
      availability: faker.helpers.arrayElement(['Available', 'Limited', 'Not Available']),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
  });
}

// Main function to fetch and extend data
async function fetchAndExtendData() {
  console.log('🚀 Starting data fetch and extension...\n');

  try {
    // Fetch current data from Firestore
    const currentStudents = await fetchCollectionData('students');
    const currentStartups = await fetchCollectionData('startups');
    const currentFaculty = await fetchCollectionData('faculty');
    const currentMentors = await fetchCollectionData('mentors');

    // Generate additional mock data
    console.log('\n📝 Generating additional mock data...');
    const additionalStudents = generateAdditionalStudents(30);
    const additionalStartups = generateAdditionalStartups(20);
    const additionalFaculty = generateAdditionalFaculty(15);
    const additionalMentors = generateAdditionalMentors(20);

    // Combine current and additional data
    const extendedStudents = [...currentStudents, ...additionalStudents];
    const extendedStartups = [...currentStartups, ...additionalStartups];
    const extendedFaculty = [...currentFaculty, ...additionalFaculty];
    const extendedMentors = [...currentMentors, ...additionalMentors];

    // Create data directory if it doesn't exist
    const dataDir = path.join(__dirname, 'extended-data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir);
    }

    // Save extended data to JSON files
    fs.writeFileSync(path.join(dataDir, 'data_student.json'), JSON.stringify(extendedStudents, null, 2));
    fs.writeFileSync(path.join(dataDir, 'data_startup.json'), JSON.stringify(extendedStartups, null, 2));
    fs.writeFileSync(path.join(dataDir, 'data_faculty.json'), JSON.stringify(extendedFaculty, null, 2));
    fs.writeFileSync(path.join(dataDir, 'data_mentor.json'), JSON.stringify(extendedMentors, null, 2));

    console.log('\n📁 Extended data saved to JSON files:');
    console.log(`   data_student.json: ${extendedStudents.length} students (${currentStudents.length} existing + ${additionalStudents.length} new)`);
    console.log(`   data_startup.json: ${extendedStartups.length} startups (${currentStartups.length} existing + ${additionalStartups.length} new)`);
    console.log(`   data_faculty.json: ${extendedFaculty.length} faculty (${currentFaculty.length} existing + ${additionalFaculty.length} new)`);
    console.log(`   data_mentor.json: ${extendedMentors.length} mentors (${currentMentors.length} existing + ${additionalMentors.length} new)`);

    console.log('\n🎉 Data fetch and extension completed successfully!');

  } catch (error) {
    console.error('❌ Error in data fetch and extension:', error);
  } finally {
    process.exit(0);
  }
}

// Run the script
fetchAndExtendData(); 