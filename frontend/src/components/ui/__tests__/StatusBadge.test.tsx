/**
 * Tests for StatusBadge component
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  StatusBadge,
  ActiveBadge,
  InactiveBadge,
  PendingBadge,
  SuccessBadge,
  ErrorBadge,
} from '../StatusBadge';

// Mock Ant Design theme
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  theme: {
    useToken: () => ({
      token: {
        colorSuccess: '#52c41a',
        colorTextSecondary: '#666666',
        colorWarning: '#faad14',
        colorPrimary: '#1890ff',
        colorError: '#ff4d4f',
      },
    }),
  },
}));

describe('StatusBadge', () => {
  it('should render status text', () => {
    render(<StatusBadge status="active" />);

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should render custom text when provided', () => {
    render(<StatusBadge status="success" text="Completed" />);

    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByText('success')).not.toBeInTheDocument();
  });

  it('should render active status', () => {
    const { container } = render(<StatusBadge status="active" />);

    const badge = container.querySelector('.ant-tag');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('active');
  });

  it('should render inactive status', () => {
    const { container } = render(<StatusBadge status="inactive" />);

    const badge = container.querySelector('.ant-tag');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('inactive');
  });

  it('should render pending status', () => {
    const { container } = render(<StatusBadge status="pending" />);

    const badge = container.querySelector('.ant-tag');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('pending');
  });

  it('should render processing status', () => {
    render(<StatusBadge status="processing" />);

    expect(screen.getByText('processing')).toBeInTheDocument();
  });

  it('should render success status', () => {
    render(<StatusBadge status="success" />);

    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should render warning status', () => {
    render(<StatusBadge status="warning" />);

    expect(screen.getByText('warning')).toBeInTheDocument();
  });

  it('should render error status', () => {
    render(<StatusBadge status="error" />);

    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('should render custom status', () => {
    render(<StatusBadge status="custom-status" />);

    expect(screen.getByText('custom-status')).toBeInTheDocument();
  });

  it('should pass additional props to Tag', () => {
    const { container } = render(
      <StatusBadge status="active" data-testid="status-badge" />
    );

    const badge = container.querySelector('[data-testid="status-badge"]');
    expect(badge).toBeInTheDocument();
  });
});

describe('Pre-configured Status Badges', () => {
  it('should render ActiveBadge', () => {
    render(<ActiveBadge />);

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('should render ActiveBadge with custom text', () => {
    render(<ActiveBadge text="Online" />);

    expect(screen.getByText('Online')).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('should render InactiveBadge', () => {
    render(<InactiveBadge />);

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('should render InactiveBadge with custom text', () => {
    render(<InactiveBadge text="Offline" />);

    expect(screen.getByText('Offline')).toBeInTheDocument();
  });

  it('should render PendingBadge', () => {
    render(<PendingBadge />);

    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should render SuccessBadge', () => {
    render(<SuccessBadge />);

    expect(screen.getByText('Success')).toBeInTheDocument();
  });

  it('should render ErrorBadge', () => {
    render(<ErrorBadge />);

    expect(screen.getByText('Error')).toBeInTheDocument();
  });
});
