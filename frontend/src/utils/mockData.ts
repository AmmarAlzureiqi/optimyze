// Mock data for the job search platform
export interface Job {
  id: string;
  title: string;
  company: string;
  location: string;
  salary: string;
  type: string; // Full-time, Part-time, Contract, etc.
  description: string;
  requirements: string[];
  posted: string; // Date string
  industry: string;
  logo: string; // URL to company logo
}
export interface NetworkContact {
  id: string;
  name: string;
  position: string;
  company: string;
  connectionType: string; // Recruiter, Hiring Manager, Potential Referral
  linkedinUrl: string;
  referralReceived: boolean;
  connectionSent: boolean;
  connectionAccepted: boolean;
  referralStatus: 'None' | 'Requested' | 'Received' | 'Declined';
  totalDMSent: number;
  totalAccept: number;
  totalReplies: number;
  totalReferrals: number;
  conversionRate: number;
  jobsApplied: number;
  notes: string;
  lastUpdated: string;
  avatar: string; // URL to avatar
}
export interface JobApplication {
  id: string;
  jobId: string;
  position: string;
  applyDate: string;
  resume: {
    url: string;
    isTailored: boolean;
  };
  coverLetter: {
    url: string;
    isTailored: boolean;
  };
  applicationSite: string;
  jobDescription: string;
  location: string;
  referralStatus: boolean;
  responseDate: string | null;
  status: 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Saved';
  stage: string;
  aiGeneratedText: string | null;
  connectionsSent: number;
  notes: string;
  followUps: {
    date: string;
    notes: string;
  }[];
}
export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  location: string;
  title: string;
  summary: string;
  skills: string[];
  experience: {
    title: string;
    company: string;
    location: string;
    startDate: string;
    endDate: string;
    description: string;
  }[];
  education: {
    degree: string;
    institution: string;
    location: string;
    graduationDate: string;
  }[];
}
// Mock jobs data
export const jobs: Job[] = [{
  id: "1",
  title: "Senior Frontend Developer",
  company: "TechCorp",
  location: "San Francisco, CA (Remote)",
  salary: "$120,000 - $150,000",
  type: "Full-time",
  description: "We're looking for a senior frontend developer to join our team and help build our next-generation web applications.",
  requirements: ["5+ years of experience with React", "Strong TypeScript skills", "Experience with state management", "Knowledge of modern CSS practices"],
  posted: "2023-06-15",
  industry: "Technology",
  logo: "https://images.unsplash.com/photo-1549082984-1323b94df9a6?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "2",
  title: "Product Manager",
  company: "InnovateCo",
  location: "New York, NY",
  salary: "$130,000 - $160,000",
  type: "Full-time",
  description: "Lead product development initiatives for our SaaS platform, working closely with engineering, design, and marketing teams.",
  requirements: ["3+ years of product management experience", "Strong analytical and problem-solving skills", "Excellent communication abilities", "Experience in B2B software products"],
  posted: "2023-06-18",
  industry: "Software",
  logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "3",
  title: "Data Scientist",
  company: "DataInsight",
  location: "Remote",
  salary: "$110,000 - $140,000",
  type: "Full-time",
  description: "Join our data science team to develop machine learning models and extract insights from large datasets.",
  requirements: ["MS or PhD in Computer Science, Statistics, or related field", "Experience with Python, R, and SQL", "Knowledge of machine learning algorithms", "Experience with data visualization tools"],
  posted: "2023-06-20",
  industry: "Data Science",
  logo: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "4",
  title: "UX/UI Designer",
  company: "DesignFirst",
  location: "Austin, TX (Hybrid)",
  salary: "$90,000 - $120,000",
  type: "Full-time",
  description: "Create beautiful, intuitive user experiences for our clients across various industries.",
  requirements: ["3+ years of UX/UI design experience", "Proficiency in Figma, Sketch, or Adobe XD", "Portfolio demonstrating user-centered design approach", "Experience conducting user research and usability testing"],
  posted: "2023-06-22",
  industry: "Design",
  logo: "https://images.unsplash.com/photo-1560179707-f14e90ef3623?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "5",
  title: "DevOps Engineer",
  company: "CloudSystems",
  location: "Seattle, WA",
  salary: "$125,000 - $155,000",
  type: "Full-time",
  description: "Build and maintain our cloud infrastructure, implement CI/CD pipelines, and ensure system reliability.",
  requirements: ["Experience with AWS, Azure, or GCP", "Knowledge of Docker and Kubernetes", "Proficiency in infrastructure as code (Terraform, CloudFormation)", "Strong scripting skills (Python, Bash)"],
  posted: "2023-06-25",
  industry: "Cloud Computing",
  logo: "https://images.unsplash.com/photo-1529612700005-e35377bf1415?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}];
// Mock network contacts
export const networkContacts: NetworkContact[] = [{
  id: "1",
  name: "Sarah Johnson",
  position: "Technical Recruiter",
  company: "TechCorp",
  connectionType: "Recruiter",
  linkedinUrl: "https://linkedin.com/in/sarahjohnson",
  referralReceived: true,
  connectionSent: true,
  connectionAccepted: true,
  referralStatus: "Received",
  totalDMSent: 3,
  totalAccept: 1,
  totalReplies: 2,
  totalReferrals: 1,
  conversionRate: 0.33,
  jobsApplied: 2,
  notes: "Met at the tech conference last month. She's looking for React developers.",
  lastUpdated: "2023-06-18",
  avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "2",
  name: "Michael Chen",
  position: "Engineering Manager",
  company: "InnovateCo",
  connectionType: "Hiring Manager",
  linkedinUrl: "https://linkedin.com/in/michaelchen",
  referralReceived: false,
  connectionSent: false,
  connectionAccepted: false,
  referralStatus: "None",
  totalDMSent: 0,
  totalAccept: 0,
  totalReplies: 0,
  totalReferrals: 0,
  conversionRate: 0,
  jobsApplied: 0,
  notes: "Former colleague at StartupX. His team is expanding and hiring frontend developers.",
  lastUpdated: "2023-06-18",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}, {
  id: "3",
  name: "Emily Rodriguez",
  position: "Senior Software Engineer",
  company: "DataInsight",
  connectionType: "Potential Referral",
  linkedinUrl: "https://linkedin.com/in/emilyrodriguez",
  referralReceived: true,
  connectionSent: true,
  connectionAccepted: true,
  referralStatus: "Received",
  totalDMSent: 3,
  totalAccept: 1,
  totalReplies: 2,
  totalReferrals: 1,
  conversionRate: 0.33,
  jobsApplied: 2,
  notes: "Connected on LinkedIn after participating in the same online hackathon. She mentioned her company is hiring.",
  lastUpdated: "2023-06-18",
  avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=100&q=80"
}];
// Mock job applications
export const jobApplications: JobApplication[] = [{
  id: "1",
  jobId: "1",
  position: "Senior Frontend Developer",
  applyDate: "2023-06-16",
  resume: {
    url: "resume_v1.pdf",
    isTailored: true
  },
  coverLetter: {
    url: "cover_letter_v1.pdf",
    isTailored: true
  },
  applicationSite: "Company Website",
  jobDescription: "We're looking for a senior frontend developer to join our team...",
  location: "San Francisco, CA",
  referralStatus: true,
  responseDate: "2023-06-18",
  status: "Interview",
  stage: "Technical Interview",
  aiGeneratedText: "Generated custom introduction...",
  connectionsSent: 3,
  notes: "Phone interview scheduled for June 20th",
  followUps: [{
    date: "2023-06-18",
    notes: "Sent thank you email to recruiter"
  }]
}, {
  id: "2",
  jobId: "3",
  status: "Applied",
  dateApplied: "2023-06-21",
  notes: "Applied through company website",
  followUps: []
}, {
  id: "3",
  jobId: "5",
  status: "Saved",
  dateApplied: "",
  notes: "Waiting for updated resume before applying",
  followUps: []
}];
// Mock user profile
export const userProfile: UserProfile = {
  name: "Alex Taylor",
  email: "alex.taylor@example.com",
  phone: "(555) 123-4567",
  location: "San Francisco, CA",
  title: "Senior Frontend Developer",
  summary: "Experienced frontend developer with 6+ years of experience building responsive and accessible web applications using React and TypeScript.",
  skills: ["React", "TypeScript", "JavaScript", "HTML5", "CSS3", "Redux", "GraphQL", "Jest", "Cypress", "Webpack"],
  experience: [{
    title: "Senior Frontend Developer",
    company: "WebTech Solutions",
    location: "San Francisco, CA",
    startDate: "2020-03",
    endDate: "Present",
    description: "Lead frontend development for multiple client projects, mentored junior developers, and improved build processes to reduce deployment time by 40%."
  }, {
    title: "Frontend Developer",
    company: "StartupX",
    location: "Oakland, CA",
    startDate: "2017-06",
    endDate: "2020-02",
    description: "Developed and maintained multiple React applications, collaborated with designers to implement UI/UX improvements, and participated in code reviews."
  }],
  education: [{
    degree: "B.S. Computer Science",
    institution: "University of California, Berkeley",
    location: "Berkeley, CA",
    graduationDate: "2017"
  }]
};
// Job industry options for filtering
export const industries = ["Technology", "Software", "Data Science", "Design", "Cloud Computing", "Marketing", "Finance", "Healthcare", "Education", "Retail"];
// Job type options for filtering
export const jobTypes = ["Full-time", "Part-time", "Contract", "Internship", "Remote", "Hybrid"];
// Job locations for filtering
export const locations = ["San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA", "Remote", "Boston, MA", "Chicago, IL", "Los Angeles, CA"];
// Analytics data
export const analyticsData = {
  applicationsByStatus: [{
    name: "Applied",
    value: 12
  }, {
    name: "Interview",
    value: 5
  }, {
    name: "Offer",
    value: 1
  }, {
    name: "Rejected",
    value: 3
  }, {
    name: "Saved",
    value: 7
  }],
  applicationsByWeek: [{
    week: "Week 1",
    count: 3
  }, {
    week: "Week 2",
    count: 5
  }, {
    week: "Week 3",
    count: 7
  }, {
    week: "Week 4",
    count: 2
  }],
  jobTrendsByIndustry: [{
    industry: "Technology",
    openings: 450,
    growth: "+15%"
  }, {
    industry: "Healthcare",
    openings: 320,
    growth: "+8%"
  }, {
    industry: "Finance",
    openings: 280,
    growth: "+5%"
  }, {
    industry: "Education",
    openings: 150,
    growth: "+2%"
  }, {
    industry: "Retail",
    openings: 200,
    growth: "-3%"
  }]
};