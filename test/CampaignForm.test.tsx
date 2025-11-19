import { screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import CampaignForm from '../src/components/CampaignManager/CampaignForm';
import { renderWithProviders } from './test-utils';

describe('CampaignForm', () => {
  it('renders the form title', () => {
    renderWithProviders(<CampaignForm />);
    expect(screen.getByText('Campaign Title')).toBeInTheDocument();
  });
});