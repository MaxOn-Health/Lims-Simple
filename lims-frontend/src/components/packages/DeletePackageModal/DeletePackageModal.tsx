'use client';

import React from 'react';
import { Modal } from '@/components/common/Modal';
import { Button } from '@/components/common/Button/Button';

interface DeletePackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  packageName: string;
  isLoading?: boolean;
}

export const DeletePackageModal: React.FC<DeletePackageModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  packageName,
  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Delete Package" size="md">
      <div className="mt-4">
        <p className="text-sm text-gray-700">
          Are you sure you want to delete{' '}
          <span className="font-semibold">{packageName}</span>? This action cannot
          be undone.
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

