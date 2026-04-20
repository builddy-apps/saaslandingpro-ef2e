import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'app.db');
const db = new Database(DB_PATH);

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Check if data already exists
const count = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get();
if (count.count > 0) {
  console.log('Data already seeded, skipping...');
  db.close();
  process.exit(0);
}

// Prepare subscriber data with realistic information
const subscribers = [
  {
    email: 'sarah.chen@techstartup.io',
    source: 'landing',
    daysAgo: 28,
    isActive: true
  },
  {
    email: 'marcus.johnson@gmail.com',
    source: 'landing',
    daysAgo: 27,
    isActive: true
  },
  {
    email: 'elena.rodriguez@company.org',
    source: 'popup',
    daysAgo: 26,
    isActive: true
  },
  {
    email: 'james.obrien@designstudio.co',
    source: 'footer',
    daysAgo: 25,
    isActive: true
  },
  {
    email: 'priya.patel@enterprise.com',
    source: 'landing',
    daysAgo: 24,
    isActive: true
  },
  {
    email: 'alex.kowalski@freelance.dev',
    source: 'social',
    daysAgo: 23,
    isActive: true
  },
  {
    email: 'maya.singh@digitalagency.io',
    source: 'referral',
    daysAgo: 22,
    isActive: true
  },
  {
    email: 'david.kim@startup.co',
    source: 'landing',
    daysAgo: 21,
    isActive: true
  },
  {
    email: 'olivia.martinez@product.team',
    source: 'blog',
    daysAgo: 20,
    isActive: true
  },
  {
    email: 'ryan.taylor@techcorp.com',
    source: 'popup',
    daysAgo: 19,
    isActive: true
  },
  {
    email: 'lisa.wang@innovation.lab',
    source: 'landing',
    daysAgo: 18,
    isActive: true
  },
  {
    email: 'chris.thompson@devshop.io',
    source: 'footer',
    daysAgo: 17,
    isActive: true
  },
  {
    email: 'anna.kovalenko@global.tech',
    source: 'social',
    daysAgo: 15,
    isActive: true
  },
  {
    email: 'michael.brown@saas.company',
    source: 'landing',
    daysAgo: 14,
    isActive: true
  },
  {
    email: 'sophie.dubois@agency.fr',
    source: 'referral',
    daysAgo: 12,
    isActive: true
  },
  {
    email: 'kevin.nguyen@mobilefirst.io',
    source: 'popup',
    daysAgo: 10,
    isActive: true
  },
  {
    email: 'rachel.green@marketplace.co',
    source: 'landing',
    daysAgo: 8,
    isActive: true
  },
  {
    email: 'tom.wilson@cloudnative.dev',
    source: 'blog',
    daysAgo: 6,
    isActive: true
  },
  {
    email: 'nina.petrova@datateam.org',
    source: 'footer',
    daysAgo: 4,
    isActive: true
  },
  {
    email: 'jorge.garcia@ux.studio',
    source: 'landing',
    daysAgo: 2,
    isActive: true
  },
  {
    email: 'emma.johnson@webflow.io',
    source: 'social',
    daysAgo: 1,
    isActive: true
  },
  {
    email: 'daniel.lee@platform.co',
    source: 'landing',
    daysAgo: 0,
    isActive: true
  },
  {
    email: 'unsubscribe.test@email.com',
    source: 'landing',
    daysAgo: 20,
    isActive: false
  },
  {
    email: 'old.subscriber@company.com',
    source: 'popup',
    daysAgo: 30,
    isActive: false
  }
];

// Insert all data in a transaction
const insertAll = db.transaction(() => {
  const insertStmt = db.prepare(`
    INSERT INTO newsletter_subscribers (email, source, subscribed_at, is_active)
    VALUES (?, ?, ?, ?)
  `);

  for (const subscriber of subscribers) {
    const subscribedAt = new Date(Date.now() - subscriber.daysAgo * 86400000).toISOString();
    insertStmt.run(subscriber.email, subscriber.source, subscribedAt, subscriber.isActive ? 1 : 0);
  }
});

// Execute the transaction
insertAll();

// Get final counts
const totalCount = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers').get().count;
const activeCount = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = 1').get().count;
const inactiveCount = db.prepare('SELECT COUNT(*) as count FROM newsletter_subscribers WHERE is_active = 0').get().count;

// Close the database connection
db.close();

// Summary output
console.log(`
✨ ApexLanding database seeded successfully!
   
   Newsletter Subscribers:
   - Total: ${totalCount}
   - Active: ${activeCount}
   - Inactive: ${inactiveCount}
   
   Sources: landing, popup, footer, blog, social, referral
   
   Subscribers span the last 30 days for realistic data distribution.
`);