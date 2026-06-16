const GIST_ID = process.env.GIST_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'hr@mega2025';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
        },
      });
      if (!response.ok) return res.status(200).json([]);
      const gist = await response.json();
      const content = gist.files?.['employees.json']?.content || '[]';
      const employees = JSON.parse(content);
      res.setHeader('Cache-Control', 'no-store');
      return res.status(200).json(employees);
    } catch (e) {
      return res.status(200).json([]);
    }
  }

  if (req.method === 'POST') {
    const { password, employees } = req.body;
    if (!password || password !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
    }
    if (!Array.isArray(employees)) {
      return res.status(400).json({ error: 'Invalid data' });
    }
    try {
      const response = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${GITHUB_TOKEN}`,
          Accept: 'application/vnd.github+json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          files: {
            'employees.json': { content: JSON.stringify(employees, null, 2) },
          },
        }),
      });
      if (!response.ok) {
        const err = await response.text();
        return res.status(500).json({ error: 'GitHub API error: ' + err });
      }
      return res.status(200).json({ success: true, count: employees.length });
    } catch (e) {
      return res.status(500).json({ error: e.message });
    }
  }

  return res.status(405).end();
}
