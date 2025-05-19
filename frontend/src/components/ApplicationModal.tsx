import React from 'react';
import { JobApplication } from '../utils/mockData';
import Modal from './Modal';
import ApplicationDetailForm from './ApplicationDetailForm';
interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  application?: JobApplication;
  onSave: (application: JobApplication) => void;
}
const ApplicationModal = ({
  isOpen,
  onClose,
  application,
  onSave
}: ApplicationModalProps) => {
  const isNewApplication = !application;
  const defaultApplication: JobApplication = {
    id: Math.random().toString(),
    jobId: '',
    position: '',
    applyDate: new Date().toISOString().split('T')[0],
    resume: {
      url: '',
      isTailored: false
    },
    coverLetter: {
      url: '',
      isTailored: false
    },
    applicationSite: '',
    jobDescription: '',
    location: '',
    referralStatus: false,
    responseDate: null,
    status: 'Saved',
    stage: 'Applied',
    aiGeneratedText: null,
    connectionsSent: 0,
    notes: '',
    followUps: []
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={isNewApplication ? 'Add New Application' : 'Edit Application'}>
      <ApplicationDetailForm application={application || defaultApplication} onUpdate={onSave} />
      <div className="mt-6 flex justify-end space-x-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Cancel
        </button>
        <button onClick={() => {
        onSave(application || defaultApplication);
        onClose();
      }} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {isNewApplication ? 'Add Application' : 'Save Changes'}
        </button>
      </div>
    </Modal>;
};
export default ApplicationModal;