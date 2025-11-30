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
  currentIssues?: string;
  futureIdeas?: string;
}

const FeedbackButton = () => {
  const [opened, setOpened] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [currentIssues, setCurrentIssues] = useState('');
  const [futureIdeas, setFutureIdeas] = useState('');

  const [sendFeedbackMutation, { loading }] = useMutation<
    SendFeedbackResponse,
    SendFeedbackVars
  >(SEND_FEEDBACK);

  const handleSubmit = async () => {
    if (!name.trim()) {
      notifications.show({
        title: 'Name Required',
        message: 'Please enter your name',
        color: 'yellow',
      });
      return;
    }

    if (!currentIssues.trim() && !futureIdeas.trim()) {
      notifications.show({
        title: 'Feedback Required',
        message: 'Please enter at least one type of feedback',
        color: 'yellow',
      });
      return;
    }

    try {
      const result = await sendFeedbackMutation({
        variables: {
          email: email.trim() || undefined,
          name: name.trim(),
          currentIssues: currentIssues.trim() || undefined,
          futureIdeas: futureIdeas.trim() || undefined,
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
        setCurrentIssues('');
        setFutureIdeas('');
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
            required
            withAsterisk
          />

          <TextInput
            label="Email (optional)"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            type="email"
          />

          <Textarea
            label="Current Issues / Feedback"
            placeholder="Any bugs, issues, or general feedback about the current app..."
            value={currentIssues}
            onChange={(e) => setCurrentIssues(e.currentTarget.value)}
            minRows={3}
            maxRows={6}
          />

          <Textarea
            label="Future Ideas"
            placeholder="Any features or improvements you'd like to see..."
            value={futureIdeas}
            onChange={(e) => setFutureIdeas(e.currentTarget.value)}
            minRows={3}
            maxRows={6}
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
