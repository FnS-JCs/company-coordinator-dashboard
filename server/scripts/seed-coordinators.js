import admin from 'firebase-admin';
import dotenv from 'dotenv';
dotenv.config();

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

const db = admin.firestore();

const seniorCoordinators = [
  { name: 'Aaditya Goyal', email: 'aadityagoyal0108@gmail.com' },
  { name: 'Aayati Goyal', email: 'aayatirgoyal@gmail.com' },
  { name: 'Aditya C', email: 'aditya5462006@gmail.com' },
  { name: 'Ashish Kohli', email: 'kohliashish12@gmail.com' },
  { name: 'Dhwani', email: 'dhwani1006@gmail.com' },
  { name: 'Eshani Chaudhary', email: 'cheshani2006@gmail.com' },
  { name: 'Gunjan Gupta', email: 'gunjan17guptaa@gmail.com' },
  { name: 'Harshit Sharma', email: 'harshit.9731@gmail.com' },
  { name: 'Manzil Sharma', email: 'sharmamanzil05@gmail.com' },
  { name: 'N B Mothi Krishna', email: 'mothikrishna86217@gmail.com' },
  { name: 'Rohan Gehani', email: 'rohangehani1@gmail.com' },
  { name: 'Sandeep Ramani', email: 'sandeepramani2006@gmail.com' },
  { name: 'Shouraya Aggarwal', email: 'shourayaaggarwal2006@gmail.com' },
  { name: 'Sjonum Walia', email: 'sjonumwalia@gmail.com' },
  { name: 'Tanvi Bansal', email: 'tanvibansal0607@gmail.com' },
];

const juniorCoordinators = [
  { name: 'Aayaan Gambhir', email: 'aayaangambhir@gmail.com' },
  { name: 'Aditya Rajoteaya', email: 'aditya.rajoteaya1@gmail.com' },
  { name: 'Akhil Agarwal', email: 'akhilagarwal290807@gmail.com' },
  { name: 'Anushka', email: 'anu.2044shka@gmail.com' },
  { name: 'Anushka Agarwal', email: 'anushka.agarwal285@gmail.com' },
  { name: 'Aradhya Aggarwal', email: 'aradhyaaggarwal2008@gmail.com' },
  { name: 'Aryan Ankush', email: 'postaryan04@gmail.com' },
  { name: 'Asmi Saini', email: 'asmisaini0512@gmail.com' },
  { name: 'Avni Toshniwal', email: 'avninarayantoshniwal@gmail.com' },
  { name: 'Dhruv Makhija', email: 'dhruvmakhija118@gmail.com' },
  { name: 'Divyansh Mittal', email: 'divyansh.mittal730@gmail.com' },
  { name: 'Haya Pahwa', email: 'hayapahwa@gmail.com' },
  { name: 'Lakshita Chauhan', email: 'chauhan.lakshita23@gmail.com' },
  { name: 'Manya Dhar', email: 'manyadhar2007@gmail.com' },
  { name: 'Navya Jain', email: 'navyajain090807@gmail.com' },
  { name: 'Nishta Dave', email: 'nishtadave28@gmail.com' },
  { name: 'Paavni Gupta', email: 'guptapaavni1907@gmail.com' },
  { name: 'Prisha Sheokand', email: 'prishasheokand2801@gmail.com' },
  { name: 'Ruchir Kohli', email: 'kohliruchir07@gmail.com' },
  { name: 'Rushil Dass', email: 'rushil.dass2207@gmail.com' },
  { name: 'Seyan Ashvin Sonone', email: 'seyan.sonone@gmail.com' },
  { name: 'Shaurya Singh', email: 'shaurya.3817@gmail.com' },
  { name: 'Urshita Khemka', email: 'urshitakhemka@gmail.com' },
  { name: 'Uttara Vasudevan', email: 'uttara.vasudevan@gmail.com' },
  { name: 'Venya Verma', email: 'verma.15.venya@gmail.com' },
];

async function seedUser(name, email, role) {
  const usersRef = db.collection('users');
  const existing = await usersRef.where('email', '==', email).limit(1).get();

  if (!existing.empty) {
    console.log(`  SKIP (already exists): ${name} <${email}>`);
    return;
  }

  await usersRef.add({
    name,
    email,
    phone: null,
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  console.log(`  ADDED [${role}]: ${name} <${email}>`);
}

async function seed() {
  console.log('\nSeeding Senior Coordinators...');
  for (const user of seniorCoordinators) {
    await seedUser(user.name, user.email, 'senior_coordinator');
  }

  console.log('\nSeeding Junior Coordinators...');
  for (const user of juniorCoordinators) {
    await seedUser(user.name, user.email, 'junior_coordinator');
  }

  const total = seniorCoordinators.length + juniorCoordinators.length;
  console.log(`\nDone. Processed ${total} coordinators.\n`);
  process.exit(0);
}

seed().catch((error) => {
  console.error('Seeding failed:', error);
  process.exit(1);
});
