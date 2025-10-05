
export interface UserFormData {
  firstName: string;
  lastName: string;
  name: string; // computed field
  email: string;
  phone: string;
  company: string;
  jobTitle: string;
  securityConcerns: string;
}

export interface AnalysisMetadata {
  submissionTime: string;
  platform: string;
  analysisId?: string;
  riskScore?: number;
}

export const downloadSQL = (formData: UserFormData, metadata: AnalysisMetadata) => {
  const analysisId = `ANALYSIS_${Date.now()}`;
  const riskScore = generateRiskScore(formData.email);
  
  const sqlContent = `-- Security Analysis Platform Database Export
-- Generated on: ${metadata.submissionTime}
-- Analysis ID: ${analysisId}
-- User: ${formData.email}

-- Create database schema
CREATE DATABASE IF NOT EXISTS security_analysis_platform;
USE security_analysis_platform;

-- User information table
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(255) UNIQUE,
    phone VARCHAR(20),
    company VARCHAR(255),
    job_title VARCHAR(255),
    security_concerns TEXT,
    risk_score DECIMAL(5,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events table
CREATE TABLE IF NOT EXISTS security_events (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    timestamp TIMESTAMP,
    event_type VARCHAR(100),
    source VARCHAR(100),
    description TEXT,
    severity ENUM('low', 'medium', 'high', 'critical'),
    ip_address VARCHAR(45),
    location VARCHAR(255),
    status VARCHAR(50),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Threat detection table
CREATE TABLE IF NOT EXISTS threat_detections (
    id VARCHAR(50) PRIMARY KEY,
    user_id VARCHAR(50),
    threat_type VARCHAR(100),
    confidence_score DECIMAL(5,2),
    detected_at TIMESTAMP,
    mitigated BOOLEAN DEFAULT FALSE,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Insert user data
INSERT INTO users (id, first_name, last_name, email, phone, company, job_title, security_concerns, risk_score) 
VALUES (
    '${analysisId}',
    '${formData.firstName.replace(/'/g, "''")}',
    '${formData.lastName.replace(/'/g, "''")}',
    '${formData.email}',
    '${formData.phone}',
    '${formData.company.replace(/'/g, "''")}',
    '${formData.jobTitle.replace(/'/g, "''")}',
    '${formData.securityConcerns.replace(/'/g, "''")}',
    ${riskScore}
);

-- Insert personalized security events
${generateSecurityEvents(analysisId, formData.email)}

-- Insert threat detections
${generateThreatDetections(analysisId, formData.email)}

-- Analysis summary
SELECT 
    'SECURITY ANALYSIS COMPLETE' as status,
    email,
    risk_score,
    COUNT(se.id) as total_events,
    COUNT(td.id) as threats_detected
FROM users u
LEFT JOIN security_events se ON u.id = se.user_id
LEFT JOIN threat_detections td ON u.id = td.user_id
WHERE u.id = '${analysisId}'
GROUP BY u.id, u.email, u.risk_score;
`;

  const blob = new Blob([sqlContent], { type: 'application/sql' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `security_analysis_${formData.firstName}_${formData.lastName}_${Date.now()}.sql`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateRiskScore = (email: string): number => {
  // Generate risk score based on email patterns
  let score = Math.random() * 30 + 10; // Base score 10-40
  
  if (email.includes('admin') || email.includes('root')) score += 20;
  if (email.includes('.gov') || email.includes('.mil')) score += 15;
  if (email.includes('temp') || email.includes('test')) score += 25;
  if (email.length < 10) score += 10;
  
  return Math.min(100, Math.round(score * 100) / 100);
};

const generateSecurityEvents = (userId: string, email: string): string => {
  const events = [
    {
      id: `SE_Login_${Date.now()}`,
      type: 'Authentication Success',
      severity: 'low',
      description: `Successful login for ${email}`,
      location: 'Unknown Location'
    },
    {
      id: `SE_Anomaly_${Date.now() + 1}`,
      type: 'Behavioral Anomaly',
      severity: 'medium',
      description: 'Unusual access pattern detected',
      location: 'Multiple Locations'
    },
    {
      id: `SE_Threat_${Date.now() + 2}`,
      type: 'Potential Threat',
      severity: 'high',
      description: 'Suspicious activity detected from new device',
      location: 'Unknown Location'
    }
  ];

  return events.map(event => `
INSERT INTO security_events (id, user_id, timestamp, event_type, source, description, severity, ip_address, location, status)
VALUES (
    '${event.id}',
    '${userId}',
    NOW(),
    '${event.type}',
    'Security Analysis Platform',
    '${event.description}',
    '${event.severity}',
    '${generateRandomIP()}',
    '${event.location}',
    'detected'
);`).join('\n');
};

const generateThreatDetections = (userId: string, email: string): string => {
  const threats = [
    { type: 'Phishing Attempt', confidence: 85.5 },
    { type: 'Malware Detection', confidence: 72.3 },
    { type: 'Suspicious Login', confidence: 91.2 }
  ];

  return threats.map((threat, index) => `
INSERT INTO threat_detections (id, user_id, threat_type, confidence_score, detected_at, mitigated)
VALUES (
    'TD_${Date.now() + index}',
    '${userId}',
    '${threat.type}',
    ${threat.confidence},
    NOW(),
    ${Math.random() > 0.5}
);`).join('\n');
};

const generateRandomIP = (): string => {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
};
