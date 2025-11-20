import { screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import CampaignForm from '../src/components/CampaignManager/CampaignForm';
import { renderWithProviders } from './test-utils';

vi.mock('../src/components/CampaignManager/PlatformSelector', () => ({
  default: ({ onChange }: { onChange: (platforms: string[]) => void }) => (
    <div>
      <button onClick={() => onChange(['email'])}>Select Email</button>
    </div>
  ),
}));

vi.mock('../src/components/CampaignManager/flows/EmailFlow', () => ({
  default: ({ data, onChange }: { data: Record<string, any>, onChange: (data: Record<string, any>) => void }) => (
    <div>
      <input
        aria-label="subject"
        value={data.subject || ''}
        onChange={(e) => onChange({ ...data, subject: e.target.value })}
      />
      <input
        aria-label="fromAddress"
        value={data.fromAddress || ''}
        onChange={(e) => onChange({ ...data, fromAddress: e.target.value })}
      />
    </div>
  ),
}));

vi.mock('../src/components/CampaignManager/flows/WhatsappFlow', () => ({
  default: () => <div>Whatsapp Flow</div>,
}));

vi.mock('../src/components/CampaignManager/flows/SocialMediaFlow', () => ({
  default: () => <div>Social Media Flow</div>,
}));


describe('CampaignForm', () => {
  it('renders the form title', () => {
    renderWithProviders(<CampaignForm />);
    expect(screen.getByText('Campaign Title')).toBeInTheDocument();
  });

  it('disables the "Next" button on the first step if title and content are empty', () => {
    renderWithProviders(<CampaignForm />);
    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled();
  });

  it('enables the "Next" button on the first step if title and content are filled', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign Title/i }), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Content/i }), { target: { value: 'Test Content' } });
    expect(screen.getByRole('button', { name: 'Next step' })).not.toBeDisabled();
  });

  it('disables the "Next" button on the second step if no platforms are selected', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign Title/i }), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Content/i }), { target: { value: 'Test Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled();
  });

  it('enables the "Next" button on the second step if a platform is selected', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign Title/i }), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Content/i }), { target: { value: 'Test Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByText('Select Email'));
    expect(screen.getByRole('button', { name: 'Next step' })).not.toBeDisabled();
  });

  it('disables the "Next" button on the third step if required fields for the selected platform are not filled', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign Title/i }), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Content/i }), { target: { value: 'Test Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByText('Select Email'));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    expect(screen.getByRole('button', { name: 'Next step' })).toBeDisabled();
  });

  it('enables the "Next" button on the third step if required fields for the selected platform are filled', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.change(screen.getByRole('textbox', { name: /Campaign Title/i }), { target: { value: 'Test Title' } });
    fireEvent.change(screen.getByRole('textbox', { name: /Content/i }), { target: { value: 'Test Content' } });
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.click(screen.getByText('Select Email'));
    fireEvent.click(screen.getByRole('button', { name: 'Next step' }));
    fireEvent.change(screen.getByLabelText('subject'), { target: { value: 'Test Subject' } });
    fireEvent.change(screen.getByLabelText('fromAddress'), { target: { value: 'test@example.com' } });
    expect(screen.getByRole('button', { name: 'Next step' })).not.toBeDisabled();
  });

  it('prevents navigation to future steps via stepper click if current step is invalid', () => {
    renderWithProviders(<CampaignForm />);
    fireEvent.click(screen.getByText('Select Platforms'));
    expect(screen.getByText('Campaign Title')).toBeInTheDocument();
  });
});