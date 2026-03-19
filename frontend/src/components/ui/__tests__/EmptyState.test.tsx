/**
 * Tests for EmptyState component
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  EmptyState,
  NoData,
  NoDatasets,
  NoSearchResults,
} from '../EmptyState';

// Mock Ant Design theme
jest.mock('antd', () => ({
  ...jest.requireActual('antd'),
  theme: {
    useToken: () => ({
      token: {
        colorTextTertiary: '#bfbfbf',
        paddingXL: 24,
        paddingLG: 16,
        marginLG: 24,
        marginXS: 8,
        fontSizeLG: 18,
        fontSizeSM: 14,
        colorText: '#000000',
        colorTextSecondary: '#666666',
      },
    }),
  },
}));

describe('EmptyState', () => {
  it('should render default empty state', () => {
    render(<EmptyState />);

    expect(screen.getByText('No Data')).toBeInTheDocument();
    expect(screen.getByText(/There is no data to display/)).toBeInTheDocument();
  });

  it('should render custom title and description', () => {
    render(
      <EmptyState
        title="Custom Title"
        description="Custom description text"
      />
    );

    expect(screen.getByText('Custom Title')).toBeInTheDocument();
    expect(screen.getByText('Custom description text')).toBeInTheDocument();
  });

  it('should render data type', () => {
    render(<EmptyState type="data" />);

    expect(screen.getByText('No Data Available')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating your first item.')).toBeInTheDocument();
  });

  it('should render datasets type', () => {
    render(<EmptyState type="datasets" />);

    expect(screen.getByText('No Datasets')).toBeInTheDocument();
    expect(screen.getByText(/Create your first dataset/)).toBeInTheDocument();
  });

  it('should render errors type', () => {
    render(<EmptyState type="errors" />);

    expect(screen.getByText('No Errors')).toBeInTheDocument();
    expect(screen.getByText(/Everything is working correctly/)).toBeInTheDocument();
  });

  it('should render search type', () => {
    render(<EmptyState type="search" />);

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
    expect(screen.getByText(/couldn't find anything/)).toBeInTheDocument();
  });

  it('should render action button when actionText and onAction provided', () => {
    const handleClick = jest.fn();

    render(
      <EmptyState
        actionText="Create Item"
        onAction={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Item' });
    expect(button).toBeInTheDocument();
  });

  it('should call onAction when button is clicked', () => {
    const handleClick = jest.fn();

    render(
      <EmptyState
        actionText="Create Item"
        onAction={handleClick}
      />
    );

    const button = screen.getByRole('button', { name: 'Create Item' });
    fireEvent.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not render action button when actionText is missing', () => {
    render(
      <EmptyState onAction={jest.fn()} />
    );

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should not render action button when onAction is missing', () => {
    render(<EmptyState actionText="Create Item" />);

    const button = screen.queryByRole('button');
    expect(button).not.toBeInTheDocument();
  });

  it('should render custom illustration', () => {
    const customIllustration = <div data-testid="custom-illustration">Custom Icon</div>;

    render(<EmptyState illustration={customIllustration} />);

    expect(screen.getByTestId('custom-illustration')).toBeInTheDocument();
    expect(screen.getByText('Custom Icon')).toBeInTheDocument();
  });
});

describe('Pre-configured Empty States', () => {
  it('should render NoData component', () => {
    render(<NoData />);

    expect(screen.getByText('No Data Available')).toBeInTheDocument();
  });

  it('should render NoData with action button', () => {
    const handleClick = jest.fn();

    render(<NoData actionText="Add Data" onAction={handleClick} />);

    const button = screen.getByRole('button', { name: 'Add Data' });
    expect(button).toBeInTheDocument();
  });

  it('should render NoDatasets with default action text', () => {
    const handleClick = jest.fn();
    render(<NoDatasets onAction={handleClick} />);

    expect(screen.getByText('No Datasets')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Dataset' })).toBeInTheDocument();
  });

  it('should render NoDatasets with custom action', () => {
    const handleClick = jest.fn();

    render(<NoDatasets actionText="New Dataset" onAction={handleClick} />);

    expect(screen.getByRole('button', { name: 'New Dataset' })).toBeInTheDocument();
  });

  it('should render NoSearchResults', () => {
    render(<NoSearchResults />);

    expect(screen.getByText('No Results Found')).toBeInTheDocument();
  });
});
