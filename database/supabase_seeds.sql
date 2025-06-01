-- supabase_seeds.sql
-- Run this in your Supabase SQL editor to create initial job sources

-- Insert job sources for LinkedIn and Indeed
INSERT INTO jobs_source (id, name, url, description, is_active, jobspy_site_name, created_at, updated_at) VALUES
(
    gen_random_uuid(),
    'LinkedIn',
    'https://linkedin.com',
    'Professional networking platform with job listings',
    true,
    'linkedin',
    NOW(),
    NOW()
),
(
    gen_random_uuid(),
    'Indeed',
    'https://indeed.ca',
    'Popular job search engine',
    true,
    'indeed',
    NOW(),
    NOW()
);

-- Insert some common job categories
INSERT INTO jobs_jobcategory (name) VALUES
('Software Engineering'),
('Data Science'),
('Product Management'),
('Marketing'),
('Sales'),
('Design'),
('Operations'),
('Finance'),
('Human Resources'),
('Customer Success')
ON CONFLICT (name) DO NOTHING;

-- Insert some common job tags/skills
INSERT INTO jobs_jobtag (name) VALUES
('Python'),
('JavaScript'),
('React'),
('Node.js'),
('SQL'),
('Machine Learning'),
('AWS'),
('Docker'),
('Kubernetes'),
('Git'),
('Agile'),
('Scrum'),
('Product Management'),
('Data Analysis'),
('Communication'),
('Leadership'),
('Problem Solving'),
('Team Collaboration')
ON CONFLICT (name) DO NOTHING;