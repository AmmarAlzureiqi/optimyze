import React, { useState } from 'react';
import { userProfile } from '../utils/mockData';
import { DownloadIcon, RefreshCwIcon, FileTextIcon } from 'lucide-react';
const ResumeBuilder = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedResume, setGeneratedResume] = useState('');
  const [generatedCoverLetter, setGeneratedCoverLetter] = useState('');
  const [activeTab, setActiveTab] = useState('resume');
  const handleGenerate = () => {
    if (!jobDescription) return;
    setIsGenerating(true);
    // Simulate AI generation with a timeout
    setTimeout(() => {
      setGeneratedResume(`# ${userProfile.name}
${userProfile.email} | ${userProfile.phone} | ${userProfile.location}
## Professional Summary
${userProfile.summary}
## Skills
${userProfile.skills.join(', ')}
## Experience
${userProfile.experience.map(exp => `
### ${exp.title}
${exp.company} | ${exp.location} | ${exp.startDate} - ${exp.endDate}
${exp.description}
`).join('\n')}
## Education
${userProfile.education.map(edu => `
### ${edu.degree}
${edu.institution} | ${edu.location} | ${edu.graduationDate}
`).join('\n')}
`);
      setGeneratedCoverLetter(`Dear Hiring Manager,
I am writing to express my interest in the position you've posted. With my background in frontend development and experience building responsive web applications, I believe I would be a valuable addition to your team.
My experience at WebTech Solutions has equipped me with the skills necessary to excel in this role. I've led frontend development for multiple client projects, mentored junior developers, and improved build processes to reduce deployment time by 40%.
I'm particularly excited about the opportunity to work on projects that focus on user experience and accessibility, which align perfectly with my professional interests and expertise.
Thank you for considering my application. I look forward to the possibility of discussing how my skills and experiences can contribute to your team's success.
Sincerely,
${userProfile.name}`);
      setIsGenerating(false);
    }, 2000);
  };
  return <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Resume & Cover Letter Builder
        </h1>
        <p className="text-gray-600 mt-2">
          Create tailored documents for your job applications
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input Section */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Job Description
          </h2>
          <p className="text-gray-600 mb-4">
            Paste the job description below, and our AI will generate a tailored
            resume and cover letter.
          </p>
          <textarea className="w-full h-64 p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500" placeholder="Paste job description here..." value={jobDescription} onChange={e => setJobDescription(e.target.value)}></textarea>
          <button className="mt-4 w-full inline-flex justify-center items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-blue-300 disabled:cursor-not-allowed" onClick={handleGenerate} disabled={!jobDescription || isGenerating}>
            {isGenerating ? <>
                <RefreshCwIcon className="animate-spin h-5 w-5 mr-2" />
                Generating...
              </> : 'Generate Resume & Cover Letter'}
          </button>
        </div>
        {/* Output Section */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-200">
            <button className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'resume' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('resume')}>
              Resume
            </button>
            <button className={`flex-1 py-4 px-1 text-center border-b-2 font-medium text-sm ${activeTab === 'coverLetter' ? 'border-blue-500 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`} onClick={() => setActiveTab('coverLetter')}>
              Cover Letter
            </button>
          </div>
          {/* Content */}
          <div className="p-6">
            {activeTab === 'resume' ? <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Tailored Resume
                  </h2>
                  {generatedResume && <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>}
                </div>
                {generatedResume ? <div className="prose prose-sm max-w-none whitespace-pre-line">
                    {generatedResume}
                  </div> : <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FileTextIcon className="h-12 w-12 mb-2" />
                    <p>Your tailored resume will appear here</p>
                  </div>}
              </> : <>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Cover Letter
                  </h2>
                  {generatedCoverLetter && <button className="inline-flex items-center px-3 py-1 border border-gray-300 text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50">
                      <DownloadIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>}
                </div>
                {generatedCoverLetter ? <div className="prose prose-sm max-w-none whitespace-pre-line">
                    {generatedCoverLetter}
                  </div> : <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                    <FileTextIcon className="h-12 w-12 mb-2" />
                    <p>Your tailored cover letter will appear here</p>
                  </div>}
              </>}
          </div>
        </div>
      </div>
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Saved Documents
        </h2>
        {/* Empty state */}
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <FileTextIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No saved documents
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Your generated resumes and cover letters will be saved here
            temporarily.
          </p>
        </div>
      </div>
    </div>;
};
export default ResumeBuilder;