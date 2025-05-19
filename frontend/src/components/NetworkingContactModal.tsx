import React from 'react';
import { NetworkContact } from '../utils/mockData';
import Modal from './Modal';
import NetworkingContactForm from './NetworkingContactForm';
interface NetworkingContactModalProps {
  isOpen: boolean;
  onClose: () => void;
  contact?: NetworkContact;
  onSave: (contact: NetworkContact) => void;
}
const NetworkingContactModal = ({
  isOpen,
  onClose,
  contact,
  onSave
}: NetworkingContactModalProps) => {
  const isNewContact = !contact;
  const defaultContact: NetworkContact = {
    id: Math.random().toString(),
    name: '',
    position: '',
    company: '',
    connectionType: 'Potential Referral',
    linkedinUrl: '',
    referralReceived: false,
    connectionSent: false,
    connectionAccepted: false,
    referralStatus: 'None',
    totalDMSent: 0,
    totalAccept: 0,
    totalReplies: 0,
    totalReferrals: 0,
    conversionRate: 0,
    jobsApplied: 0,
    notes: '',
    lastUpdated: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'
  };
  return <Modal isOpen={isOpen} onClose={onClose} title={isNewContact ? 'Add New Contact' : 'Edit Contact'}>
      <NetworkingContactForm contact={contact || defaultContact} onUpdate={onSave} />
      <div className="mt-6 flex justify-end space-x-3">
        <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          Cancel
        </button>
        <button onClick={() => {
        onSave(contact || defaultContact);
        onClose();
      }} className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
          {isNewContact ? 'Add Contact' : 'Save Changes'}
        </button>
      </div>
    </Modal>;
};
export default NetworkingContactModal;