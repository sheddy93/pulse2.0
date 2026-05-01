import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatWindow from '@/components/chat/ChatWindow';

describe('ChatWindow', () => {
  const mockProps = {
    conversation: { id: 'conv-1', title: 'Chat Test' },
    user: { email: 'test@example.com', full_name: 'Test User', company_id: 'comp-1' },
    employee: { id: 'emp-1', company_id: 'comp-1' }
  };

  beforeEach(() => {
    // Mock localStorage
    Storage.prototype.getItem = () => null;
  });

  it('renders chat window header', () => {
    render(<ChatWindow {...mockProps} />);
    expect(screen.getByText('Chat Test')).toBeInTheDocument();
  });

  it('shows empty state for no messages', () => {
    render(<ChatWindow {...mockProps} />);
    expect(screen.getByText('Caricamento...')).toBeInTheDocument();
  });

  it('has message input field', () => {
    render(<ChatWindow {...mockProps} />);
    expect(screen.getByPlaceholderText('Scrivi un messaggio...')).toBeInTheDocument();
  });
});