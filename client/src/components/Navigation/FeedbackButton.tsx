import { useState } from 'react';
import { Button, Modal, Textarea, TextInput } from '@mantine/core';
import { IconMessageCircle } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useMutation } from '@apollo/client/react';
import { TOGGLE_ICON_SIZE } from '@/const';
import { SEND_FEEDBACK } from '@/api/queries';

interface SendFeedbackResponse {
  sendFeedback: {
    success: boolean;
    message: string;
  };
}

interface SendFeedbackVars {
  email?: string;
  name: string;
  message: string;
}

const FeedbackButton = () => {
  const [opened, setOpened] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const [sendFeedbackMutation, { loading }] = useMutation<
    SendFeedbackResponse,
    SendFeedbackVars
  >(SEND_FEEDBACK);

  const handleSubmit = async () => {
    if (!message.trim()) {
      notifications.show({
        title: 'Message Required',
        message: 'Please enter your feedback message',
        color: 'yellow',
      });
      return;
    }

    try {
      const result = await sendFeedbackMutation({
        variables: {
          email: email.trim() || undefined,
          name: name.trim(),
          message: message.trim(),
        },
      });

      if (result.data?.sendFeedback.success) {
        notifications.show({
          title: 'Thank You!',
          message: 'Your feedback has been sent successfully',
          color: 'green',
        });

        setEmail('');
        setName('');
        setMessage('');
        setOpened(false);
      } else {
        throw new Error(result.data?.sendFeedback.message || 'Failed to send');
      }
    } catch (error) {
      console.error('Error sending feedback:', error);
      notifications.show({
        title: 'Error',
        message: 'Failed to send feedback. Please try again.',
        color: 'red',
      });
    }
  };

  return (
    <>
      <Button
        onClick={() => setOpened(true)}
        leftSection={<IconMessageCircle size={TOGGLE_ICON_SIZE} />}
        size="xs"
        variant="light"
      >
        Feedback
      </Button>

      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Send Feedback"
        size="md"
      >
        <div className="flex flex-col gap-4">
          <TextInput
            label="Your Name"
            placeholder="name"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            type="name"
          />

          <TextInput
            label="Email (optional)"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            type="email"
          />

          <Textarea
            label="Your Feedback"
            placeholder="Tell us what you think..."
            value={message}
            onChange={(e) => setMessage(e.currentTarget.value)}
            minRows={4}
            maxRows={8}
            required
          />

          <div className="flex gap-2 justify-end">
            <Button variant="subtle" onClick={() => setOpened(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} loading={loading}>
              Send Feedback
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default FeedbackButton;
