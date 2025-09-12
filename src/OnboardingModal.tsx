import React from "react";

interface OnboardingModalProps {
  open: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60"
      role="dialog"
      aria-modal="true"
      aria-label="Onboarding instructions"
    >
      <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
          aria-label="Close onboarding modal"
        >
          ×
        </button>
        <div className="flex flex-col items-center">
          <img src="/ws-logo.svg" alt="Western & Southern Financial Group logo" className="mb-4 w-20 h-20" />
          <h2 className="text-xl font-bold mb-2 text-blue-900">Welcome to Your Interview Experience</h2>
          <p className="mb-2 text-gray-700 text-center">
            This interactive interview will analyze your audio responses for clarity, sentiment, and emotional intelligence. Your privacy is important—your voice data is securely processed and never shared outside Western & Southern.
          </p>
          <ul className="mb-4 text-left text-gray-600 text-sm list-disc pl-5">
            <li>Ensure your microphone is enabled and working.</li>
            <li>Respond naturally and clearly to each prompt.</li>
            <li>You can review your analysis at the end.</li>
          </ul>
          <button
            onClick={onClose}
            className="mt-2 px-6 py-2 rounded bg-blue-900 text-white font-semibold hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
            aria-label="Start interview"
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};

export default OnboardingModal;
