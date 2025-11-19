'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button';

interface RemoveTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  testName: string;
  isLoading?: boolean;
}

export const RemoveTestModal: React.FC<RemoveTestModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  testName,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Remove Test from Package" size="md">
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Are you sure you want to remove{' '}
          <span className="font-semibold">{testName}</span> from this package? This
          action cannot be undone.
        </p>
      </div>

      <div className="mt-6 flex justify-end gap-3">
        <Button variant="outline" onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={onConfirm}
          isLoading={isLoading}
          disabled={isLoading}
        >
          Remove
        </Button>
      </div>
    </Modal>
  );
};

