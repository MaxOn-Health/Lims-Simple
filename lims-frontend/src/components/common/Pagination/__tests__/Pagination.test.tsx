import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Pagination } from '@/components/common/Pagination/Pagination';

describe('Pagination', () => {
  const defaultProps = {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    itemsPerPage: 10,
    onPageChange: jest.fn(),
    onItemsPerPageChange: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders pagination controls', () => {
    render(<Pagination {...defaultProps} />);
    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
    expect(screen.getByText('Showing 1 to 10 of 50 results')).toBeInTheDocument();
  });

  it('disables Previous button on first page', () => {
    render(<Pagination {...defaultProps} currentPage={1} />);
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toBeDisabled();
  });

  it('disables Next button on last page', () => {
    render(<Pagination {...defaultProps} currentPage={5} />);
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });

  it('calls onPageChange when clicking Next', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} onPageChange={onPageChange} />);
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('calls onPageChange when clicking Previous', () => {
    const onPageChange = jest.fn();
    render(<Pagination {...defaultProps} currentPage={2} onPageChange={onPageChange} />);
    const prevButton = screen.getByText('Previous');
    fireEvent.click(prevButton);
    expect(onPageChange).toHaveBeenCalledWith(1);
  });

  it('calls onItemsPerPageChange when changing page size', () => {
    const onItemsPerPageChange = jest.fn();
    render(<Pagination {...defaultProps} onItemsPerPageChange={onItemsPerPageChange} />);
    const select = screen.getByLabelText('Per page:');
    fireEvent.change(select, { target: { value: '20' } });
    expect(onItemsPerPageChange).toHaveBeenCalledWith(20);
  });

  it('displays correct page numbers', () => {
    render(<Pagination {...defaultProps} currentPage={3} totalPages={5} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('handles empty results', () => {
    render(<Pagination {...defaultProps} totalItems={0} totalPages={0} />);
    expect(screen.getByText('Showing 0 to 0 of 0 results')).toBeInTheDocument();
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
  });
});

