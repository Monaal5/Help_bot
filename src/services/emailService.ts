// Email service for sending viewer invitations
// This is a simple implementation - in production, you'd want to use a proper email service

interface ViewerInvitationData {
  viewerEmail: string;
  chatbotName: string;
  adminName: string;
  adminEmail: string;
  applicationUrl: string;
  invitationToken?: string;
}

export class EmailService {
  private static instance: EmailService;

  static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  async sendViewerInvitation(data: ViewerInvitationData, options?: { preferGmail?: boolean }): Promise<boolean> {
    try {
      const subject = `You've been invited to view chat sessions - ${data.chatbotName}`;
      const body = this.createInvitationEmailBody(data);

      // Prefer Gmail compose if requested
      if (options?.preferGmail) {
        const gmailUrl = this.createGmailComposeUrl({ to: data.viewerEmail, subject, body });
        window.open(gmailUrl, '_blank');
        return true;
      }

      // Fallback to default mail client
      const mailtoLink = `mailto:${data.viewerEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(mailtoLink);
      return true;
    } catch (error) {
      console.error('Failed to send viewer invitation:', error);
      return false;
    }
  }

  private createGmailComposeUrl({ to, subject, body }: { to: string; subject: string; body: string; }): string {
    const base = 'https://mail.google.com/mail/?view=cm&fs=1&tf=1';
    const params = new URLSearchParams({ to, su: subject, body });
    return `${base}&${params.toString()}`;
  }

  private createInvitationEmailBody(data: ViewerInvitationData): string {
    const inviteUrl = data.invitationToken
      ? `${data.applicationUrl}/invite/${data.invitationToken}`
      : data.applicationUrl;

    return `Hello,

You have been granted viewer access to chat sessions for the chatbot "${data.chatbotName}" by ${data.adminName} (${data.adminEmail}).

As a viewer, you can:
• View chat sessions and conversations
• Monitor user interactions
• Access session analytics

🔗 CLICK HERE TO ACCESS: ${inviteUrl}

Alternative access method:
1. Visit: ${data.applicationUrl}
2. Sign in using this email address: ${data.viewerEmail}
3. You'll be automatically redirected to the sessions page

Important Notes:
• You must sign in with the exact email address: ${data.viewerEmail}
• You will only have access to view sessions - no editing capabilities
• If you don't have an account, you can create one using the same email address
• This invitation link expires in 7 days

If you have any questions, please contact ${data.adminName} at ${data.adminEmail}.

Best regards,
MedCare Chatbot System`;
  }

  // Alternative method for copying invitation text to clipboard
  async copyInvitationToClipboard(data: ViewerInvitationData): Promise<boolean> {
    try {
      const inviteUrl = data.invitationToken
        ? `${data.applicationUrl}/invite/${data.invitationToken}`
        : data.applicationUrl;

      const invitationText = `
🎉 Viewer Access Granted!

Hi there! You've been invited to view chat sessions for "${data.chatbotName}".

🔗 Direct Access Link: ${inviteUrl}

📧 Your access email: ${data.viewerEmail}

Instructions:
1. Click the direct access link above
2. Sign in with your email: ${data.viewerEmail}
3. You'll be automatically taken to the sessions page

Note: This invitation expires in 7 days.

Questions? Contact ${data.adminName} at ${data.adminEmail}
      `.trim();

      await navigator.clipboard.writeText(invitationText);
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      return false;
    }
  }

  // Method to generate a shareable invitation message
  generateInvitationMessage(data: ViewerInvitationData): string {
    return `You've been granted viewer access to "${data.chatbotName}" chatbot sessions. 

Visit: ${data.applicationUrl}
Sign in with: ${data.viewerEmail}

You'll be automatically redirected to view the sessions.`;
  }
}

export const emailService = EmailService.getInstance();
