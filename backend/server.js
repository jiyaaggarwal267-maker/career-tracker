import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Get current directory (ES Module equivalent of __dirname)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 5001;
const DATA_FILE = path.join(__dirname, 'data', 'applications.json');

// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// ============================================
// HELPER FUNCTIONS
// ============================================
async function initDataFile() {
  try {
    await fs.access(DATA_FILE);
    console.log('✅ Data file exists');
  } catch {
    console.log('📁 Creating data directory and file...');
    await fs.mkdir(path.dirname(DATA_FILE), { recursive: true });

    const sampleData = [
      {
        id: 1,
        company: 'Google',
        role: 'Senior Frontend Developer',
        date: '2026-01-10',
        status: 'Interview',
        location: 'Gurgaon,India',
        notes: 'Technical round scheduled for next week. Focus on system design and React architecture. Team seems great!'
      },
      {
        id: 2,
        company: 'Meta',
        role: 'Full Stack Engineer Intern',
        date: '2026-01-08',
        status: 'Applied',
        location: 'Delhi,India',
        notes: 'Interesting AR/VR projects. Submitted portfolio showcasing React and Node.js work.'
      },
      {
        id: 3,
        company: 'Netflix',
        role: 'Software Engineer',
        date: '2026-01-05',
        status: 'Offer',
        location: 'Ahmedabad,Gujarat',
        notes: 'Received offer! Great team culture and exciting streaming technology projects. Compensation package is competitive.'
      },
      {
        id: 4,
        company: 'Amazon',
        role: 'SDE Intern',
        date: '2026-01-03',
        status: 'Rejected',
        location: 'Gurgaon,India',
        notes: 'Made it to final round but position filled. Good interview experience overall. Will apply again next cycle.'
      },
      {
        id: 5,
        company: 'Microsoft',
        role: 'Cloud Engineer',
        date: '2026-01-12',
        status: 'Applied',
        location: 'Redmond, WA',
        notes: 'Azure platform team. Recruiter reached out via LinkedIn. Application submitted with referral.'
      }
    ];

    await fs.writeFile(DATA_FILE, JSON.stringify(sampleData, null, 2));
    console.log('✅ Data file created with sample data');
  }
}

async function readData() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Error reading data:', error);
    return [];
  }
}

async function writeData(data) {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error writing data:', error);
    throw error;
  }
}

function validateApplication(data) {
  const errors = [];
  const validStatuses = ['Applied', 'Interview', 'Offer', 'Rejected'];

  if (!data.company || typeof data.company !== 'string' || data.company.trim() === '') {
    errors.push('Company name is required');
  }

  if (!data.role || typeof data.role !== 'string' || data.role.trim() === '') {
    errors.push('Role is required');
  }

  if (!data.date || isNaN(Date.parse(data.date))) {
    errors.push('Valid date is required');
  }

  if (!data.status || !validStatuses.includes(data.status)) {
    errors.push('Status must be one of: Applied, Interview, Offer, Rejected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// ============================================
// API ROUTES
// ============================================

// Root route - added safely
app.get('/', (req, res) => {
  res.send('🚀 Welcome to Career Tracker API! Use /api/applications, /api/stats or /health');
});

app.get('/api/applications', async (req, res) => {
  try {
    let applications = await readData();

    if (req.query.status && req.query.status !== 'All') {
      applications = applications.filter(app => app.status === req.query.status);
    }

    if (req.query.sort) {
      applications.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        return req.query.sort === 'asc' ? dateA - dateB : dateB - dateA;
      });
    }

    res.json(applications);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch applications', message: error.message });
  }
});

app.get('/api/applications/:id', async (req, res) => {
  try {
    const applications = await readData();
    const appData = applications.find(a => a.id === parseInt(req.params.id));

    if (!appData) {
      return res.status(404).json({ error: 'Application not found', id: req.params.id });
    }

    res.json(appData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch application', message: error.message });
  }
});

app.post('/api/applications', async (req, res) => {
  try {
    const validation = validateApplication(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const applications = await readData();
    const newApp = { id: Date.now(), ...req.body };
    applications.push(newApp);
    await writeData(applications);
    res.status(201).json(newApp);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create application', message: error.message });
  }
});

app.put('/api/applications/:id', async (req, res) => {
  try {
    const validation = validateApplication(req.body);
    if (!validation.isValid) {
      return res.status(400).json({ error: 'Validation failed', errors: validation.errors });
    }

    const applications = await readData();
    const index = applications.findIndex(a => a.id === parseInt(req.params.id));
    if (index === -1) return res.status(404).json({ error: 'Application not found', id: req.params.id });

    applications[index] = { id: parseInt(req.params.id), ...req.body };
    await writeData(applications);
    res.json(applications[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update application', message: error.message });
  }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    const applications = await readData();
    const filtered = applications.filter(a => a.id !== parseInt(req.params.id));
    if (filtered.length === applications.length)
      return res.status(404).json({ error: 'Application not found', id: req.params.id });

    await writeData(filtered);
    res.json({ success: true, message: 'Application deleted successfully', id: parseInt(req.params.id) });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete application', message: error.message });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    const applications = await readData();
    const stats = {
      total: applications.length,
      applied: applications.filter(a => a.status === 'Applied').length,
      interview: applications.filter(a => a.status === 'Interview').length,
      offer: applications.filter(a => a.status === 'Offer').length,
      rejected: applications.filter(a => a.status === 'Rejected').length,
      successRate:
        applications.length > 0
          ? ((applications.filter(a => a.status === 'Offer').length / applications.length) * 100).toFixed(2) + '%'
          : '0%'
    };
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch statistics', message: error.message });
  }
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running', timestamp: new Date().toISOString() });
});

// Catch-all 404 route
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.path, method: req.method });
});

// Error-handling middleware
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
await initDataFile();
app.listen(PORT, () => {
  console.log(`🚀 Career Tracker API running on http://localhost:${PORT}`);
});
