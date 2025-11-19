'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button/Button';

interface DeleteTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  testName: string;
  isLoading?: boolean;
}

export const DeleteTestModal: React.FC<DeleteTestModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  testName,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Test" size="md">
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{testName}</span>? This action cannot
          be undone.
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Note: If this test is used in any packages, deletion may fail.
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
          Delete
        </Button>
      </div>
    </Modal>
  );
};

